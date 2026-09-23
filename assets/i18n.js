/**
 * AtlasLog · 国际化多语言引擎 (i18n Engine)
 * 支持中英文即时无缝切换、本地环境智能探测与持久化记忆
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'atlas_language_preference';

  const UI_STRINGS = {
    zh: {
      siteTitle: '地图录 OpenQGIS制图作品集',
      brandTitle: '地图录 · AtlasLog',
      brandSubtitle: '个人制图实践 · QGIS 能力边界的记录',
      navAbout: '关于',
      navCabinet: '珍奇柜',
      navGallery: '聚合总览',
      navAboutTitle: '查看《地图录》案名定位与说明',
      navCabinetTitle: '《珍奇柜 · 空间制图藏录》共享精选库',
      navGalleryTitle: '《Gallery · 典藏画廊》聚合大厅',
      navThemeToggle: '切换主题模式',
      navLangToggle: 'English',
      navLangTitle: 'Switch to English / 切换至英文',
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
      aboutTag: '一图一境 · 静观其详',
      aboutSubtag: 'OpenQGIS 制图作品集',
      aboutTitle: '《地图录》· AtlasLog',
      aboutSubtitle: '个人制图实践，亦是 QGIS 能力边界的记录。',
      aboutDesc: '这里汇集多年来用 QGIS 亲手制作的地图作品。每一幅既是独立完成的视觉表达，也是对 QGIS 制图能力边界的探索与验证。<br/><br/>作品采用 1:1 4K 物理像素无损深览，探索 QGIS 制图表现力的极致细节与空间形态美学。',
      aboutClose: '关闭',
      metaDrawerTitle: '作品档案与调色板',
      metaCategory: '类目归属',
      metaAuthor: '制作者',
      metaPhysicalSize: '原生尺寸',
      metaRatio: '长宽比例',
      metaPaletteTitle: '主调色板萃取',
      metaPaletteExtracting: '提取中...',
      metaPaletteEmpty: '暂无色彩数据',
      metaPaletteCopied: '已复制!',
      metaPaletteHint: '点击复制色彩 ',
      metaNotesTitle: '工造题记与说明',
      emptyFilter: '当前筛选条件下暂无收录成果',
      heroSlogan: '一图一境 · 静观其详',
      heroSubslogan: '地图录 · AtlasLog · OpenQGIS 制图作品集',
      heroDesc: '个人制图实践 · QGIS 能力边界的记录',
      heroScroll: '向下探索',
      heroBgArtwork: '背景展卷',
      badgeNew: 'NEW',
      badgeNewAria: '近3个月新作',
      langSelectTitle: '切换语言 / Switch Language'
    },
    en: {
      siteTitle: 'AtlasLog · OpenQGIS Cartography Portfolio',
      brandTitle: 'AtlasLog',
      brandSubtitle: 'Personal Cartography · Recording the Limits of QGIS',
      navAbout: 'About',
      navCabinet: 'Cabinet',
      navGallery: 'Gallery',
      navAboutTitle: 'About AtlasLog & Cartographic Vision',
      navCabinetTitle: 'Cabinet · Curated Geospatial Library',
      navGalleryTitle: 'Gallery · Central Showcase Portal',
      navThemeToggle: 'Toggle Theme',
      navLangToggle: '中文',
      navLangTitle: 'Switch to Chinese / 切换至中文',
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
      aboutTag: 'One Map, One Realm · Contemplate the Nuance',
      aboutSubtag: 'OpenQGIS Cartography Portfolio',
      aboutTitle: 'AtlasLog',
      aboutSubtitle: 'Personal cartographic practice, recording the upper limits of QGIS.',
      aboutDesc: 'A curated collection of maps handcrafted over the years with QGIS. Each piece stands as an independent visual expression and an exploration of the boundaries of QGIS cartography.<br/><br/>Rendered in 1:1 4K physical pixel lossless deep zoom to inspect spatial morphology and fine cartographic details.',
      aboutClose: 'Close',
      metaDrawerTitle: 'Archive & Palette',
      metaCategory: 'Category',
      metaAuthor: 'Author',
      metaPhysicalSize: 'Physical Size',
      metaRatio: 'Aspect Ratio',
      metaPaletteTitle: 'Dominant Color Palette',
      metaPaletteExtracting: 'Extracting...',
      metaPaletteEmpty: 'No color data',
      metaPaletteCopied: 'Copied!',
      metaPaletteHint: 'Click to copy color ',
      metaNotesTitle: 'Notes & Description',
      footerCopyright: '《AtlasLog · OpenQGIS Cartography Portfolio》· Copyright © 2026 OpenQGIS / Atlas · Unauthorized reproduction prohibited',
      emptyFilter: 'No artworks found under current filter',
      heroSlogan: 'One Map, One Realm · Contemplate the Nuance',
      heroSubslogan: 'AtlasLog · OpenQGIS Cartography Portfolio',
      heroDesc: 'Personal Cartography · Recording the Limits of QGIS',
      heroScroll: 'Scroll to Explore',
      heroBgArtwork: 'Featured Map',
      badgeNew: 'NEW',
      badgeNewAria: 'Recent Artwork',
      langSelectTitle: 'Switch Language / 切换语言'
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
      }
    }
  };

  // Determine initial language:
  // 1. URL search param (?lang=en or ?lang=zh)
  // 2. localStorage
  // 3. navigator.language (if zh -> zh, otherwise en)
  function detectInitialLanguage() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && (urlLang === 'zh' || urlLang === 'en')) {
      return urlLang;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'zh' || saved === 'en')) {
      return saved;
    }

    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    return 'en';
  }

  let currentLang = detectInitialLanguage();

  function setLanguage(lang) {
    if (lang !== 'zh' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = (lang === 'zh' ? 'zh-CN' : 'en');
    
    // Update all elements with data-i18n
    updateDOMTranslations();

    // Dispatch custom event for app.js to re-render dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function toggleLanguage() {
    setLanguage(currentLang === 'zh' ? 'en' : 'zh');
  }

  function t(key) {
    const dict = UI_STRINGS[currentLang] || UI_STRINGS.zh;
    return dict[key] || UI_STRINGS.zh[key] || key;
  }

  function getLocalizedItem(item) {
    if (!item) return item;
    if (currentLang === 'zh') return item;

    const translation = (ARTWORK_TRANSLATIONS[item.id] && ARTWORK_TRANSLATIONS[item.id].en) || {};
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
    const currentLangLabel = document.getElementById('currentLangLabel');
    if (currentLangLabel) {
      currentLangLabel.textContent = currentLang === 'zh' ? '中' : 'EN';
    }
    const langBtn = document.getElementById('btnLangDropdown') || document.getElementById('btnToggleLang');
    if (langBtn) {
      langBtn.title = t('langSelectTitle');
    }
    document.querySelectorAll('.lang-dropdown-item').forEach(item => {
      const itemLang = item.getAttribute('data-lang');
      item.classList.toggle('active', itemLang === currentLang);
    });
  }

  const SUPPORTED_LANGUAGES = [
    { code: 'zh', name: '简体中文', short: '中' },
    { code: 'en', name: 'English', short: 'EN' }
  ];

  // Pre-set document.documentElement.lang before paint
  document.documentElement.lang = (currentLang === 'zh' ? 'zh-CN' : 'en');

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
