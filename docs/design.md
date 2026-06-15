# KENYO / TRIPO3D Design System Notes

本文总结当前网站的视觉风格、布局结构、组件用途、交互方式和特效实现，方便后续复用或扩展。

## 1. 设计定位

整体方向：

- 高级 AI 建筑生成平台
- 暗色科技感产品官网 + 下方工作台
- 不是传统后台大屏，不做密集监控面板
- 首屏强调 cinematic fullscreen hero，工作区再承载具体任务流

关键词：

- dark cinematic
- cyan technical line
- architecture AI
- product landing hero
- restrained console
- glass / grid / motion

避免：

- 过度赛博朋克紫色霓虹
- 大数据驾驶舱风格
- 纯后台管理系统视觉
- 大面积卡片堆叠
- 过强粒子噪声

## 2. 色彩系统

核心变量在 `frontend/src/styles.css` 的 `:root` 中定义：

```css
--c: #00ffe7;
--c2: #0066ff;
--bg: #020508;
--bg2: #040b10;
--line: rgba(0, 255, 231, 0.1);
--line2: rgba(0, 255, 231, 0.22);
--text: rgba(225, 248, 255, 0.94);
--muted: rgba(160, 220, 235, 0.48);
```

用法：

- `--bg` / `--bg2`：页面基底，接近深蓝黑。
- `--c`：主强调色，用于按钮、边框、状态点、进度条。
- `--c2`：辅助蓝色，用于背景渐变和局部能量感。
- `--line` / `--line2`：细线框、分割线、卡片边界。
- `--text`：主文字，偏冷白。
- `--muted`：辅助说明文字，低透明度蓝灰。

建议：

- 保持 cyan 作为唯一高亮主色。
- 大面积背景不要变成纯青绿色。
- 新组件优先使用透明边框和低透明背景，而不是实心卡片。

## 3. 字体与文字层级

当前使用系统 sans 作为主字体，并在局部使用：

- `Space Mono` 风格：编号、标签、技术字段、状态值。
- `Syne` 风格：Logo、部分标题。

文字风格：

- 标签：小字号、大写、较大 letter spacing。
- 主标题：克制，不再使用巨大后台屏标题。
- 表单正文：13px 左右，保证扫描效率。
- 技术状态：使用 mono、青色、低透明度。

常用类：

- `.neon-label`：技术标签、字段标题。
- `.hero-copy h1`：Hero 主标题。
- `.workflow-num`：首屏工作流编号。
- `.tpl-row-tag`：模板类型标签。

## 4. 页面结构

当前页面由两层体验构成。

### 首屏 Hero

对应区域：

```jsx
<section id="workflow" className="product-hero">
```

组成：

- fullscreen background video：`/media/hero-bg.mp4`
- DarkVeil 动态背景作为底层氛围
- 深色渐变 overlay
- 顶部 pill nav
- 左下角小型 hero copy
- 左上视觉区机械臂模型
- 右侧弱化工作流卡片

设计原则：

- 首屏像产品官网入口，不像后台工作台。
- Hero 文案放左下角，小而精。
- 工作流卡片是辅助信息，不抢主视觉。
- 背景视频和 3D 模型负责高级感，文字保持克制。

### 工作台 Section

工作台从 Hero 下方开始，以 `.band` 分段。

主要区块：

- `01 API 接入`
- `02 模板库`
- `04 工作台`
- `05 任务输出`

结构特点：

- 左侧窄栏显示编号和区块标题。
- 右侧为主体内容。
- 使用细线分割，不使用厚重卡片。
- 表单最大宽度受控，避免铺满页面。

## 5. 背景系统

背景由多层叠加：

1. `DarkVeil`
2. body 技术网格
3. `#app-shell::before` 二次网格
4. `#app-shell::after` 深色渐变遮罩
5. Hero 内部 video / overlay

### DarkVeil

文件：

```text
frontend/src/components/DarkVeil/DarkVeil.jsx
frontend/src/components/DarkVeil/DarkVeil.css
```

用途：

- 使用 `ogl` 渲染 shader canvas。
- 作为全局动态背景。
- 提供低速、低噪声、低亮度的流动感。

当前参数：

```jsx
<DarkVeil
  speed={0.35}
  hueShift={165}
  noiseIntensity={0.03}
  scanlineIntensity={0.12}
  scanlineFrequency={1.8}
  warpAmount={0.18}
  resolutionScale={veilResolutionScale}
/>
```

响应式：

- 桌面：`resolutionScale = 0.75`
- 小屏：`resolutionScale = 0.55`

注意：

- 只渲染一次。
- 必须 `pointer-events: none`。
- 不要在每个 section 重复创建 canvas。

### Hero Video

文件：

```text
frontend/public/media/hero-bg.mp4
```

接入：

```jsx
<video
  className="hero-media"
  src="/media/hero-bg.mp4"
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  aria-hidden="true"
/>
```

CSS 关键点：

```css
.hero-media {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  opacity: 0.58;
}
```

用途：

- 提供 fullscreen media hero 感。
- 不承载交互。
- 上方必须叠加 `.hero-media-overlay` 保证文字可读。

## 6. 导航系统

### 顶部 Pill Nav

类名：

- `.top-nav-shell`
- `.logo-pill`
- `.nav-pill`
- `.top-nav-link`
- `.lang-pill`

特点：

- fixed 顶部居中。
- 左侧圆形 Logo pill。
- 右侧长条 nav pill。
- 背景为半透明深色 + blur。
- 文字小而轻，减少后台系统感。

Logo 特效：

`.logo-pill::before` 使用 conic-gradient + mask 形成顺时针旋转绿色光轨迹。

```css
animation: logoOrbit 2.8s linear infinite;
```

复用建议：

- 用于品牌入口或主页返回。
- 光轨迹只在 Logo 外圈，不要扩散到整条导航。

### 左侧 Legacy Sidebar

类名：

- `#sidebar`
- `.nav-step`
- `.nav-step-num`
- `.nav-step-label`

用途：

- 保留原有控制台导航结构。
- 在工作台区域仍有工程软件感。
- 与顶部产品导航共同存在。

## 7. Hero 组件与视觉资产

### Hero Copy

类名：

- `.hero-copy`
- `.hero-copy-landing`
- `.hero-badge`
- `.hero-cta`

结构：

1. Badge Link
2. Headline
3. Subtext
4. CTA Button

复用原则：

- 文案靠左下角。
- 最大宽度小，不占据半屏。
- CTA 使用圆角胶囊按钮。
- 箭头 hover 右移，强化轻量交互。

### 机械臂模型

使用：

```jsx
<model-viewer src="/models/robotic_arm_kuka.glb" ... />
```

用途：

- Hero 主视觉资产。
- 表达建筑 3D 打印 / 工业自动化。
- 只作为视觉，不参与业务流程。

关键样式：

- `.hero-model-stage`
- `.hero-model-stage::before`
- `.hero-model-stage model-viewer`

注意：

- `pointer-events: none`
- `auto-rotate`
- 使用 drop-shadow 和底部光晕融入背景。

## 8. 工作流卡片

组件：

```text
frontend/src/components/BorderGlow/BorderGlow.jsx
```

用途：

- 首屏右侧 `01-04` 工作流卡片。
- 鼠标靠近边缘时产生感应边框光。
- hover 时强化亮度和边缘扫描。

常用参数：

```jsx
<BorderGlow
  className="workflow-card"
  borderRadius={8}
  glowIntensity={0.45}
  glowRadius={18}
  animated
>
```

视觉原则：

- 卡片透明度低，默认弱化。
- hover 才增强。
- 右侧最多一列，不与 Hero 主文案平分视觉权重。

复用场景：

- 产品流程节点
- 功能入口
- 步骤卡片
- 小型状态卡片

避免：

- 大面积重复使用，否则会造成视觉噪声。
- 嵌套卡片。

## 9. 表单与工作台组件

### LField

函数：

```jsx
function LField({ label, hint, children })
```

用途：

- 表单字段包装。
- 左侧 label，右侧 hint。
- 子元素通常为 input / textarea / file。

### 输入控件

类名：

- `.line-input`
- `.line-textarea`
- `.line-file`

风格：

- 深色透明背景。
- 细青色边框。
- focus 时边框变亮。
- 不使用白色默认输入框。

### FlatToggle

函数：

```jsx
function FlatToggle({ label, checked, onChange, disabled = false })
```

用途：

- Texture / PBR / Auto Size / Quad 等布尔开关。

状态：

- `.flat-toggle`
- `.flat-toggle.on`
- `.flat-toggle.disabled`

交互：

- 开启时 knob 右移并变 cyan。
- 禁用时透明度降低，鼠标为 not-allowed。

重要规则：

- `Auto Size` 仅在 `Texture` 或 `PBR` 开启时可用。

## 10. 按钮系统

主按钮：

```css
.btn-primary
```

用途：

- 主要动作：保存 API Key、提交任务、生成 3D。
- cyan 边框 + 扫描光效。
- hover 时背景变 cyan，文字转深色。

次按钮：

```css
.btn-secondary
```

用途：

- 辅助动作：刷新、下载、生成中间结果。
- 默认透明线框。

推荐动作呼吸光：

```css
.survey-recommended-action
```

用途：

- 问卷链路中提示用户下一步该点哪个按钮。
- 用轻微 cyan pulse，不使用弹窗打断。

## 11. 问卷弹窗

类名：

- `.survey-modal-root`
- `.survey-modal-overlay`
- `.survey-modal-panel`
- `.survey-modal-header`
- `.survey-question-shell`
- `.survey-progress-fill`

动效：

- 使用 `gsap`。
- 打开时 overlay 淡入，panel 上浮，内容 stagger。
- 切题时问题区域左右滑动 + blur。
- 关闭时 panel 下沉淡出。

交互规则：

- 一题一屏。
- 单选题选择后可自动进入下一题。
- 文本题点击下一题。
- 支持上一步和关闭。
- 进度显示 `当前 / 总数`。

可访问性：

- `role="dialog"`
- `aria-modal="true"`
- 支持 `prefers-reduced-motion`，减少动画。

复用建议：

- 适合多步骤问卷、配置向导、任务创建 wizard。
- 不要把大量后台表单放进首屏。

## 12. 问卷生成链路指引

类名：

- `.survey-flow-guide`
- `.survey-flow-kicker`
- `.survey-flow-title`
- `.survey-flow-copy`
- `.survey-flow-steps`
- `.survey-flow-step`
- `.survey-flow-dot`
- `.survey-flow-disabled-hints`

用途：

引导用户完成：

```text
问卷完成 -> 生成参考图 -> 优化透明主体 -> 提交图生 3D
```

状态规则：

- 已完成：绿色点。
- 当前推荐：cyan 高亮。
- 未完成：弱化。

适合复用在：

- 多阶段 AI 生成流程
- 上传 -> 处理 -> 提交
- 任务配置 -> 预览 -> 导出

## 13. 状态与输出

### SDot

函数：

```jsx
function SDot({ status })
```

用途：

- 小状态点。
- 根据任务状态显示 idle / running / success / failed。

### PBar

函数：

```jsx
function PBar()
```

用途：

- 非精确进度条。
- 用于 Gemini 图像生成、透明主体优化、Tripo 提交中。

### 任务输出区

内容：

- Task ID
- Status
- Feedback
- Preview images
- model-viewer 预览
- Raw JSON

设计原则：

- 以诊断和结果检查为主。
- 保持表格/字段式布局。
- 不做大卡片堆叠。

## 14. 3D 预览

使用 `<model-viewer>`。

用途：

- Hero 机械臂展示。
- 任务结果 GLB/GLTF 预览。

常用属性：

```jsx
<model-viewer
  camera-controls
  auto-rotate
  shadow-intensity="0.45"
  exposure="0.9"
/>
```

注意：

- 对 Hero 模型禁用交互，避免抢页面事件。
- 对结果模型开启 `camera-controls`，用于检查模型。

## 15. 响应式规则

核心策略：

- 首屏保持 fullscreen hero。
- 移动端 Hero 内容仍靠下，不居中堆满。
- 工作流卡片在小屏变单列。
- 表单 grid 使用 `auto-fit/minmax` 或降为单列。
- DarkVeil 降低 resolutionScale。

关键断点：

- `900px`：DarkVeil resolutionScale 降低。
- 移动端：Hero padding 缩小，CTA 可占满宽度。

注意：

- 不使用 viewport width 控制字体大小。
- 保持按钮文字不溢出。
- 背景视频必须 `object-fit: cover`。

## 16. 依赖与用途

前端依赖：

```json
{
  "react": "UI 框架",
  "react-dom": "React DOM 渲染",
  "vite": "前端开发与构建",
  "@vitejs/plugin-react": "Vite React 插件",
  "ogl": "DarkVeil WebGL shader 背景",
  "gsap": "问卷 modal 与切题动效"
}
```

外部 Web Component：

- `model-viewer`：加载和预览 GLB/GLTF。

## 17. 新页面复用清单

如果下次要复用这个风格，建议按以下顺序搭建：

1. 定义 CSS 变量：`--c`, `--bg`, `--line`, `--text`, `--muted`。
2. 加入 DarkVeil 全局背景。
3. 加入 body 网格和深色渐变遮罩。
4. 顶部使用 pill nav，不做重型 sidebar 首屏。
5. Hero 用 fullscreen media：视频、3D 模型或高质量图像。
6. Hero 文案靠左下，小标题、短说明、单 CTA。
7. 右侧辅助卡片使用 BorderGlow，但默认弱化。
8. 下方功能区使用 `.band` 分段。
9. 表单使用 LField + line-input / line-textarea。
10. 多步骤任务使用 survey-flow-guide 这种状态引导。
11. 生成过程必须有 PBar 或明确 busy 文案。
12. 结果区保留 raw JSON 或诊断信息。

## 18. 新功能设计注意事项

新增功能时优先遵守：

- 不在首屏直接放复杂后台表单。
- 不新增强烈彩色渐变。
- 不让动效影响可读性和点击。
- 不重复创建背景 canvas。
- 不把所有内容都放进卡片。
- 按钮和开关要有 disabled 原因。
- AI 生成链路必须给出当前建议操作。
- 真实 API 错误要尽量显示可诊断信息。

## 19. 推荐文件位置

新增设计组件：

```text
frontend/src/components/<ComponentName>/<ComponentName>.jsx
frontend/src/components/<ComponentName>/<ComponentName>.css
```

全局样式：

```text
frontend/src/styles.css
```

业务页面：

```text
frontend/src/main.jsx
```

静态媒体：

```text
frontend/public/media/
frontend/public/models/
```

设计文档：

```text
docs/design.md
```

## 20. 一句话复用准则

这个站点的核心不是“炫技后台”，而是“克制、高级、可操作的 AI 建筑生成产品入口”：首屏用媒体和空间建立质感，下方用清晰的工程控件完成真实任务。
