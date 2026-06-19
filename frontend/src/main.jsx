import React, { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import BorderGlow from './components/BorderGlow/BorderGlow.jsx';
import DarkVeil from './components/DarkVeil/DarkVeil.jsx';
import './styles.css';

      /* ────── i18n ────── */
      const copy = {
        zh: {
          tagline: "建筑生成控制台",
          heroSub: "三维模型生成 · 图像驱动建模 · 任务状态监控",
          statusReady: "已配置", statusNeedKey: "待配置",
          langZh: "中文", langEn: "EN",
          navKey: "接入配置", navTemplates: "模板库", navWorkspace: "工作台", navResults: "任务输出",
          keyTitle: "API 接入", keyDesc: "输入 Tripo 3D 与 Google Gemini API Key",
          keyLabel: "API KEY", keyPlaceholder: "tsk_...",
          keySave: "确认保存", keySaving: "保存中…", keyStored: "当前 KEY", keyNotSet: "未配置",
          keyHint: "留空保存可清除 Key",
          googleKeyLabel: "GOOGLE API KEY", googleKeyPlaceholder: "AIza...",
          googleKeySave: "保存 Google Key", googleKeyStored: "Google KEY", googleKeyHint: "用于 Nano Banana 2 / Gemini 图片生成与透明主体优化",
          keyFormatWarning: "Key 前缀与标准格式不符",
          templatesTitle: "模板库", presetsToggle: "展开", tipsToggle: "提示",
          notesTitle: "操作提示",
          notes: ["短句 + 强约束的提示词在建筑打印场景更稳定", "草图 / 白模比复杂街景更适合作为参考图输入", "可用问卷生成主体图，再接图生 3D"],
          tabs: { image: "图生 3D" },
          tabDesc: { image: "从参考图驱动重建" },
          surveyEyebrow: "DESIGN QUESTIONNAIRE", surveyTitle: "3D 打印住宅建筑设计前问卷",
          surveyPromptTitle: "问卷提示词", surveyQuoteTitle: "报价话术", surveyAnswerHint: "填写问卷后先生成提示词，可人工微调再生成参考图",
          surveyGeneratePrompt: "生成提示词 ›", surveyGenerateImage: "生成参考图 ›", surveyMakeTransparent: "优化透明主体 ›", surveySendToTripo: "发送 Tripo 图生 3D ›",
          surveyReferenceImage: "参考图", surveyTransparentImage: "透明主体图", surveyNoImage: "尚未生成图片",
          surveyPromptReady: "问卷提示词已生成，可继续生成参考图", surveyImageReady: "参考图已保存", surveyTransparentReady: "透明主体图已保存", surveySubmittedToTripo: "已提交 Tripo 图生 3D",
          surveyOpen: "设计问卷", surveyClose: "关闭", surveyPrev: "上一步", surveyNext: "下一题", surveyDone: "完成问卷",
          surveyProgress: "题目", surveyStepHint: "选择后自动进入下一题，文本题填写后点击下一题",
          sourceTitle: "图像来源", sourceUpload: "上传图片", sourceGenerated: "生成主体图", generatedSourceReady: "透明主体图可用", generatedSourceMissing: "请先生成并优化透明主体图",
          generatingReference: "正在生成参考图，通常需要数秒到几十秒…", generatingTransparent: "正在优化透明主体图…", submittingTripo: "正在提交 Tripo 图生 3D…",
          textEyebrow: "TEXT TO 3D", textTitle: "文本驱动建筑体块生成",
          imageEyebrow: "IMAGE TO 3D", imageTitle: "参考图驱动模型重建",
          imageGenEyebrow: "REFERENCE IMAGE", imageGenTitle: "先生成参考图再转模型",
          promptLabel: "PROMPT", promptHint: "短句 · 强约束 · 可打印",
          negativeLabel: "NEGATIVE", negativeHint: "排除脆弱细节",
          modelVersion: "MODEL VERSION", faceLimit: "FACE LIMIT", seed: "SEED",
          seedPlaceholder: "留空为随机", togglesTitle: "打印导向选项",
          uploadLabel: "上传参考图", urlLabel: "或图片 URL", urlPlaceholder: "https://…/ref.png",
          submitText: "提交文生 3D ›", submitImage: "提交图生 3D ›",
          submitImageGen: "提交文生图 ›", busy: "提交中…",
          toggleTexture: "贴图 Texture", togglePbr: "PBR 材质",
          toggleAutoSize: "Auto Size", toggleQuad: "Quad 拓扑",
          quadUnsupported: "P1 不支持 Quad，已自动关闭",
          guideTitle: "建议策略",
          textGuideItems: ["低面数、连续体块、少装饰 → 更适合打印测试", "建议包含 monolithic / printable / low-poly / thick walls", "输出适合验证几何逻辑，而非最终写实渲染"],
          imageGuideItems: ["草图、白模比复杂街景更稳定", "避免杂乱背景、遮挡与过度透视", "没有现成图像可先用设计问卷生成主体图"],
          imageGenGuideItems: ["先生成体块明确、材质克制的参考图", "从结果中选最稳定的一张作图生 3D 输入", "适合从概念阶段快速过渡到几何测试"],
          resultsTitle: "任务输出", taskId: "TASK ID", status: "STATUS",
          feedback: "FEEDBACK", refresh: "刷新 ›", preview: "预览资源", models: "模型资源",
          viewer: "3D 预览", viewerDesc: "拖动旋转 · 滚轮缩放",
          viewerEmpty: "等待可预览的 GLB / GLTF 模型…",
          viewerHint: "拖动旋转，滚轮缩放", previewModel: "预览",
          openPreview: "打开预览", downloadModel: "下载",
          jsonTitle: "原始 JSON", noOutput: "暂无任务输出。",
          idle: "待命", running: "生成中", success: "完成", failed: "失败",
          selectedFile: "已选文件", sourceReady: "图像来源已就绪", sourceMissing: "请上传图片",
          messageSaveSuccess: "API Key 已保存", messageSaveCleared: "API Key 已清除",
          messageSaveError: "保存失败", messageGoogleSaveSuccess: "Google Key 已保存", messageGoogleSaveCleared: "Google Key 已清除", messageTemplateText: "文生 3D 模板已应用",
          messageTemplateImage: "已切换到图生 3D", messageTemplateImageGen: "已切换到文生图链路",
          messageTextSubmitted: "文生 3D 任务已提交", messageImageSubmitted: "图生 3D 任务已启动",
          messageImageGenSubmitted: "文生图任务已提交", messageImageSourceMissing: "请先上传参考图",
        },
        en: {
          tagline: "Architecture Generation Console",
          heroSub: "3D Model Generation · Image-Driven Modeling · Task Monitoring",
          statusReady: "Ready", statusNeedKey: "Key Needed",
          langZh: "中文", langEn: "EN",
          navKey: "Access Config", navTemplates: "Templates", navWorkspace: "Workspace", navResults: "Output",
          keyTitle: "API Access", keyDesc: "Enter Tripo 3D and Google Gemini API keys",
          keyLabel: "API KEY", keyPlaceholder: "tsk_...",
          keySave: "Save Key", keySaving: "Saving…", keyStored: "Current Key", keyNotSet: "Not Set",
          keyHint: "Save empty to clear the current key",
          googleKeyLabel: "GOOGLE API KEY", googleKeyPlaceholder: "AIza...",
          googleKeySave: "Save Google Key", googleKeyStored: "Google KEY", googleKeyHint: "Used for Nano Banana 2 / Gemini image generation and transparent cutouts",
          keyFormatWarning: "Key prefix does not match the standard Tripo format",
          templatesTitle: "Template Library", presetsToggle: "Expand", tipsToggle: "Tips",
          notesTitle: "Quick Tips",
          notes: ["Short, constrained prompts are more stable for architectural print workflows", "Sketches and white models work better than complex scenes", "Use the survey to generate a subject image before image-to-3D"],
          tabs: { image: "Image to 3D" },
          tabDesc: { image: "Reconstruct from reference" },
          surveyEyebrow: "DESIGN QUESTIONNAIRE", surveyTitle: "Pre-design Survey for 3D Printed Housing",
          surveyPromptTitle: "Survey Prompt", surveyQuoteTitle: "Quote Script", surveyAnswerHint: "Generate an editable prompt from the survey before creating the reference image",
          surveyGeneratePrompt: "Generate Prompt ›", surveyGenerateImage: "Generate Reference ›", surveyMakeTransparent: "Optimize Cutout ›", surveySendToTripo: "Send to Tripo Image to 3D ›",
          surveyReferenceImage: "Reference Image", surveyTransparentImage: "Transparent Subject", surveyNoImage: "No image yet",
          surveyPromptReady: "Survey prompt is ready for review", surveyImageReady: "Reference image saved", surveyTransparentReady: "Transparent subject saved", surveySubmittedToTripo: "Submitted to Tripo image-to-3D",
          surveyOpen: "Design Survey", surveyClose: "Close", surveyPrev: "Back", surveyNext: "Next", surveyDone: "Finish Survey",
          surveyProgress: "Question", surveyStepHint: "Radio choices advance automatically. Text fields advance with Next.",
          sourceTitle: "Image Source", sourceUpload: "Upload Image", sourceGenerated: "Generated Subject", generatedSourceReady: "Transparent subject is ready", generatedSourceMissing: "Generate and optimize a transparent subject first",
          generatingReference: "Generating reference image. This can take a few seconds…", generatingTransparent: "Optimizing transparent subject…", submittingTripo: "Submitting to Tripo image-to-3D…",
          textEyebrow: "TEXT TO 3D", textTitle: "Architecture Massing from Text",
          imageEyebrow: "IMAGE TO 3D", imageTitle: "Model Reconstruction from Reference",
          imageGenEyebrow: "REFERENCE IMAGE", imageGenTitle: "Generate Reference Before 3D",
          promptLabel: "PROMPT", promptHint: "Short · constrained · printable",
          negativeLabel: "NEGATIVE", negativeHint: "Avoid fragile details",
          modelVersion: "MODEL VERSION", faceLimit: "FACE LIMIT", seed: "SEED",
          seedPlaceholder: "Leave blank for random", togglesTitle: "Print-Oriented Options",
          uploadLabel: "Upload Reference Image", urlLabel: "Or Image URL", urlPlaceholder: "https://…/ref.png",
          submitText: "Submit Text to 3D ›", submitImage: "Submit Image to 3D ›",
          submitImageGen: "Submit Text to Image ›", busy: "Submitting…",
          toggleTexture: "Texture", togglePbr: "PBR",
          toggleAutoSize: "Auto Size", toggleQuad: "Quad",
          quadUnsupported: "Quad is not supported for P1 and has been turned off",
          guideTitle: "Recommended Strategy",
          textGuideItems: ["Low polygon, continuous volumes, fewer ornaments → better for print tests", "Use monolithic / printable / low-poly / thick walls constraints", "Outputs are better for geometry validation than photoreal rendering"],
          imageGuideItems: ["Sketches and white models are more stable than complex streetscapes", "Avoid cluttered backgrounds, occlusion, and extreme perspective", "Use the reference-image flow if you don't have a clean source image yet"],
          imageGenGuideItems: ["Generate a restrained concept image with clear massing first", "Pick the cleanest result for Image to 3D next", "Useful for moving from concept to geometry validation quickly"],
          resultsTitle: "Task Output", taskId: "TASK ID", status: "STATUS",
          feedback: "FEEDBACK", refresh: "Refresh ›", preview: "Preview Assets", models: "Model Assets",
          viewer: "3D Viewer", viewerDesc: "Drag to orbit · Scroll to zoom",
          viewerEmpty: "Awaiting a previewable GLB / GLTF model…",
          viewerHint: "Drag to orbit, scroll to zoom", previewModel: "Preview",
          openPreview: "Open Preview", downloadModel: "Download",
          jsonTitle: "Raw JSON", noOutput: "No task output yet.",
          idle: "Idle", running: "Running", success: "Complete", failed: "Failed",
          selectedFile: "Selected File", sourceReady: "Image source ready", sourceMissing: "Upload an image",
          messageSaveSuccess: "API Key saved", messageSaveCleared: "API Key cleared",
          messageSaveError: "Failed to save", messageGoogleSaveSuccess: "Google Key saved", messageGoogleSaveCleared: "Google Key cleared", messageTemplateText: "Text to 3D template applied",
          messageTemplateImage: "Switched to Image to 3D", messageTemplateImageGen: "Switched to reference-image flow",
          messageTextSubmitted: "Text to 3D task submitted", messageImageSubmitted: "Image to 3D task started",
          messageImageGenSubmitted: "Text to image task submitted", messageImageSourceMissing: "Please upload an image first",
        },
      };

      const promptTemplates = [
        { name: { zh: "极简混凝土小屋", en: "Minimal Concrete Pavilion" }, type: "text",
          prompt: "minimal concrete pavilion massing, single-storey architectural prototype, smooth continuous shell, low-poly printable geometry, thick walls, no tiny ornament, stable footprint",
          negative: "glass curtain wall, thin cantilever, tiny railings, trees, people, furniture" },
        { name: { zh: "参数化穿孔墙", en: "Parametric Perforated Wall" }, type: "text",
          prompt: "architectural perforated concrete wall module, rhythmic openings, simplified printable geometry, strong load-bearing appearance",
          negative: "fragile thin edges, metal frame, plants, people, excessive detail" },
        { name: { zh: "曲面景观座椅", en: "Curved Landscape Bench" }, type: "text",
          prompt: "curved concrete landscape bench prototype, monolithic massing, printable low-poly form, soft continuous geometry, no small details",
          negative: "fabric cushions, wood slats, fine decorative pattern" },
        { name: { zh: "薄壳亭结构", en: "Thin-Shell Pavilion" }, type: "text",
          prompt: "thin shell pavilion concept with simplified structural ribs, architectural study model, robust geometry, low polygon",
          negative: "complex truss, cables, glass panels, intricate joints" },
        { name: { zh: "参考图转体块", en: "Reference to Massing" }, type: "image",
          prompt: "upload a massing sketch or reference, then convert to simplified printable architectural geometry",
          negative: "avoid over-texturing, avoid fragile parts" },
        { name: { zh: "文生图再转模型", en: "Generate Reference First" }, type: "imagegen",
          prompt: "generate a simple architectural concept image; emphasize monolithic concrete, low detail, printable silhouette",
          negative: "complex city background, crowds, overly photoreal material" },
      ];

      const defaultTextPrompt = promptTemplates[0].prompt;
      const defaultNegative = promptTemplates[0].negative;

      function cn(...parts) { return parts.filter(Boolean).join(" "); }

      /* ── Particle field (small dots) ── */
      function Particles() {
        const pts = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
          id: i, x: Math.random() * 100, y: Math.random() * 100,
          s: Math.random() * 1.4 + 0.6, d: Math.random() * 12 + 12, delay: Math.random() * 8,
        })), []);
        return (
          <div className="particle-layer">
            {pts.map(p => (
              <span key={p.id} style={{
                position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
                width:p.s, height:p.s, borderRadius:'50%',
                background:'radial-gradient(circle,rgba(0,255,231,0.58),transparent 70%)',
                boxShadow:'0 0 3px rgba(0,255,231,0.18)', opacity:0,
                animation:`drift ${p.d}s ease-in-out ${p.delay}s infinite`,
              }} />
            ))}
            <style>{`@keyframes drift{0%,100%{transform:translateY(0);opacity:0.18;}50%{transform:translateY(-14px);opacity:0.42;}}`}</style>
          </div>
        );
      }

      /* ── Status dot ── */
      function SDot({ status }) {
        const cls = status === "running" ? "sdot sdot-running" :
                    status === "success" ? "sdot sdot-success" :
                    status === "failed"  ? "sdot sdot-failed"  : "sdot sdot-idle";
        return <span className={cls} />;
      }

      /* ── Progress bar ── */
      function PBar() {
        return <div className="pbar" style={{margin:'12px 0'}}><div className="pbar-fill" /></div>;
      }

      /* ── Line Field ── */
      function LField({ label, hint, children }) {
        return (
          <div style={{marginBottom: 20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span className="neon-label" style={{opacity:0.8}}>{label}</span>
              {hint && <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.35)'}}>{hint}</span>}
            </div>
            {children}
          </div>
        );
      }

      /* ── Flat toggle tile ── */
      function FlatToggle({ label, checked, onChange, disabled = false }) {
        return (
          <label className={cn("flat-toggle", checked && "on", disabled && "disabled")}>
            <span>{label}</span>
            <div className="toggle-track">
              <div className="toggle-knob" />
            </div>
            <input type="checkbox" style={{display:'none'}} checked={checked} onChange={onChange} disabled={disabled} />
          </label>
        );
      }

      /* ── Tab strip ── */
      function TabStrip({ tab, setTab, L }) {
        return (
          <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(0,255,231,0.1)'}}>
            {[["image", L.tabs.image]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                background:'transparent', border:'none', borderBottom: tab === key ? '2px solid var(--c)' : '2px solid transparent',
                color: tab === key ? 'var(--c)' : 'rgba(160,220,235,0.5)',
                fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:13,
                padding:'12px 20px', cursor:'pointer', transition:'all 150ms',
                marginBottom:-1,
              }}>
                {label}
              </button>
            ))}
          </div>
        );
      }

      /* ── Resource row ── */
      function ResRow({ url, label, tone = "cyan", actionLabel, onAction, active, linkLabel = "Download" }) {
        const c = tone === "green" ? "rgba(74,222,128,0.7)" : "rgba(0,255,231,0.7)";
        return (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
            padding:'10px 0', borderBottom:'1px solid rgba(0,255,231,0.06)',
            borderLeft: active ? '2px solid var(--c)' : '2px solid transparent',
            paddingLeft: active ? 10 : 0,
          }}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:c}}>{label}</div>
              <div style={{fontFamily:'Space Mono',fontSize:10,color:'rgba(160,220,235,0.4)',wordBreak:'break-all',marginTop:3}}>{url}</div>
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              {actionLabel && onAction && (
                <button onClick={onAction} className="btn-secondary" style={{fontSize:9,padding:'5px 10px'}}>{actionLabel}</button>
              )}
              <a href={url} target="_blank" rel="noreferrer" className="btn-secondary" style={{fontSize:9,padding:'5px 10px'}} download>{linkLabel}</a>
            </div>
          </div>
        );
      }

      const designSurveySections = [
        { title: "一、建筑基本信息", questions: [
          { id:"q1", type:"text", title:"1. 占地面积", placeholder:"例如：120㎡", promptPrefix:"占地面积" },
          { id:"q2", type:"radio", title:"2. 建筑长度", dimension:"length", options:[
            { label:"A. 10-20m", value:"长度10-20m" }, { label:"B. 20-30m", value:"长度20-30m" },
            { label:"C. 30-50m", value:"长度30-50m" }, { label:"D. 准确长度", value:"custom", custom:true, customPlaceholder:"例如：18", customPrefix:"长度", customSuffix:"米" },
          ]},
          { id:"q3", type:"radio", title:"3. 建筑进深宽度", dimension:"width", options:[
            { label:"A. 5-10m", value:"宽度5-10m" }, { label:"B. 10-20m", value:"宽度10-20m" },
            { label:"C. 20-50m", value:"宽度20-50m" }, { label:"D. 准确宽度", value:"custom", custom:true, customPlaceholder:"例如：9", customPrefix:"宽度", customSuffix:"米" },
          ]},
          { id:"q4", type:"radio", title:"4. 外观整体风格", options:[
            { label:"A. 现代简约", value:"现代简约" }, { label:"B. 中东风格", value:"中东风格" },
            { label:"C. 东南亚风格", value:"东南亚风格" }, { label:"D. 其它风格", value:"custom", custom:true, customPlaceholder:"输入风格", customSuffix:"风格" },
          ]},
          { id:"q5", type:"radio", title:"5. 建筑用途", options:[{ label:"A. 住宅建筑", value:"住宅建筑" }, { label:"B. 办公/厂房建筑", value:"办公/厂房建筑" }, { label:"C. 商业建筑", value:"商业建筑" }] },
          { id:"q6", type:"radio", title:"6. 建筑层数", options:[{ label:"A. 单层建筑", value:"单层建筑" }, { label:"B. 双层建筑", value:"双层建筑" }, { label:"C. 3层建筑", value:"3层建筑" }, { label:"D. 单双层结合建筑", value:"单双层结合建筑" }] },
        ]},
        { title: "二、外观造型设计", questions: [
          { id:"q7", type:"radio", title:"7. 外立面轮廓", options:[{ label:"A. 方正直线型", value:"方正直线型" }, { label:"B. 流线弧线型", value:"流线弧线型" }, { label:"C. 前后左右错落流线型", value:"前后左右错落流线型" }, { label:"D. 异形扭曲不规则型", value:"异形扭曲不规则型" }] },
          { id:"q8", type:"radio", title:"8. 屋顶形式", options:[{ label:"A. 平顶", value:"平顶" }, { label:"B. 外凸坡屋顶", value:"外凸坡屋顶" }, { label:"C. 局部穹顶", value:"局部穹顶" }, { label:"D. 顶墙一体造型", value:"顶墙一体造型" }] },
          { id:"q9", type:"radio", title:"9. 屋顶材质", options:[{ label:"A. 砖红色瓦片屋顶", value:"砖红色瓦片屋顶" }, { label:"B. 灰黑色瓦片屋顶", value:"灰黑色瓦片屋顶" }, { label:"C. 太阳能板屋顶", value:"太阳能板屋顶" }, { label:"D. 蓝色铁皮内坡顶", value:"蓝色铁皮内坡顶" }] },
        ]},
        { title: "三、环境与效果图", questions: [
          { id:"q10", type:"radio", title:"10. 建筑所处环境", options:[{ label:"A. 社区公园环境", value:"社区公园环境" }, { label:"B. 沙漠环境", value:"沙漠环境" }, { label:"C. 热带雨林环境", value:"热带雨林环境" }, { label:"D. 寒带雪林环境", value:"寒带雪林环境" }] },
          { id:"q11", type:"radio", title:"11. 效果图视角", options:[{ label:"A. 正面效果", value:"正面效果" }, { label:"B. 正侧面效果", value:"正侧面效果" }, { label:"C. 正面侧面俯视多角度效果", value:"正面侧面俯视多角度效果" }] },
          { id:"q12", type:"radio", title:"12. 灯光氛围", options:[{ label:"A. 高清写实自然光", value:"高清写实自然光" }, { label:"B. 高清白天太阳光", value:"高清白天太阳光" }, { label:"C. 高清傍晚夕阳光", value:"高清傍晚夕阳光" }, { label:"D. 高清夜间夜景", value:"高清夜间夜景" }] },
        ]},
      ];

      const quoteSurveySections = [
        { title: "报价信息填写", questions: [
          { id:"qa1", type:"text", title:"1. 所在国家、城市", placeholder:"例如：中国北京" },
          { id:"qa2", type:"text", title:"2. 准确建筑面积", placeholder:"例如：150㎡" },
          { id:"qa3", type:"radio", title:"3. 内部净层高要求", options:[{ label:"A. 2.8m", value:"2.8m" }, { label:"B. 3m", value:"3m" }, { label:"C. 3.2m", value:"3.2m" }, { label:"D. 请填写", value:"custom", custom:true, customPlaceholder:"例如：3.6", customSuffix:"m" }] },
          { id:"qa4", type:"radio", title:"4. 采光窗户要求", options:[{ label:"A. 不用考虑采光、窗户少", value:"不用考虑采光、窗户少" }, { label:"B. 正常采光、正常窗户数量", value:"正常采光、正常窗户数量" }, { label:"C. 采光极好、落地窗为主", value:"采光极好、落地窗为主" }] },
          { id:"qa6", type:"radio", title:"5. 装修档次", options:[{ label:"A. 简单装修", value:"简单装修" }, { label:"B. 中档装修", value:"中档装修" }, { label:"C. 高档装修", value:"高档装修" }] },
          { id:"qa5", type:"radio", title:"6. 结构抗震等级要求", options:[{ label:"A. 地震少、无特别要求", value:"地震少、无特别要求" }, { label:"B. 地震不多、正常等级", value:"地震不多、正常等级" }, { label:"C. 地震频发、高等级抗震", value:"地震频发、高等级抗震" }] },
          { id:"qa10", type:"radio", title:"7. 基础做法", options:[{ label:"A. 条形基础", value:"条形基础" }, { label:"B. 内陆平原地区筏板基础", value:"内陆平原地区筏板基础" }, { label:"C. 沿海/荒漠基础", value:"沿海/荒漠基础" }] },
          { id:"qa7", type:"radio", title:"8. 顶面做法", options:[{ label:"A. 混凝土现浇平顶", value:"混凝土现浇平顶" }, { label:"B. 轻钢结构屋顶", value:"轻钢结构屋顶" }, { label:"C. 木质结构瓦片屋顶", value:"木质结构瓦片屋顶" }] },
          { id:"qa8", type:"radio", title:"9. 内墙做法", options:[{ label:"A. 3D打印内墙墙体", value:"3D打印内墙墙体" }, { label:"B. 轻质隔墙内墙墙体", value:"轻质隔墙内墙墙体" }] },
          { id:"qa9", type:"checkbox", title:"10. 其它（可多选）", options:[{ label:"A. 离网太阳能+储能系统", value:"离网太阳能+储能系统" }, { label:"B. 水循环系统", value:"水循环系统" }] },
        ]},
      ];

      const surveyEnglishText = {
        sections: {
          "一、建筑基本信息": "I. Basic Building Information",
          "二、外观造型设计": "II. Exterior Form Design",
          "三、环境与效果图": "III. Environment and Rendering",
          "报价信息填写": "Quotation Information",
        },
        questions: {
          q1: { title: "1. Site Area", placeholder: "e.g. 120 m2" },
          q2: { title: "2. Building Length", options: ["A. 10-20m", "B. 20-30m", "C. 30-50m", "D. Exact length"], customPlaceholder: "e.g. 18" },
          q3: { title: "3. Building Depth / Width", options: ["A. 5-10m", "B. 10-20m", "C. 20-50m", "D. Exact width"], customPlaceholder: "e.g. 9" },
          q4: { title: "4. Overall Exterior Style", options: ["A. Modern minimalist", "B. Middle Eastern style", "C. Southeast Asian style", "D. Other style"], customPlaceholder: "Enter style" },
          q5: { title: "5. Building Use", options: ["A. Residential building", "B. Office / factory building", "C. Commercial building"] },
          q6: { title: "6. Number of Floors", options: ["A. Single-storey building", "B. Two-storey building", "C. Three-storey building", "D. Mixed single / two-storey building"] },
          q7: { title: "7. Facade Outline", options: ["A. Rectilinear block form", "B. Streamlined curved form", "C. Staggered flowing form", "D. Irregular twisted form"] },
          q8: { title: "8. Roof Form", options: ["A. Flat roof", "B. Projecting pitched roof", "C. Partial dome", "D. Integrated roof-wall form"] },
          q9: { title: "9. Roof Material", options: ["A. Brick-red tile roof", "B. Dark gray tile roof", "C. Solar panel roof", "D. Blue metal inward-slope roof"] },
          q10: { title: "10. Site Environment", options: ["A. Community park environment", "B. Desert environment", "C. Tropical rainforest environment", "D. Cold snowy forest environment"] },
          q11: { title: "11. Rendering View Angle", options: ["A. Front view", "B. Front-side view", "C. Multi-angle front, side and top view"] },
          q12: { title: "12. Lighting Atmosphere", options: ["A. High-definition realistic natural light", "B. High-definition daytime sunlight", "C. High-definition sunset light", "D. High-definition night scene"] },
          qa1: { title: "1. Country and City", placeholder: "e.g. Beijing, China" },
          qa2: { title: "2. Exact Building Area", placeholder: "e.g. 150 m2" },
          qa3: { title: "3. Interior Clear Height Requirement", options: ["A. 2.8m", "B. 3m", "C. 3.2m", "D. Custom"], customPlaceholder: "e.g. 3.6" },
          qa4: { title: "4. Window and Daylighting Requirement", options: ["A. Minimal daylighting, few windows", "B. Normal daylighting and window count", "C. Excellent daylighting, mainly floor-to-ceiling windows"] },
          qa6: { title: "5. Interior Finish Level", options: ["A. Simple finish", "B. Mid-range finish", "C. Premium finish"] },
          qa5: { title: "6. Seismic Requirement", options: ["A. Low seismic area, no special requirement", "B. Normal seismic requirement", "C. High seismic area, high-grade seismic design"] },
          qa10: { title: "7. Foundation Method", options: ["A. Strip foundation", "B. Raft foundation for inland plains", "C. Coastal / desert foundation"] },
          qa7: { title: "8. Roof Construction Method", options: ["A. Cast-in-place concrete flat roof", "B. Light steel roof structure", "C. Timber tile roof structure"] },
          qa8: { title: "9. Interior Wall Method", options: ["A. 3D printed interior walls", "B. Lightweight partition interior walls"] },
          qa9: { title: "10. Others (multiple choices)", options: ["A. Off-grid solar + energy storage system", "B. Water circulation system"] },
        },
      };

      const surveySectionTitle = (title, lang) => lang === "en" ? (surveyEnglishText.sections[title] || title) : title;
      const surveyQuestionTitle = (question, lang) => lang === "en" ? (surveyEnglishText.questions[question.id]?.title || question.title) : question.title;
      const surveyQuestionPlaceholder = (question, lang) => lang === "en" ? (surveyEnglishText.questions[question.id]?.placeholder || question.placeholder || "") : (question.placeholder || "");
      const surveyOptionLabel = (question, optionIndex, option, lang) => lang === "en" ? (surveyEnglishText.questions[question.id]?.options?.[optionIndex] || option.label) : option.label;
      const surveyCustomPlaceholder = (question, option, lang) => lang === "en" ? (surveyEnglishText.questions[question.id]?.customPlaceholder || option.customPlaceholder || "") : (option.customPlaceholder || "");

      function valueForQuestion(question, values) {
        if (question.type === "text") return (values[question.id] || "").trim();
        if (question.type === "checkbox") return values[question.id] || [];
        const selected = values[question.id];
        const option = (question.options || []).find(o => o.value === selected);
        if (!option) return "";
        if (!option.custom) return option.value;
        const custom = (values[`${question.id}_custom`] || "").trim();
        if (!custom) return "";
        return `${option.customPrefix || ""}${custom}${option.customSuffix || ""}`;
      }

      function buildDesignSurveyPrompt(values) {
        const answers = [];
        let lengthText = "";
        let widthText = "";
        designSurveySections.forEach(section => section.questions.forEach(question => {
          const value = valueForQuestion(question, values);
          if (!value) return;
          const promptValue = question.promptPrefix ? `${question.promptPrefix}${value}` : value;
          answers.push(promptValue);
          if (question.dimension === "length") lengthText = value.replace(/^长度/, "");
          if (question.dimension === "width") widthText = value.replace(/^宽度/, "");
        }));
        const brief = answers.length ? answers.join("、") : "3D打印住宅建筑，现代简约，单层建筑，方正直线型，平顶，高清写实自然光";
        return {
          prompt: `生成单张用于图生3D建模的高品质混凝土3D打印建筑外观效果图，设计要求为${brief}，画面只包含一个完整建筑主体，背景干净，主体轮廓清晰，所有墙上有高15mm横条打印堆叠层纹，墙面以米白色为主，细节完整，满足方案汇报、图像优化与图生3D建模参考。`,
          lengthText,
          widthText,
        };
      }

      function buildQuotePrompt(values, dimensions) {
        const city = (values.qa1 || "").trim() || "未填写";
        const area = (values.qa2 || "").trim() || "未填写";
        const height = valueForQuestion({ id:"qa3", type:"radio", options: quoteSurveySections[0].questions.find(q=>q.id==="qa3").options }, values) || "未选择";
        const light = valueForQuestion(quoteSurveySections[0].questions.find(q=>q.id==="qa4"), values) || "未选择";
        const finish = valueForQuestion(quoteSurveySections[0].questions.find(q=>q.id==="qa6"), values) || "未选择";
        const seismic = valueForQuestion(quoteSurveySections[0].questions.find(q=>q.id==="qa5"), values) || "未选择";
        const foundation = valueForQuestion(quoteSurveySections[0].questions.find(q=>q.id==="qa10"), values) || "未选择";
        const roof = valueForQuestion(quoteSurveySections[0].questions.find(q=>q.id==="qa7"), values) || "未选择";
        const wall = valueForQuestion(quoteSurveySections[0].questions.find(q=>q.id==="qa8"), values) || "未选择";
        const extras = valueForQuestion(quoteSurveySections[0].questions.find(q=>q.id==="qa9"), values);
        const extrasText = extras.length ? extras.join("、") : "无";
        return `为该3D打印建筑报建造总价与清单，建筑情况是：位于${city}，建筑面积${area}，建筑长度${dimensions.lengthText || "未填写"}、宽度${dimensions.widthText || "未填写"}，内部净高${height}，${light}，装修档次为${finish}，${seismic}，基础做法为${foundation}，${roof}，${wall}，其他配置：${extrasText}。`;
      }

      function SurveyQuestion({ question, values, setValues, onAnswered, lang = "zh" }) {
        const setValue = (key, value) => setValues(prev => ({...prev, [key]: value}));
        if (question.type === "text") {
          return (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:600,color:'rgba(225,248,255,0.86)',marginBottom:8}}>{surveyQuestionTitle(question, lang)}</div>
              <input className="line-input" value={values[question.id] || ""} placeholder={surveyQuestionPlaceholder(question, lang)}
                onChange={e=>setValue(question.id, e.target.value)} />
            </div>
          );
        }
        return (
          <div style={{marginBottom:18}}>
            <div style={{fontSize:13,fontWeight:600,color:'rgba(225,248,255,0.86)',marginBottom:8}}>{surveyQuestionTitle(question, lang)}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>
              {question.options.map((option, optionIndex) => {
                const checked = question.type === "checkbox"
                  ? (values[question.id] || []).includes(option.value)
                  : values[question.id] === option.value;
                const toggle = () => {
                  if (question.type === "checkbox") {
                    const next = new Set(values[question.id] || []);
                    checked ? next.delete(option.value) : next.add(option.value);
                    setValue(question.id, Array.from(next));
                  } else {
                    setValue(question.id, option.value);
                    if (!option.custom && onAnswered) setTimeout(onAnswered, 180);
                  }
                };
                return (
                  <label key={option.label} style={{display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid rgba(0,255,231,0.07)',padding:'8px 0',fontSize:12,color:checked?'var(--c)':'rgba(160,220,235,0.62)',cursor:'pointer'}}>
                    <input type={question.type === "checkbox" ? "checkbox" : "radio"} checked={checked} onChange={toggle}
                      style={{accentColor:'#00ffe7',width:14,height:14}} />
                    <span>{surveyOptionLabel(question, optionIndex, option, lang)}</span>
                    {option.custom && (
                      <input className="line-input" value={values[`${question.id}_custom`] || ""} placeholder={surveyCustomPlaceholder(question, option, lang)}
                        onFocus={()=>setValue(question.id, option.value)}
                        onChange={e=>setValue(`${question.id}_custom`, e.target.value)}
                        style={{padding:'4px 0',fontSize:12,minWidth:0}} />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      }

      /* ── Main App ── */
      function App() {
        const [lang, setLang] = useState("zh");
        const [health, setHealth] = useState({ ok: false, api_key_configured: false, google_api_key_configured: false });
        const [settings, setSettings] = useState({ api_key: "", google_api_key: "", api_key_configured: false, google_api_key_configured: false, masked_api_key: "", masked_google_api_key: "", gemini_image_model: "", key_format_warning: "", saving: false, google_saving: false });
        const heroModelRef = useRef(null);
        const [tab, setTab] = useState("image");
        const [busy, setBusy] = useState(false);
        const [busyLabel, setBusyLabel] = useState("");
        const [taskId, setTaskId] = useState("");
        const [taskDetail, setTaskDetail] = useState(null);
        const [selectedModelUrl, setSelectedModelUrl] = useState("");
        const [message, setMessage] = useState("");
        const [textForm, setTextForm] = useState({ prompt: defaultTextPrompt, negative_prompt: defaultNegative, model_version: "P1-20260311", face_limit: 20000, texture: false, pbr: false, auto_size: true, quad: false, seed: "" });
        const [imageForm, setImageForm] = useState({ image_url: "", negative_prompt: promptTemplates[4].negative, model_version: "P1-20260311", face_limit: 20000, texture: false, pbr: false, auto_size: true, quad: false, seed: "" });
        const [imageFile, setImageFile] = useState(null);
        const [imageSourceMode, setImageSourceMode] = useState("upload");
        const [imageGen, setImageGen] = useState({ prompt: promptTemplates[5].prompt, negative_prompt: promptTemplates[5].negative, seed: "" });
        const [surveyValues, setSurveyValues] = useState({});
        const [quoteValues, setQuoteValues] = useState({});
        const [surveyModalOpen, setSurveyModalOpen] = useState(false);
        const [surveyStep, setSurveyStep] = useState(0);
        const [surveyPrompt, setSurveyPrompt] = useState("");
        const [quotePrompt, setQuotePrompt] = useState("");
        const [surveyDimensions, setSurveyDimensions] = useState({ lengthText: "", widthText: "" });
        const surveyRootRef = useRef(null);
        const surveyOverlayRef = useRef(null);
        const surveyModalRef = useRef(null);
        const surveyHeaderRef = useRef(null);
        const surveyProgressRef = useRef(null);
        const surveyQuestionRef = useRef(null);
        const surveyFooterRef = useRef(null);
        const surveyProgressFillRef = useRef(null);
        const surveyClosingRef = useRef(false);
        const surveyQuestionAnimatingRef = useRef(false);
        const [referenceImage, setReferenceImage] = useState(null);
        const [transparentImage, setTransparentImage] = useState(null);
        const [sideSection, setSideSection] = useState("workspace");
        const [veilResolutionScale, setVeilResolutionScale] = useState(() => (window.innerWidth <= 900 ? 0.55 : 0.75));

        const L = copy[lang];

        useEffect(() => {
          const handleResize = () => setVeilResolutionScale(window.innerWidth <= 900 ? 0.55 : 0.75);
          window.addEventListener("resize", handleResize);
          return () => window.removeEventListener("resize", handleResize);
        }, []);

        useEffect(() => {
          fetch("/api/health").then(r=>r.json()).then(setHealth).catch(()=>setHealth({ok:false,api_key_configured:false}));
          fetch("/api/settings").then(r=>r.json()).then(d=>setSettings(v=>({...v,api_key_configured:d.api_key_configured,google_api_key_configured:d.google_api_key_configured,masked_api_key:d.masked_api_key||"",masked_google_api_key:d.masked_google_api_key||"",gemini_image_model:d.gemini_image_model||"",key_format_warning:d.key_format_warning||""}))).catch(()=>{});
        }, []);

        useEffect(() => {
          const viewer = heroModelRef.current;
          if (!viewer) return;
          const attrs = {
            src: "/models/robotic_arm_kuka.glb",
            "camera-orbit": "-34deg 66deg auto",
            "field-of-view": "28deg",
            exposure: "0.95",
            "shadow-intensity": "0.35",
            "shadow-softness": "0.85",
            "auto-rotate-delay": "0",
            "rotation-per-second": "12deg",
            "interaction-prompt": "none",
            loading: "eager",
            reveal: "auto",
          };
          Object.entries(attrs).forEach(([key, value]) => viewer.setAttribute(key, value));
          viewer.setAttribute("auto-rotate", "");
          viewer.setAttribute("disable-zoom", "");
        }, []);

        const textQuadUnsupported = /^P1/i.test((textForm.model_version||"").trim());
        const imageQuadUnsupported = /^P1/i.test((imageForm.model_version||"").trim());
        const imageAutoSizeUnsupported = !imageForm.texture && !imageForm.pbr;

        const previewableModelUrls = useMemo(() => {
          const ex = taskDetail?.viewer_model_urls||[];
          if(ex.length) return ex;
          return (taskDetail?.model_urls||[]).filter(u=>{const c=u.split("?")[0].toLowerCase();return c.endsWith(".glb")||c.endsWith(".gltf");});
        }, [taskDetail]);

        const viewerPosterUrl = useMemo(()=>{
          const p=(taskDetail?.preview_urls||[]).find(u=>{const l=u.toLowerCase();return l.includes(".png")||l.includes(".jpg")||l.includes(".jpeg")||l.includes(".webp");});
          return p?`/api/proxy-file?url=${encodeURIComponent(p)}`:"";
        },[taskDetail]);

        const viewerSrc = useMemo(()=>selectedModelUrl?`/api/proxy-file?url=${encodeURIComponent(selectedModelUrl)}`:"", [selectedModelUrl]);

        const prefersReducedMotion = () =>
          typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const statusLabel = useMemo(()=>{
          const s=taskDetail?.status;
          if(s==="success") return L.success;
          if(s==="failed") return L.failed;
          if(s==="running") return L.running;
          return L.idle;
        },[taskDetail,L]);

        const statusClass = useMemo(()=>{
          const s=taskDetail?.status;
          if(s==="success") return "#4ade80";
          if(s==="failed") return "#f87171";
          if(s==="running") return "var(--c)";
          return "rgba(255,255,255,0.5)";
        },[taskDetail]);

        useEffect(()=>{
          if(!previewableModelUrls.length){setSelectedModelUrl("");return;}
          if(!selectedModelUrl||!previewableModelUrls.includes(selectedModelUrl)) setSelectedModelUrl(previewableModelUrls[0]);
        },[previewableModelUrls]);

        useEffect(()=>{if(textQuadUnsupported&&textForm.quad)setTextForm(v=>({...v,quad:false}));},[textQuadUnsupported]);
        useEffect(()=>{if(imageQuadUnsupported&&imageForm.quad)setImageForm(v=>({...v,quad:false}));},[imageQuadUnsupported]);

        useLayoutEffect(() => {
          if (!surveyModalOpen) return undefined;
          const reduced = prefersReducedMotion();
          const ctx = gsap.context(() => {
            const staggerTargets = [
              surveyHeaderRef.current,
              surveyProgressRef.current,
              surveyQuestionRef.current,
              surveyFooterRef.current,
            ].filter(Boolean);

            gsap.set(surveyOverlayRef.current, { opacity: 0 });
            gsap.set(surveyModalRef.current, {
              opacity: 0,
              y: reduced ? 0 : 80,
              scale: reduced ? 1 : 0.96,
              filter: reduced ? "none" : "blur(14px)",
            });
            gsap.set(staggerTargets, {
              opacity: 0,
              y: reduced ? 0 : 24,
              filter: reduced ? "none" : "blur(8px)",
            });
            gsap.set(surveyProgressFillRef.current, {
              scaleX: (surveyStep + 1) / surveyQuestions.length,
              transformOrigin: "left center",
            });

            const tl = gsap.timeline();
            tl.to(surveyOverlayRef.current, {
              opacity: 1,
              duration: reduced ? 0.18 : 0.35,
              ease: "power2.out",
            })
              .to(surveyModalRef.current, {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: reduced ? "none" : "blur(0px)",
                duration: reduced ? 0.22 : 0.75,
                ease: "power3.out",
              }, reduced ? "<" : "-=0.1")
              .to(staggerTargets, {
                opacity: 1,
                y: 0,
                filter: reduced ? "none" : "blur(0px)",
                duration: reduced ? 0.2 : 0.55,
                stagger: reduced ? 0 : 0.06,
                ease: "power3.out",
              }, reduced ? "<" : "-=0.35");
          }, surveyRootRef);

          return () => ctx.revert();
        }, [surveyModalOpen]);

        const jumpTo = id => { const n=document.getElementById(id); if(n)n.scrollIntoView({behavior:"smooth",block:"start"}); };

        const parseJson = async res => { const t=await res.text(); try{return t?JSON.parse(t):{};} catch{return{detail:t||"Request failed"};} };
        const formatDetail = detail => {
          if(!detail) return "";
          if(typeof detail === "string") {
            try {
              const parsed = JSON.parse(detail);
              return formatDetail(parsed) || detail;
            } catch {
              return detail;
            }
          }
          if(detail.message) {
            const nested = detail.message;
            if(typeof nested === "string") {
              try {
                const parsed = JSON.parse(nested);
                return formatDetail(parsed) || nested;
              } catch {
                return nested;
              }
            }
            return JSON.stringify(nested);
          }
          if(detail.code && detail.suggestion) return `${detail.code}: ${detail.suggestion}`;
          if(detail.code) return `${detail.code}: ${detail.message || "Request failed"}`;
          try { return JSON.stringify(detail); } catch { return String(detail); }
        };
        const errorMessage = (error, fallback) => formatDetail(error?.message || error) || fallback;

        const surveyQuestions = useMemo(() => designSurveySections.flatMap(section => section.questions), []);
        const currentSurveyQuestion = surveyQuestions[surveyStep];
        const currentSurveyAnswered = currentSurveyQuestion ? Boolean(valueForQuestion(currentSurveyQuestion, surveyValues)) : false;
        const generatedImagePath = transparentImage?.image_path || "";
        const hasSurveyPrompt = Boolean((surveyPrompt || "").trim());
        const hasReferenceImage = Boolean(referenceImage?.image_path);
        const hasTransparentImage = Boolean(transparentImage?.image_path);
        const hasGeneratedImage = Boolean(generatedImagePath);
        const nextSurveyAction = useMemo(() => {
          if (!hasSurveyPrompt) {
            return {
              key: "prompt",
              title: lang === "zh" ? "先完成设计问卷" : "Complete the survey first",
              body: lang === "zh" ? "完成问卷后会生成可编辑提示词，然后继续生成参考图。" : "Finish the survey to create an editable prompt, then generate a reference image.",
            };
          }
          if (!hasReferenceImage) {
            return {
              key: "reference",
              title: lang === "zh" ? "下一步：生成参考图" : "Next: generate reference image",
              body: lang === "zh" ? "提示词已就绪。点击「生成参考图」，创建用于图生 3D 的建筑参考图。" : "The prompt is ready. Generate a reference image for image-to-3D.",
            };
          }
          if (!hasTransparentImage) {
            return {
              key: "transparent",
              title: lang === "zh" ? "下一步：优化透明主体" : "Next: optimize transparent subject",
              body: lang === "zh" ? "参考图已生成。检查主体是否完整、背景是否干净，然后点击「优化透明主体」。" : "The reference is ready. Check the subject and background, then optimize the cutout.",
            };
          }
          return {
            key: "tripo",
            title: lang === "zh" ? "透明主体图可用" : "Transparent subject ready",
            body: lang === "zh" ? "透明主体图将优先作为 Tripo 图生 3D 输入，可继续提交生成模型。" : "The transparent subject will be prioritized for Tripo image-to-3D.",
          };
        }, [hasSurveyPrompt, hasReferenceImage, hasTransparentImage, lang]);
        const surveyFlowSteps = useMemo(() => ([
          { key: "prompt", label: lang === "zh" ? "问卷完成" : "Survey", done: hasSurveyPrompt },
          { key: "reference", label: lang === "zh" ? "生成参考图" : "Reference", done: hasReferenceImage },
          { key: "transparent", label: lang === "zh" ? "优化透明主体" : "Cutout", done: hasTransparentImage },
          { key: "tripo", label: lang === "zh" ? "提交图生 3D" : "Submit 3D", done: false },
        ]), [hasSurveyPrompt, hasReferenceImage, hasTransparentImage, lang]);
        const openSurveyModal = () => {
          surveyClosingRef.current = false;
          surveyQuestionAnimatingRef.current = false;
          setSurveyStep(0);
          setSurveyModalOpen(true);
        };

        const closeSurveyModal = (onClosed) => {
          if (surveyClosingRef.current) return;
          surveyClosingRef.current = true;
          const finishClose = () => {
            setSurveyModalOpen(false);
            surveyClosingRef.current = false;
            if (onClosed) onClosed();
          };

          if (!surveyModalRef.current || prefersReducedMotion()) {
            gsap.to(surveyOverlayRef.current, {
              opacity: 0,
              duration: 0.18,
              ease: "power2.out",
              onComplete: finishClose,
            });
            return;
          }

          gsap.timeline({ onComplete: finishClose })
            .to(surveyModalRef.current, {
              y: 60,
              scale: 0.97,
              opacity: 0,
              filter: "blur(10px)",
              duration: 0.34,
              ease: "power2.in",
            })
            .to(surveyOverlayRef.current, {
              opacity: 0,
              duration: 0.24,
              ease: "power2.out",
            }, "-=0.18");
        };

        const animateProgressTo = nextStep => {
          if (!surveyProgressFillRef.current) return;
          gsap.to(surveyProgressFillRef.current, {
            scaleX: (nextStep + 1) / surveyQuestions.length,
            duration: prefersReducedMotion() ? 0.16 : 0.45,
            ease: "power3.out",
            transformOrigin: "left center",
          });
        };

        const goToSurveyStep = (nextStep, direction = "next") => {
          if (surveyQuestionAnimatingRef.current) return;
          if (nextStep < 0 || nextStep >= surveyQuestions.length || nextStep === surveyStep) return;

          const reduced = prefersReducedMotion();
          if (!surveyQuestionRef.current || reduced) {
            setSurveyStep(nextStep);
            requestAnimationFrame(() => animateProgressTo(nextStep));
            return;
          }

          surveyQuestionAnimatingRef.current = true;
          const exitX = direction === "next" ? -32 : 32;
          const enterX = direction === "next" ? 32 : -32;

          gsap.to(surveyQuestionRef.current, {
            opacity: 0,
            x: exitX,
            y: -10,
            filter: "blur(8px)",
            duration: 0.25,
            ease: "power2.in",
            onComplete: () => {
              setSurveyStep(nextStep);
              requestAnimationFrame(() => {
                gsap.fromTo(surveyQuestionRef.current,
                  { opacity: 0, x: enterX, y: 32, filter: "blur(10px)" },
                  {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    filter: "blur(0px)",
                    duration: 0.45,
                    ease: "power3.out",
                    onComplete: () => { surveyQuestionAnimatingRef.current = false; },
                  }
                );
                animateProgressTo(nextStep);
              });
            },
          });
        };

        const finishSurvey = () => {
          generateSurveyPrompt();
          closeSurveyModal(() => {
            setTab("image");
            jumpTo("workspace");
          });
        };

        const advanceSurvey = () => {
          if (!currentSurveyAnswered) return;
          if (surveyStep >= surveyQuestions.length - 1) finishSurvey();
          else goToSurveyStep(Math.min(surveyStep + 1, surveyQuestions.length - 1), "next");
        };

        const applyTemplate = item => {
          if(item.type==="text"){setTab("text");setTextForm(v=>({...v,prompt:item.prompt,negative_prompt:item.negative}));setMessage(L.messageTemplateText);}
          else if(item.type==="image"){setTab("image");setImageForm(v=>({...v,negative_prompt:item.negative}));setMessage(L.messageTemplateImage);}
          else{setTab("imagegen");setImageGen(v=>({...v,prompt:item.prompt,negative_prompt:item.negative}));setMessage(L.messageTemplateImageGen);}
        };

        const pollTask = async id => { const r=await fetch(`/api/tripo/tasks/${id}`); const d=await r.json(); setTaskDetail(d); return d; };

        const saveApiKey = async () => {
          setSettings(v=>({...v,saving:true}));
          try{
            const r=await fetch("/api/settings/tripo-key",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({api_key:settings.api_key})});
            const d=await r.json();
            if(!r.ok)throw new Error(d.detail||L.messageSaveError);
            setSettings(v=>({...v,api_key:"",api_key_configured:d.api_key_configured,masked_api_key:d.masked_api_key||"",key_format_warning:d.key_format_warning||"",saving:false}));
            setHealth(v=>({...v,api_key_configured:d.api_key_configured}));
            setMessage(d.api_key_configured?L.messageSaveSuccess:L.messageSaveCleared);
          }catch(e){setSettings(v=>({...v,saving:false}));setMessage(e.message||L.messageSaveError);}
        };

        const saveGoogleKey = async () => {
          setSettings(v=>({...v,google_saving:true}));
          try{
            const r=await fetch("/api/settings/google-key",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({api_key:settings.google_api_key})});
            const d=await r.json();
            if(!r.ok)throw new Error(d.detail||L.messageSaveError);
            setSettings(v=>({...v,google_api_key:"",google_api_key_configured:d.google_api_key_configured,masked_google_api_key:d.masked_google_api_key||"",gemini_image_model:d.gemini_image_model||v.gemini_image_model,google_saving:false}));
            setHealth(v=>({...v,google_api_key_configured:d.google_api_key_configured}));
            setMessage(d.google_api_key_configured?L.messageGoogleSaveSuccess:L.messageGoogleSaveCleared);
          }catch(e){setSettings(v=>({...v,google_saving:false}));setMessage(e.message||L.messageSaveError);}
        };

        const generateSurveyPrompt = () => {
          const built = buildDesignSurveyPrompt(surveyValues);
          const quote = buildQuotePrompt(quoteValues, built);
          setSurveyPrompt(built.prompt);
          setQuotePrompt(quote);
          setSurveyDimensions({ lengthText: built.lengthText, widthText: built.widthText });
          setImageSourceMode("generated");
          setImageGen(v=>({...v,prompt:built.prompt,negative_prompt:"杂乱背景，人物，车辆，树木遮挡，复杂街景，多栋建筑拼贴，文字，水印，低清晰度，畸变"}));
          setMessage(L.surveyPromptReady);
        };

        const submitSurveyImage = async () => {
          const prompt = surveyPrompt || buildDesignSurveyPrompt(surveyValues).prompt;
          setBusy(true);setBusyLabel(L.generatingReference);setMessage(L.generatingReference);
          try{
            const r=await fetch("/api/gemini/text-to-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,negative_prompt:imageGen.negative_prompt})});
            const d=await parseJson(r);if(!r.ok)throw new Error(formatDetail(d.detail)||"Image generation failed");
            setReferenceImage(d);setTransparentImage(null);setImageSourceMode("generated");setMessage(L.surveyImageReady);
          }catch(e){setMessage(errorMessage(e,"Image generation failed"));}finally{setBusy(false);setBusyLabel("");}
        };

        const submitTransparentSubject = async () => {
          if(!referenceImage?.image_path){setMessage(L.surveyNoImage);return;}
          setBusy(true);setBusyLabel(L.generatingTransparent);setMessage(L.generatingTransparent);
          try{
            const r=await fetch("/api/gemini/transparent-subject",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image_path:referenceImage.image_path})});
            const d=await parseJson(r);if(!r.ok)throw new Error(formatDetail(d.detail)||"Image optimization failed");
            setTransparentImage(d);setImageSourceMode("generated");setMessage(L.surveyTransparentReady);
          }catch(e){setMessage(errorMessage(e,"Image optimization failed"));}finally{setBusy(false);setBusyLabel("");}
        };

        const submitSurveyToTripo = async () => {
          const imagePath = transparentImage?.image_path;
          if(!imagePath){setMessage(L.surveyNoImage);return;}
          setBusy(true);setBusyLabel(L.submittingTripo);setMessage(L.submittingTripo);setTaskDetail(null);
          try{
            const p={...imageForm,image_path:imagePath,face_limit:Number(imageForm.face_limit),seed:imageForm.seed?Number(imageForm.seed):null};
            delete p.image_url;
            const r=await fetch("/api/tripo/saved-image-to-model",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
            const d=await parseJson(r);if(!r.ok)throw new Error(formatDetail(d.detail)||"Submit failed");
            setTaskId(d.task_id||"");setMessage(L.surveySubmittedToTripo);jumpTo("results");
            if(d.task_id)await pollTask(d.task_id);
          }catch(e){setMessage(errorMessage(e,"Submit failed"));jumpTo("results");}finally{setBusy(false);setBusyLabel("");}
        };

        const submitText = async () => {
          setBusy(true);setMessage("");setTaskDetail(null);
          try{
            const p={...textForm,face_limit:Number(textForm.face_limit),seed:textForm.seed?Number(textForm.seed):null};
            const r=await fetch("/api/tripo/text-to-model",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
            const d=await r.json();if(!r.ok)throw new Error(d.detail||"Submit failed");
            setTaskId(d.task_id||"");setMessage(L.messageTextSubmitted);
            if(d.task_id)await pollTask(d.task_id);
          }catch(e){setMessage(e.message||"Submit failed");}finally{setBusy(false);}
        };

        const submitImage = async () => {
          setBusy(true);setBusyLabel(L.submittingTripo);setMessage(L.submittingTripo);setTaskDetail(null);
          try{
            if(imageSourceMode === "generated"){
              const imagePath = transparentImage?.image_path;
              if(!imagePath)throw new Error(L.generatedSourceMissing);
              const p={...imageForm,image_path:imagePath,face_limit:Number(imageForm.face_limit),seed:imageForm.seed?Number(imageForm.seed):null};
              delete p.image_url;
              const r=await fetch("/api/tripo/saved-image-to-model",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
              const d=await parseJson(r);if(!r.ok)throw new Error(formatDetail(d.detail)||"Submit failed");
              setTaskId(d.task_id||"");setMessage(L.surveySubmittedToTripo);jumpTo("results");
              if(d.task_id)await pollTask(d.task_id);
              return;
            }

            if(!imageFile)throw new Error(L.messageImageSourceMissing);
            let r;
            const fd=new FormData();fd.append("file",imageFile);
            Object.entries(imageForm).forEach(([k,v])=>{if(k==="image_url")return;if(k==="seed"&&(v===""||v==null))return;fd.append(k,typeof v==="boolean"?String(v):`${v}`);});
            r=await fetch("/api/tripo/image-upload-to-model",{method:"POST",body:fd});
            const d=await parseJson(r);if(!r.ok)throw new Error(formatDetail(d.detail)||"Submit failed");
            setTaskId(d.task_id||"");setMessage(L.messageImageSubmitted);jumpTo("results");
            if(d.task_id)await pollTask(d.task_id);
          }catch(e){setMessage(errorMessage(e,"Submit failed"));jumpTo("results");}finally{setBusy(false);setBusyLabel("");}
        };

        const submitImageGen = async () => {
          setBusy(true);setMessage("");
          try{
            const fd=new FormData();fd.append("prompt",imageGen.prompt);fd.append("negative_prompt",imageGen.negative_prompt||"");
            if(imageGen.seed)fd.append("seed",imageGen.seed);
            const r=await fetch("/api/tripo/text-to-image",{method:"POST",body:fd});
            const d=await r.json();if(!r.ok)throw new Error(d.detail||"Submit failed");
            setTaskId(d.task_id||"");setMessage(L.messageImageGenSubmitted);
            if(d.task_id)await pollTask(d.task_id);
          }catch(e){setMessage(e.message||"Submit failed");}finally{setBusy(false);}
        };

        /* Sidebar sections */
        const navItems = [
          ["key", L.navKey, "01"],
          ["templates", L.navTemplates, "02"],
          ["survey", L.surveyOpen, "03"],
          ["workspace", L.navWorkspace, "04"],
          ["results", L.navResults, "05"],
        ];
        const topNavItems = [
          ["workflow", lang === "zh" ? "工作流" : "Workflow"],
          ["templates", lang === "zh" ? "模板库" : "Templates"],
          ["survey", lang === "zh" ? "设计问卷" : "Survey"],
          ["workspace", lang === "zh" ? "生成工作台" : "Generate"],
          ["results", lang === "zh" ? "任务输出" : "Output"],
        ];
        const workflowCards = [
          {
            key: "key",
            num: "01",
            title: lang === "zh" ? "接入配置" : "API Access",
            desc: lang === "zh" ? "Tripo3D / Gemini / GPT Image API Key 管理" : "Manage Tripo3D, Gemini, and image API keys",
          },
          {
            key: "templates",
            num: "02",
            title: lang === "zh" ? "模板库" : "Templates",
            desc: lang === "zh" ? "建筑体块、混凝土打印测试件、构造节点模板" : "Massing, concrete print tests, and node templates",
          },
          {
            key: "survey",
            num: "03",
            title: lang === "zh" ? "设计问卷" : "Design Survey",
            desc: lang === "zh" ? "通过问卷生成建筑 AI prompt" : "Turn structured answers into architecture prompts",
          },
          {
            key: "workspace",
            num: "04",
            title: lang === "zh" ? "生成任务" : "Generation",
            desc: lang === "zh" ? "图像生成、3D 模型生成、任务状态监控" : "Image generation, 3D model creation, and task status",
          },
        ];
        const goToPanel = key => {
          setSideSection(key);
          if (key === "survey") {
            openSurveyModal();
            return;
          }
          if (key === "key") document.getElementById("key")?.setAttribute("open", "");
          jumpTo(key);
        };

        return (
          <div id="app-shell" style={{display:'flex', minHeight:'100vh', position:'relative', zIndex:1}}>
            <div className="darkveil-bg" aria-hidden="true">
              <DarkVeil
                speed={0.35}
                hueShift={165}
                noiseIntensity={0.03}
                scanlineIntensity={0.12}
                scanlineFrequency={1.8}
                warpAmount={0.18}
                resolutionScale={veilResolutionScale}
              />
            </div>
            <Particles />

            {surveyModalOpen && currentSurveyQuestion && (
              <div ref={surveyRootRef} className="survey-modal-root">
                <div ref={surveyOverlayRef} className="survey-modal-overlay" />
                <div ref={surveyModalRef} role="dialog" aria-modal="true" className="survey-modal-panel">
                  <div ref={surveyHeaderRef} className="survey-modal-header">
                    <div>
                      <div className="neon-label" style={{marginBottom:6}}>{L.surveyEyebrow}</div>
                      <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18}}>{L.surveyTitle}</div>
                    </div>
                    <button className="btn-secondary survey-motion-btn" onClick={()=>closeSurveyModal()} style={{fontSize:9,padding:'7px 10px'}}>{L.surveyClose}</button>
                  </div>

                  <div ref={surveyProgressRef} style={{padding:'18px 22px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:14}}>
                    <div style={{fontFamily:'Space Mono',fontSize:10,letterSpacing:'0.2em',color:'rgba(0,255,231,0.65)',textTransform:'uppercase'}}>
                      {L.surveyProgress} {surveyStep + 1} / {surveyQuestions.length}
                    </div>
                    <div style={{flex:1,height:1,background:'rgba(0,255,231,0.12)',position:'relative',overflow:'hidden'}}>
                      <div ref={surveyProgressFillRef} className="survey-progress-fill" style={{position:'absolute',left:0,top:0,bottom:0,width:'100%',transform:`scaleX(${((surveyStep + 1) / surveyQuestions.length)})`,transformOrigin:'left center',background:'var(--c)',boxShadow:'0 0 10px rgba(0,255,231,0.5)'}} />
                    </div>
                  </div>

                  <div ref={surveyQuestionRef} className="survey-question-shell">
                    <SurveyQuestion question={currentSurveyQuestion} values={surveyValues} setValues={setSurveyValues}
                      lang={lang}
                      onAnswered={surveyStep < surveyQuestions.length - 1 ? () => goToSurveyStep(Math.min(surveyStep + 1, surveyQuestions.length - 1), "next") : null} />
                    <div style={{fontSize:11,color:'rgba(160,220,235,0.42)',fontFamily:'Space Mono',lineHeight:1.7,borderTop:'1px solid rgba(0,255,231,0.08)',paddingTop:14}}>
                      {L.surveyStepHint}
                    </div>
                  </div>

                  <div ref={surveyFooterRef} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'16px 22px',borderTop:'1px solid var(--line)'}}>
                    <button className="btn-secondary survey-motion-btn" onClick={()=>goToSurveyStep(Math.max(0,surveyStep-1), "prev")} disabled={surveyStep===0 || surveyQuestionAnimatingRef.current}>{L.surveyPrev}</button>
                    <button className="btn-primary survey-motion-btn" onClick={advanceSurvey} disabled={!currentSurveyAnswered || surveyQuestionAnimatingRef.current}>
                      {surveyStep >= surveyQuestions.length - 1 ? L.surveyDone : L.surveyNext}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SIDEBAR ── */}
            <header className="top-nav-shell">
              <button className="logo-pill" onClick={() => jumpTo("workflow")} aria-label="KENYO home">
                <span>K</span>
              </button>
              <nav className="nav-pill" aria-label="Primary navigation">
                {topNavItems.map(([key, label]) => (
                  <button key={key} className="top-nav-link" onClick={() => goToPanel(key)}>
                    {label}
                  </button>
                ))}
                <span className="nav-divider" />
                {[["zh", "中文"], ["en", "EN"]].map(([key, label]) => (
                  <button key={key} className={cn("lang-pill", lang === key && "active")} onClick={() => setLang(key)}>
                    {label}
                  </button>
                ))}
              </nav>
            </header>

            <div id="sidebar">
              {/* Logo */}
              <div style={{padding:'28px 20px 20px',borderBottom:'1px solid var(--line)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  {/* Spinning ring logo */}
                  <div style={{position:'relative',width:36,height:36,flexShrink:0}}>
                    <div className="spin-ring" style={{position:'absolute',inset:0}} />
                    <div style={{position:'absolute',inset:6,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Mono',fontSize:11,color:'var(--c)',fontWeight:700}}>K</div>
                  </div>
                  <div>
                    <div style={{fontFamily:'Syne',fontWeight:800,fontSize:14,letterSpacing:'0.12em',color:'var(--text)'}}>KENYO</div>
                    <div style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.3em',color:'rgba(0,255,231,0.5)',marginTop:2}}>TRIPO3D</div>
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div style={{padding:'14px 20px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <SDot status={settings.api_key_configured?"success":"idle"} />
                  <span style={{fontFamily:'Space Mono',fontSize:10,letterSpacing:'0.15em',color: settings.api_key_configured?'rgba(74,222,128,0.9)':'rgba(160,220,235,0.5)'}}>
                    {settings.api_key_configured ? L.statusReady : L.statusNeedKey}
                  </span>
                </div>
                {/* Lang toggle */}
                <div style={{display:'flex',gap:4}}>
                  {[["zh","中文"],["en","EN"]].map(([k,l])=>(
                    <button key={k} onClick={()=>setLang(k)} style={{background:'transparent',border:'none',fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.15em',cursor:'pointer',padding:'3px 7px',color:lang===k?'var(--c)':'rgba(160,220,235,0.35)',borderBottom:lang===k?'1px solid var(--c)':'1px solid transparent',transition:'all 140ms'}}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Nav */}
              <nav style={{flex:1,padding:'16px 0',overflowY:'auto'}}>
                {navItems.map(([key, label, num]) => (
                  <a key={key} href={`#${key}`}
                    className={cn("nav-step", sideSection===key&&"active")}
                    onClick={e=>{e.preventDefault(); if(key==="survey"){setSideSection("survey");openSurveyModal();}else{setSideSection(key);jumpTo(key);}}}>
                    <span className="nav-step-num">{num}</span>
                    <span className="nav-step-label">{label}</span>
                  </a>
                ))}
              </nav>

              {/* Tips */}
              <div style={{padding:'16px 20px',borderTop:'1px solid var(--line)'}}>
                <div className="neon-label" style={{marginBottom:10,opacity:0.5}}>{L.notesTitle}</div>
                {L.notes.map((n,i)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:10}}>
                    <span style={{fontFamily:'Space Mono',fontSize:9,color:'rgba(0,255,231,0.35)',flexShrink:0,marginTop:1}}>▸</span>
                    <span style={{fontSize:11,lineHeight:1.6,color:'rgba(160,220,235,0.5)'}}>{n}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div id="main" style={{flex:1,overflowX:'hidden'}}>

              <section id="workflow" className="product-hero">
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
                <div className="hero-media-overlay" aria-hidden="true" />
                <div className="hero-model-stage" aria-hidden="true">
                  <model-viewer
                    ref={heroModelRef}
                    src="/models/robotic_arm_kuka.glb"
                    camera-orbit="-34deg 66deg auto"
                    field-of-view="28deg"
                    exposure="0.95"
                    shadow-intensity="0.35"
                    shadow-softness="0.85"
                    auto-rotate
                    auto-rotate-delay="0"
                    rotation-per-second="12deg"
                    disable-zoom
                    interaction-prompt="none"
                    loading="eager"
                    reveal="auto"
                  />
                </div>
                <div className="hero-foreground">
                  <div className="hero-copy hero-copy-landing">
                    <a className="hero-badge" href="#workflow" onClick={e=>e.preventDefault()}>
                      KENYO × TRIPO3D × AI BUILDING GENERATION
                      <span>→</span>
                    </a>
                    <h1>{lang === "zh" ? "AI 建筑生成工作台" : "AI Architecture Workbench"}</h1>
                    <p>
                      {lang === "zh"
                        ? "通过设计问卷生成 Prompt，再调用 AI 图像与 Tripo3D 模型生成，为混凝土 3D 打印测试件建立自动化流程。"
                        : "Generate prompts from a design survey, then use AI imaging and Tripo3D reconstruction to automate concrete 3D printing test assets."}
                    </p>
                    <button className="hero-cta" onClick={() => goToPanel("workspace")}>
                      {lang === "zh" ? "进入工作台" : "Open Workspace"}
                      <span>→</span>
                    </button>
                  </div>
                </div>
                <div className="hero-copy">
                  <a className="hero-badge" href="#workflow" onClick={e=>e.preventDefault()}>
                    KENYO × TRIPO3D × AI BUILDING GENERATION
                    <span>→</span>
                  </a>
                  <h1>{lang === "zh" ? "建筑生成控制台" : "AI Building Generation Console"}</h1>
                  <p>
                    {lang === "zh"
                      ? "从设计问卷到 AI 图像生成，再到 Tripo3D 模型生成，为混凝土 3D 打印测试件提供自动化生成流程。"
                      : "From design survey to AI image generation and Tripo3D reconstruction, built for concrete 3D printing test assets."}
                  </p>
                  <div className="hero-flow">Prompt → Image → 3D Model → Print-ready Asset</div>
                  <div className="hero-actions">
                    <button className="hero-cta primary" onClick={() => goToPanel("workspace")}>
                      {lang === "zh" ? "进入工作台" : "Open Workspace"}
                      <span>→</span>
                    </button>
                    <button className="hero-cta" onClick={() => goToPanel("results")}>
                      {lang === "zh" ? "查看任务输出" : "View Output"}
                      <span>→</span>
                    </button>
                  </div>
                </div>

                <div className="workflow-card-grid" aria-label={lang === "zh" ? "工作流入口" : "Workflow entries"}>
                  {workflowCards.map((card, index) => (
                    <BorderGlow
                      key={card.key}
                      as="button"
                      type="button"
                      className="workflow-card"
                      onClick={() => goToPanel(card.key)}
                      edgeSensitivity={24}
                      glowColor="185 92 58"
                      backgroundColor="rgba(2, 10, 15, 0.24)"
                      borderRadius={14}
                      glowRadius={24}
                      glowIntensity={0.55}
                      coneSpread={20}
                      animated={index === 0}
                      colors={['#22d3ee', '#14b8a6', '#60a5fa']}
                      fillOpacity={0.2}
                    >
                      <span className="workflow-num">{card.num}</span>
                      <span className="workflow-title">{card.title}</span>
                      <span className="workflow-desc">{card.desc}</span>
                    </BorderGlow>
                  ))}
                </div>
              </section>

              {/* ═══ HERO BAND ═══ */}
              <div className="legacy-hero" style={{position:'relative',padding:'60px 48px',borderBottom:'1px solid var(--line)',overflow:'hidden',minHeight:220}}>
                <div className="hero-stripe" />
                {/* Crosshair decorations */}
                <div className="crosshair" style={{top:24,right:80,opacity:0.4}} />
                <div className="crosshair" style={{bottom:32,right:200,opacity:0.2,width:24,height:24}} />

                <div style={{maxWidth:720,position:'relative'}}>
                  <div style={{fontFamily:'Space Mono',fontSize:10,letterSpacing:'0.4em',textTransform:'uppercase',color:'rgba(0,255,231,0.6)',marginBottom:20}}>
                    KENYO TRIPO3D · SCHEMA LAYOUT
                  </div>
                  <h1 style={{fontFamily:'Syne',fontWeight:800,fontSize:'clamp(2rem,4vw,3.5rem)',lineHeight:1.05,letterSpacing:'-0.01em',color:'var(--text)'}}>
                    {L.tagline.split(" ").map((word,i)=>
                      <span key={i} style={{display:'inline-block',marginRight:'0.3em',color: i%3===2?'var(--c)':'inherit'}}>{word}</span>
                    )}
                  </h1>
                  <p style={{marginTop:16,fontSize:13,letterSpacing:'0.05em',color:'var(--muted)',fontFamily:'Space Mono',lineHeight:1.8}}>{L.heroSub}</p>
                  <div style={{display:'flex',gap:12,marginTop:28}}>
                    <button className="btn-primary" onClick={()=>jumpTo("workspace")}>{lang==="zh"?"进入工作台 ›":"Open Workspace ›"}</button>
                    <button className="btn-secondary" onClick={()=>jumpTo("results")}>{lang==="zh"?"查看输出":"View Output"}</button>
                  </div>
                </div>
              </div>

              {/* ═══ SECTION: KEY ═══ */}
              <details id="key" className="band key-details">
                <summary className="band-index">
                  <span className="neon-label" style={{fontSize:9,opacity:0.45}}>01</span>
                  <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.4)',marginTop:4,lineHeight:1.4}}>{L.navKey}</span>
                </summary>
                <div className="band-body">
                  <div style={{maxWidth:720}}>
                    <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:6}}>{L.keyTitle}</div>
                    <p style={{fontSize:13,color:'var(--muted)',marginBottom:24,lineHeight:1.7}}>{L.keyDesc}</p>

                    <LField label={L.keyLabel}>
                      <input type="password" className="line-input" value={settings.api_key}
                        onChange={e=>setSettings(v=>({...v,api_key:e.target.value}))}
                        placeholder={L.keyPlaceholder} />
                    </LField>

                    <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
                      <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.35)'}}>{L.keyStored}</span>
                      <span style={{fontFamily:'Space Mono',fontSize:12,color:'rgba(0,255,231,0.8)'}}>{settings.masked_api_key||L.keyNotSet}</span>
                    </div>

                    {settings.key_format_warning && (
                      <div style={{fontSize:12,color:'rgba(251,191,36,0.8)',marginBottom:16,paddingLeft:12,borderLeft:'2px solid rgba(251,191,36,0.4)'}}>⚠ {L.keyFormatWarning}</div>
                    )}

                    <button className="btn-primary" onClick={saveApiKey} disabled={settings.saving}>
                      {settings.saving ? L.keySaving : L.keySave}
                    </button>
                    <div style={{marginTop:10,fontFamily:'Space Mono',fontSize:10,color:'rgba(0,255,231,0.3)'}}>{L.keyHint}</div>

                    <div style={{height:1,background:'var(--line)',margin:'28px 0'}} />

                    <LField label={L.googleKeyLabel} hint={settings.gemini_image_model || ""}>
                      <input type="password" className="line-input" value={settings.google_api_key}
                        onChange={e=>setSettings(v=>({...v,google_api_key:e.target.value}))}
                        placeholder={L.googleKeyPlaceholder} />
                    </LField>

                    <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
                      <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.35)'}}>{L.googleKeyStored}</span>
                      <span style={{fontFamily:'Space Mono',fontSize:12,color:'rgba(0,255,231,0.8)'}}>{settings.masked_google_api_key||L.keyNotSet}</span>
                    </div>

                    <button className="btn-primary" onClick={saveGoogleKey} disabled={settings.google_saving}>
                      {settings.google_saving ? L.keySaving : L.googleKeySave}
                    </button>
                    <div style={{marginTop:10,fontFamily:'Space Mono',fontSize:10,color:'rgba(0,255,231,0.3)'}}>{L.googleKeyHint}</div>
                  </div>
                </div>
              </details>

              {/* ═══ SECTION: TEMPLATES ═══ */}
              <div id="templates" className="band">
                <div className="band-index">
                  <span className="neon-label" style={{fontSize:9,opacity:0.45}}>02</span>
                  <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.4)',marginTop:4,lineHeight:1.4}}>{L.navTemplates}</span>
                </div>
                <div className="band-body">
                  <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:20}}>{L.templatesTitle}</div>
                  {promptTemplates.filter(item => item.type === "image").map(item => (
                    <div key={item.name.en}
                      className={cn("tpl-row", tab === item.type && "active")}
                      onClick={() => applyTemplate(item)}>
                      <span className="tpl-row-tag">{item.type}</span>
                      <div>
                        <div className="tpl-row-name">{item.name[lang]}</div>
                        <div className="tpl-row-desc">{item.prompt.length > 90 ? item.prompt.slice(0,90)+"…" : item.prompt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ SECTION: WORKSPACE ═══ */}
              <div id="workspace" className="band">
                <div className="band-index">
                  <span className="neon-label" style={{fontSize:9,opacity:0.45}}>04</span>
                  <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.4)',marginTop:4,lineHeight:1.4}}>{L.navWorkspace}</span>
                </div>
                <div className="band-body">
                  <TabStrip tab={tab} setTab={setTab} L={L} />

                  <div style={{paddingTop:24}}>
                    {/* DESIGN QUESTIONNAIRE */}
                    {tab === "questionnaire" && (
                      <div style={{maxWidth:980}}>
                        <div className="neon-label" style={{marginBottom:4}}>{L.surveyEyebrow}</div>
                        <div style={{fontFamily:'Syne',fontWeight:700,fontSize:17,marginBottom:8}}>{L.surveyTitle}</div>
                        <div style={{fontSize:12,color:'var(--muted)',fontFamily:'Space Mono',lineHeight:1.7,marginBottom:24}}>{L.surveyAnswerHint}</div>

                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:36,alignItems:'start'}}>
                          <div>
                            {designSurveySections.map(section => (
                              <div key={section.title} style={{borderTop:'1px solid var(--line)',paddingTop:16,marginBottom:24}}>
                                <div className="neon-label" style={{marginBottom:14,opacity:0.65}}>{surveySectionTitle(section.title, lang)}</div>
                                {section.questions.map(question => (
                                  <SurveyQuestion key={question.id} question={question} values={surveyValues} setValues={setSurveyValues} lang={lang} />
                                ))}
                              </div>
                            ))}

                            {quoteSurveySections.map(section => (
                              <div key={section.title} style={{borderTop:'1px solid var(--line)',paddingTop:16,marginBottom:24}}>
                                <div className="neon-label" style={{marginBottom:14,opacity:0.65}}>{surveySectionTitle(section.title, lang)}</div>
                                {section.questions.map(question => (
                                  <SurveyQuestion key={question.id} question={question} values={quoteValues} setValues={setQuoteValues} lang={lang} />
                                ))}
                              </div>
                            ))}

                            <button className="btn-primary" onClick={generateSurveyPrompt} disabled={busy}>{L.surveyGeneratePrompt}</button>
                          </div>

                          <div style={{position:'sticky',top:24}}>
                            <LField label={L.surveyPromptTitle}>
                              <textarea className="line-textarea" style={{width:'100%',minHeight:150}}
                                value={surveyPrompt}
                                onChange={e=>setSurveyPrompt(e.target.value)}
                                placeholder={L.surveyAnswerHint} />
                            </LField>
                            <LField label={L.surveyQuoteTitle}>
                              <textarea className="line-textarea" style={{width:'100%',minHeight:96}}
                                value={quotePrompt}
                                onChange={e=>setQuotePrompt(e.target.value)} />
                            </LField>

                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,margin:'4px 0 18px'}}>
                              <button className="btn-secondary" onClick={submitSurveyImage} disabled={busy || !surveyPrompt}>{L.surveyGenerateImage}</button>
                              <button className="btn-secondary" onClick={submitTransparentSubject} disabled={busy || !referenceImage}>{L.surveyMakeTransparent}</button>
                            </div>
                            <button className="btn-primary" onClick={submitSurveyToTripo} disabled={busy || !transparentImage}>{L.surveySendToTripo}</button>

                            <div style={{borderTop:'1px solid var(--line)',paddingTop:18,marginTop:24}}>
                              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,180px),1fr))',gap:14}}>
                                {[{label:L.surveyReferenceImage,img:referenceImage},{label:L.surveyTransparentImage,img:transparentImage}].map(item => (
                                  <div key={item.label} style={{border:'1px solid rgba(0,255,231,0.12)',minHeight:180,display:'flex',flexDirection:'column'}}>
                                    <div className="neon-label" style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',opacity:0.55}}>{item.label}</div>
                                    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.22)',minHeight:150}}>
                                      {item.img?.image_path ? (
                                        <a href={item.img.image_path} target="_blank" rel="noreferrer" style={{display:'block',width:'100%',height:'100%'}}>
                                          <img src={item.img.image_path} alt={item.label} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}} />
                                        </a>
                                      ) : (
                                        <span style={{fontFamily:'Space Mono',fontSize:10,color:'rgba(0,255,231,0.28)'}}>{L.surveyNoImage}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TEXT TO 3D */}
                    {tab === "text" && (
                      <div style={{maxWidth:600}}>
                        <div className="neon-label" style={{marginBottom:4}}>{L.textEyebrow}</div>
                        <div style={{fontFamily:'Syne',fontWeight:700,fontSize:17,marginBottom:20}}>{L.textTitle}</div>

                        <LField label={L.promptLabel} hint={L.promptHint}>
                          <textarea className="line-textarea" style={{width:'100%'}}
                            value={textForm.prompt}
                            onChange={e=>setTextForm(v=>({...v,prompt:e.target.value}))} />
                        </LField>

                        <LField label={L.negativeLabel} hint={L.negativeHint}>
                          <textarea className="line-textarea" style={{width:'100%',minHeight:80}}
                            value={textForm.negative_prompt}
                            onChange={e=>setTextForm(v=>({...v,negative_prompt:e.target.value}))} />
                        </LField>

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginBottom:20}}>
                          <LField label={L.modelVersion}>
                            <input className="line-input" value={textForm.model_version} onChange={e=>setTextForm(v=>({...v,model_version:e.target.value}))} />
                          </LField>
                          <LField label={L.faceLimit}>
                            <input type="number" className="line-input" value={textForm.face_limit} onChange={e=>setTextForm(v=>({...v,face_limit:e.target.value}))} />
                          </LField>
                          <LField label={L.seed}>
                            <input type="number" className="line-input" value={textForm.seed} onChange={e=>setTextForm(v=>({...v,seed:e.target.value}))} placeholder={L.seedPlaceholder} />
                          </LField>
                        </div>

                        <div style={{marginBottom:24}}>
                          <div className="neon-label" style={{marginBottom:10,opacity:0.6}}>{L.togglesTitle}</div>
                          <FlatToggle label={L.toggleTexture} checked={textForm.texture} onChange={e=>setTextForm(v=>({...v,texture:e.target.checked}))} />
                          <FlatToggle label={L.togglePbr} checked={textForm.pbr} onChange={e=>setTextForm(v=>({...v,pbr:e.target.checked}))} />
                          <FlatToggle label={L.toggleAutoSize} checked={textForm.auto_size} onChange={e=>setTextForm(v=>({...v,auto_size:e.target.checked}))} />
                          <FlatToggle label={L.toggleQuad} checked={textForm.quad} onChange={e=>setTextForm(v=>({...v,quad:e.target.checked}))} />
                          {textQuadUnsupported && <div style={{fontSize:11,color:'rgba(251,191,36,0.7)',marginTop:6}}>{L.quadUnsupported}</div>}
                        </div>

                        {/* Guide items as inline notes */}
                        <div style={{borderTop:'1px solid var(--line)',paddingTop:16,marginBottom:20}}>
                          <div className="neon-label" style={{marginBottom:10,opacity:0.5}}>{L.guideTitle}</div>
                          {L.textGuideItems.map((g,i)=>(
                            <div key={i} style={{display:'flex',gap:10,marginBottom:8}}>
                              <span style={{fontFamily:'Space Mono',fontSize:9,color:'rgba(0,255,231,0.3)',marginTop:1}}>→</span>
                              <span style={{fontSize:12,color:'rgba(160,220,235,0.5)',lineHeight:1.6}}>{g}</span>
                            </div>
                          ))}
                        </div>

                        <button className="btn-primary" onClick={submitText} disabled={busy}>{busy?L.busy:L.submitText}</button>
                      </div>
                    )}

                    {/* IMAGE TO 3D */}
                    {tab === "image" && (
                      <div style={{maxWidth:600}}>
                        <div className="neon-label" style={{marginBottom:4}}>{L.imageEyebrow}</div>
                        <div style={{fontFamily:'Syne',fontWeight:700,fontSize:17,marginBottom:20}}>{L.imageTitle}</div>

                        <LField label={L.sourceTitle}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                            {[["upload",L.sourceUpload],["generated",L.sourceGenerated]].map(([key,label])=>(
                              <button key={key} className={imageSourceMode===key?"btn-primary":"btn-secondary"}
                                onClick={()=>setImageSourceMode(key)} style={{justifyContent:'center'}}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </LField>

                        {imageSourceMode === "upload" && (
                          <>
                            <LField label={L.uploadLabel}>
                              <input type="file" accept="image/*" className="line-file"
                                onChange={e=>{const f=e.target.files?.[0]||null;setImageFile(f);setImageSourceMode("upload");if(f)setImageForm(v=>({...v,image_url:""}));}} />
                            </LField>

                            <div style={{display:'flex',alignItems:'center',gap:8,margin:'8px 0 20px',fontSize:12,color: imageFile?'rgba(0,255,231,0.7)':'rgba(160,220,235,0.38)'}}>
                              <SDot status={imageFile?"success":null} />
                              {imageFile ? `${L.selectedFile}: ${imageFile.name}` : L.sourceMissing}
                            </div>
                          </>
                        )}

                        {imageSourceMode === "generated" && (
                          <div style={{borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)',padding:'18px 0',marginBottom:20}}>
                            <div className="survey-flow-guide">
                              <div className="survey-flow-kicker">{lang === "zh" ? "当前建议操作" : "Recommended next action"}</div>
                              <div className="survey-flow-title">{nextSurveyAction.title}</div>
                              <div className="survey-flow-copy">{nextSurveyAction.body}</div>
                              <div className="survey-flow-steps" aria-label={lang === "zh" ? "问卷生成流程" : "Survey generation flow"}>
                                {surveyFlowSteps.map(step => {
                                  const active = nextSurveyAction.key === step.key;
                                  const done = step.done || (step.key === "tripo" && nextSurveyAction.key === "tripo");
                                  return (
                                    <div key={step.key} className={cn("survey-flow-step", done && "done", active && "active")}>
                                      <span className="survey-flow-dot" />
                                      <span>{step.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <LField label={L.surveyPromptTitle} hint={L.surveyAnswerHint}>
                              <textarea className="line-textarea" style={{width:'100%',minHeight:130}}
                                value={surveyPrompt}
                                onChange={e=>setSurveyPrompt(e.target.value)}
                                placeholder={L.surveyAnswerHint} />
                            </LField>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                              <button className={cn("btn-secondary", nextSurveyAction.key === "reference" && "survey-recommended-action")} onClick={submitSurveyImage} disabled={busy || !hasSurveyPrompt}>{L.surveyGenerateImage}</button>
                              <button className={cn("btn-secondary", nextSurveyAction.key === "transparent" && "survey-recommended-action")} onClick={submitTransparentSubject} disabled={busy || !hasReferenceImage}>{L.surveyMakeTransparent}</button>
                            </div>
                            {(!hasSurveyPrompt || !hasReferenceImage || !hasTransparentImage) && (
                              <div className="survey-flow-disabled-hints">
                                {!hasSurveyPrompt && <span>{lang === "zh" ? "请先完成问卷并生成提示词" : "Generate a survey prompt first"}</span>}
                                {hasSurveyPrompt && !hasReferenceImage && <span>{lang === "zh" ? "生成参考图后才能优化透明主体" : "Generate a reference image before optimizing the cutout"}</span>}
                                {hasReferenceImage && !hasTransparentImage && <span>{lang === "zh" ? "请先优化透明主体图，再提交 Tripo 图生 3D" : "Optimize the transparent subject before submitting to Tripo"}</span>}
                              </div>
                            )}
                            {busy && busyLabel && (
                              <div style={{margin:'0 0 16px'}}>
                                <div style={{fontFamily:'Space Mono',fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(0,255,231,0.72)',marginBottom:8}}>{busyLabel}</div>
                                <PBar />
                              </div>
                            )}
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,fontSize:12,color: hasGeneratedImage?'rgba(0,255,231,0.7)':'rgba(160,220,235,0.38)'}}>
                              <SDot status={hasGeneratedImage?"success":null} />
                              {hasGeneratedImage ? L.generatedSourceReady : L.generatedSourceMissing}
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,180px),1fr))',gap:12}}>
                              {[{label:L.surveyReferenceImage,img:referenceImage,desc:lang==="zh"?"用于检查构图与主体完整度":"Check composition and subject integrity"},{label:L.surveyTransparentImage,img:transparentImage,desc:lang==="zh"?"将优先用于 Tripo 图生 3D":"Prioritized for Tripo image-to-3D"}].map(item => (
                                <div key={item.label} style={{border:'1px solid rgba(0,255,231,0.12)',minHeight:160,display:'flex',flexDirection:'column'}}>
                                  <div style={{padding:'9px 11px',borderBottom:'1px solid var(--line)'}}>
                                    <div className="neon-label" style={{opacity:0.55}}>{item.label}</div>
                                    <div className="survey-preview-desc">{item.desc}</div>
                                  </div>
                                  <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.22)',minHeight:120}}>
                                    {item.img?.image_path ? (
                                      <a href={item.img.image_path} target="_blank" rel="noreferrer" style={{display:'block',width:'100%',height:'100%'}}>
                                        <img src={item.img.image_path} alt={item.label} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}} />
                                      </a>
                                    ) : (
                                      <span style={{fontFamily:'Space Mono',fontSize:10,color:'rgba(0,255,231,0.28)'}}>{L.surveyNoImage}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginBottom:20}}>
                          <LField label={L.modelVersion}><input className="line-input" value={imageForm.model_version} onChange={e=>setImageForm(v=>({...v,model_version:e.target.value}))} /></LField>
                          <LField label={L.faceLimit}><input type="number" className="line-input" value={imageForm.face_limit} onChange={e=>setImageForm(v=>({...v,face_limit:e.target.value}))} /></LField>
                          <LField label={L.seed}><input type="number" className="line-input" value={imageForm.seed} onChange={e=>setImageForm(v=>({...v,seed:e.target.value}))} placeholder={L.seedPlaceholder} /></LField>
                        </div>

                        <div style={{marginBottom:24}}>
                          <div className="neon-label" style={{marginBottom:10,opacity:0.6}}>{L.togglesTitle}</div>
                          <FlatToggle label={L.toggleTexture} checked={imageForm.texture} onChange={e=>setImageForm(v=>({...v,texture:e.target.checked}))} />
                          <FlatToggle label={L.togglePbr} checked={imageForm.pbr} onChange={e=>setImageForm(v=>({...v,pbr:e.target.checked}))} />
                          <FlatToggle label={L.toggleAutoSize} checked={imageForm.auto_size && !imageAutoSizeUnsupported} onChange={e=>setImageForm(v=>({...v,auto_size:e.target.checked}))} disabled={imageAutoSizeUnsupported} />
                          {imageAutoSizeUnsupported && <div style={{fontSize:11,color:'rgba(251,191,36,0.7)',marginTop:6}}>{lang==="zh" ? "Auto Size 仅适用于开启 Texture 或 PBR 的模型，已自动关闭" : "Auto Size only works with Texture or PBR and has been turned off"}</div>}
                          <FlatToggle label={L.toggleQuad} checked={imageForm.quad} onChange={e=>setImageForm(v=>({...v,quad:e.target.checked}))} />
                          {imageQuadUnsupported && <div style={{fontSize:11,color:'rgba(251,191,36,0.7)',marginTop:6}}>{L.quadUnsupported}</div>}
                        </div>

                        <div style={{borderTop:'1px solid var(--line)',paddingTop:16,marginBottom:20}}>
                          <div className="neon-label" style={{marginBottom:10,opacity:0.5}}>{L.guideTitle}</div>
                          {L.imageGuideItems.map((g,i)=>(
                            <div key={i} style={{display:'flex',gap:10,marginBottom:8}}>
                              <span style={{fontFamily:'Space Mono',fontSize:9,color:'rgba(0,255,231,0.3)',marginTop:1}}>→</span>
                              <span style={{fontSize:12,color:'rgba(160,220,235,0.5)',lineHeight:1.6}}>{g}</span>
                            </div>
                          ))}
                        </div>

                        {busy && busyLabel && (
                          <div style={{margin:'0 0 16px'}}>
                            <div style={{fontFamily:'Space Mono',fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(0,255,231,0.72)',marginBottom:8}}>{busyLabel}</div>
                            <PBar />
                          </div>
                        )}

                        <button className={cn("btn-primary", imageSourceMode === "generated" && nextSurveyAction.key === "tripo" && "survey-recommended-action")} onClick={submitImage} disabled={busy || (imageSourceMode==="upload"&&!imageFile) || (imageSourceMode==="generated"&&!hasGeneratedImage)}>{busy?L.busy:L.submitImage}</button>
                        {imageSourceMode === "generated" && !hasGeneratedImage && (
                          <div className="survey-flow-disabled-hints" style={{marginTop:10}}>
                            <span>{lang === "zh" ? "提交图生 3D 前，请先完成「优化透明主体」。" : "Optimize the transparent subject before submitting image-to-3D."}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TEXT TO IMAGE */}
                    {tab === "imagegen" && (
                      <div style={{maxWidth:600}}>
                        <div className="neon-label" style={{marginBottom:4}}>{L.imageGenEyebrow}</div>
                        <div style={{fontFamily:'Syne',fontWeight:700,fontSize:17,marginBottom:20}}>{L.imageGenTitle}</div>

                        <LField label={L.promptLabel} hint={L.promptHint}>
                          <textarea className="line-textarea" style={{width:'100%'}}
                            value={imageGen.prompt}
                            onChange={e=>setImageGen(v=>({...v,prompt:e.target.value}))} />
                        </LField>
                        <LField label={L.negativeLabel} hint={L.negativeHint}>
                          <textarea className="line-textarea" style={{width:'100%',minHeight:80}}
                            value={imageGen.negative_prompt}
                            onChange={e=>setImageGen(v=>({...v,negative_prompt:e.target.value}))} />
                        </LField>
                        <LField label={L.seed}>
                          <input type="number" className="line-input" value={imageGen.seed}
                            onChange={e=>setImageGen(v=>({...v,seed:e.target.value}))}
                            placeholder={L.seedPlaceholder} />
                        </LField>

                        <div style={{borderTop:'1px solid var(--line)',paddingTop:16,marginBottom:20}}>
                          <div className="neon-label" style={{marginBottom:10,opacity:0.5}}>{L.guideTitle}</div>
                          {L.imageGenGuideItems.map((g,i)=>(
                            <div key={i} style={{display:'flex',gap:10,marginBottom:8}}>
                              <span style={{fontFamily:'Space Mono',fontSize:9,color:'rgba(0,255,231,0.3)',marginTop:1}}>→</span>
                              <span style={{fontSize:12,color:'rgba(160,220,235,0.5)',lineHeight:1.6}}>{g}</span>
                            </div>
                          ))}
                        </div>

                        <button className="btn-primary" onClick={submitImageGen} disabled={busy}>{busy?L.busy:L.submitImageGen}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══ SECTION: RESULTS ═══ */}
              <div id="results" className="band" style={{minHeight:400}}>
                <div className="band-index">
                  <span className="neon-label" style={{fontSize:9,opacity:0.45}}>05</span>
                  <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.4)',marginTop:4,lineHeight:1.4}}>{L.navResults}</span>
                </div>
                <div className="band-body">
                  <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:6}}>{L.resultsTitle}</div>
                  {busy && <PBar />}

                  {/* Status line */}
                  <div style={{display:'flex',alignItems:'center',gap:24,padding:'16px 0',borderBottom:'1px solid var(--line)',marginBottom:20}}>
                    <div>
                      <div className="neon-label" style={{fontSize:9,opacity:0.5,marginBottom:4}}>{L.taskId}</div>
                      <div style={{fontFamily:'Space Mono',fontSize:12,color:'rgba(0,255,231,0.8)'}}>{taskId||"—"}</div>
                    </div>
                    <div style={{width:1,height:32,background:'var(--line)'}} />
                    <div>
                      <div className="neon-label" style={{fontSize:9,opacity:0.5,marginBottom:4}}>{L.status}</div>
                      <div style={{display:'flex',alignItems:'center',gap:7,fontSize:14,fontWeight:600,color:statusClass}}>
                        <SDot status={taskDetail?.status} />
                        {statusLabel}
                      </div>
                    </div>
                    <div style={{width:1,height:32,background:'var(--line)'}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div className="neon-label" style={{fontSize:9,opacity:0.5,marginBottom:4}}>{L.feedback}</div>
                      <div style={{fontSize:12,color:'rgba(160,220,235,0.65)',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{message||busyLabel||L.noOutput}</div>
                    </div>
                    {taskId && (
                      <button className="btn-secondary" onClick={()=>pollTask(taskId)}>{L.refresh}</button>
                    )}
                  </div>

                  {/* Output grid */}
                  <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:40}}>
                    {/* Left: assets */}
                    <div>
                      {taskDetail?.preview_urls?.length ? (
                        <div style={{marginBottom:24}}>
                          <div className="neon-label" style={{marginBottom:12,opacity:0.6}}>{L.preview}</div>
                          {taskDetail.preview_urls.slice(0,4).map((url,i)=>(
                            <ResRow key={url} url={url} label={`${L.preview} ${i+1}`} linkLabel={L.downloadModel} />
                          ))}
                        </div>
                      ) : null}
                      {!taskDetail && (
                        <div style={{fontSize:12,color:'rgba(0,255,231,0.25)',fontFamily:'Space Mono',lineHeight:1.8}}>{L.noOutput}</div>
                      )}
                    </div>

                    {/* Right: 3D viewer */}
                    <div>
                      <div className="neon-label" style={{marginBottom:8,opacity:0.6}}>{L.viewer}</div>
                      <div style={{fontSize:11,color:'var(--muted)',marginBottom:12,fontFamily:'Space Mono'}}>{L.viewerDesc}</div>
                      {selectedModelUrl ? (
                        <div style={{border:'1px solid var(--line2)',background:'rgba(0,0,0,0.4)'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderBottom:'1px solid var(--line)',fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(0,255,231,0.4)'}}>
                            <span>{L.viewerHint}</span>
                            <a href={selectedModelUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{fontSize:9,padding:'3px 8px'}}>↗</a>
                          </div>
                          <div style={{height:340}}>
                            <model-viewer src={viewerSrc} poster={viewerPosterUrl||undefined}
                              camera-controls touch-action="pan-y" auto-rotate
                              shadow-intensity="1" exposure="1.1" environment-image="neutral" />
                          </div>
                        </div>
                      ) : (
                        <div style={{border:'1px dashed rgba(0,255,231,0.15)',padding:24,fontSize:12,fontFamily:'Space Mono',color:'rgba(0,255,231,0.3)',lineHeight:1.8}}>{L.viewerEmpty}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer rule */}
              <div style={{borderTop:'1px solid var(--line)',padding:'20px 48px',display:'flex',alignItems:'center',gap:16}}>
                <span style={{fontFamily:'Space Mono',fontSize:9,letterSpacing:'0.3em',textTransform:'uppercase',color:'rgba(0,255,231,0.2)'}}>KENYO · TRIPO3D · SCHEMA</span>
                <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(0,255,231,0.1),transparent)'}} />
              </div>

            </div>{/* end #main */}
          </div>
        );
      }

      createRoot(document.getElementById("root")).render(<App />);
