# Changelog · 藏锋录 (CangFeng)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范，版本号遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)。

---

## [1.2.2] - 2026-09-25

### 优化 (Optimized)
- **瀑布流卡片微浮动效 (Waterfall Card Refinement)**：
  - 采用平缓上浮（Scheme A）：底边预留 20px 间距，悬停位移从 -6px 优化至 -3px，底栏元数据与二级标签平滑展开，彻底解决底端紧贴视口的不适感。
- **深览视口左上角通透烙印 (Viewer Top-Left Brand Imprint)**：
  - 采纳极简通透烙印方案（Scheme 3）：移除 42px 黑色 OpenQGIS 头像与白色卡片包裹背景，采用半透明浮动文本烙印与柔和阴影，图名与 QMapFlow 精度工作流标识清晰醒目且不遮挡地图图面细节。
- **右上角全局操作胶囊多语言切换适配 (Viewer Language Selector)**：
  - 移除原固定 36px 圆形限制，设为自适应宽度的药丸胶囊（min-width: 52px），彻底解决“中/EN/JA/KO”文字与下拉箭头错位或溢出的缺陷。
- **全屏聚焦蒙版与分享按钮视效 (Share Focus & Dimming)**：
  - 点击“分享”弹出二级下拉菜单时，地图底层自动铺开轻柔暗场对焦蒙版（rgba(0,0,0,0.5) + 2.5px 景深微模糊），使分享菜单成为视觉绝对焦点；点击蒙版平滑收起。
- **分享文案与光标操作反馈强化 (Share Options & Cursor Toast)**：
  - 精简海报分享文案为【海报分享】；点击“复制网页链接”时，鼠标指针跟随弹出半透明悬浮反馈胶囊「✓ 网址已复制」，并在 1.8 秒后淡出移除。

---

## [1.2.1] - 2026-09-23

### 修复 (Fixed)
- **移动端与国内公网大图深览加载失败缺陷修复 (Mobile & Mainland Network Tile Delivery Fix)**：
  - **同源瓦片金字塔内置**：同步内置 `CangFengCore` 全量 5 幅作品 8.04MB WebP 瓦片金字塔目录（`tiles/`），解开 `.gitignore` 限制，使 GitHub Pages 支持同源直接分发，彻底摆脱国内手机蜂窝网络及无代理环境下外部 Cloudflare Workers 免费域名（`*.workers.dev`）被 SNI 阻断导致大图视口黑屏的问题。
  - **默认直连策略优化**：在 `assets/config.js` 中将 `assetBaseUrl` 默认置空，优先采用本站同源相对路径 `tiles/` 极速加载，免翻墙、免跨域、零网络延迟。
  - **首帧即时渲染保障 (`placeholderImage`)**：为 OpenSeadragon 视口配置 `placeholderImage: item.thumb` 与 `immediateRender: true`，点开大图 0ms 呈现画作预览，彻底消除等待空白期。
  - **多级网络容灾降级引擎**：若配置了远程 CDN 且瓦片连续加载失败，系统自动无缝降级切换至本地同源 `tiles/` 或已加载的预览全图，保障在任何弱网或断网离线环境下均能顺畅观赏大图。

### 优化 (Optimized)
- **移动端竖屏与触控交互适配 (Mobile UI/UX Refinement)**：
  - 针对手机小屏（`max-width: 768px`）优化顶栏布局，收拢右侧按钮间距，隐藏冗余退出键，确保作品名称完整居中呈现；
  - 手机端隐藏左右侧边翻页大箭头（`.viewer-edge-nav`），彻底消除双指捏合缩放（Pinch-to-zoom）与单指拖拽平移时的误触与视觉遮挡；
  - 底部浮动工具栏紧凑化重构，适配小屏边距与触控尺寸；
  - 移动端浮动信息面板自适应转为底部抽屉式卡片（Bottom Sheet），浏览档案更贴合移动端操作直觉。

---

## [1.2.0] - 2026-09-21

### 新增 (Added)
- **浮动信息提示悬窗 (Floating Metadata Window)**：
  - 将原本右侧固定的推拉抽屉重构为高质感磨砂玻璃浮动悬窗（Glassmorphic Floating Panel）。
  - **自由拖拽移动**：支持按住悬窗顶部手柄（带三道横线 Grip 视觉标记）拖拽至屏幕任意位置。
  - **8 向拉伸调整尺寸 (8-directional Resize)**：支持对四角（NW, NE, SW, SE）及四边（N, S, W, E）进行尺寸拖动拉伸，光标自适应变化，右下角带有斜纹指示标记。
  - **视口边界防护 (Viewport Clamp)**：拖拽与拉伸均内置 16px 视口吸附保护，避免窗口被拖出屏幕外；浏览器窗口大小改变时自动回弹至安全可见区域。
  - **快捷键呼出**：支持键盘 `Tab` 键及 `I` 键一键弹出 / 收起信息悬窗，带来沉浸式观览体验。
  - **自适应动态透光度机制 (Adaptive Opacity Interaction)**：
    - 鼠标在悬浮窗上悬停时，呈现清晰易读的 **80% 不透明度**（`opacity: 0.8`）；
    - 鼠标在地图上进行滚轮或手势缩放时，悬窗瞬间降为 **30% 不透明度**（`opacity: 0.3`），实现极致通透的底层空间纹理观察体验，停止缩放后平滑过渡恢复。

### 优化 (Optimized)
- **阅览视窗顶栏视觉降噪 (Header De-cluttering)**：
  - 移除左上角冗余的 `CANGFENG 4K` 徽标标签与尺寸像素副标题（已在 Tab 呼出的信息悬窗中完整呈现），仅保留退出按钮与单行垂直居中的纯粹作品名，彻底消除视觉杂质与顶栏切边挤压感。

### 修复 (Fixed)
- **描述文本横向溢出问题 (Text Overflow Fix)**：
  - 修复 `.drawer-content` 默认 `overflow-y: auto` 导致 `overflow-x` 隐式计算为 auto 引起的长文本溢出问题，显式声明 `overflow-x: hidden`。
  - 为 `.meta-desc` 与 `.meta-desc-text` 补充 `overflow-wrap: break-word` 与 `max-width: 100%`，确保工造题记与解析度说明在任意悬窗宽度下自适应折行。
- **主调色板萃取无结果缺陷修复 (Color Palette Extraction Fix)**：
  - 修复 `extractDominantColors` 异步图像加载时遗漏给 `img.src` 赋值导致 `onload` 永远无法触发、面板持续卡在“提取中...”的致命缺陷。
  - 引入 DOM 已加载卡片缩略图优先内存复用机制（0ms 秒级响应，无需发起二次网络请求）。
  - 增强颜色欧氏距离色差聚类去重算法，并内置高精度专属工造主色谱优雅兜底，杜绝白屏或提取失败。

---

## [1.1.0] - 2026-09-21

### 新增 (Added)
- **双层隐形数字盲水印取证引擎 (Stealth Watermark Engine)**：
  - 集成前端自检网格与取证系统，支持快捷键 `Alt+W` 或 `Shift+W` 触发取证 HUD 探针，显影隐藏在画幅纹理中的版权追踪签名。
  - 引入微透明度水印算法（人眼不可见，但在图像处理软件高反差曲线拉升下清晰可辨）。
- **防盗链与防截屏多维防护机制**：
  - 全局拦截右键菜单（Context Menu）、禁止图片拖拽，屏蔽 `Ctrl+S`、`Ctrl+P` 等扒图快捷键。
  - 增加打印介质保护规则（`@media print`），阻断网页直印商用行为。

### 变更 (Changed)
- **成果档案元数据优化**：统一五大核心传世卷（上海矢量肌理、激光剪纸系列、锦江绿道山水剖面等）的比例、门类与原解析度元数据。
- **瓦片网络链路接入**：`assets/config.js` 正式接入 `CangFengCore` 私有云托管切片节点（`https://cangfengcore.lidmwork.workers.dev`）。

---

## [1.0.0] - 2026-09-21

### 新增 (Added)
- **藏锋录初始版本发布 (Initial Release)**：
  - 纯原生前端工程（HTML5 + CSS3 + ES6），完全摒弃冗余的打包器依赖。
  - 集成 OpenSeadragon 5.0，支持 WebP 多层级物理金字塔深览（Deep Zoom）。
  - 支持浅色 / 深色（Light / Dark）艺术馆级主题自由切换。
  - 紧凑网格（Dense）与宽松网格（Comfort）双版式排版。
  - 基于 Canvas 的作品主色调萃取调色板系统（一键复制 HEX 颜色值）。
