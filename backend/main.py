import base64
import json
import mimetypes
import os
import subprocess
import tempfile
import uuid
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
FRONTEND_DIST_DIR = os.path.join(FRONTEND_DIR, "dist")
FRONTEND_DIST_ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")
SCHEMA_FILE = os.path.join(PROJECT_ROOT, "schema.html")
ENV_FILE = os.path.join(PROJECT_ROOT, ".env")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "outputs")


def _load_env_file() -> None:
    if not os.path.exists(ENV_FILE):
        return

    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


def _persist_env_var(key: str, value: str) -> None:
    lines: List[str] = []
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()

    output: List[str] = []
    found = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(f"{key}="):
            found = True
            if value:
                output.append(f"{key}={value}\n")
            continue
        output.append(line)

    if not found and value:
        output.append(f"{key}={value}\n")

    with open(ENV_FILE, "w", encoding="utf-8") as f:
        f.writelines(output)


def _mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return f"{value[:2]}***"
    return f"{value[:4]}***{value[-4:]}"


def _key_format_warning(value: str) -> str:
    if not value:
        return ""
    if value.startswith("tsk_"):
        return ""
    return "unexpected_prefix"


def _model_supports_quad(model_version: str) -> bool:
    version = (model_version or "").strip().upper()
    return not version.startswith("P1")


def _normalize_upload_type(file_ext: str) -> str:
    value = (file_ext or "").strip().lower()
    if value in {"jpg", "jpeg"}:
        return "jpg"
    if value in {"png", "webp"}:
        return value
    return "jpg"


def _sts_upload_format(file_ext: str) -> str:
    value = (file_ext or "").strip().lower()
    if value in {"jpg", "jpeg"}:
        return "jpeg"
    if value in {"png", "webp", "glb", "obj", "fbx", "stl"}:
        return value
    return "jpeg"


_load_env_file()

TRIPO_API_KEY = os.getenv("TRIPO_API_KEY", "")
TRIPO_BASE_URL = os.getenv("TRIPO_BASE_URL", "https://api.tripo3d.ai/v2/openapi")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", os.getenv("GEMINI_API_KEY", ""))
GEMINI_BASE_URL = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image")
REQUEST_TIMEOUT = float(os.getenv("TRIPO_TIMEOUT", "120"))

os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(title="KENYO Tripo3D Test Lab", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.isdir(FRONTEND_DIST_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST_ASSETS_DIR), name="assets")
elif os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR), name="assets")

app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


class TextToModelRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1024)
    negative_prompt: Optional[str] = Field(default="")
    model_version: str = Field(default="P1-20260311")
    face_limit: int = Field(default=20000, ge=1000, le=200000)
    texture: bool = False
    pbr: bool = False
    style: Optional[str] = None
    auto_size: bool = True
    quad: bool = False
    seed: Optional[int] = None


class ImageUrlToModelRequest(BaseModel):
    image_url: str
    negative_prompt: Optional[str] = Field(default="")
    model_version: str = Field(default="P1-20260311")
    face_limit: int = Field(default=20000, ge=1000, le=200000)
    texture: bool = False
    pbr: bool = False
    style: Optional[str] = None
    auto_size: bool = True
    quad: bool = False
    seed: Optional[int] = None


class TaskSummary(BaseModel):
    task_id: str
    status: Optional[str] = None
    raw: Dict[str, Any]
    model_urls: List[str] = []
    viewer_model_urls: List[str] = []
    preview_urls: List[str] = []


class ApiKeySettingsRequest(BaseModel):
    api_key: str = ""


class GeminiImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4096)
    negative_prompt: Optional[str] = Field(default="")
    model: Optional[str] = None


class GeminiTransparentRequest(BaseModel):
    image_path: str
    prompt: Optional[str] = None
    model: Optional[str] = None


class SavedImageToModelRequest(BaseModel):
    image_path: str
    negative_prompt: Optional[str] = Field(default="")
    model_version: str = Field(default="P1-20260311")
    face_limit: int = Field(default=20000, ge=1000, le=200000)
    texture: bool = False
    pbr: bool = False
    style: Optional[str] = None
    auto_size: bool = True
    quad: bool = False
    seed: Optional[int] = None


def _headers() -> Dict[str, str]:
    if not TRIPO_API_KEY:
        raise HTTPException(status_code=500, detail="TRIPO_API_KEY 尚未配置")
    return {
        "Authorization": f"Bearer {TRIPO_API_KEY}",
        "Content-Type": "application/json",
    }


def _google_key() -> str:
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY 尚未配置")
    return GOOGLE_API_KEY


def _walk(obj: Any):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield k, v
            yield from _walk(v)
    elif isinstance(obj, list):
        for item in obj:
            yield from _walk(item)



def _first_string_by_keys(obj: Any, candidate_keys: List[str]) -> Optional[str]:
    for key, value in _walk(obj):
        if key in candidate_keys and isinstance(value, str) and value:
            return value
    return None



def _collect_urls(obj: Any, keyword_allowlist: Optional[List[str]] = None) -> List[str]:
    results: List[str] = []
    for key, value in _walk(obj):
        if isinstance(value, str) and value.startswith("http"):
            if keyword_allowlist:
                key_l = key.lower()
                val_l = value.lower()
                if not any(word in key_l or word in val_l for word in keyword_allowlist):
                    continue
            if value not in results:
                results.append(value)
    return results


async def _post_json(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(f"{TRIPO_BASE_URL}{path}", headers=_headers(), json=payload)
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


async def _get_json(path: str) -> Dict[str, Any]:
    if not TRIPO_API_KEY:
        raise HTTPException(status_code=500, detail="TRIPO_API_KEY 尚未配置")
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.get(f"{TRIPO_BASE_URL}{path}", headers={"Authorization": f"Bearer {TRIPO_API_KEY}"})
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


async def _fetch_binary(url: str) -> Response:
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Only http(s) URLs are supported")

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
        response = await client.get(url)
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    media_type = response.headers.get("content-type", "application/octet-stream")
    clean_url = url.split("?", 1)[0].lower()
    guessed_type, _ = mimetypes.guess_type(clean_url)
    if clean_url.endswith(".glb"):
        media_type = "model/gltf-binary"
    elif clean_url.endswith(".gltf"):
        media_type = "model/gltf+json"
    elif media_type in {"application/octet-stream", "binary/octet-stream"} and guessed_type:
        media_type = guessed_type
    return Response(content=response.content, media_type=media_type)


async def _upload_to_tripo(file: UploadFile) -> Dict[str, Any]:
    if not TRIPO_API_KEY:
        raise HTTPException(status_code=500, detail="TRIPO_API_KEY 尚未配置")
    file_ext = (os.path.splitext(file.filename or "")[1] or "").lower().replace(".", "")
    if not file_ext:
        guessed = mimetypes.guess_extension(file.content_type or "") or ".png"
        file_ext = guessed.replace(".", "")
    file_name = file.filename or f"upload.{file_ext}"
    content_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()
    return await _upload_bytes_to_tripo(file_name, file_bytes, content_type, file_ext)


async def _upload_bytes_to_tripo_via_sts(file_name: str, file_bytes: bytes, content_type: str, file_ext: str) -> Dict[str, Any]:
    try:
        import boto3
    except ImportError as exc:
        raise RuntimeError("boto3 is not installed") from exc

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            f"{TRIPO_BASE_URL}/upload/sts/token",
            headers=_headers(),
            json={"format": _sts_upload_format(file_ext)},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()
    token_data = data.get("data") if isinstance(data.get("data"), dict) else data
    required_keys = ["s3_host", "sts_ak", "sts_sk", "session_token", "resource_bucket", "resource_uri"]
    missing = [key for key in required_keys if not token_data.get(key)]
    if missing:
        raise HTTPException(status_code=502, detail={"message": "Invalid STS upload token response", "missing": missing, "raw": data})

    s3_client = boto3.client(
        "s3",
        endpoint_url="https://" + token_data["s3_host"],
        aws_access_key_id=token_data["sts_ak"],
        aws_secret_access_key=token_data["sts_sk"],
        aws_session_token=token_data["session_token"],
    )
    s3_client.put_object(
        Bucket=token_data["resource_bucket"],
        Key=token_data["resource_uri"],
        Body=file_bytes,
        ContentType=content_type,
    )
    safe_raw = {
        "code": data.get("code"),
        "data": {
            "s3_host": token_data["s3_host"],
            "resource_bucket": token_data["resource_bucket"],
            "resource_uri": token_data["resource_uri"],
        },
    }
    return {
        "type": _normalize_upload_type(file_ext),
        "object": {
            "bucket": token_data["resource_bucket"],
            "key": token_data["resource_uri"],
        },
        "raw": safe_raw,
        "upload_strategy": "sts",
    }


async def _upload_bytes_to_tripo(file_name: str, file_bytes: bytes, content_type: str, file_ext: str = "") -> Dict[str, Any]:
    if not TRIPO_API_KEY:
        raise HTTPException(status_code=500, detail="TRIPO_API_KEY 尚未配置")
    file_ext = file_ext or (os.path.splitext(file_name or "")[1] or "").lower().replace(".", "")
    form = {"file": (file_name, file_bytes, content_type)}
    headers = {"Authorization": f"Bearer {TRIPO_API_KEY}"}
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(f"{TRIPO_BASE_URL}/upload", headers=headers, files=form)
    except httpx.HTTPError:
        data = _upload_to_tripo_via_curl(file_name, file_bytes, content_type)
    else:
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        data = response.json()
    token_key = _first_string_by_keys(data, ["image_token", "file_token", "token"])
    if not token_key:
        raise HTTPException(status_code=500, detail=f"未能从上传响应中提取可用 token: {data}")

    token_name = "file_token"
    return {
        "type": _normalize_upload_type(file_ext),
        "token_name": token_name,
        "token_value": token_key,
        "raw": data,
        "token_payload": data.get("data") if isinstance(data.get("data"), dict) else {},
    }


def _build_uploaded_file_variants(uploaded: Dict[str, Any]) -> List[Dict[str, Any]]:
    token_value = uploaded.get("token_value")
    file_type = uploaded["type"]
    raw_payload = uploaded.get("token_payload") or {}
    candidates: List[Dict[str, Any]] = []

    def add_candidate(candidate: Dict[str, Any]) -> None:
        cleaned = {key: value for key, value in candidate.items() if value not in (None, "", False)}
        if cleaned and cleaned not in candidates:
            candidates.append(cleaned)

    if token_value:
        add_candidate({"type": file_type, "file_token": token_value})
        add_candidate({"file_token": token_value})
        add_candidate({"type": file_type, uploaded["token_name"]: token_value})
        add_candidate({uploaded["token_name"]: token_value})
        add_candidate({"type": file_type, **raw_payload})
        add_candidate(raw_payload)
        add_candidate({"type": file_type, "image_token": token_value})
        add_candidate({"image_token": token_value})
        add_candidate({"type": file_type, "url": token_value})
        add_candidate({"url": token_value})

    return candidates


def _build_image_to_model_payload(
    negative_prompt: Optional[str] = "",
    model_version: Optional[str] = None,
    face_limit: int = 20000,
    texture: bool = False,
    pbr: bool = False,
    auto_size: bool = True,
    style: Optional[str] = None,
    quad: bool = False,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    version = (model_version or "").strip()
    safe_auto_size = bool(auto_size and (texture or pbr))
    payload: Dict[str, Any] = {
        "type": "image_to_model",
        "negative_prompt": negative_prompt or "",
        "model_version": version or "P1-20260311",
        "face_limit": face_limit,
        "texture": texture,
        "pbr": pbr,
        "auto_size": safe_auto_size,
    }
    if style:
        payload["style"] = style
    if quad and version and _model_supports_quad(version):
        payload["quad"] = True
    if seed is not None:
        payload["model_seed"] = seed
    return payload


def _resolve_output_image(image_path: str) -> str:
    value = (image_path or "").strip().replace("\\", "/")
    if value.startswith("/outputs/"):
        value = value[len("/outputs/") :]
    elif value.startswith("outputs/"):
        value = value[len("outputs/") :]
    value = os.path.basename(value)
    if not value:
        raise HTTPException(status_code=400, detail="image_path is required")

    output_root = os.path.abspath(OUTPUT_DIR)
    resolved = os.path.abspath(os.path.join(OUTPUT_DIR, value))
    if os.path.commonpath([output_root, resolved]) != output_root or not os.path.isfile(resolved):
        raise HTTPException(status_code=404, detail="Saved image not found")
    return resolved


def _save_generated_image(image_bytes: bytes, mime_type: str, prefix: str) -> Dict[str, Any]:
    ext = mimetypes.guess_extension(mime_type or "") or ".png"
    if ext == ".jpe":
        ext = ".jpg"
    filename = f"{prefix}-{uuid.uuid4().hex}{ext}"
    output_path = os.path.join(OUTPUT_DIR, filename)
    with open(output_path, "wb") as f:
        f.write(image_bytes)
    return {
        "filename": filename,
        "image_path": f"/outputs/{filename}",
        "mime_type": mime_type or "image/png",
        "size": len(image_bytes),
    }


def _extract_gemini_image(data: Dict[str, Any]) -> Dict[str, str]:
    for candidate in data.get("candidates", []):
        content = candidate.get("content") or {}
        for part in content.get("parts", []):
            inline_data = part.get("inlineData") or part.get("inline_data") or {}
            encoded = inline_data.get("data")
            mime_type = inline_data.get("mimeType") or inline_data.get("mime_type") or "image/png"
            if encoded:
                return {"data": encoded, "mime_type": mime_type}
    raise HTTPException(status_code=502, detail={"message": "Gemini response did not include an image", "raw": data})


async def _gemini_generate_image(parts: List[Dict[str, Any]], model: Optional[str] = None) -> Dict[str, Any]:
    selected_model = (model or GEMINI_IMAGE_MODEL).strip()
    payload = {
        "contents": [{"role": "user", "parts": parts}],
    }
    url = f"{GEMINI_BASE_URL}/models/{selected_model}:generateContent"
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            url,
            headers={"Content-Type": "application/json", "x-goog-api-key": _google_key()},
            json=payload,
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    data = response.json()
    image = _extract_gemini_image(data)
    return {
        "bytes": base64.b64decode(image["data"]),
        "mime_type": image["mime_type"],
        "model": selected_model,
        "raw": data,
    }


def _upload_to_tripo_via_curl(file_name: str, file_bytes: bytes, content_type: str) -> Dict[str, Any]:
    suffix = os.path.splitext(file_name)[1] or ".bin"
    fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as temp_file:
            temp_file.write(file_bytes)

        result = subprocess.run(
            [
                "curl.exe",
                "-sS",
                "-X",
                "POST",
                f"{TRIPO_BASE_URL}/upload",
                "-H",
                f"Authorization: Bearer {TRIPO_API_KEY}",
                "-F",
                f"file=@{temp_path};type={content_type}",
            ],
            capture_output=True,
            text=True,
            timeout=max(int(REQUEST_TIMEOUT), 30),
            check=False,
        )
        if result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "curl upload failed"
            raise HTTPException(status_code=502, detail=detail)
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=502, detail=f"Invalid upload response: {result.stdout}") from exc
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/api/health")
async def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "api_key_configured": bool(TRIPO_API_KEY),
        "google_api_key_configured": bool(GOOGLE_API_KEY),
    }


@app.get("/api/settings")
async def get_settings() -> Dict[str, Any]:
    return {
        "api_key_configured": bool(TRIPO_API_KEY),
        "masked_api_key": _mask_secret(TRIPO_API_KEY),
        "google_api_key_configured": bool(GOOGLE_API_KEY),
        "masked_google_api_key": _mask_secret(GOOGLE_API_KEY),
        "gemini_image_model": GEMINI_IMAGE_MODEL,
        "key_format_warning": _key_format_warning(TRIPO_API_KEY),
    }


@app.post("/api/settings/tripo-key")
async def set_tripo_key(req: ApiKeySettingsRequest) -> Dict[str, Any]:
    global TRIPO_API_KEY

    TRIPO_API_KEY = (req.api_key or "").strip()
    if TRIPO_API_KEY:
        os.environ["TRIPO_API_KEY"] = TRIPO_API_KEY
    else:
        os.environ.pop("TRIPO_API_KEY", None)

    _persist_env_var("TRIPO_API_KEY", TRIPO_API_KEY)

    return {
        "ok": True,
        "api_key_configured": bool(TRIPO_API_KEY),
        "masked_api_key": _mask_secret(TRIPO_API_KEY),
        "key_format_warning": _key_format_warning(TRIPO_API_KEY),
    }


@app.post("/api/settings/google-key")
async def set_google_key(req: ApiKeySettingsRequest) -> Dict[str, Any]:
    global GOOGLE_API_KEY

    GOOGLE_API_KEY = (req.api_key or "").strip()
    if GOOGLE_API_KEY:
        os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
    else:
        os.environ.pop("GOOGLE_API_KEY", None)

    _persist_env_var("GOOGLE_API_KEY", GOOGLE_API_KEY)

    return {
        "ok": True,
        "google_api_key_configured": bool(GOOGLE_API_KEY),
        "masked_google_api_key": _mask_secret(GOOGLE_API_KEY),
        "gemini_image_model": GEMINI_IMAGE_MODEL,
    }


@app.get("/api/tripo/balance")
async def balance() -> Dict[str, Any]:
    return await _get_json("/user/balance")


@app.get("/api/proxy-file")
async def proxy_file(url: str) -> Response:
    return await _fetch_binary(url)


@app.post("/api/gemini/text-to-image")
async def gemini_text_to_image(req: GeminiImageRequest) -> Dict[str, Any]:
    prompt = (
        "Generate a high-quality architectural concept rendering for a concrete 3D printed building. "
        "Keep the main building as one clear, centered subject with clean edges and minimal background clutter. "
        "The image should be useful as a reference for image-to-3D reconstruction. "
        f"Design brief: {req.prompt}"
    )
    if req.negative_prompt:
        prompt += f" Avoid: {req.negative_prompt}"
    generated = await _gemini_generate_image([{"text": prompt}], req.model)
    saved = _save_generated_image(generated["bytes"], generated["mime_type"], "gemini-reference")
    return {**saved, "model": generated["model"]}


@app.post("/api/gemini/transparent-subject")
async def gemini_transparent_subject(req: GeminiTransparentRequest) -> Dict[str, Any]:
    source_path = _resolve_output_image(req.image_path)
    mime_type = mimetypes.guess_type(source_path)[0] or "image/png"
    with open(source_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("ascii")

    edit_prompt = req.prompt or (
        "Edit the image to keep only the main architectural building subject. "
        "Remove the sky, ground plane, landscape, people, vehicles, labels, shadows, and all background elements. "
        "Output MUST be a PNG with alpha transparency. Do not return JPEG. "
        "The background must be fully transparent, not white, gray, black, blurred, or checkerboard. "
        "Center the isolated building in frame with clean edges. "
        "Preserve the building shape, material, facade details, roof, proportions, and readable silhouette."
    )
    generated = await _gemini_generate_image(
        [
            {"text": edit_prompt},
            {"inlineData": {"mimeType": mime_type, "data": image_b64}},
        ],
        req.model,
    )
    saved = _save_generated_image(generated["bytes"], generated["mime_type"], "gemini-transparent")
    return {**saved, "source_image_path": req.image_path, "model": generated["model"]}


@app.post("/api/tripo/text-to-model")
async def text_to_model(req: TextToModelRequest) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "type": "text_to_model",
        "prompt": req.prompt,
        "negative_prompt": req.negative_prompt or "",
        "model_version": req.model_version,
        "face_limit": req.face_limit,
        "texture": req.texture,
        "pbr": req.pbr,
        "auto_size": req.auto_size,
    }
    if req.quad and _model_supports_quad(req.model_version):
        payload["quad"] = True
    if req.style:
        payload["style"] = req.style
    if req.seed is not None:
        payload["model_seed"] = req.seed

    data = await _post_json("/task", payload)
    task_id = _first_string_by_keys(data, ["task_id", "id"])
    return {"task_id": task_id, "raw": data}


@app.post("/api/tripo/text-to-image")
async def text_to_image(prompt: str = Form(...), negative_prompt: str = Form(""), seed: Optional[int] = Form(None)) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "type": "text_to_image",
        "prompt": prompt,
        "negative_prompt": negative_prompt,
    }
    if seed is not None:
        payload["seed"] = seed
    data = await _post_json("/task", payload)
    task_id = _first_string_by_keys(data, ["task_id", "id"])
    return {"task_id": task_id, "raw": data}


@app.post("/api/tripo/image-url-to-model")
async def image_url_to_model(req: ImageUrlToModelRequest) -> Dict[str, Any]:
    file_type = (os.path.splitext(req.image_url.split("?")[0])[1] or ".png").replace(".", "").lower() or "png"
    payload = _build_image_to_model_payload(
        negative_prompt=req.negative_prompt,
        model_version=req.model_version,
        style=req.style,
        quad=req.quad,
        seed=req.seed,
    )
    payload["file"] = {
        "type": file_type,
        "url": req.image_url,
    }

    data = await _post_json("/task", payload)
    task_id = _first_string_by_keys(data, ["task_id", "id"])
    return {"task_id": task_id, "raw": data}


@app.post("/api/tripo/image-upload-to-model")
async def image_upload_to_model(
    file: UploadFile = File(...),
    negative_prompt: str = Form(""),
    model_version: str = Form("P1-20260311"),
    face_limit: int = Form(20000),
    texture: bool = Form(False),
    pbr: bool = Form(False),
    style: Optional[str] = Form(None),
    auto_size: bool = Form(True),
    quad: bool = Form(False),
    seed: Optional[int] = Form(None),
) -> Dict[str, Any]:
    uploaded = await _upload_to_tripo(file)
    base_payload = _build_image_to_model_payload(
        negative_prompt=negative_prompt,
        model_version=model_version,
        face_limit=face_limit,
        texture=texture,
        pbr=pbr,
        auto_size=auto_size,
        style=style,
        quad=quad,
        seed=seed,
    )

    last_exc: Optional[HTTPException] = None
    attempted_payloads: List[Dict[str, Any]] = []
    for file_payload in _build_uploaded_file_variants(uploaded):
        payload = {**base_payload, "file": file_payload}
        attempted_payloads.append(payload)
        try:
            data = await _post_json("/task", payload)
            task_id = _first_string_by_keys(data, ["task_id", "id"])
            return {"task_id": task_id, "upload": uploaded["raw"], "file_payload": file_payload, "raw": data}
        except HTTPException as exc:
            if exc.status_code >= 500:
                raise
            last_exc = exc
            continue

    if last_exc is not None:
        raise HTTPException(
            status_code=last_exc.status_code,
            detail={
                "message": last_exc.detail,
                "upload": uploaded["raw"],
                "attempted_file_payloads": _build_uploaded_file_variants(uploaded),
                "attempted_task_payloads": attempted_payloads,
            },
        )
    raise HTTPException(status_code=500, detail="Image upload failed before task submission")


@app.post("/api/tripo/saved-image-to-model")
async def saved_image_to_model(req: SavedImageToModelRequest) -> Dict[str, Any]:
    source_path = _resolve_output_image(req.image_path)
    file_name = os.path.basename(source_path)
    content_type = mimetypes.guess_type(source_path)[0] or "image/png"
    file_ext = (os.path.splitext(file_name)[1] or ".png").replace(".", "").lower()
    with open(source_path, "rb") as f:
        uploaded = await _upload_bytes_to_tripo(file_name, f.read(), content_type, file_ext)

    base_payload = _build_image_to_model_payload(
        negative_prompt=req.negative_prompt,
        model_version=req.model_version,
        face_limit=req.face_limit,
        texture=req.texture,
        pbr=req.pbr,
        auto_size=req.auto_size,
        style=req.style,
        quad=req.quad,
        seed=req.seed,
    )

    last_exc: Optional[HTTPException] = None
    attempted_payloads: List[Dict[str, Any]] = []
    for file_payload in _build_uploaded_file_variants(uploaded):
        payload = {**base_payload, "file": file_payload}
        attempted_payloads.append(payload)
        try:
            data = await _post_json("/task", payload)
            task_id = _first_string_by_keys(data, ["task_id", "id"])
            return {
                "task_id": task_id,
                "image_path": req.image_path,
                "upload": uploaded["raw"],
                "file_payload": file_payload,
                "raw": data,
            }
        except HTTPException as exc:
            if exc.status_code >= 500:
                raise
            last_exc = exc
            continue

    if last_exc is not None:
        raise HTTPException(
            status_code=last_exc.status_code,
            detail={
                "message": last_exc.detail,
                "upload": uploaded["raw"],
                "attempted_file_payloads": _build_uploaded_file_variants(uploaded),
                "attempted_task_payloads": attempted_payloads,
            },
        )
    raise HTTPException(status_code=500, detail="Saved image upload failed before task submission")


@app.get("/api/tripo/tasks/{task_id}", response_model=TaskSummary)
async def get_task(task_id: str) -> TaskSummary:
    data = await _get_json(f"/task/{task_id}")
    status = _first_string_by_keys(data, ["status"])
    model_urls = _collect_urls(data, ["glb", "obj", "fbx", "stl", "usdz", "3mf", "model", "mesh"])
    viewer_model_urls = _collect_urls(data, ["glb", "gltf"])
    preview_urls = _collect_urls(data, ["preview", "thumbnail", "render", "image", "gif", "mp4"])
    return TaskSummary(
        task_id=task_id,
        status=status,
        raw=data,
        model_urls=model_urls,
        viewer_model_urls=viewer_model_urls,
        preview_urls=preview_urls,
    )


@app.get("/")
async def index():
    dist_index = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.isfile(dist_index):
        return FileResponse(dist_index)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/schema.html")
async def schema_page():
    if not os.path.isfile(SCHEMA_FILE):
        raise HTTPException(status_code=404, detail="schema.html not found")
    return FileResponse(SCHEMA_FILE)
