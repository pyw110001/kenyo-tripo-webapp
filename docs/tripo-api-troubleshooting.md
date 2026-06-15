# Tripo API 图生 3D 排错记录

本文记录本项目中 Tripo 图生 3D 调用的已知坑点，尤其用于避免再次出现：

```text
One or more of your parameter is invalid
```

该错误来自 Tripo `1004`，含义是请求参数不合法，不等同于额度不足。

## 官方文档入口

- Introduction: https://docs.tripo3d.ai/get-started/introduction.html
- Errors: https://docs.tripo3d.ai/get-started/errors-and-error-handling.html
- Pricing: https://docs.tripo3d.ai/get-started/pricing.html
- P1 Image to Model: https://docs.tripo3d.ai/model-generation/image-to-model-p1-20260311.html
- Direct Upload: https://docs.tripo3d.ai/file-upload/quick-upload-directly.html

## 本次问题结论

最终可用链路为：

1. 前端提交图片到本项目后端。
2. 后端调用 Tripo `/upload` 直接上传图片。
3. Tripo 返回 `image_token`，项目内部统一作为 `file_token` 使用。
4. 后端调用 Tripo `/task` 创建 `image_to_model` 任务。

不要优先使用本项目之前尝试过的 STS/object 路径，除非完整重测通过。当前已验证可用的是 direct upload + `file_token`。

## 正确请求结构

P1 图生 3D 推荐最小稳定结构：

```json
{
  "type": "image_to_model",
  "model_version": "P1-20260311",
  "face_limit": 20000,
  "texture": false,
  "pbr": false,
  "auto_size": false,
  "file": {
    "type": "jpg",
    "file_token": "UPLOAD_TOKEN_FROM_TRIPO"
  }
}
```

如果开启 `texture` 或 `pbr`，才允许启用 `auto_size`：

```json
{
  "texture": true,
  "pbr": false,
  "auto_size": true
}
```

## 已踩坑点

### 1. 额度不足不是这个错误

`One or more of your parameter is invalid` 对应 Tripo 错误码 `1004`，是参数错误。

额度不足对应官方错误码：

```text
403 / 2010 / You don't have enough credit to create this task
```

排查额度用：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/tripo/balance
```

P1 图生模型基础消耗：

- 无贴图：约 40 credits
- 有贴图：约 50 credits

### 2. `auto_size=true` 不能和无贴图模型同时使用

官方 P1 文档说明：`auto_size` 只适用于 textured model。

因此以下组合会导致参数错误：

```json
{
  "texture": false,
  "pbr": false,
  "auto_size": true
}
```

本项目后端已做兜底：

```python
safe_auto_size = bool(auto_size and (texture or pbr))
```

### 3. P1 必须保留 `model_version`

P1 图生 3D 文档要求：

```json
{
  "model_version": "P1-20260311"
}
```

不要因为精简 payload 而省略它。

### 4. direct upload 返回的是 image token

Direct Upload 文档返回字段为 `image_token`。当前项目会从 Tripo 上传响应中提取：

```python
["image_token", "file_token", "token"]
```

然后提交任务时使用：

```json
{
  "file": {
    "type": "jpg",
    "file_token": "..."
  }
}
```

### 5. 图片限制

Direct Upload 只支持：

- `webp`
- `jpeg`
- `png`

文件大小必须小于 `20 MB`。

如果透明主体图来自 Gemini，但实际保存成 `.jpg`，不要假设它一定带 alpha。Tripo 只关心上传图像能被识别，透明背景是建模效果层面的优化，不是 API 必需字段。

## 项目内关键代码位置

后端文件：

```text
backend/main.py
```

重点函数：

```python
_upload_bytes_to_tripo()
_build_uploaded_file_variants()
_build_image_to_model_payload()
image_upload_to_model()
saved_image_to_model()
```

当前应保持：

- `_upload_bytes_to_tripo()` 使用 `/upload` direct upload。
- `_build_uploaded_file_variants()` 优先返回 `{ "type": file_type, "file_token": token }`。
- `_build_image_to_model_payload()` 自动修正 `auto_size` 与 `texture/pbr` 的组合。
- `saved_image_to_model()` 与 `image_upload_to_model()` 走同一套 Tripo payload。

## 快速排查清单

遇到 Tripo 400 时按顺序检查：

1. 查余额：

   ```powershell
   Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/tripo/balance
   ```

2. 确认错误码：

   - `1004`: 参数错误
   - `2010`: 额度不足
   - `2004`: 图片类型不支持
   - `2019`: 文件没有上传成功或 token/object 无效

3. 检查 payload 是否包含：

   ```json
   {
     "type": "image_to_model",
     "model_version": "P1-20260311",
     "file": {
       "type": "jpg",
       "file_token": "..."
     }
   }
   ```

4. 检查是否误传：

   ```json
   {
     "texture": false,
     "pbr": false,
     "auto_size": true
   }
   ```

5. 检查图片：

   - 是否 `jpg/png/webp`
   - 是否小于 `20 MB`
   - 是否成功上传并拿到 token

6. 如果仍失败，看后端返回的诊断字段：

   ```json
   {
     "attempted_file_payloads": [],
     "attempted_task_payloads": []
   }
   ```

## 修改后验证命令

语法检查：

```powershell
python -m py_compile backend/main.py
```

前端构建：

```powershell
cd frontend
npm run build
```

重启后端：

```powershell
cd D:\01_AIGC\CODEX\kenyo-tripo-webapp
start-server.cmd
```

健康检查：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/health
```

余额检查：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/tripo/balance
```

## 后续维护建议

- 每次改 Tripo payload 前，先对照官方 P1 文档。
- 不要把“能上传成功”和“能创建 task 成功”混为一谈，两步都会独立失败。
- 不要为了排错直接反复提交真实任务，成功一次就会消耗 credits。
- 如果改用 STS/object 上传，必须单独验证 `file.object.bucket/key` 是否被 `/task` 接受，再替换当前 direct upload 路径。
