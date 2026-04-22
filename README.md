# KENYO · Tripo3D 建筑打印测试台

一个面向 **建筑模型 / 混凝土 3D 打印测试件** 的 Web 原型。

## 包含内容

- `frontend/index.html`
  - KENYO 品牌化前端页面
  - 文生 3D / 图生 3D / 文生图参考图 三个工作页签
  - 建筑打印导向的提示词模板
- `backend/main.py`
  - FastAPI 后端代理
  - 对接 Tripo OpenAPI：
    - `POST /api/tripo/text-to-model`
    - `POST /api/tripo/image-url-to-model`
    - `POST /api/tripo/image-upload-to-model`
    - `POST /api/tripo/text-to-image`
    - `GET /api/tripo/tasks/{task_id}`
    - `GET /api/tripo/balance`

## 适合当前测试方向的默认策略

- 默认模型版本：`P1-20260311`
- 默认面数上限：`20000`
- 默认关闭 `texture` / `pbr`
- Prompt 以 **体块化、低细节、可打印、连续轮廓** 为核心

## 启动方式

```bash
cd kenyo-tripo-webapp
python -m venv .venv
source .venv/bin/activate   # Windows 用 .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# 填入你的 TRIPO_API_KEY
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

浏览器打开：

```bash
http://127.0.0.1:8000
```

## 接口说明

### 1) 文生 3D
前端提交 JSON 到：

```json
{
  "prompt": "minimal concrete pavilion massing...",
  "negative_prompt": "glass curtain wall...",
  "model_version": "P1-20260311",
  "face_limit": 20000,
  "texture": false,
  "pbr": false,
  "auto_size": true,
  "quad": false,
  "seed": null
}
```

### 2) 图生 3D
两种方式：

- 上传本地图片：`multipart/form-data`
- 直接传图片 URL：JSON

### 3) 文生图
用于先生成参考图，再把参考图投喂图生 3D。

## 建议你下一步补的两块

### A. 打印参数联动
把下面参数也加入前端并传给你自己的切片/路径规划服务：

- 喷嘴宽度
- 层高
- 壁厚
- 最小转弯半径
- 挤出速度
- 打印速度
- 是否生成空心 / 单层 / 双层轮廓

### B. 后处理链路
在 Tripo 模型成功后，增加：

1. 网格简化
2. 法线修复
3. STL / OBJ 统一导出
4. 自动送入切片与 G-code 生成

## 注意

这个项目已经尽量兼容 Tripo 当前任务式接口，但由于官方接口字段仍可能继续演进，若你账号下的响应 JSON 与默认解析略有差异，建议先看 `/api/tripo/tasks/{task_id}` 返回的原始 JSON，再微调字段映射。
