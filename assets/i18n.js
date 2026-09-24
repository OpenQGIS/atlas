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
      navPortalTitle: '浏览 OpenQGIS 空间体系定位大厅',
      navCabinetTitle: '《珍奇柜 · 空间制图藏录》共享精选库',
      navGalleryTitle: '《Gallery · 典藏画廊》聚合大厅',
      navThemeToggle: '切换主题模式',
      navLangToggle: 'English',
      navLangTitle: '切换语言 / Switch Language',
      filterAll: '全部成果',
      filterWide: '横幅画卷',
      filterTall: '条屏竖幅',
      actionZoom: '深览',
      actionClose: '退出阅览 (Esc)',
      actionPrev: '上一卷 (←)',
      actionNext: '下一卷 (→)',
      actionToggleInfo: '作品档案与色板 (I)',
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
      shareOptPoster: '分享竖版海报加二维码',
      shareOptPosterDesc: '生成 3:4 典藏海报与专属码',
      shareQrTitle: '扫码深览画卷',
      shareQrSaveBtn: '保存二维码图片',
      sharePosterTitle: '3:4 展卷典藏海报',
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
      metaDrawerTitle: '作品档案与调色板',
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
      metaNavNotes: '工造题记',
      emptyFilter: '当前筛选条件下暂无收录成果',
      heroSlogan: '<span class="hero-title-chunk">一图一境</span><span class="hero-title-sep"> · </span><span class="hero-title-chunk">静观其详</span>',
      heroSubslogan: '<span class="hero-sub-chunk">地图录</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS 制图作品集</span>',
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
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.'
    },
    en: {
      siteTitle: 'AtlasLog · OpenQGIS Cartography Portfolio',
      brandTitle: '<span class="brand-title-main">AtlasLog</span>',
      brandSubtitle: 'Personal Cartography · Recording the Limits of QGIS',
      navAbout: 'About',
      navCabinet: 'Cabinet',
      navGallery: 'Gallery',
      navAboutTitle: 'About AtlasLog & Cartographic Vision',
      navPortalTitle: 'Explore OpenQGIS Geospatial Ecosystem Portal',
      navCabinetTitle: 'Cabinet · Curated Geospatial Library',
      navGalleryTitle: 'Gallery · Central Showcase Portal',
      navThemeToggle: 'Toggle Theme',
      navLangToggle: '中文',
      navLangTitle: 'Switch Language / 切换语言',
      filterAll: 'All Works',
      filterWide: 'Landscape',
      filterTall: 'Portrait',
      actionZoom: 'Explore',
      actionClose: 'Close Viewer (Esc)',
      actionPrev: 'Previous (←)',
      actionNext: 'Next (→)',
      actionToggleInfo: 'Archive & Palette (I)',
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
      shareOptPoster: 'Portrait Poster & QR',
      shareOptPosterDesc: 'Generate 3:4 poster with QR code',
      shareQrTitle: 'Scan to Deep Zoom',
      shareQrSaveBtn: 'Save QR Image',
      sharePosterTitle: '3:4 Artwork Poster',
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
      metaDrawerTitle: 'Archive & Palette',
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
      metaNavNotes: 'Notes & Details',
      emptyFilter: 'No artworks found under current filter',
      heroSlogan: '<span class="hero-title-chunk">One Map, One Realm</span><span class="hero-title-sep"> · </span><span class="hero-title-chunk">Contemplate the Nuance</span>',
      heroSubslogan: '<span class="hero-sub-chunk">AtlasLog</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS Cartography Portfolio</span>',
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
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.'
    },
    ja: {
      siteTitle: '地図録 OpenQGIS地図作品集',
      brandTitle: '<span class="brand-title-main">地図録</span><span class="brand-title-sub"> · AtlasLog</span>',
      brandSubtitle: '個人の作図実践 · QGISの能力の限界を記録する',
      navAbout: '概要',
      navCabinet: '驚異の部屋',
      navGallery: '統合ギャラリー',
      navAboutTitle: '『地図録』のコンセプトと解説を見る',
      navPortalTitle: 'OpenQGIS 空間体系ポータルへ',
      navCabinetTitle: '『驚異の部屋 · 空間地図アーカイブ』コレクション',
      navGalleryTitle: '『Gallery · 典蔵ギャラリー』',
      navThemeToggle: 'テーマの切り替え',
      navLangToggle: '日本語',
      navLangTitle: '言語を切り替える / Switch Language',
      filterAll: 'すべての作品',
      filterWide: '横パノラマ',
      filterTall: '縦掛軸',
      actionZoom: '詳細表示',
      actionClose: '閉じる (Esc)',
      actionPrev: '前の作品 (←)',
      actionNext: '次の作品 (→)',
      actionToggleInfo: '作品アーカイブとパレット (I)',
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
      shareOptPoster: '縦型ポスターとQRコード',
      shareOptPosterDesc: '3:4 コレクションポスターとQRコードを生成',
      shareQrTitle: 'QRコードで作品を閲覧',
      shareQrSaveBtn: 'QRコード画像を保存',
      sharePosterTitle: '3:4 展覧コレクションポスター',
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
      metaDrawerTitle: '作品アーカイブとカラーパレット',
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
      metaNavNotes: '制作ノート',
      emptyFilter: '該当する作品がありません',
      heroSlogan: '<span class="hero-title-chunk">一図一境</span><span class="hero-title-sep"> · </span><span class="hero-title-chunk">静観其詳</span>',
      heroSubslogan: '<span class="hero-sub-chunk">地図録</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS 地図作品集</span>',
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
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.'
    },
    ko: {
      siteTitle: '지도록 OpenQGIS 지도 작품집',
      brandTitle: '<span class="brand-title-main">지도록</span><span class="brand-title-sub"> · AtlasLog</span>',
      brandSubtitle: '개인 지도 제작 실천 · QGIS의 한계를 기록하다',
      navAbout: '소개',
      navCabinet: '호기심의 캐비닛',
      navGallery: '통합 갤러리',
      navAboutTitle: '《지도록》 기획 의도 및 설명 보기',
      navPortalTitle: 'OpenQGIS 공간 체계 포털 탐색',
      navCabinetTitle: '《호기심의 캐비닛 · 공간 지도 아카이브》 컬렉션',
      navGalleryTitle: '《Gallery · 컬렉션 갤러리》',
      navThemeToggle: '테마 모드 전환',
      navLangToggle: '한국어',
      navLangTitle: '언어 전환 / Switch Language',
      filterAll: '전체 작품',
      filterWide: '가로 파노라마',
      filterTall: '세로 족자형',
      actionZoom: '상세 보기',
      actionClose: '닫기 (Esc)',
      actionPrev: '이전 작품 (←)',
      actionNext: '다음 작품 (→)',
      actionToggleInfo: '작품 아카이브 및 팔레트 (I)',
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
      shareOptPoster: '세로형 포스터 및 QR 코드',
      shareOptPosterDesc: '3:4 소장용 포스터 및 QR 코드 생성',
      shareQrTitle: 'QR 코드로 작품 보기',
      shareQrSaveBtn: 'QR 코드 이미지 저장',
      sharePosterTitle: '3:4 소장용 전시 포스터',
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
      metaDrawerTitle: '작품 기록 및 색상 팔레트',
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
      metaNavNotes: '제작 노트',
      emptyFilter: '해당 조건의 작품이 없습니다',
      heroSlogan: '<span class="hero-title-chunk">一圖一境</span><span class="hero-title-sep"> · </span><span class="hero-title-chunk">靜觀其詳</span>',
      heroSubslogan: '<span class="hero-sub-chunk">지도록</span><span class="hero-sub-sep"> · </span><span class="hero-sub-chunk">OpenQGIS 지도 작품집</span>',
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
      footerCopyrightLine: '© 2026 OpenQGIS / AtlasLog. All Rights Reserved.'
    }
  };

  const ARTWORK_TRANSLATIONS = {
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
      description: translation.description || item.description,
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

    // 4. data-i18n-title for attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const title = t(key);
      if (title) el.title = title;
    });

    // 5. Update Lang toggle / dropdown indicators
    const shortLabel = LANG_SHORT_LABELS[currentLang] || '中';
    document.querySelectorAll('#currentLangLabel, #viewerCurrentLangLabel, .lang-current-label').forEach(el => {
      el.textContent = shortLabel;
    });

    document.querySelectorAll('#btnLangDropdown, #viewerBtnLangDropdown, #toolToggleLang').forEach(btn => {
      btn.title = t('langSelectTitle');
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
    setLang: setLanguage,
    toggle: toggleLanguage,
    t: t,
    getItem: getLocalizedItem,
    updateDOM: updateDOMTranslations,
    languages: SUPPORTED_LANGUAGES,
    STRINGS: UI_STRINGS
  };
})();
