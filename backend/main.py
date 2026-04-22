import os
import mimetypes
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
ENV_FILE = os.path.join(PROJECT_ROOT, ".env")


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


_load_env_file()

TRIPO_API_KEY = os.getenv("TRIPO_API_KEY", "")
TRIPO_BASE_URL = os.getenv("TRIPO_BASE_URL", "https://api.tripo3d.ai/v2/openapi")
REQUEST_TIMEOUT = float(os.getenv("TRIPO_TIMEOUT", "120"))

app = FastAPI(title="KENYO Tripo3D Test Lab", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR), name="assets")


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
    preview_urls: List[str] = []


class ApiKeySettingsRequest(BaseModel):
    api_key: str = ""


def _headers() -> Dict[str, str]:
    if not TRIPO_API_KEY:
        raise HTTPException(status_code=500, detail="TRIPO_API_KEY 尚未配置")
    return {
        "Authorization": f"Bearer {TRIPO_API_KEY}",
        "Content-Type": "application/json",
    }


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


async def _upload_to_tripo(file: UploadFile) -> Dict[str, Any]:
    if not TRIPO_API_KEY:
        raise HTTPException(status_code=500, detail="TRIPO_API_KEY 尚未配置")
    file_ext = (os.path.splitext(file.filename or "")[1] or "").lower().replace(".", "")
    if not file_ext:
        guessed = mimetypes.guess_extension(file.content_type or "") or ".png"
        file_ext = guessed.replace(".", "")
    form = {"file": (file.filename or f"upload.{file_ext}", await file.read(), file.content_type or "application/octet-stream")}
    headers = {"Authorization": f"Bearer {TRIPO_API_KEY}"}
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(f"{TRIPO_BASE_URL}/upload/sts", headers=headers, files=form)
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    data = response.json()
    file_token = _first_string_by_keys(data, ["file_token", "token"])
    if not file_token:
        raise HTTPException(status_code=500, detail=f"未能从上传响应中提取 file_token: {data}")
    return {"type": file_ext or "png", "file_token": file_token, "raw": data}


@app.get("/api/health")
async def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "api_key_configured": bool(TRIPO_API_KEY),
    }


@app.get("/api/settings")
async def get_settings() -> Dict[str, Any]:
    return {
        "api_key_configured": bool(TRIPO_API_KEY),
        "masked_api_key": _mask_secret(TRIPO_API_KEY),
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


@app.get("/api/tripo/balance")
async def balance() -> Dict[str, Any]:
    return await _get_json("/user/balance")


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
    payload: Dict[str, Any] = {
        "type": "image_to_model",
        "file": {
            "type": file_type,
            "url": req.image_url,
        },
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
    payload: Dict[str, Any] = {
        "type": "image_to_model",
        "file": {
            "type": uploaded["type"],
            "file_token": uploaded["file_token"],
        },
        "negative_prompt": negative_prompt or "",
        "model_version": model_version,
        "face_limit": face_limit,
        "texture": texture,
        "pbr": pbr,
        "auto_size": auto_size,
    }
    if quad and _model_supports_quad(model_version):
        payload["quad"] = True
    if style:
        payload["style"] = style
    if seed is not None:
        payload["model_seed"] = seed

    data = await _post_json("/task", payload)
    task_id = _first_string_by_keys(data, ["task_id", "id"])
    return {"task_id": task_id, "upload": uploaded["raw"], "raw": data}


@app.get("/api/tripo/tasks/{task_id}", response_model=TaskSummary)
async def get_task(task_id: str) -> TaskSummary:
    data = await _get_json(f"/task/{task_id}")
    status = _first_string_by_keys(data, ["status"])
    model_urls = _collect_urls(data, ["glb", "obj", "fbx", "stl", "usdz", "3mf", "model", "mesh"])
    preview_urls = _collect_urls(data, ["preview", "thumbnail", "render", "image", "gif", "mp4"])
    return TaskSummary(task_id=task_id, status=status, raw=data, model_urls=model_urls, preview_urls=preview_urls)


@app.get("/")
async def index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
