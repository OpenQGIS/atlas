/**
 * AtlasLog · 国际化多语言引擎 (i18n Engine)
 * 支持中/英/日/韩四语无缝切换、本地环境智能探测与持久化记忆
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'atlas_language_preference';

  const UI_STRINGS = {
    zh: {
      siteTitle: '地图录 OpenQGIS制图作品集',
      brandTitle: '<span class="brand-title-main">地图录</span><span class="brand-title-sub"> · AtlasLog</span>',
      brandSubtitle: '个人制图实践 · QGIS 能力边界的记录',
      navAbout: '关于',
      navCabinet: '珍奇柜',
      navGallery: '聚合总览',
      navAboutTitle: '查看《地图录》案名定位与说明',
      navHomeTitle: '返回首屏画卷 (Home)',
      navPortalTitle: '浏览 OpenQGIS 空间体系定位大厅',
      navCabinetTitle: '《珍奇柜 · 空间制图藏录》共享精选库',
      navGalleryTitle: '《Gallery · 典藏画廊》聚合大厅',
      navThemeToggle: '切换主题模式',
      navLangToggle: 'English',
      navLangTitle: '切换语言 / Switch Language',
      filterAll: '全部成果',
      filterWide: '横幅画卷',
      filterTall: '条屏竖幅',
      cardClickHint: '点击查看详图',
      actionZoom: '深览',
      actionClose: '退出阅览 (Esc)',
      actionPrev: '上一卷 (←)',
      actionNext: '下一卷 (→)',
      actionToggleInfo: '作品档案 (I)',
      actionZoomIn: '放大 (＋)',
      actionZoomOut: '缩小 (－)',
      actionReset: '全幅还原 (Home / 0)',
      actionRotate: '顺时针旋转90° (R)',
      actionActualSize: '1:1 4K 原生像素 (1)',
      actionFullscreen: '全屏模式 (F)',
      actionShare: '分享画卷 (S)',
      zoomInputPrefix: '比例',
      zoomInputApply: '确定',
      zoomFitScreen: '整图展卷全貌 (0)',
      zoomFitOption: '自适应全貌',
      zoomPhysical50: '50% 物理尺寸',
      zoomPhysical100: '100% 物理原寸 (真实幅面)',
      zoomPhysical200: '200% 精细刻画',
      zoomPixel1to1: '1:1 像素点对点 (超精细)',
      zoomUltraDetail: '400% 超微细节',
      toolFitScreen: '整图展卷全貌 (0)',
      actionShareCopied: '已复制!',
      actionCopy: '复制',
      actionCopyShare: '复制画卷专属直链',
      metaShareTitle: '画卷直链分享',
      shareToastSuccess: '画卷直链已复制到剪贴板',
      shareOptLink: '分享网址',
      shareOptLinkDesc: '复制专属直链到剪贴板',
      shareOptQr: '分享二维码',
      shareOptQrDesc: '扫码即刻原图深览',
      shareOptPoster: '海报分享',
      shareOptPosterDesc: '生成典藏画卷海报与专属码',
      shareQrTitle: '扫码深览画卷',
      shareQrSubtitle: '地图录 · 1:1 4K Deep Zoom 深览',
      shareQrSaveBtn: '保存二维码',
      sharePosterTitle: '典藏画卷海报',
      posterRatioLabel: '画幅比例',
      posterRatio3x4: '3:4 竖版典藏',
      posterRatio4x3: '4:3 横版画廊',
      posterRatio16x9: '16:9 宽屏全景',
      posterRatio9x16: '9:16 移动全屏',
      posterRatio21x9: '21:9 极客超宽',
      posterRatio9x21: '21:9 极客超宽',
      sharePosterDownloadBtn: '下载高清海报 (PNG)',
      sharePosterGenerating: '正在生成高清典藏海报...',
      aboutTag: '一图一境 · 静观其详',
      aboutSubtag: 'OpenQGIS 制图作品集',
      aboutTitle: '《地图录》· AtlasLog',
      aboutSubtitle: '个人制图实践，亦是 QGIS 能力边界的记录。',
      aboutDesc: '这里汇集多年来用 QGIS 亲手制作的地图作品。每一幅既是独立完成的视觉表达，也是对 QGIS 制图能力边界的探索与验证。<br/><br/>作品采用 1:1 4K 物理像素无损深览，探索 QGIS 制图表现力的极致细节与空间形态美学。',
      aboutClose: '关闭',
      navOverviewTitle: '全图导航',
      navToggleHint: '折叠/展开全图导航 (N)',
      navCloseHint: '关闭全图导航 (N)',
      metaDrawerTitle: '作品档案',
      metaCategory: '类目归属',
      metaAuthor: '制作者',
      metaDate: '创作日期',
      metaPhysicalSize: '原生尺寸',
      metaRatio: '长宽比例',
      metaPaletteTitle: '主调色板萃取',
      metaPaletteExtracting: '提取中...',
      metaPaletteEmpty: '暂无色彩数据',
      metaPaletteCopied: '已复制!',
      metaPaletteHint: '点击复制色彩 ',
      metaNotesTitle: '工造题记与说明',
      metaNavInfo: '基本信息',
      metaNavShare: '专属直链',
      metaNavPalette: '艺术色板',
      metaNavSharePalette: '直链与色板',
      metaNavNotes: '工造题记',
      emptyFilter: '当前筛选条件下暂无收录成果',
      subviewBack: '返回全部成果',
      subviewEnter: '进入专题',
      subviewBreadcrumb: '专题子界面',
      subviewAllTopics: '全部',
      subviewCountSuffix: ' 件画卷收录',
      subviewSpecWorks: '收录成果',
      subviewSpecWorksUnit: '件画卷',
      subviewSpecEngine: '制图体系',
      subviewSpecEngineVal: 'QGIS 原生',
      subviewSpecSeries: '精选序列',
      subviewTopicLabel: '探索细分',
      heroSlogan: '<span class="hero-title-chunk hero-slogan-chunk" aria-label="一图一境"><svg class="hero-slogan-svg" viewBox="0 0 120.27366 27.723831" fill="currentColor"><path transform="translate(-6.2418926,-86.886976)" d="M 6.2418926,99.733572 6.5034065,100.6634 H 32.945368 c 0.493971,0 0.842656,-0.14529 0.929827,-0.46491 -1.743426,-1.656259 -4.765364,-4.300455 -4.765364,-4.300455 l -2.702311,3.835537 z m 41.6603064,2.789478 c 1.859655,0.98795 3.167224,2.4408 3.632138,3.31251 2.963824,1.24946 4.649136,-4.82348 -3.486852,-3.69025 z m -2.004939,4.41668 c 3.428737,1.07512 6.363504,2.87666 7.61296,3.95177 3.632137,0.87171 4.561965,-6.39256 -7.554846,-4.30045 z m -2.818539,4.41668 v -8.04881 l 0.116228,0.26151 c 2.963824,-0.6102 5.578963,-1.59814 7.787303,-2.87665 1.452855,1.13322 3.167224,1.97588 5.11405,2.67325 0.348685,-1.65625 1.162284,-2.78948 2.411739,-3.2544 v 11.2451 z m 3.428738,-21.124509 c -0.4068,2.527967 -1.598141,6.30539 -3.080053,8.71713 l 0.232457,0.319628 c 1.278512,-0.842656 2.527968,-1.975883 3.60308,-3.138167 0.581142,1.162284 1.278513,2.179282 2.063054,3.080053 -1.743426,1.598145 -3.864594,2.963825 -6.247276,3.951765 V 90.231901 Z m 6.450676,4.213279 c -0.552085,1.133227 -1.249455,2.20834 -2.121168,3.225338 -1.191342,-0.581142 -2.237397,-1.278512 -3.050996,-2.121168 0.319628,-0.377742 0.610199,-0.726428 0.871713,-1.10417 z m 5.549906,-4.213279 v 9.4145 c -1.59814,-0.174343 -3.196281,-0.464914 -4.736307,-0.90077 1.307569,-1.10417 2.382682,-2.353625 3.225338,-3.748366 0.69737,-0.05811 0.958884,-0.145285 1.162284,-0.464914 l -3.196281,-2.760424 -2.00494,1.859654 h -3.719309 c 0.348685,-0.49397 0.610199,-0.958884 0.842656,-1.423798 0.552085,0.05812 0.813599,-0.02906 0.929827,-0.319628 l -3.922708,-1.656254 z m 1.656255,-2.963825 -1.946826,2.150226 H 43.398349 l -4.445736,-1.772483 v 26.964991 h 0.69737 c 1.772483,0 3.428738,-1.017 3.428738,-1.54003 v -0.90077 h 15.42932 v 2.29551 h 0.668313 c 1.569084,0 3.515909,-0.98794 3.544967,-1.27851 V 90.900214 c 0.610199,-0.145286 0.958884,-0.377742 1.162284,-0.639256 z m 7.895956,12.465496 0.261514,0.929828 h 26.441961 c 0.493971,0 0.842656,-0.14529 0.929827,-0.46491 -1.743426,-1.656259 -4.765364,-4.300455 -4.765364,-4.300455 l -2.70231,3.835537 z m 40.294628,-8.281273 h 9.87941 c -0.2034,1.365684 -0.52303,3.283452 -0.78454,4.678193 h -9.90847 l 0.23245,0.813599 h 17.92823 c 0.43586,0 0.72643,-0.145286 0.8136,-0.464914 -1.24945,-1.133227 -3.34156,-2.760424 -3.34156,-2.760424 l -1.8306,2.411739 h -2.96383 c 1.27852,-0.90077 2.58609,-1.946826 3.54497,-2.673253 0.63926,0.05811 0.98794,-0.145286 1.10417,-0.493971 l -4.53291,-1.510969 h 6.71219 c 0.4068,0 0.72643,-0.145286 0.8136,-0.464914 -1.2204,-1.162284 -3.34156,-2.90571 -3.34156,-2.90571 l -1.85966,2.557025 h -3.13817 c 1.74343,-0.929827 1.88872,-3.864594 -3.80648,-3.748366 l -0.17434,0.145286 c 0.58114,0.726427 1.10417,2.033997 1.10417,3.254395 0.17434,0.145285 0.37774,0.261514 0.55209,0.348685 h -7.23522 z m 2.17928,0.348685 c 0.63925,0.871713 1.16228,2.295511 1.13322,3.60308 3.16723,2.586082 7.03182,-3.312509 -0.92982,-3.748365 z m -1.71437,11.768126 c -1.10417,0.31963 -2.20834,0.6102 -3.2544,0.87171 v -8.804299 h 3.13817 c 0.37774,0 0.66831,-0.145285 0.75548,-0.464913 -0.84265,-1.162284 -2.55702,-3.021939 -2.55702,-3.021939 l -1.33663,2.41174 v -5.695192 c 0.8136,-0.116229 1.017,-0.4068 1.07512,-0.813599 l -5.05594,-0.435856 v 7.20616 h -2.760424 l 0.232457,0.813599 h 2.527967 v 9.821299 c -1.2204,0.31963 -2.208339,0.55209 -2.847595,0.66831 l 2.353625,4.53291 c 0.34869,-0.11623 0.66831,-0.43585 0.78454,-0.84265 3.39968,-2.61514 5.63708,-4.62008 7.00276,-6.01482 z m 11.4485,-3.922709 v 2.208339 h -7.08994 v -2.208339 z m -7.08994,3.021939 h 7.08994 v 2.15022 h -7.08994 z m 12.23304,4.30045 h -0.29057 c -0.58114,1.56908 -1.017,2.73137 -1.30757,3.13817 -0.17434,0.26151 -0.29057,0.31963 -0.58114,0.34868 h -0.90077 -1.10417 c -0.43586,0 -0.52303,-0.11623 -0.52303,-0.43585 v -3.22534 h 0.23246 c 1.19134,0 3.08005,-0.63926 3.10911,-0.84266 v -5.78236 c 0.55208,-0.0872 0.87171,-0.348686 1.04605,-0.552086 l -3.45779,-2.557025 -1.65625,1.772483 h -6.59597 l -4.18422,-1.59814 v 9.966588 h 0.55209 c 0.81359,0 1.62719,-0.2034 2.26645,-0.43586 -0.31963,2.70231 -1.48191,5.20122 -7.3805,7.46768 l 0.23245,0.37774 c 9.38545,-2.00494 11.0417,-5.20122 11.59379,-8.97865 h 0.46491 v 5.14311 c 0,2.26645 0.37774,2.96382 3.08005,2.96382 h 1.8306 c 3.54497,0 4.67819,-0.66831 4.67819,-2.00494 0,-0.66831 -0.14528,-1.07511 -1.017,-1.48191 z"></path></svg></span><span class="hero-title-sep hero-slogan-sep" aria-hidden="true"><svg class="hero-slogan-sep-svg" viewBox="57.376411 55.187965 5.3465047 5.2593384" fill="currentColor"><path transform="translate(-6.2418926,-86.886976)" d="m 66.291555,147.33428 c 1.481912,0 2.673253,-1.13323 2.673253,-2.58609 0,-1.45285 -1.191341,-2.67325 -2.673253,-2.67325 -1.481912,0 -2.673253,1.2204 -2.673253,2.67325 0,1.45286 1.191341,2.58609 2.673253,2.58609 z"></path></svg></span><span class="hero-title-chunk hero-slogan-chunk" aria-label="静观其详"><svg class="hero-slogan-svg" viewBox="-0.2324568 88.318718 120.65142 27.778591" fill="currentColor"><path transform="translate(-6.2418926,-86.886976)" d="m 27.889432,193.48261 h -1.888711 v -4.00988 h 1.888711 z m -1.888711,-9.03676 h 1.888711 v 4.21328 h -1.888711 z m -0.174343,-4.93971 c -0.348685,1.24946 -0.929827,2.96382 -1.510969,4.12611 h -4.271394 c 1.540027,-1.16229 2.90571,-2.61514 4.00988,-4.12611 z m -10.111871,5.92765 h -1.016998 v -2.76043 h 4.038937 c 0.203399,0 0.348685,-0.0291 0.49397,-0.11622 -0.261513,0.52302 -0.552084,1.01699 -0.842655,1.45285 -0.581142,-0.46491 -0.987942,-0.78454 -0.987942,-0.78454 z m -4.358565,9.53073 v -2.49891 h 3.021939 v 2.49891 z m 3.021939,-5.84048 v 2.52797 h -3.021939 v -2.52797 z m 17.172746,-0.90077 v -3.13817 c 0.493971,-0.0872 0.871713,-0.31962 1.075113,-0.52302 l -2.90571,-2.61514 -1.598141,1.68531 h -2.876653 c 1.685312,-0.98794 3.428738,-2.4408 4.70725,-3.57402 0.6102,-0.0581 0.929828,-0.14529 1.162285,-0.4068 l -3.428738,-2.93477 -1.975883,1.97588 h -1.075113 c 0.377742,-0.55208 0.697371,-1.10417 1.016999,-1.65625 0.755484,0.11623 0.987941,0 1.104169,-0.31963 l -5.084992,-1.51097 c -0.377742,2.26645 -1.191341,4.82348 -2.237397,6.94465 -1.046055,-0.98794 -2.789481,-2.35363 -2.789481,-2.35363 l -1.569084,2.06306 h -0.377742 v -2.38269 h 4.416679 c 0.406799,0 0.69737,-0.14528 0.784542,-0.46491 -1.10417,-1.04606 -2.963824,-2.49891 -2.963824,-2.49891 l -1.656255,2.15022 h -0.581142 v -2.17928 c 0.69737,-0.11623 0.90077,-0.37774 0.929827,-0.75548 l -4.939707,-0.4068 v 3.34156 H 6.3871781 l 0.2324569,0.8136 h 4.067994 v 2.38269 H 6.7358634 l 0.2324568,0.81359 h 3.7193088 v 2.76043 H 6.0094358 l 0.2324568,0.8136 H 19.637216 c 0.435856,0 0.726427,-0.14529 0.813599,-0.46492 -0.464914,-0.4068 -1.046056,-0.90077 -1.569084,-1.36568 0.232457,-0.14529 0.493971,-0.29057 0.726428,-0.46491 l 0.145285,0.49397 h 2.440797 v 4.21328 h -3.486852 l -2.963825,-2.20834 -1.656254,1.85965 h -2.615139 l -3.8936517,-1.54002 v 16.03951 h 0.5520849 c 1.6271976,0 3.2253378,-0.87171 3.2253378,-1.24945 v -5.78236 h 3.021939 v 2.46985 c 0,0.29057 -0.08717,0.46491 -0.435857,0.46491 -0.406799,0 -1.743426,-0.0581 -1.743426,-0.0581 v 0.37774 c 0.929827,0.2034 1.249456,0.58114 1.510969,1.13323 0.232457,0.55208 0.290571,1.48191 0.319629,2.70231 3.719308,-0.31963 4.213279,-1.68531 4.213279,-4.21328 v -8.97864 c 0.232457,-0.0581 0.435857,-0.11623 0.581142,-0.2034 h 3.370624 v 4.00988 h -2.847596 l 0.261514,0.81359 h 2.586082 v 3.89366 c 0,0.31962 -0.116229,0.49397 -0.493971,0.49397 -0.493971,0 -2.498911,-0.11623 -2.498911,-0.11623 v 0.37774 c 1.220399,0.2034 1.656255,0.63926 1.975883,1.19134 0.319628,0.55209 0.4068,1.45286 0.435857,2.6442 3.835537,-0.29057 4.387622,-2.00494 4.387622,-4.4748 v -4.00988 h 1.888711 v 1.68532 h 0.697371 c 1.452855,0 2.90571,-0.58115 2.963824,-0.72643 v -5.78236 h 2.179283 c 0.377742,0 0.639256,-0.14529 0.726427,-0.46492 -0.668313,-0.95888 -2.00494,-2.44079 -2.00494,-2.44079 z m 32.245806,6.50879 h -0.319628 c -0.523028,1.65626 -0.987941,3.051 -1.249455,3.51591 -0.174343,0.29057 -0.261514,0.34869 -0.523028,0.34869 h -0.813599 -0.929827 c -0.406799,0 -0.493971,-0.11623 -0.493971,-0.43586 v -5.49179 h 0.319628 c 2.033997,0 3.31251,-0.72643 3.31251,-0.92983 v -12.93041 c 0.668313,-0.11623 0.958884,-0.34869 1.162284,-0.6102 l -3.428738,-2.67325 -1.888711,2.15022 h -5.695192 l -4.126108,-1.54002 v 3.51591 l -3.138167,-2.76043 -1.917769,2.09211 h -7.002761 l 0.261514,0.8136 h 7.031818 c -0.203399,2.00494 -0.464913,4.09705 -0.871713,6.16011 -1.365684,-1.39474 -3.050995,-2.78948 -5.114049,-4.18423 l -0.4068,0.17435 c 1.481912,2.44079 3.10911,5.31745 4.474794,8.22316 -1.191342,4.06799 -2.963825,7.87447 -5.520849,10.83829 l 0.290571,0.26152 c 3.050995,-2.00494 5.259335,-4.47479 6.886532,-7.20616 0.4068,1.13322 0.755485,2.23739 1.016999,3.28345 3.167224,2.61514 5.230278,-1.88871 1.162284,-7.9907 1.046055,-2.90571 1.627197,-5.92765 2.00494,-8.86242 0.406799,-0.0581 0.668313,-0.11623 0.842656,-0.23245 v 12.72701 h 0.69737 c 1.946826,0 3.10911,-0.66832 3.10911,-0.92983 v -13.56967 h 6.160105 v 12.8723 l -1.743426,-0.14529 c 0.435857,-2.73137 0.406799,-5.9567 0.464914,-9.73413 0.668313,-0.11623 0.958884,-0.37774 1.046055,-0.84265 l -4.70725,-0.4068 c 0,11.50661 0.871713,17.812 -10.51867,22.14151 l 0.203399,0.43585 c 6.886533,-1.62719 10.344328,-3.9227 12.087754,-7.14804 v 3.42874 c 0,2.20834 0.348685,2.90571 2.876653,2.90571 h 1.656255 c 3.10911,0 4.358565,-0.75549 4.358565,-2.12117 0,-0.66832 -0.116229,-1.07511 -0.929827,-1.48191 z m 4.321933,8.13599 c 4.678193,-0.90077 9.12393,-2.6442 11.768126,-4.59102 1.016998,0.14528 1.540026,-0.0581 1.80154,-0.43586 l -4.997821,-2.61514 c -1.598141,2.38268 -5.11405,5.52085 -8.688073,7.35145 z m 15.719891,-6.33445 c 3.51591,1.59814 5.491792,3.83554 6.479734,5.37556 3.370623,3.42874 10.722069,-4.5329 -6.363505,-5.69519 z m -5.230278,-6.33445 h 6.595962 v 3.98083 h -6.595962 z m 6.595962,-9.24015 v 3.83553 H 78.607979 V 180.959 Z m -6.595962,4.64913 h 6.595962 v 3.77742 h -6.595962 z m 10.867356,8.54279 V 180.959 h 4.794421 c 0.435857,0 0.755485,-0.14529 0.842656,-0.46492 -1.39474,-1.19134 -3.690251,-2.87665 -3.690251,-2.87665 l -1.946826,2.4408 v -3.34157 c 0.813599,-0.11623 1.016998,-0.4068 1.075113,-0.84266 l -5.346507,-0.46491 v 4.73631 h -6.595962 v -3.42874 c 0.784542,-0.14529 0.987942,-0.43586 1.046056,-0.84266 L 74.3947,175.40909 v 4.73631 h -5.695192 l 0.232457,0.8136 H 74.3947 v 13.22098 h -6.334448 l 0.232457,0.81359 h 26.587247 c 0.406799,0 0.755484,-0.14528 0.842656,-0.46491 -1.51097,-1.30757 -4.038937,-3.22534 -4.038937,-3.22534 z m 20.913535,-18.59655 c 0.75549,1.54003 1.51097,3.54497 1.59814,5.46274 3.37063,2.96382 7.29333,-3.54497 -1.36568,-5.57896 z m -9.79224,0.14529 c 1.017,1.30757 2.17928,3.22534 2.61514,5.02688 3.60308,2.35362 6.62502,-4.44574 -2.38268,-5.17217 z m 5.66613,8.86242 c 0.75549,-0.0872 1.10417,-0.31963 1.24946,-0.52303 l -3.2544,-2.70231 -1.80154,1.77248 h -3.690248 l 0.261514,0.8136 h 3.370624 v 12.0587 c 0,0.69737 -0.23246,1.01699 -1.71437,1.85965 l 2.93477,4.24234 c 0.31963,-0.23246 0.66831,-0.63926 0.92982,-1.16229 2.58609,-2.29551 4.50386,-4.41668 5.4918,-5.57896 l -0.0581,-0.23246 c -1.27851,0.43586 -2.52797,0.84266 -3.71931,1.2204 z m 14.79007,9.24015 h -2.26646 v -5.05593 h 5.95671 c 0.43586,0 0.72643,-0.14529 0.8136,-0.46492 -1.27851,-1.22039 -3.4578,-3.02193 -3.4578,-3.02193 l -1.91777,2.67325 h -1.39474 v -5.14311 h 6.62502 c 0.4068,0 0.72643,-0.14528 0.8136,-0.46491 -1.33662,-1.19134 -3.57402,-2.93477 -3.57402,-2.93477 l -1.94683,2.58608 h -2.44079 c 1.85965,-1.42379 3.71931,-3.16722 4.96876,-4.35856 0.66831,0.0581 0.98794,-0.17434 1.13323,-0.52303 l -5.49179,-1.85965 c -0.29058,1.91777 -0.87172,4.70725 -1.4238,6.74124 h -9.18205 l 0.23246,0.8136 h 6.16011 v 5.14311 h -5.6952 l 0.23246,0.8136 h 5.46274 v 5.05593 h -6.85748 l 0.23246,0.8136 h 6.62502 v 8.36845 h 0.75548 c 2.15023,0 3.37062,-0.78454 3.37062,-1.017 v -7.35145 h 7.06088 c 0.43586,0 0.75548,-0.14528 0.8136,-0.46491 -1.30757,-1.24946 -3.60308,-3.13817 -3.60308,-3.13817 z"></path></svg></span>',

      heroSubslogan: '<span class="hero-sub-chunk">地图录</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS 制图作品集</span>',
      heroBrandTooltip: '点击步入画卷展厅 ↓',
      heroDesc: '个人制图实践 · QGIS 能力边界的记录',
      heroScroll: '向下探索',
      heroBgArtwork: '背景展卷',
      badgeNew: 'NEW',
      badgeNewAria: '近3个月新作',
      footerCopyright: '<p class="footer-desc">「一图一境 · 静观其详」 每一幅地图既是独立完成的空间形态与视觉表达，也是对地理信息开源制图上限的探索与验证。</p><p class="footer-copy">© 2026 OpenQGIS / AtlasLog. All Rights Reserved. 原创空间制图作品未经许可严禁盗用、商用翻印或二次打包传播。</p>',
      langSelectTitle: '切换语言 / Switch Language',
      footerBrandTitle: '<span class="footer-brand-main">地图录</span><span class="footer-brand-sub"> · AtlasLog</span>',
      footerBrandSlogan: '「一图一境 · 静观其详」',
      footerBrandDesc: '空间制图实践专卷。每一幅地图既是独立完成的空间形态与视觉表达，也是对开源地理信息与 QGIS 制图能力边界的探索与验证。',
      footerOpenAboutBtn: '查看案名定位与说明 →',
      footerCol1Title: '空间制图全系',
      footerLinkAtlas: '地图录 · AtlasLog',
      footerBadgeCurrent: '本卷',
      footerLinkAtlasHint: 'QGIS 独立制图成果与 1:1 4K 深览',
      footerLinkCabinet: '珍奇柜 · Cabinet',
      footerLinkCabinetHint: '空间碎片藏录与开源资源精选库',
      footerLinkGallery: '典藏总馆 · Gallery',
      footerLinkGalleryHint: '空间地理成果与制图聚合大厅',
      footerCol2Title: '工造规范与特性',
      footerFeature1: 'QGIS 极限矢量制图',
      footerFeature1Hint: '突破桌面 GIS 视觉表达边界',
      footerFeature2: 'OpenSeadragon 4K WebP 切片',
      footerFeature2Hint: '1:1 原生微米级深览引擎',
      footerFeature3: '空间形态学与路网织体',
      footerFeature3Hint: '几何形态与地理环境深度解构',
      footerFeature4: '自适应主调色板萃取',
      footerFeature4Hint: '动态吸色与作品专属色彩基因',
      footerCol3Title: '社区与版权准则',
      footerLinkOrgHint: '探索更多开源制图与空间算法项目',
      footerCopyrightNotice: '所有作品为原创空间制图实践，受国际版权及开源许可保护。未经许可严禁商用、翻印、洗稿或二次打包再分发。',
      footerEdition: '2026 EDITION',
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.',
      viewerHdLoading: '加载中…',
      viewerHdSlowHint: '网络传输稍慢，已保持当前清晰度，后台持续连接中'
    },
    en: {
      siteTitle: 'AtlasLog · OpenQGIS Cartography Portfolio',
      brandTitle: '<span class="brand-title-main">AtlasLog</span>',
      brandSubtitle: 'Personal Cartography · Recording the Limits of QGIS',
      navAbout: 'About',
      navCabinet: 'Cabinet',
      navGallery: 'Gallery',
      navAboutTitle: 'About AtlasLog & Cartographic Vision',
      navHomeTitle: 'Return to Hero Cover (Home)',
      navPortalTitle: 'Explore OpenQGIS Geospatial Ecosystem Portal',
      navCabinetTitle: 'Cabinet · Curated Geospatial Library',
      navGalleryTitle: 'Gallery · Central Showcase Portal',
      navThemeToggle: 'Toggle Theme',
      navLangToggle: '中文',
      navLangTitle: 'Switch Language / 切换语言',
      filterAll: 'All Works',
      filterWide: 'Landscape',
      filterTall: 'Portrait',
      cardClickHint: 'View Full Map',
      actionZoom: 'Explore',
      actionClose: 'Close Viewer (Esc)',
      actionPrev: 'Previous (←)',
      actionNext: 'Next (→)',
      actionToggleInfo: 'Artwork Archive (I)',
      actionZoomIn: 'Zoom In (＋)',
      actionZoomOut: 'Zoom Out (－)',
      actionReset: 'Reset Extent (Home / 0)',
      actionRotate: 'Rotate 90° (R)',
      actionActualSize: '1:1 4K Physical Pixels (1)',
      actionFullscreen: 'Fullscreen (F)',
      actionShare: 'Share (S)',
      zoomInputPrefix: 'Scale',
      zoomInputApply: 'Go',
      zoomFitScreen: 'Fit Full Map (0)',
      zoomFitOption: 'Fit to View',
      zoomPhysical50: '50% Print Scale',
      zoomPhysical100: '100% Print Actual (Real Size)',
      zoomPhysical200: '200% Close-up',
      zoomPixel1to1: '1:1 Pixel Native',
      zoomUltraDetail: '400% Ultra Detail',
      toolFitScreen: 'Fit Full Map (0)',
      actionShareCopied: 'Copied!',
      actionCopy: 'Copy',
      actionCopyShare: 'Copy direct artwork link',
      metaShareTitle: 'Direct Share Link',
      shareToastSuccess: 'Artwork direct link copied to clipboard',
      shareOptLink: 'Share Link',
      shareOptLinkDesc: 'Copy direct artwork URL',
      shareOptQr: 'QR Code',
      shareOptQrDesc: 'Scan to explore in Deep Zoom',
      shareOptPoster: 'Artwork Poster',
      shareOptPosterDesc: 'Generate artwork poster with QR code',
      shareQrTitle: 'Scan to Deep Zoom',
      shareQrSubtitle: 'Atlas · 1:1 4K Deep Zoom',
      shareQrSaveBtn: 'Save QR Code',
      sharePosterTitle: 'Artwork Poster',
      posterRatioLabel: 'Aspect Ratio',
      posterRatio3x4: '3:4 Portrait',
      posterRatio4x3: '4:3 Landscape',
      posterRatio16x9: '16:9 Widescreen',
      posterRatio9x16: '9:16 Story / Mobile',
      posterRatio21x9: '21:9 Ultrawide',
      posterRatio9x21: '21:9 Ultrawide',
      sharePosterDownloadBtn: 'Download Poster (PNG)',
      sharePosterGenerating: 'Generating poster...',
      aboutTag: 'One Map, One Realm · Contemplate the Nuance',
      aboutSubtag: 'OpenQGIS Cartography Portfolio',
      aboutTitle: 'AtlasLog',
      aboutSubtitle: 'Personal cartographic practice, recording the upper limits of QGIS.',
      aboutDesc: 'A curated collection of maps handcrafted over the years with QGIS. Each piece stands as an independent visual expression and an exploration of the boundaries of QGIS cartography.<br/><br/>Rendered in 1:1 4K physical pixel lossless deep zoom to inspect spatial morphology and fine cartographic details.',
      aboutClose: 'Close',
      navOverviewTitle: 'Overview Map',
      navToggleHint: 'Toggle Overview Map (N)',
      navCloseHint: 'Close Overview Map (N)',
      metaDrawerTitle: 'Artwork Archive',
      metaCategory: 'Category',
      metaAuthor: 'Author',
      metaDate: 'Date',
      metaPhysicalSize: 'Physical Size',
      metaRatio: 'Aspect Ratio',
      metaPaletteTitle: 'Dominant Color Palette',
      metaPaletteExtracting: 'Extracting...',
      metaPaletteEmpty: 'No color data',
      metaPaletteCopied: 'Copied!',
      metaPaletteHint: 'Click to copy color ',
      metaNotesTitle: 'Notes & Description',
      metaNavInfo: 'Basic Info',
      metaNavShare: 'Share Link',
      metaNavPalette: 'Color Palette',
      metaNavSharePalette: 'Link & Palette',
      metaNavNotes: 'Notes & Details',
      emptyFilter: 'No artworks found under current filter',
      subviewBack: 'Back to All Works',
      subviewEnter: 'Explore Topic',
      subviewBreadcrumb: 'Topic View',
      subviewAllTopics: 'All',
      subviewCountSuffix: ' Works',
      subviewSpecWorks: 'Curated Works',
      subviewSpecWorksUnit: 'Works',
      subviewSpecEngine: 'Core Engine',
      subviewSpecEngineVal: 'QGIS Native',
      subviewSpecSeries: 'Series ID',
      subviewTopicLabel: 'Themes',
      heroSlogan: '<span class="hero-title-chunk">One Map, One Realm</span><span class="hero-title-sep"> · </span><span class="hero-title-chunk">Contemplate the Nuance</span>',
      heroSubslogan: '<span class="hero-sub-chunk">AtlasLog</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS Cartography Portfolio</span>',
      heroBrandTooltip: 'Click to Explore Works ↓',
      heroDesc: 'Personal Cartography · Recording the Limits of QGIS',
      heroScroll: 'Scroll to Explore',
      heroBgArtwork: 'Featured Map',
      badgeNew: 'NEW',
      badgeNewAria: 'Recent Artwork',
      footerCopyright: '<p class="footer-desc">"One Map, One Realm · Contemplate the Nuance" — Each map stands as an independent spatial form and visual expression, exploring the upper limits of open-source GIS cartography.</p><p class="footer-copy">© 2026 OpenQGIS / AtlasLog. All Rights Reserved. Unauthorized commercial reproduction, reprinting, or repackaged redistribution is strictly prohibited.</p>',
      langSelectTitle: 'Switch Language / 切换语言',
      footerBrandTitle: '<span class="footer-brand-main">AtlasLog</span><span class="footer-brand-sub"> · OpenQGIS</span>',
      footerBrandSlogan: '"One Map, One Realm · Contemplate the Nuance"',
      footerBrandDesc: 'Dedicated volume of spatial cartography. Each piece stands as an independent spatial form and visual expression, exploring the upper limits of open-source GIS and QGIS cartographic capabilities.',
      footerOpenAboutBtn: 'About AtlasLog & Vision →',
      footerCol1Title: 'Geospatial Ecosystem',
      footerLinkAtlas: 'AtlasLog',
      footerBadgeCurrent: 'CURRENT',
      footerLinkAtlasHint: 'QGIS original cartography & 1:1 4K deep zoom',
      footerLinkCabinet: 'Cabinet',
      footerLinkCabinetHint: 'Curated spatial fragments & open resources',
      footerLinkGallery: 'Gallery',
      footerLinkGalleryHint: 'Central geospatial showcase portal',
      footerCol2Title: 'Craft & Architecture',
      footerFeature1: 'QGIS Vector Limits',
      footerFeature1Hint: 'Pushing boundaries of desktop GIS visualization',
      footerFeature2: '4K Deep Zoom Tiles',
      footerFeature2Hint: '1:1 native physical pixel deep viewer',
      footerFeature3: 'Spatial Morphology',
      footerFeature3Hint: 'Urban fabric & territorial deconstruction',
      footerFeature4: 'Adaptive Palette Extraction',
      footerFeature4Hint: 'Dynamic chromatic DNA per artwork',
      footerCol3Title: 'Community & Licensing',
      footerLinkOrgHint: 'Explore open-source cartography & spatial tools',
      footerCopyrightNotice: 'All works are original spatial cartography protected under international copyright. Unauthorized commercial reuse, reprinting, or repackaged redistribution is strictly prohibited.',
      footerEdition: '2026 EDITION',
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.',
      viewerHdLoading: 'Loading...',
      viewerHdSlowHint: 'Slow network; preview held, continuing connection...'
    },
    ja: {
      siteTitle: '地図録 OpenQGIS地図作品集',
      brandTitle: '<span class="brand-title-main">地図録</span><span class="brand-title-sub"> · AtlasLog</span>',
      brandSubtitle: '個人の作図実践 · QGISの能力の限界を記録する',
      navAbout: '概要',
      navCabinet: '驚異の部屋',
      navGallery: '統合ギャラリー',
      navAboutTitle: '『地図録』のコンセプトと解説を見る',
      navHomeTitle: '表紙画巻に戻る (Home)',
      navPortalTitle: 'OpenQGIS 空間体系ポータルへ',
      navCabinetTitle: '『驚異の部屋 · 空間地図アーカイブ』コレクション',
      navGalleryTitle: '『Gallery · 典蔵ギャラリー』',
      navThemeToggle: 'テーマの切り替え',
      navLangToggle: '日本語',
      navLangTitle: '言語を切り替える / Switch Language',
      filterAll: 'すべての作品',
      filterWide: '横パノラマ',
      filterTall: '縦掛軸',
      cardClickHint: '詳細図を見る',
      actionZoom: '詳細表示',
      actionClose: '閉じる (Esc)',
      actionPrev: '前の作品 (←)',
      actionNext: '次の作品 (→)',
      actionToggleInfo: '作品アーカイブ (I)',
      actionZoomIn: '拡大 (＋)',
      actionZoomOut: '縮小 (－)',
      actionReset: '全体表示 (Home / 0)',
      actionRotate: '時計回りに90°回転 (R)',
      actionActualSize: '1:1 4K 原寸ピクセル (1)',
      actionFullscreen: 'フルスクリーン (F)',
      actionShare: '作品を共有 (S)',
      zoomInputPrefix: '倍率',
      zoomInputApply: '適用',
      zoomFitScreen: '地図全体を表示 (0)',
      zoomFitOption: '全体表示',
      zoomPhysical50: '50% 印刷縮尺',
      zoomPhysical100: '100% 原寸 (実寸大)',
      zoomPhysical200: '200% 拡大精細',
      zoomPixel1to1: '1:1 ドット・バイ・ドット',
      zoomUltraDetail: '400% 超微細ディテール',
      toolFitScreen: '地図全体を表示 (0)',
      actionShareCopied: 'コピーしました!',
      actionCopy: 'コピー',
      actionCopyShare: '作品専用リンクをコピー',
      metaShareTitle: '作品リンクの共有',
      shareToastSuccess: '作品リンクをクリップボードにコピーしました',
      shareOptLink: 'URLを共有',
      shareOptLinkDesc: '専用リンクをクリップボードにコピー',
      shareOptQr: 'QRコードで共有',
      shareOptQrDesc: 'QRコードをスキャンして原図を拡大表示',
      shareOptPoster: 'ポスター共有',
      shareOptPosterDesc: 'コレクションポスターとQRコードを生成',
      shareQrTitle: 'QRコードで作品を閲覧',
      shareQrSubtitle: '地図録 · 1:1 4K ディープズーム',
      shareQrSaveBtn: 'QRコードを保存',
      sharePosterTitle: 'コレクションポスター',
      posterRatioLabel: 'アスペクト比',
      posterRatio3x4: '3:4 縦型',
      posterRatio4x3: '4:3 横型',
      posterRatio16x9: '16:9 ワイド',
      posterRatio9x16: '9:16 モバイル',
      posterRatio21x9: '21:9 超広角',
      posterRatio9x21: '21:9 超広角',
      sharePosterDownloadBtn: '高解像度ポスターをダウンロード (PNG)',
      sharePosterGenerating: '高解像度ポスターを生成中...',
      aboutTag: '一図一境 · 静観其詳',
      aboutSubtag: 'OpenQGIS 地図作品集',
      aboutTitle: '『地図録』· AtlasLog',
      aboutSubtitle: '個人の作図実践、そしてQGISの表現力の限界の記録。',
      aboutDesc: '長年にわたりQGISで自ら制作した地図作品を集約しています。一枚一枚が独立した空間形態の視覚表現であり、同時にオープンソースGISにおける作図表現力の可能性への挑戦でもあります。<br/><br/>作品は 1:1 4K 物理ピクセルによる無損失ディープズームに対応し、ディテールと空間美学を鑑賞できます。',
      aboutClose: '閉じる',
      navOverviewTitle: '全図ナビゲーション',
      navToggleHint: 'ナビゲーションの開閉 (N)',
      navCloseHint: 'ナビゲーションを閉じる (N)',
      metaDrawerTitle: '作品アーカイブ',
      metaCategory: 'カテゴリー',
      metaAuthor: '作者',
      metaDate: '制作日',
      metaPhysicalSize: '原寸サイズ',
      metaRatio: 'アスペクト比',
      metaPaletteTitle: 'メインカラーパレット抽出',
      metaPaletteExtracting: '抽出中...',
      metaPaletteEmpty: 'カラーデータなし',
      metaPaletteCopied: 'コピーしました!',
      metaPaletteHint: 'クリックしてカラーコードをコピー ',
      metaNotesTitle: '制作ノート・解説',
      metaNavInfo: '基本情報',
      metaNavShare: '専用リンク',
      metaNavPalette: 'カラーパレット',
      metaNavSharePalette: 'リンク・パレット',
      metaNavNotes: '制作ノート',
      emptyFilter: '該当する作品がありません',
      subviewBack: 'すべての作品に戻る',
      subviewEnter: 'トピックを見る',
      subviewBreadcrumb: 'トピックビュー',
      subviewAllTopics: 'すべて',
      subviewCountSuffix: ' 作品',
      subviewSpecWorks: '収録作品',
      subviewSpecWorksUnit: '作品',
      subviewSpecEngine: '作図体系',
      subviewSpecEngineVal: 'QGIS ネイティブ',
      subviewSpecSeries: 'シリーズ',
      subviewTopicLabel: 'テーマ',
      heroSlogan: '<span class="hero-title-chunk">一図一境</span><span class="hero-title-sep"> · </span><span class="hero-title-chunk">静観其詳</span>',
      heroSubslogan: '<span class="hero-sub-chunk">地図録</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS 地図作品集</span>',
      heroBrandTooltip: 'クリックして作品を閲覧 ↓',
      heroDesc: '個人の作図実践 · QGISの能力の限界を記録する',
      heroScroll: 'スクロールして探索',
      heroBgArtwork: '背景の作品',
      badgeNew: 'NEW',
      badgeNewAria: '直近3か月の新作',
      footerCopyright: '<p class="footer-desc">「一図一境 · 静観其詳」 一枚一枚の地図は独立した空間形態の視覚表現であり、地理情報オープンソース作図の限界への探求でもあります。</p><p class="footer-copy">© 2026 OpenQGIS / AtlasLog. All Rights Reserved. 掲載されている地図作品の無断転載・商用利用・再配布を禁じます。</p>',
      langSelectTitle: '言語の切り替え / Switch Language',
      footerBrandTitle: '<span class="footer-brand-main">地図録</span><span class="footer-brand-sub"> · AtlasLog</span>',
      footerBrandSlogan: '「一図一境 · 静観其詳」',
      footerBrandDesc: '空間作図実践の専門巻。各作品は独立した視覚表現であり、QGISの作図能力の限界を探求・検証するものです。',
      footerOpenAboutBtn: 'コンセプトと解説を見る →',
      footerCol1Title: '空間地図シリーズ',
      footerLinkAtlas: '地図録 · AtlasLog',
      footerBadgeCurrent: '本編',
      footerLinkAtlasHint: 'QGISオリジナル作図と1:1 4Kディープズーム',
      footerLinkCabinet: '驚異の部屋 · Cabinet',
      footerLinkCabinetHint: '空間アーカイブとオープンソースリソース',
      footerLinkGallery: '典蔵総館 · Gallery',
      footerLinkGalleryHint: '空間地理成果と地図ギャラリー',
      footerCol2Title: '制作仕様と特徴',
      footerFeature1: 'QGIS 極限ベクター作図',
      footerFeature1Hint: 'デスクトップGISの視覚表現の限界を拡張',
      footerFeature2: 'OpenSeadragon 4K WebP タイル',
      footerFeature2Hint: '1:1 原寸マイクロズームエンジン',
      footerFeature3: '空間形態論と道路網テクスチャ',
      footerFeature3Hint: '幾何構造と地理環境の解体と再構築',
      footerFeature4: '適応型カラーパレット抽出',
      footerFeature4Hint: '作品固有の色彩DNAを動的抽出',
      footerCol3Title: 'コミュニティと著作権',
      footerLinkOrgHint: 'オープンソース地図と空間アルゴリズムを探求',
      footerCopyrightNotice: 'すべての作品はオリジナルの空間作図実践であり、著作権法およびオープンソースライセンスにより保護されています。',
      footerEdition: '2026 EDITION',
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.',
      viewerHdLoading: '読み込み中…',
      viewerHdSlowHint: '低速回線のため現在の解像度を維持し、接続を継続中...'
    },
    ko: {
      siteTitle: '지도록 OpenQGIS 지도 작품집',
      brandTitle: '<span class="brand-title-main">지도록</span><span class="brand-title-sub"> · AtlasLog</span>',
      brandSubtitle: '개인 지도 제작 실천 · QGIS의 한계를 기록하다',
      navAbout: '소개',
      navCabinet: '호기심의 캐비닛',
      navGallery: '통합 갤러리',
      navAboutTitle: '《지도록》 기획 의도 및 설명 보기',
      navHomeTitle: '첫 화면으로 돌아가기 (Home)',
      navPortalTitle: 'OpenQGIS 공간 체계 포털 탐색',
      navCabinetTitle: '《호기심의 캐비닛 · 공간 지도 아카이브》 컬렉션',
      navGalleryTitle: '《Gallery · 컬렉션 갤러리》',
      navThemeToggle: '테마 모드 전환',
      navLangToggle: '한국어',
      navLangTitle: '언어 전환 / Switch Language',
      filterAll: '전체 작품',
      filterWide: '가로 파노라마',
      filterTall: '세로 족자형',
      cardClickHint: '상세도 보기',
      actionZoom: '상세 보기',
      actionClose: '닫기 (Esc)',
      actionPrev: '이전 작품 (←)',
      actionNext: '다음 작품 (→)',
      actionToggleInfo: '작품 아카이브 (I)',
      actionZoomIn: '확대 (＋)',
      actionZoomOut: '축소 (－)',
      actionReset: '전체 맞춤 (Home / 0)',
      actionRotate: '시계 방향으로 90° 회전 (R)',
      actionActualSize: '1:1 4K 원본 픽셀 (1)',
      actionFullscreen: '전체 화면 (F)',
      actionShare: '작품 공유 (S)',
      zoomInputPrefix: '배율',
      zoomInputApply: '적용',
      zoomFitScreen: '전체 지도 보기 (0)',
      zoomFitOption: '화면 맞춤',
      zoomPhysical50: '50% 인쇄 축척',
      zoomPhysical100: '100% 실제 크기 (인쇄 원촌)',
      zoomPhysical200: '200% 정밀 확대',
      zoomPixel1to1: '1:1 픽셀 원본',
      zoomUltraDetail: '400% 초미세 디테일',
      toolFitScreen: '전체 지도 보기 (0)',
      actionShareCopied: '복사되었습니다!',
      actionCopy: '복사',
      actionCopyShare: '작품 전용 링크 복사',
      metaShareTitle: '작품 링크 공유',
      shareToastSuccess: '작품 전용 링크가 클립보드에 복사되었습니다',
      shareOptLink: '링크 공유',
      shareOptLinkDesc: '전용 링크를 클립보드에 복사',
      shareOptQr: 'QR 코드 공유',
      shareOptQrDesc: 'QR 코드를 스캔하여 원본 고화질 보기',
      shareOptPoster: '포스터 공유',
      shareOptPosterDesc: '소장용 포스터 및 전용 QR 생성',
      shareQrTitle: 'QR 코드로 작품 보기',
      shareQrSubtitle: '지도록 · 1:1 4K 딥 줌',
      shareQrSaveBtn: 'QR 코드 저장',
      sharePosterTitle: '소장용 전시 포스터',
      posterRatioLabel: '화면 비율',
      posterRatio3x4: '3:4 세로',
      posterRatio4x3: '4:3 가로',
      posterRatio16x9: '16:9 와이드스크린',
      posterRatio9x16: '9:16 모바일',
      posterRatio21x9: '21:9 울트라와이드',
      posterRatio9x21: '21:9 울트라와이드',
      sharePosterDownloadBtn: '고화질 포스터 다운로드 (PNG)',
      sharePosterGenerating: '고화질 포스터 생성 중...',
      aboutTag: '一圖一境 · 靜觀其詳',
      aboutSubtag: 'OpenQGIS 지도 작품집',
      aboutTitle: '《지도록》· AtlasLog',
      aboutSubtitle: '개인의 지도 제작 실천이자 QGIS 역량의 한계를 기록한 아카이브.',
      aboutDesc: '수년간 QGIS로 직접 제작한 지도 작품을 모은 공간입니다. 각각의 작품은 독립된 시각적 표현이자 오픈소스 GIS의 지도 제작 역량의 한계를 탐색하고 검증한 결과물입니다.<br/><br/>모든 작품은 1:1 4K 무손실 딥 줌을 지원하여 QGIS의 정밀한 디테일과 공간 형태학적 미학을 감상할 수 있습니다.',
      aboutClose: '닫기',
      navOverviewTitle: '전체 지도 탐색',
      navToggleHint: '내비게이션 접기/펼치기 (N)',
      navCloseHint: '내비게이션 닫기 (N)',
      metaDrawerTitle: '작품 아카이브',
      metaCategory: '분류',
      metaAuthor: '제작자',
      metaDate: '제작 일자',
      metaPhysicalSize: '원본 규격',
      metaRatio: '가로세로 비율',
      metaPaletteTitle: '메인 색상 팔레트 추출',
      metaPaletteExtracting: '추출 중...',
      metaPaletteEmpty: '색상 데이터 없음',
      metaPaletteCopied: '복사되었습니다!',
      metaPaletteHint: '클릭하여 색상 코드 복사 ',
      metaNotesTitle: '제작 노트 및 설명',
      metaNavInfo: '기본 정보',
      metaNavShare: '전용 링크',
      metaNavPalette: '색상 팔레트',
      metaNavSharePalette: '링크 및 팔레트',
      metaNavNotes: '제작 노트',
      emptyFilter: '해당 조건의 작품이 없습니다',
      subviewBack: '전체 작품으로 돌아가기',
      subviewEnter: '주제 보기',
      subviewBreadcrumb: '주제 뷰',
      subviewAllTopics: '전체',
      subviewCountSuffix: ' 개 작품 수록',
      subviewSpecWorks: '수록 작품',
      subviewSpecWorksUnit: '개 작품',
      subviewSpecEngine: '제작 체계',
      subviewSpecEngineVal: 'QGIS 네이티브',
      subviewSpecSeries: '시리즈',
      subviewTopicLabel: '세부 주제',
      heroSlogan: '<span class="hero-title-chunk">一圖一境</span><span class="hero-title-sep"> · </span><span class="hero-title-chunk">靜觀其詳</span>',
      heroSubslogan: '<span class="hero-sub-chunk">지도록</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS 지도 작품집</span>',
      heroBrandTooltip: '클릭하여 작품 둘러보기 ↓',
      heroDesc: '개인 지도 제작 실천 · QGIS의 한계를 기록하다',
      heroScroll: '아래로 스크롤하여 탐색',
      heroBgArtwork: '배경 작품',
      badgeNew: 'NEW',
      badgeNewAria: '최근 3개월 신작',
      footerCopyright: '<p class="footer-desc">「한 장의 지도, 하나의 세계 · 고요히 그 디테일을 보다」 모든 지도는 독립된 공간 형태와 시각적 표현이자 오픈소스 지리정보 지도 제작의 한계를 탐구한 기록입니다.</p><p class="footer-copy">© 2026 OpenQGIS / AtlasLog. All Rights Reserved. 본 사이트의 작품은 무단 전재, 상업적 복제 및 재배포를 엄격히 금지합니다.</p>',
      langSelectTitle: '언어 전환 / Switch Language',
      footerBrandTitle: '<span class="footer-brand-main">지도록</span><span class="footer-brand-sub"> · AtlasLog</span>',
      footerBrandSlogan: '「한 장의 지도, 하나의 세계 · 고요히 그 디테일을 보다」',
      footerBrandDesc: '공간 지도 제작 실천 아카이브. 각 작품은 QGIS의 지도 제작 역량 한계를 검증한 독창적 공간 형태입니다.',
      footerOpenAboutBtn: '기획 의도 및 설명 보기 →',
      footerCol1Title: '공간 지도 컬렉션',
      footerLinkAtlas: '지도록 · AtlasLog',
      footerBadgeCurrent: '본권',
      footerLinkAtlasHint: 'QGIS 오리지널 지도 제작 및 1:1 4K 딥 줌',
      footerLinkCabinet: '호기심의 캐비닛 · Cabinet',
      footerLinkCabinetHint: '공간 아카이브 및 오픈소스 리소스 컬렉션',
      footerLinkGallery: '컬렉션 갤러리 · Gallery',
      footerLinkGalleryHint: '공간 지리 성과 및 지도 통합 갤러리',
      footerCol2Title: '제작 규격 및 특징',
      footerFeature1: 'QGIS 극한 벡터 지도 제작',
      footerFeature1Hint: '데스크톱 GIS 시각 표현의 한계 확장',
      footerFeature2: 'OpenSeadragon 4K WebP 타일',
      footerFeature2Hint: '1:1 원본 마이크로 딥 줌 엔진',
      footerFeature3: '공간 형태학과 도로망 텍스처',
      footerFeature3Hint: '기하학적 형태와 지리적 환경의 해체',
      footerFeature4: '적응형 색상 팔레트 추출',
      footerFeature4Hint: '작품 고유의 색채 DNA 동적 추출',
      footerCol3Title: '커뮤니티 및 저작권',
      footerLinkOrgHint: '오픈소스 지도 및 공간 알고리즘 탐색',
      footerCopyrightNotice: '모든 작품은 독창적인 공간 지도 제작 실천물이며 국제 저작권 및 라이선스의 보호를 받습니다.',
      footerEdition: '2026 EDITION',
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.',
      viewerHdLoading: '로딩 중…',
      viewerHdSlowHint: '네트워크 지연; 현재 해상도를 유지하며 연결 지속 중...'
    }
  };

  const ARTWORK_TRANSLATIONS = {
    aba_cycling_route: {
      en: {
            title: "Aba Cycling Route · Texture Overlay",
            categoryName: "Original Cartography",
            subCategory: "Map Layout & Engineering",
            topic: "Multi-element Layout & Cycling",
            description: "A composition featuring one primary elevation terrain map and four inset cycling route sections across the Aba Tibetan and Qiang Autonomous Prefecture. Surrounding insets detail Lianbaoyeze, Barkam, Zoige, and Hongyuan alongside elevation profile curves generated in QGIS.",
            author: "OpenQGIS",
            physicalSize: "60.0cm x 30.0cm, Standard Banner Ratio",
            tags: [
                  "Texture Overlay",
                  "Aba",
                  "Plateau",
                  "Elevation Profile",
                  "Cycling Route",
                  "Hillshade"
            ]
      },
      ja: {
            title: "阿壩サイクリングルート · テクスチャ重畳",
            categoryName: "オリジナル地図",
            subCategory: "組版と土木工学",
            topic: "複合要素レイアウト · サイクリング",
            description: "阿壩チベット族チャン族自治州の広大な高原地形図を中心に、蓮宝葉則、マルカム、ゾルゲ、紅原の4つのサイクリングルート詳細図とQGIS生成標高断面図を左右に配置した学術的組版設計。",
            author: "OpenQGIS",
            physicalSize: "60.0cm x 30.0cm、標準パノラマ横幅",
            tags: [
                  "テクスチャ重畳",
                  "阿壩",
                  "高原",
                  "標高断面",
                  "サイクリングルート",
                  "陰影起伏"
            ]
      },
      ko: {
            title: "아바 사이클링 노선 · 질감 오버레이",
            categoryName: "오리지널 지도",
            subCategory: "도면 조판 & 엔지니어링",
            topic: "다요소 조판 · 사이클링 지도",
            description: "아바 장족 칭족 자치주의 고원 지형도를 중심으로 롄바오예쩌, 바얼캉, 뤄얼가이, 훙위안 4개 라이딩 구간의 상세도와 QGIS 표고 단면 곡선을 결합한 전문 지도 디자인.",
            author: "OpenQGIS",
            physicalSize: "60.0cm x 30.0cm, 표준 파노라마 가로형",
            tags: [
                  "질감 오버레이",
                  "아바",
                  "고원",
                  "표고 단면",
                  "라이딩 코스",
                  "산체 음영"
            ]
      }
},
    china_top12_airports_2024: {
      en: {
            title: "China Top 12 Airports (2024) · Geometric Deconstruction",
            categoryName: "Original Cartography",
            subCategory: "Spatial Morphology",
            topic: "Airport Morphology & Runway Topology",
            description: "Deconstructing runway layouts and terminal geometries of China's top 12 passenger airports in 2024. Runway alignments, terminal aprons, and taxiway networks are rendered in a sleek minimalist style.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Airports",
                  "Runway Layout",
                  "Transportation Infrastructure",
                  "Vector Morphology"
            ]
      },
      ja: {
            title: "中国トップ12空港（2024年）· 幾何学的解体",
            categoryName: "オリジナル地図",
            subCategory: "空間形態論",
            topic: "空港形態と滑走路トポロジー",
            description: "2024年の中国旅客数上位12空港の滑走路構成とターミナル幾何学を解体・可視化。滑走路の方位角、エプロン、誘導路ネットワークを精緻なミニマルスタイルで提示する。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "空港",
                  "滑走路レイアウト",
                  "交通インフラ",
                  "ベクター形態論"
            ]
      },
      ko: {
            title: "2024 중국 12대 공항 형상 해체",
            categoryName: "오리지널 지도",
            subCategory: "공간 형태학",
            topic: "공항 형태학 & 활주로 토폴로지",
            description: "2024년 중국 여객량 상위 12개 공항의 활주로 배치 및 터미널 기하학 구조를 시각적으로 해체. 활주로 방위각과 유도로 네트워크를 미니멀한 벡터 양식으로 정밀 묘사.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "공항",
                  "활주로 배치",
                  "교통 인프라",
                  "벡터 형태학"
            ]
      }
},
    lake_poyang: {
      en: {
            title: "Lake Poyang · Hydrological Morphology",
            categoryName: "Original Cartography",
            subCategory: "Spatial Morphology",
            topic: "Hydrological Rhythm & Wetland Geography",
            description: "Mapping the seasonal wetland ecology and dynamic flood plains of China's largest freshwater lake, Lake Poyang, using gradient depth and water body contours.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Lake Poyang",
                  "Hydrology",
                  "Wetland",
                  "Freshwater Lake",
                  "Spatial Form"
            ]
      },
      ja: {
            title: "鄱陽湖 · 水文形態論",
            categoryName: "オリジナル地図",
            subCategory: "空間形態論",
            topic: "水文リズムと湿地地理",
            description: "中国最大の淡水湖である鄱陽湖の季節的水位変動と氾濫原の生態系を、繊細な深度グラデーションと水系等高線で表現した水文空間作品。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "鄱陽湖",
                  "水文学",
                  "湿地",
                  "淡水湖",
                  "空間形態"
            ]
      },
      ko: {
            title: "포양호 · 수문 형태학",
            categoryName: "오리지널 지도",
            subCategory: "공간 형태학",
            topic: "수문 리듬 & 습지 지리학",
            description: "중국 최대 담수호인 포양호의 계절별 수위 변동과 범람원 생태계를 깊이감 있는 수역 등고선과 그러데이션으로 표현한 수문 지리학적 작품.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "포양호",
                  "수문학",
                  "습지",
                  "담수호",
                  "공간 형태"
            ]
      }
},
    yangtze_river_bridge_chongqing: {
      en: {
            title: "Chongqing Yangtze River Bridges Catalog",
            categoryName: "Original Cartography",
            subCategory: "Engineering Cartography",
            topic: "Bridge Engineering & Mountain City River Crossings",
            description: "A comprehensive cartographic inventory of major bridges crossing the Yangtze River in Chongqing, illustrating structural spans, river navigation corridors, and topography.",
            author: "OpenQGIS",
            physicalSize: "60.0cm x 40.0cm, Engineering Panoramic Sheet",
            tags: [
                  "Chongqing",
                  "Yangtze River",
                  "Bridge Engineering",
                  "River Crossing"
            ]
      },
      ja: {
            title: "重慶長江大橋名録全図",
            categoryName: "オリジナル地図",
            subCategory: "エンジニアリング作図",
            topic: "橋梁工学と山岳都市渡河網",
            description: "「橋の都」重慶における長江横断橋梁群の包括的目録。橋梁構造のスパン、航路限界、峡谷地形の工学的関係を網羅的に作図。",
            author: "OpenQGIS",
            physicalSize: "60.0cm x 40.0cm、エンジニアリング大判図面",
            tags: [
                  "重慶",
                  "長江",
                  "橋梁工学",
                  "渡河交通"
            ]
      },
      ko: {
            title: "충칭 장강대교 명록 전도",
            categoryName: "오리지널 지도",
            subCategory: "엔지니어링 지도 제작",
            topic: "교량 공학 & 산악 도시 횡단망",
            description: "교량의 수도 충칭의 장강 횡단 교량군을 체계적으로 정리한 도면. 교량 구조 경간, 항로 한계 및 협곡 지형의 공학적 상호작용을 정밀 기록.",
            author: "OpenQGIS",
            physicalSize: "60.0cm x 40.0cm, 엔지니어링 대형 도면",
            tags: [
                  "충칭",
                  "장강",
                  "교량 공학",
                  "도하 교통"
            ]
      }
},
    chengdu_citywall_gates: {
      en: {
            title: "Chengdu Ancient City Wall & Gates",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Historical Gates & City Wall Reconstruction",
            description: "Reconstructing the historic walls and iconic defense gates of ancient Chengdu, contrasting historical moats against modern urban street grids.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Chengdu",
                  "City Wall",
                  "Historical Geography",
                  "Ancient Gates"
            ]
      },
      ja: {
            title: "成都古城壁と城門",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "歴史的城門と城壁復元",
            description: "古代成都の城壁輪郭と歴史的な城門群を復元。外濠水系と現代の都市グリッドの重層的な歴史的痕跡を視覚化。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "成都",
                  "城壁",
                  "歴史地理",
                  "城門"
            ]
      },
      ko: {
            title: "청두 고성벽과 성문",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "역사적 성문 & 성벽 복원",
            description: "고대 청두의 성벽 윤곽과 유서 깊은 성문들을 복원. 해자 수계와 현대 도시 격자망의 역사적 층위를 우아하게 대비 표현.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "청두",
                  "성벽",
                  "역사 지리학",
                  "성문"
            ]
      }
},
    chongqing_ancient_city: {
      en: {
            title: "Chongqing Ancient City",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Yuzhong Peninsula & Ancient Fortifications",
            description: "Spatial cartography of historic Chongqing within the Yuzhong Peninsula, depicting the natural defensive fortress sculpted by the Yangtze and Jialing rivers.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Chongqing",
                  "Ancient City",
                  "Yuzhong Peninsula",
                  "Mountain Fortress"
            ]
      },
      ja: {
            title: "重慶古城",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "渝中半島と古代防衛空間",
            description: "渝中半島に築かれた重慶古城の歴史的空間形態。長江と嘉陵江に囲まれた天然の要塞都市としての地形特性を描き出す。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "重慶",
                  "古城",
                  "渝中半島",
                  "山岳要塞"
            ]
      },
      ko: {
            title: "충칭 고성",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "위중 반도 & 고대 방어 요새",
            description: "위중 반도에 자리 잡은 충칭 고성의 역사적 공간 형태. 장강과 자링강이 빚어낸 천연 요새 도시의 험준한 지형 미학을 포착.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "충칭",
                  "고성",
                  "위중 반도",
                  "산악 요새"
            ]
      }
},
    changsha_citywall: {
      en: {
            title: "Changsha Ancient City Wall",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Historical Changsha & Xiang River Defense",
            description: "Historical spatial footprint of the ancient city wall of Changsha, detailing gate bastions and historical morphology facing the Xiang River.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Changsha",
                  "City Wall",
                  "Xiang River",
                  "Historical Cartography"
            ]
      },
      ja: {
            title: "長沙古城壁",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "歴史的長沙と湘江防衛",
            description: "湘江東岸に広がる長沙古城壁の歴史的フットプリント。防衛城門の配置と水陸交通の結束点を端正な線画で再現。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "長沙",
                  "城壁",
                  "湘江",
                  "歴史地図"
            ]
      },
      ko: {
            title: "창사 고성벽",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "역사적 창사 & 샹강 방어선",
            description: "샹강 동쪽 기슭에 위치한 창사 고성벽의 역사적 공간 궤적. 성문 배치와 수륙 교통 요충지로서의 성곽 형태학을 섬세하게 표현.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "창사",
                  "성벽",
                  "샹강",
                  "역사 지도"
            ]
      }
},
    nanjing_silver_black: {
      en: {
            title: "Nanjing · Silver & Black",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Monochrome Aesthetic & Ancient Capital",
            description: "A sophisticated silver-and-black contrast illustrating Nanjing's historic capital layout, framing Xuanwu Lake, Purple Mountain, and the Ming Dynasty city wall.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Nanjing",
                  "Monochrome",
                  "Purple Mountain",
                  "Ming City Wall"
            ]
      },
      ja: {
            title: "南京 · 銀黒の美学",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "モノクローム美学と古都空間",
            description: "シルバーとブラックの静謐なコントラストで描く南京の古都景観。玄武湖、紫金山、明代城壁の有機的な山水都市関係を強調。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "南京",
                  "モノクローム",
                  "紫金山",
                  "明代城壁"
            ]
      },
      ko: {
            title: "난징 · 실버 & 블랙",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "모노크롬 미학 & 고도 공간",
            description: "실버와 블랙의 정제된 대비로 표현한 난징의 고도 경관. 셴우호, 자금산, 명나라 성벽이 이루는 유기적 배산임수 구조를 부각.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "난징",
                  "모노크롬",
                  "자금산",
                  "명나라 성벽"
            ]
      }
},
    datong_papercut: {
      en: {
            title: "Datong · Papercut Aesthetic",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Papercut Craft & Northern Frontier Grid",
            description: "Rendering Datong's northern frontier city structure through tactile papercut relief aesthetic, emphasizing the rectangular garrison wall and urban grid.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Datong",
                  "Papercut",
                  "Northern Frontier",
                  "Garrison Wall"
            ]
      },
      ja: {
            title: "大同 · 切り絵アート",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "切り絵工芸と北方要衝グリッド",
            description: "切り絵の陰影表現を通じて北方防衛の要衝・大同の都市構造を描出。四角い城壁と規則正しい街区グリッドの立体感を表現。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "大同",
                  "切り絵",
                  "北方要衝",
                  "城壁グリッド"
            ]
      },
      ko: {
            title: "다퉁 · 페이퍼컷 아트",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "종이 공예 & 북방 요충지 그리드",
            description: "종이 공예의 입체적 음영 기법으로 표현한 북방 방어 요충지 다퉁의 도시 골격. 방형 성곽과 규칙적인 바둑판 격자의 정연한 조화.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "다퉁",
                  "페이퍼컷",
                  "북방 요충지",
                  "성곽 그리드"
            ]
      }
},
    chengdu_blueprint: {
      en: {
            title: "Chengdu · Cyan Blueprint",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Architectural Blueprint & Radial Ring Roads",
            description: "Chengdu presented in classic architectural blueprint aesthetics: deep Prussian blue backdrop with crisp cyan-white drafting lines showcasing radial ring roads.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Chengdu",
                  "Blueprint",
                  "Ring Roads",
                  "Radial Grid"
            ]
      },
      ja: {
            title: "成都 · シアン青写真",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "建築青写真と放射環状道路網",
            description: "伝統的な建築青写真（ブループリント）の美学で描く成都。深いプルシアンブルーに映える白くシャープな製図線が同心円状の環状道路網を浮き彫りにする。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "成都",
                  "青写真",
                  "環状道路",
                  "放射グリッド"
            ]
      },
      ko: {
            title: "청두 · 청사진 블루프린트",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "건축 청사진 & 방사 환상 도로망",
            description: "정통 건축 청사진 미학으로 구현한 청두의 도로망. 깊은 프러시안 블루 배경 위 명쾌한 시안 백색 제도선이 동심원 환상 도로의 질서를 표현.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "청두",
                  "블루프린트",
                  "환상 도로",
                  "방사 격자"
            ]
      }
},
    chengdu_macaron: {
      en: {
            title: "Chengdu · Macaron Pastel Palette",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Pastel Aesthetics & Urban Land Use Hierarchy",
            description: "Soft macaron pastel tones mapping Chengdu's vast metropolitan area, transforming functional zoning and road hierarchies into a gentle, inviting visual tapestry.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Chengdu",
                  "Macaron",
                  "Pastel Tones",
                  "Urban Tapestry"
            ]
      },
      ja: {
            title: "成都 · マカロンパステル",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "マカロンカラーと都市土地利用",
            description: "柔らかなマカロンパステル調の色彩で成都広域都市圏を描画。機能的ゾーニングと道路階層を親しみやすく洗練されたタペストリーに昇華。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "成都",
                  "マカロン",
                  "パステルトーン",
                  "都市タペストリー"
            ]
      },
      ko: {
            title: "청두 · 마카롱 파스텔",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "마카롱 컬러 & 도시 토지 이용 계층",
            description: "부드러운 마카롱 파스텔 색조로 시각화한 청두 대도시권. 도시 기능 구역과 도로 위계를 따뜻하고 세련된 시각적 태피스트리로 변환.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "청두",
                  "마카롱",
                  "파스텔 톤",
                  "도시 태피스트리"
            ]
      }
},
    hangzhou_low_saturation: {
      en: {
            title: "Hangzhou · Muted Palette",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography",
            topic: "Muted Tones & West Lake Geography",
            description: "Low-saturation earthy tones framing Hangzhou, balancing West Lake, Qiantang River, and the canal network with subtle Eastern landscape sensibility.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Hangzhou",
                  "Muted Colors",
                  "West Lake",
                  "Qiantang River"
            ]
      },
      ja: {
            title: "杭州 · 低彩度トーン",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図",
            topic: "低彩度美学と西湖山水",
            description: "低彩度の落ち着いたアーストーンで杭州を描画。西湖、銭塘江、京杭大運河が織りなす東洋的な山水都市の調和を静かに表現。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "杭州",
                  "低彩度",
                  "西湖",
                  "銭塘江"
            ]
      },
      ko: {
            title: "항저우 · 저채도 뮤트 톤",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작",
            topic: "저채도 미학 & 서호 산수",
            description: "차분한 저채도 어스 톤으로 표현한 항저우의 도시 공간. 서호, 첸탕강, 대운하가 빚어내는 동양적 배산임수 조화를 정갈하게 묘사.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "항저우",
                  "저채도",
                  "서호",
                  "첸탕강"
            ]
      }
},
    wuhan_low_saturation: {
      en: {
            title: "Wuhan · Muted Palette",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Rivers Convergence & Urban Tri-towns",
            description: "Muted warm paper base and vintage brick-red roads depicting Wuhan: where the Yangtze and Han rivers intersect and divide Hankou, Hanyang, and Wuchang.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Wuhan",
                  "Muted Colors",
                  "Three Towns",
                  "Yangtze River",
                  "Han River"
            ]
      },
      ja: {
            title: "武漢 · 低彩度トーン",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "二大河川の合流と武漢三鎮",
            description: "ヴィンテージ感のある低彩度パレットで江城武漢を描画。長江と漢江の合流点が漢口・漢陽・武昌の三鎮を分かち、橋梁群がそれらを再び結びつける。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "武漢",
                  "低彩度",
                  "武漢三鎮",
                  "長江",
                  "漢江"
            ]
      },
      ko: {
            title: "우한 · 저채도 뮤트 톤",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "양대 강 합류 & 우한 삼진",
            description: "빈티지한 저채도 톤으로 묘사한 강의 도시 우한. 장강과 한강이 만나 한커우, 한양, 우창 삼진을 나누고 교량들이 하나로 잇는 역동적 지형.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "우한",
                  "저채도",
                  "우한 삼진",
                  "장강",
                  "한강"
            ]
      }
},
    pearl_river_delta_dot_art: {
      en: {
            title: "Pearl River Delta · Halftone Dot Art",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Halftone Aesthetics & Megalopolis Bay Area",
            description: "Halftone dot matrix art deconstructing the Pearl River Delta megalopolis: Guangzhou, Shenzhen, Hong Kong, Macao, and Zhuhai encircling the Lingdingyang bay.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Pearl River Delta",
                  "Halftone Dots",
                  "Greater Bay Area",
                  "Urban Cluster"
            ]
      },
      ja: {
            title: "珠江デルタ · ハーフトーンドットアート",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "ドットアートとベイエリア都市群",
            description: "伝統的な印刷ドット（網点）技法で珠江デルタ大都市圏を解体・再構築。伶仃洋を取り囲む広州、深圳、香港、マカオの緊密な湾岸ネットワークを表現。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "珠江デルタ",
                  "ドットアート",
                  "大湾区",
                  "メガロポリス"
            ]
      },
      ko: {
            title: "주강 삼각주 · 도트 하프트 아트",
            categoryName: "오리지널 지도",
            subCategory: "공간 형태학",
            topic: "하프톤 도트 & 베이 에어리어 메갈로폴리스",
            description: "인쇄 하프톤 도트 기법으로 시각화한 주강 삼각주 대도시군. 링딩양 만을 둘러싼 광저우, 선전, 홍콩, 마카오, 주하이의 초연결 네트워크를 묘사.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "주강 삼각주",
                  "도트 아트",
                  "웨강아오 대만구",
                  "메갈로폴리스"
            ]
      }
},
    suzhou_dot_art: {
      en: {
            title: "Suzhou · Lake Taihu Halftone Dot Art",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Halftone Water Aesthetics & Lake Taihu Urban Fabric",
            description: "Cyan halftone dots simulating the vast waters of Lake Taihu, bordered by red-brown capillary street networks with ancient Suzhou tucked into the northeast corner.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Suzhou",
                  "Lake Taihu",
                  "Halftone Dots",
                  "Water Town"
            ]
      },
      ja: {
            title: "蘇州 · 太湖ドットアート",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "ドット水文美学と太湖都市網",
            description: "シアンのドットマトリクスで太湖の雄大な水面を表現。赤褐色の毛細血管のような道路網が湖畔を縁取り、北東に佇む古都蘇州との山水関係を際立たせる。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "蘇州",
                  "太湖",
                  "ドットアート",
                  "水郷都市"
            ]
      },
      ko: {
            title: "쑤저우 · 타이후 도트 아트",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "도트 수문 미학 & 타이후 수변 도시망",
            description: "시안 하프톤 도트로 광활한 타이후 호수의 수면을 표현. 적갈색 모세혈관 도로망이 호숫가를 감싸고 북동쪽 고도 쑤저우와의 조화를 정밀 구성.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "쑤저우",
                  "타이후",
                  "도트 아트",
                  "수향 도시"
            ]
      }
},
    xian_papercut: {
      en: {
            title: "Xi'an · Papercut Aesthetic",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Papercut Relief & Ancient Gridiron",
            description: "Layered papercut relief centering on Xi'an's Ming Dynasty rectangular city wall, radiating outwards through concentric ring expressways in pristine planar symmetry.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Xi'an",
                  "Papercut",
                  "Ancient Capital",
                  "Gridiron Street Network"
            ]
      },
      ja: {
            title: "西安 · 切り絵アート",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "切り絵工芸と長安の碁盤目",
            description: "明代の長方形城壁を中心に据えたペーパーカット表現。同心円状に広がる環状高速道路と無限に連なる碁盤目街区が、平原古都の威厳ある秩序を示す。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "西安",
                  "切り絵",
                  "長安",
                  "碁盤目道路網"
            ]
      },
      ko: {
            title: "시안 · 페이퍼컷 아트",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "페이퍼컷 부조 & 격자형 가구 구조",
            description: "명나라 장방형 성벽을 중심으로 한 다층 페이퍼컷 부조. 동심원 환상 고속도로와 끝없이 뻗은 바둑판 격자가 평원 고도의 장엄한 질서를 완성.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "시안",
                  "페이퍼컷",
                  "고도 장안",
                  "바둑판 격자망"
            ]
      }
},
    chongqing_cyan: {
      en: {
            title: "Chongqing · Cyan River Tone",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Cyan Monotone & Mountain Peninsula",
            description: "A cool cyan interpretation of Chongqing's dramatic mountain-and-river terrain: deep cyan for the Yangtze and Jialing rivers, contrasting with crisp white road networks.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Chongqing",
                  "Cyan Aesthetic",
                  "Mountain City",
                  "Peninsula Fabric"
            ]
      },
      ja: {
            title: "重慶 · シアン水都トーン",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "シアン単色美学と山城半島",
            description: "澄んだ青緑のトーンで再解釈した重慶の山水地形。深青の長江・嘉陵江回廊と軽やかに浮かび上がる白色道路網が、瑞々しい都市の息吹を伝える。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "重慶",
                  "シアン美学",
                  "山城",
                  "半島テクスチャ"
            ]
      },
      ko: {
            title: "충칭 · 시안 리버 톤",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "시안 모노톤 & 산악 반도 형태학",
            description: "청량한 시안 블루 톤으로 재해석한 충칭의 산수 지형. 깊은 청록색 장강·자링강 회랑과 백색 도로망이 어우러져 청량하고 유기적인 호흡을 선사.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "충칭",
                  "시안 미학",
                  "산악 도시",
                  "반도 텍스처"
            ]
      }
},
    chongqing_black_gold: {
      en: {
            title: "Chongqing · Black & Gold",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Minimalist Black & Gold · Dark Aesthetic",
            description: "Chongqing under midnight skies: glowing gold road networks tracing high-density urban cliffs, while the Yangtze and Jialing rivers emerge as dramatic negative spaces.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Chongqing",
                  "Black & Gold",
                  "Dark Mode",
                  "Mountain Peninsula"
            ]
      },
      ja: {
            title: "重慶 · 黒金美学",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "極簡黒金美学 · ダークモード",
            description: "漆黒の夜空に浮かび上がる重慶。黄金色に発光する道路網が険しい山腹を駆け巡り、長江と嘉陵江がネガティブスペースとして立体的に浮かび上がる。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "重慶",
                  "黒金",
                  "ダークモード",
                  "山城半島"
            ]
      },
      ko: {
            title: "충칭 · 블랙 & 골드",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "미니멀 블랙 & 골드 · 다크 미학",
            description: "칠흑 같은 밤하늘에 빛나는 충칭의 골드 로드 네트워크. 험준한 산악 지형을 타고 흐르는 금빛 선과 음각으로 드러난 장강·자링강의 강렬한 대비.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "충칭",
                  "블랙&골드",
                  "다크 미학",
                  "산악 반도"
            ]
      }
},
    changsha_emboss: {
      en: {
            title: "Changsha · Tactile Neumorphic Relief",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Spatial Morphology",
            topic: "Neumorphism & Tactile River Topology",
            description: "Neumorphic soft-shadow relief styling Changsha's riverfront: gentle paper embossment lifting the urban fabric along the Xiang River and Juzizhou islet.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Changsha",
                  "Neumorphism",
                  "Emboss Relief",
                  "Xiang River",
                  "Juzizhou"
            ]
      },
      ja: {
            title: "長沙 · ニューモーフィズム浮彫",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · 空間形態論",
            topic: "ニューモーフィズムと触覚的河川地形",
            description: "柔らかな陰影を伴うニューモーフィズム手法で長沙を描出。湘江両岸の市街地、川中島の橘子洲、岳麓山がまるで触れられるような立体浮彫として広がる。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "長沙",
                  "ニューモーフィズム",
                  "浮彫",
                  "湘江",
                  "橘子洲"
            ]
      },
      ko: {
            title: "창사 · 뉴모피즘 음영 부조",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 공간 형태학",
            topic: "뉴모피즘 & 촉각적 하천 지형",
            description: "부드러운 음영의 뉴모피즘 기법으로 표현한 창사의 수변 공간. 샹강 양안의 도로망과 강 한가운데 쥐쯔저우 섬이 손에 만져질 듯한 입체 부조로 구현.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "창사",
                  "뉴모피즘",
                  "음영 부조",
                  "샹강",
                  "쥐쯔저우"
            ]
      }
},
    tianfu_luxihe_xinglong_lake: {
      en: {
            title: "Tianfu Park & Luxihe River (Xinglong Lake)",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Engineering",
            topic: "Park City Greenway & WonderRide Route",
            description: "Soft green ground overlaid with bright magenta loops showcasing the WonderRide cycling circuit in Tianfu New Area, linking Tianfu Park, Luxihe wetlands, and Xinglong Lake.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Tianfu New Area",
                  "Xinglong Lake",
                  "Greenway Engineering",
                  "Cycling Circuit"
            ]
      },
      ja: {
            title: "天府公園 · 鹿渓河（興隆湖）",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · エンジニアリング作図",
            topic: "公園都市緑道とサイクリングルート",
            description: "淡い緑の背景に鮮やかなマゼンタのループを描き、天府新区のWonderRideサイクリングコースを可視化。天府公園、鹿渓河湿地、興隆湖を結ぶ水緑ネットワーク。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "天府新区",
                  "興隆湖",
                  "緑道工学",
                  "サイクリングルート"
            ]
      },
      ko: {
            title: "톈푸 공원 루시허 (싱룽호)",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 엔지니어링 지도 제작",
            topic: "공원 도시 녹도 & 원더라이드 코스",
            description: "연녹색 배경 위 경쾌한 핑크색 루프로 구현한 톈푸 신구 WonderRide 라이딩 노선. 톈푸 공원, 루시허 습지 및 싱룽호를 잇는 생태 회랑을 표현.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "톈푸 신구",
                  "싱룽호",
                  "녹도 공학",
                  "라이딩 코스"
            ]
      }
},
    chengdu_greenway_ring: {
      en: {
            title: "Chengdu Greenway Ring (100km)",
            categoryName: "Original Cartography",
            subCategory: "Artistic Cartography & Engineering",
            topic: "Ecological Greenway Loop & Milestone Mapping",
            description: "A 100-kilometer closed-loop ecological greenway encircling Chengdu: featuring 20 dual-directional milestone stations mapped in crisp magenta along ring parks.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Chengdu",
                  "Greenway Ring",
                  "100km Loop",
                  "Milestones",
                  "Cycling"
            ]
      },
      ja: {
            title: "成都環城緑道（100km環状ルート）",
            categoryName: "オリジナル地図",
            subCategory: "芸術的地図作図 · エンジニアリング作図",
            topic: "環状生態緑道とマイルストーン測量",
            description: "成都市街地を完全に一周する100kmの生態緑道ループ。20箇所の双方向マイルストーンを配し、都市を取り囲む巨大な緑の環状インフラを明快に描く。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "成都",
                  "環城緑道",
                  "100kmループ",
                  "マイルストーン",
                  "サイクリング"
            ]
      },
      ko: {
            title: "청두 환청 녹도 (100km 순환선)",
            categoryName: "오리지널 지도",
            subCategory: "예술적 지도 제작 · 엔지니어링 지도 제작",
            topic: "환상 생태 녹도 & 이정표 매핑",
            description: "청두 도심을 완벽하게 일주하는 100km 폐곡선 생태 녹도. 20개 양방향 이정표 스테이션을 명쾌한 핑크 라인으로 시각화한 녹도 공학의 정수.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "청두",
                  "환청 녹도",
                  "100km 순환",
                  "이정표",
                  "사이클링"
            ]
      }
},
    longquanshan_slope_a: {
      en: {
            title: "Longquanshan Mountain · Slope A",
            categoryName: "Original Cartography",
            subCategory: "Spatial Morphology & Engineering",
            topic: "Hill Climb Profile & Elevation Contours",
            description: "The western climbing route of Longquanshan mountain: 7.7 km climb ascending from 497m to 804m, rendered with precise contour lines, hillshading, and hairpin curves.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Longquanshan",
                  "Hill Climb",
                  "Contour Lines",
                  "Hillshade",
                  "Elevation"
            ]
      },
      ja: {
            title: "龍泉山 · スロープA（西斜面登攀）",
            categoryName: "オリジナル地図",
            subCategory: "空間形態論 · エンジニアリング作図",
            topic: "ヒルクライム標高と等高線地形",
            description: "龍泉山西面の7.7kmヒルクライムルート。標高497mから804mへの登攀路を、高精度等高線と山体陰影暈渲、8箇所のヘアピンカーブ測点で記録。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "龍泉山",
                  "ヒルクライム",
                  "等高線",
                  "陰影起伏",
                  "標高"
            ]
      },
      ko: {
            title: "룽취안산 · 슬로프 A (서측 업힐)",
            categoryName: "오리지널 지도",
            subCategory: "공간 형태학 · 엔지니어링 지도 제작",
            topic: "힐클라임 표고 & 등고선 지형",
            description: "룽취안산 서측 7.7km 업힐 라이딩 코스. 표고 497m에서 804m 정상까지 이어지는 급경사 구간을 정밀 등고선과 헤어핀 커브 측점으로 기록.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "룽취안산",
                  "힐클라임",
                  "등고선",
                  "산체 음영",
                  "표고"
            ]
      }
},
    longquanshan_slope_b: {
      en: {
            title: "Longquanshan Mountain · Slope B",
            categoryName: "Original Cartography",
            subCategory: "Spatial Morphology",
            topic: "Mountain Descent & Topographic Relief",
            description: "The eastern descent of Longquanshan mountain: continuing from 804m summit down 9.7 km to Shijing Temple at 466m, completing the mountain pass profile.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, Poster Ratio",
            tags: [
                  "Longquanshan",
                  "Mountain Descent",
                  "Contour Lines",
                  "Topography"
            ]
      },
      ja: {
            title: "龍泉山 · スロープB（東斜面降下）",
            categoryName: "オリジナル地図",
            subCategory: "空間形態論",
            topic: "ダウンヒルルートと地形起伏",
            description: "スロープAの終点（標高804m）から東斜面を9.7km下り、標高466mの石経寺に至るダウンヒルコース。東西2枚の地図で龍泉山越えの全容が完成する。",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm、ポスター比率",
            tags: [
                  "龍泉山",
                  "ダウンヒル",
                  "等高線",
                  "地形起伏"
            ]
      },
      ko: {
            title: "룽취안산 · 슬로프 B (동측 다운힐)",
            categoryName: "오리지널 지도",
            subCategory: "공간 형태학",
            topic: "다운힐 루트 & 지형 기복",
            description: "슬로프 A의 종점(804m)에서 출발해 동쪽으로 9.7km 내려가 스징사에 이르는 다운힐 코스. A면과 B면이 결합되어 완전한 산악 횡단로를 완성.",
            author: "OpenQGIS",
            physicalSize: "15.0cm x 20.0cm, 포스터 비율",
            tags: [
                  "룽취안산",
                  "다운힐",
                  "등고선",
                  "지형 기복"
            ]
      }
},

    shanghai: {
      en: {
        title: 'Shanghai · Dark Fabric',
        categoryName: 'Original Cartography',
        subCategory: 'Urban Morphology',
        description: 'Deconstructing the central urban fabric of Shanghai through spatial morphology and a minimalist black-and-gold aesthetic. The dark substrate represents dense urbanized zones, while subtle tones trace the contours of the Huangpu River, Yangtze River, and the East China Sea. Golden strokes delineate the organic network of historic Puxi and the structured grid of Pudong, highlighting Chongming and Changxing islands.',
        author: 'OpenQGIS',
        physicalSize: '15.0cm x 20.0cm, Poster Ratio',
        tags: ['Urban Fabric', 'Vector Mapping', 'Shanghai', 'Black & Gold', 'Spatial Form']
      },
      ja: {
        title: '上海 · 暗夜のテクスチャ',
        categoryName: 'オリジナル地図',
        subCategory: '都市形態論',
        description: '空間形態学の手法を用い、黒と金のミニマルな対比で上海中心部の道路網テクスチャを解体・再構築。黒い基底は高密度の市街化区域を表し、繊細なトーンが黄浦江、長江、東シナ海の水系輪郭を描き出す。黄金色のラインが浦西の歴史的道路網と浦東の近代グリッドを鮮やかに描き分ける。',
        author: 'OpenQGIS',
        physicalSize: '15.0cm x 20.0cm、ポスター比率',
        tags: ['都市形態', 'ベクター作図', '上海', '黒金美学', '空間形態']
      },
      ko: {
        title: '상하이 · 암야의 텍스처',
        categoryName: '오리지널 지도',
        subCategory: '도시 형태학',
        description: '공간 형태학적 방법을 활용하여 블랙과 골드의 미니멀한 대비로 상하이 중심 도시의 도로망 텍스처를 해체 및 재구성. 어두운 배경은 고밀도 도시 개발 구역을 상징하며, 섬세한 톤이 황푸강, 장강, 동중국해의 수계를 정밀하게 표현함.',
        author: 'OpenQGIS',
        physicalSize: '15.0cm x 20.0cm, 포스터 비율',
        tags: ['도시 형태', '벡터 지도 제작', '상하이', '블랙&골드', '공간 형태']
      }
    },
    city_papercut_14pro: {
      en: {
        title: 'Chengdu Papercut · 14Pro',
        categoryName: 'Original Cartography',
        subCategory: 'Urban Morphology',
        description: 'Distilling the urban density and morphological evolution of Chengdu along its north-south axis. Rendered on warm textured paper, minimalist vector strokes trace the concentric ring roads and radial corridors, highlighting the winding Jinjiang River corridor and Tianfu New Area lakes in an elongated panoramic scroll.',
        author: 'OpenQGIS',
        physicalSize: '9.9 x 21.4cm',
        tags: ['Urban Fabric', 'Chengdu Axis', 'Tianfu New Area', 'Jinjiang Ecology']
      },
      ja: {
        title: '成都切り絵 · 14Pro',
        categoryName: 'オリジナル地図',
        subCategory: '都市形態論',
        description: '空間形態学の手法で成都の南北都市軸における建築密度と都市テクスチャの変遷を抽出。温かみのある和紙風の質感の上に、ミニマルなベクターラインで環状線と放射状道路網を描出。',
        author: 'OpenQGIS',
        physicalSize: '9.9 x 21.4cm',
        tags: ['都市テクスチャ', '成都軸', '天府新区', 'ミニマル地図']
      },
      ko: {
        title: '청두 종이공예 · 14Pro',
        categoryName: '오리지널 지도',
        subCategory: '도시 형태학',
        description: '공간 형태학적 기법을 통해 청두 남북 도시 축의 건축 밀도와 도시 텍스처 변화를 추출. 따뜻한 종이 질감 배경 위에 미니멀한 벡터 라인으로 순환 도로망과 방사형 도로를 섬세하게 표현.',
        author: 'OpenQGIS',
        physicalSize: '9.9 x 21.4cm',
        tags: ['도시 텍스처', '청두 중심축', '톈푸신구', '미니멀 지도']
      }
    },
    chengdu_papercut_ipad: {
      en: {
        title: 'Chengdu Papercut · iPad Pro',
        categoryName: 'Original Cartography',
        subCategory: 'Laser Papercut',
        description: 'Merging spatial morphology with traditional Chinese papercut aesthetics and laser-engraving craftsmanship. This artwork renders micron-level filigree detailing Chengdu\'s concentric ring roads and historic dual rivers, balancing ancient street networks with modern geometric tension in the southern tech district.',
        author: 'OpenQGIS',
        physicalSize: '20.0cm x 28.0cm (iPad Ratio)',
        tags: ['Laser Papercut', 'Morphology', 'Chengdu', 'Precision Craft', 'Hydrology & Roads']
      },
      ja: {
        title: '成都切り絵 · iPad Pro',
        categoryName: 'オリジナル地図',
        subCategory: 'レーザーカット切り絵',
        description: '空間形態学と中国伝統の切り絵芸術、レーザー彫刻の工芸美学を融合。成都の環状道路網と歴史的な二重河川をミクロン単位の繊細なラインで表現。',
        author: 'OpenQGIS',
        physicalSize: '20.0cm x 28.0cm (iPad 比率)',
        tags: ['切り絵', '形態論', '成都', '精密工芸', '水系と道路']
      },
      ko: {
        title: '청두 종이공예 · iPad Pro',
        categoryName: '오리지널 지도',
        subCategory: '레이저 커팅 페이퍼아트',
        description: '공간 형태학과 중국 전통 종이공예, 레이저 각인 공예 미학을 융합. 청두의 순환 도로망과 역사적인 하천 수계를 마이크론 단위의 정밀한 선으로 구현.',
        author: 'OpenQGIS',
        physicalSize: '20.0cm x 28.0cm (iPad 비율)',
        tags: ['페이퍼아트', '형태학', '청두', '정밀 공예', '수계와 도로']
      }
    },
    layout_pattern_02: {
      en: {
        title: 'Layout Paradigm 02 · Spatial Schema',
        categoryName: 'Original Cartography',
        subCategory: 'Spatial Schema',
        description: 'A cartographic layout study rooted in spatial syntax and modern grid composition principles. Using a calibrated modular grid system, this specimen explores dynamic balance between primary map extents, overviews, symbology, and balanced negative space.',
        author: 'OpenQGIS',
        physicalSize: '21.0cm x 29.7cm (A4)',
        tags: ['Layout Design', 'Spatial Schema', 'Grid System', 'Minimalist Mapping']
      },
      ja: {
        title: 'レイアウト規範02 · 空間スキーマ',
        categoryName: 'オリジナル地図',
        subCategory: '空間スキーマ',
        description: '空間統語論と近代グリッド構成原則に基づいた地図レイアウト研究。厳密なモジュラーグリッドシステムにより、主図・副図・記号と余白の動的均衡を探求。',
        author: 'OpenQGIS',
        physicalSize: '21.0cm x 29.7cm (A4)',
        tags: ['レイアウト設計', '空間スキーマ', 'グリッドシステム', 'ミニマル作図']
      },
      ko: {
        title: '레이아웃 표준 02 · 공간 스키마',
        categoryName: '오리지널 지도',
        subCategory: '공간 스키마',
        description: '공간 구문론과 현대 그리드 구성 원리에 기반한 지도 레이아웃 연구. 정밀한 모듈형 그리드 시스템을 통해 주 지도와 색인도, 기호 및 여백 간의 역동적 균형을 탐색.',
        author: 'OpenQGIS',
        physicalSize: '21.0cm x 29.7cm (A4)',
        tags: ['레이아웃 디자인', '공간 스키마', '그리드 시스템', '미니멀 지도']
      }
    },
    jinjiang_greenway_section: {
      en: {
        title: 'Jinjiang Greenway Section · Huanglongxi',
        categoryName: 'Original Cartography',
        subCategory: 'Greenway Elevation',
        description: 'An architectural and environmental section elevation visualizing the ecological corridor of the Jinjiang Greenway through historic Huanglongxi. Combining high-resolution DEM data and spatial cross-section algorithms to portray riverbed gradients, riparian forests, and heritage settlement typologies.',
        author: 'OpenQGIS',
        physicalSize: '120.0cm x 30.0cm, Panorama Scroll',
        tags: ['Greenway Elevation', 'Section Profile', 'Huanglongxi', 'DEM', 'Riparian Ecology']
      },
      ja: {
        title: '錦江緑道断面図 · 黄龍渓',
        categoryName: 'オリジナル地図',
        subCategory: '緑道標高断面',
        description: '歴史ある黄龍渓を通過する錦江緑道のエコロジカル回廊を可視化した建築環境断面図。高解像度DEMデータと断面アルゴリズムを組み合わせ、河床勾配や河畔林、集落景観を立体的に表現。',
        author: 'OpenQGIS',
        physicalSize: '120.0cm x 30.0cm、パノラマ巻軸',
        tags: ['緑道標高', '断面プロファイル', '黄龍渓', 'DEM', '河畔生態']
      },
      ko: {
        title: '진장 녹도 단면도 · 황룽시',
        categoryName: '오리지널 지도',
        subCategory: '녹도 단면 고도',
        description: '유서 깊은 황룽시를 통과하는 진장 녹도의 생태 통로를 시각화한 건축 및 환경 단면도. 고해상도 DEM 데이터와 공간 단면 알고리즘을 결합하여 하상 경사와 수변 숲, 전통 취락 형태를 표현.',
        author: 'OpenQGIS',
        physicalSize: '120.0cm x 30.0cm, 파노라마 두루마리',
        tags: ['녹도 고도', '단면 프로파일', '황룽시', 'DEM', '수변 생태']
      }
    },
    pinglu_canal: {
      en: {
        title: 'Pinglu Canal · Cyberpunk Dark Fabric',
        categoryName: 'Original Cartography',
        subCategory: 'Engineering & Morphology',
        description: 'A dark-mode cyberpunk GIS visualization of the Pinglu Canal project in Guangxi. Over a deep black terrain substrate, glowing amber and golden contour lines delineate the rugged mountain ridges and gorges. A prominent crimson corridor traces the primary canal navigation route, highlighted with zebra-striped patterning across the active excavation segments.',
        author: 'OpenQGIS',
        physicalSize: '15.0cm x 20.0cm, Panorama Scroll',
        tags: ['Data Visualization', 'Topographic Contours', 'Dark Aesthetics', 'Glowing Vector', 'Pinglu Canal']
      },
      ja: {
        title: '平陸運河 · サイバーパンク暗夜テクスチャ',
        categoryName: 'オリジナル地図',
        subCategory: '土木工学と形態論',
        description: '広西チワン族自治区の平陸運河プロジェクトをサイバーパンク風のGIS視覚言語で表現。深みのある漆黒の地形基底に、輝くアンバーとゴールドの等高線が険しい山脈と渓谷を描き出す。',
        author: 'OpenQGIS',
        physicalSize: '15.0cm x 20.0cm、パノラマ巻軸',
        tags: ['データ可視化', '地形等高線', 'ダークモード', '発光ベクター', '平陸運河']
      },
      ko: {
        title: '핑루 운하 · 사이버펑크 암야 텍스처',
        categoryName: '오리지널 지도',
        subCategory: '엔지니어링 & 형태학',
        description: '광시 핑루 운하 프로젝트를 사이버펑크 풍의 GIS 시각화로 구현. 깊은 흑색 지형 배경 위에 빛나는 앰버와 골드 등고선이 산맥과 협곡의 지형을 정밀하게 표현함.',
        author: 'OpenQGIS',
        physicalSize: '15.0cm x 20.0cm, 파노라마 두루마리',
        tags: ['데이터 시각화', '지형 등고선', '다크 미학', '글로우 벡터', '핑루 운하']
      }
    }
  };

  const VALID_LANGS = ['zh', 'en', 'ja', 'ko'];
  const HTML_LANG_MAP = { zh: 'zh-CN', en: 'en', ja: 'ja', ko: 'ko' };
  const LANG_SHORT_LABELS = { zh: '中', en: 'EN', ja: '日', ko: '한' };

  // Determine initial language:
  // 1. URL search param (?lang=zh|en|ja|ko)
  // 2. localStorage
  // 3. navigator.language (zh/ja/ko -> respective, otherwise en)
  function detectInitialLanguage() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && VALID_LANGS.includes(urlLang)) {
      return urlLang;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID_LANGS.includes(saved)) {
      return saved;
    }

    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ko')) return 'ko';
    return 'en';
  }

  let currentLang = detectInitialLanguage();

  function setLanguage(lang) {
    if (!VALID_LANGS.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = HTML_LANG_MAP[lang] || 'zh-CN';
    
    // Update all elements with data-i18n
    updateDOMTranslations();

    // Dispatch custom event for app.js to re-render dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function toggleLanguage() {
    const idx = VALID_LANGS.indexOf(currentLang);
    const nextLang = VALID_LANGS[(idx + 1) % VALID_LANGS.length];
    setLanguage(nextLang);
  }

  function t(key) {
    const dict = UI_STRINGS[currentLang] || UI_STRINGS.zh;
    return dict[key] || UI_STRINGS.zh[key] || key;
  }

  function getLocalizedItem(item) {
    if (!item) return item;
    if (currentLang === 'zh') return item;

    const artworkTrans = ARTWORK_TRANSLATIONS[item.id] || {};
    const translation = artworkTrans[currentLang] || artworkTrans.en || {};
    return Object.assign({}, item, {
      title: translation.title || item.title,
      categoryName: translation.categoryName || item.categoryName,
      subCategory: translation.subCategory || item.subCategory,
      topic: translation.topic || item.topic,
      description: translation.description || item.description,
      descriptionHtml: null,
      physicalSize: translation.physicalSize || item.physicalSize,
      tags: translation.tags || item.tags
    });
  }

  function updateDOMTranslations() {
    // 1. Title
    document.title = t('siteTitle');

    // 2. data-i18n text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (text) el.textContent = text;
    });

    // 3. data-i18n-html for elements with innerHTML
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const html = t(key);
      if (html) el.innerHTML = html;
    });

    // 4. data-i18n-title for attributes (免除底栏按钮原生 title 避免与高质感自定义气泡双重触发)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const title = t(key);
      if (title) {
        if (el.closest('.viewer-modal') || el.closest('.viewer-container') || el.closest('.viewer-floating-toolbar') || el.closest('.viewer-top-actions') || el.closest('#dockTooltip') || el.closest('#topTooltip') || el.closest('.viewer-artwork-badge') || el.closest('.viewer-edge-nav') || el.hasAttribute('data-custom-tip')) {
          el.dataset.customTip = title;
          el.removeAttribute('title');
        } else {
          el.title = title;
        }
      }
    });

    // 5. Update Lang toggle / dropdown indicators
    const shortLabel = LANG_SHORT_LABELS[currentLang] || '中';
    document.querySelectorAll('#currentLangLabel, #viewerCurrentLangLabel, .lang-current-label').forEach(el => {
      el.textContent = shortLabel;
    });

    document.querySelectorAll('#btnLangDropdown, #viewerBtnLangDropdown, #toolToggleLang').forEach(btn => {
      btn.dataset.customTip = t('langSelectTitle');
      btn.removeAttribute('title');
    });

    document.querySelectorAll('.lang-dropdown-item').forEach(item => {
      const itemLang = item.getAttribute('data-lang');
      item.classList.toggle('active', itemLang === currentLang);
    });
  }

  const SUPPORTED_LANGUAGES = [
    { code: 'zh', name: '简体中文', short: '中' },
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'ja', name: '日本語', short: '日' },
    { code: 'ko', name: '한국어', short: '한' }
  ];

  // Pre-set document.documentElement.lang before paint
  document.documentElement.lang = HTML_LANG_MAP[currentLang] || 'zh-CN';

  window.AtlasI18n = {
    detect: detectInitialLanguage,
    getLang: getLanguage,
    getCurrentLang: getLanguage,
    setLang: setLanguage,
    toggle: toggleLanguage,
    t: t,
    getItem: getLocalizedItem,
    updateDOM: updateDOMTranslations,
    languages: SUPPORTED_LANGUAGES,
    STRINGS: UI_STRINGS
  };
})();
