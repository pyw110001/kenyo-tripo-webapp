# 设计问卷到图生 3D 工作流

- 前端新增 `设计问卷` 标签页，移植“嘉翼3D打印住宅建筑设计前问卷6.html”的设计问卷与报价问卷。
- 设计问卷会生成可编辑的文生图提示词；报价问卷会生成报价/清单话术。
- `POST /api/gemini/text-to-image` 使用 `GOOGLE_API_KEY` 与 `GEMINI_IMAGE_MODEL` 生成建筑参考图。
- `POST /api/gemini/transparent-subject` 基于参考图优化为只保留主体的透明/干净背景图片。
- 图片保存到后端 `outputs/`，通过 `/outputs/{filename}` 预览；目录已加入 `.gitignore`。
- `POST /api/tripo/saved-image-to-model` 会读取保存图并上传给 Tripo，创建图生 3D 任务。

新增环境变量：

```bash
GOOGLE_API_KEY=AIza_xxx
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
```
