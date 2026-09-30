/**
 * AtlasLog · 地图录 成果集配置与品牌定义
 * OpenQGIS 制图作品集，探索 QGIS 的表达上限。
 *
 * 挂载逻辑与安全架构：
 * 1. 瓦片同源直连：默认内置 tiles/ 目录，通过 GitHub Pages 同源极速分发，零跨域、免翻墙、全端秒开。
 * 2. 外部生态关联：支持一键导航至 Gallery 聚合大厅与 Cabinet 共享精选库。
 */
window.ATLAS_CONFIG = window.CANGFENG_CONFIG = {
  // 外部挂载 CDN 节点 (默认为空 ''，直接使用同源/本地 tiles/ 瓦片目录；亦可配置自定义加速域名)
  assetBaseUrl: '',

  // 核心生产工具与数据底座仓库
  coreRepoUrl: 'https://github.com/OpenQGIS/atlas-core',

  // 共享精选库外链 (Cabinet)
  cabinetUrl: 'https://github.com/OpenQGIS/Cabinet',

  // 中央聚合大厅外链 (Gallery)
  galleryPortalUrl: 'https://github.com/OpenQGIS/Gallery',

  // 本仓库开源主页
  repositoryUrl: 'https://github.com/OpenQGIS/atlas',

  // 品牌宣传体系
  brand: {
    title: '地图录 · AtlasLog',
    subtitle: '个人制图实践，亦是 QGIS 能力边界的记录。',
    slogan: '一图一境，静观其详。',
    positioning: 'OpenQGIS 制图作品集，探索 QGIS 的表达上限。',
    description: '这里汇集多年来用 QGIS 亲手制作的地图作品。每一幅既是独立完成的视觉表达，也是对 QGIS 制图能力边界的探索与验证。'
  }
};
