# 地图录 · AtlasLog
### OpenQGIS 制图作品集 · 探索 QGIS 的表达上限
> **主口号**：一图一境，静观其详。  
> **副标**：个人制图实践，亦是 QGIS 能力边界的记录。  
> **在线直达**：[https://openqgis.github.io/atlas/](https://openqgis.github.io/atlas/)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Viewer: OpenSeadragon](https://img.shields.io/badge/Engine-OpenSeadragon%204K-orange.svg)](#system-architecture)

---

## 1. 成果集定位与扩展描述 (Overview & Vision)

> **一句话定位**：OpenQGIS 制图作品集，探索 QGIS 的表达上限。

这里汇集多年来用 QGIS 亲手制作的地图作品。每一幅既是独立完成的视觉表达，也是对 QGIS 制图能力边界的探索与验证。采用 1:1 4K 物理像素无损深览。

### 收录传世卷目 (Featured Masterworks)
1. **上海市中心城区空间肌理 (`shanghai`)**
   - 提取自上海核心都会区的高维建筑轮廓与路网骨架，千万级节点高密度几何重构，黑金撞色美学。
2. **城市剪纸-14PRO (`city_papercut_14pro`)**
   - 针对智能移动终端尺度的激光微雕纸卷构图，方寸转折之间起伏千里城郭。
3. **成都剪纸-iPAD_pro (`chengdu_papercut_ipad`)**
   - 蜀都千年古城肌理与现代平板比例的镂空艺术融合。
4. **锦江绿道黄龙溪段空间立面剖面 (`jinjiang_greenway_section`)**
   - 融合水文走势、山地高程剖切与生态游径的超大幅面立面山水画卷。
5. **布局方式2 (`layout_pattern_02`)**
   - 理性严谨的栅格秩序构图与现代极简设计版式。

---

## 2. 成果架构与极速分发体系 (Architecture)

本工程采用纯原生、轻量级、零构建依赖的高性能静态前端架构，深度适配桌面与移动全终端：

```text
┌────────────────────────────────────────────────────────────┐
│              AtlasLog 前端展厅 (GitHub Pages)              │
│       https://openqgis.github.io/atlas/ (同源秒开)         │
│  UI / 缩略图 / 元数据 / 1:1 4K WebP 金字塔瓦片 (tiles/)    │
└────────────────────────────────────────────────────────────┘
```

- **全端同源秒开**：全量 5 幅作品的十亿像素 WebP 金字塔瓦片内置分发，免翻墙、免代理、国内手机 4G/5G 与离线双击均可 0ms 呈现超清深览。
- **即时首帧预览**：集成 `placeholderImage` 机制，点击作品 0ms 无缝展现高清画幅底图，彻底告别黑屏与加载等待。
- **浮动档案悬窗**：磨砂玻璃浮动信息面板，支持自由拖拽、8 向拉伸尺寸（8-directional Resize）及 `Tab` / `I` 键快捷呼出；移动端自动自适应为底部抽屉卡片。
- **双层盲水印取证**：内置人眼不可见的微透明度版权追踪盲水印网格，支持 `Alt+W` 开启取证探针显影。

---

## 3. 关联生态 (Related Ecosystem)

- **[珍奇柜 · Cabinet](https://github.com/OpenQGIS/Cabinet)**: 全球卫星遥感与国家标准地图要素的公开共享精选库。
- **[聚合总览 · Gallery](https://github.com/OpenQGIS/Gallery)**: OpenQGIS 成果聚合探索大厅。
- **[底座工程 · atlas-core](https://github.com/OpenQGIS/atlas-core)**: 高清原图金字塔切片算法生产工具套件。

---

## 4. 本地极速浏览

在 Windows 环境下，直接双击运行：
```bash
双击浏览地图录.bat
```
或启动任意本地静态服务器：
```bash
python -m http.server 8080
```
浏览器访问 `http://localhost:8080` 即可开始沉浸式深览。
