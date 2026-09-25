/**
 * CangFeng · 藏锋录 核心应用程序 (v1.0.0)
 * 个人空间工造与视觉成果典藏 · WebP 4K Deep Zoom 深览系统
 * 前端开源 + 核心数据 Cloudflare Pages 挂载架构
 */

(function () {
  'use strict';

  // Global State
  let galleryItems = [];
  let currentFilteredItems = [];
  let currentViewerIndex = -1;
  let osdViewer = null;
  let currentFilter = 'all';
  let preViewerScrollY = 0;
  let currentHistoryLevel = 0; // 0: hero, 1: gallery, 2: viewer

  // 物理尺寸引擎基准 (300 DPI 印刷制图在 96 CSS DPI 显示器上的 100% 物理真实尺寸系数)
  const PHYSICAL_100_RATIO = 96 / 300; // 0.32

  function getBase100PhysicalZoom(viewer) {
    if (!viewer || !viewer.viewport) return 1;
    return viewer.viewport.imageToViewportZoom(1) * PHYSICAL_100_RATIO;
  }

  function getPhysicalPercentFromZoom(viewer, zoom) {
    const base100 = getBase100PhysicalZoom(viewer);
    if (!base100 || base100 <= 0) return 100;
    return Math.round((zoom / base100) * 100);
  }

  function getZoomFromPhysicalPercent(viewer, percent) {
    const base100 = getBase100PhysicalZoom(viewer);
    return base100 * (Math.max(1, Math.min(percent, 2500)) / 100);
  }

  function bindZoomControllerEvents() {
    const wrapper = document.getElementById('zoomDropdownWrapper');
    const zoomPill = document.getElementById('toolZoomPill');
    const zoomInput = document.getElementById('zoomInlineInput');
    const chevronBtn = document.getElementById('btnZoomChevron');
    const popover = document.getElementById('zoomPopover');
    if (!wrapper || !zoomPill || !popover) return;

    function closeZoomPopover() {
      popover.classList.remove('open');
      zoomPill.classList.remove('active');
      if (chevronBtn) chevronBtn.setAttribute('aria-expanded', 'false');
      popover.setAttribute('aria-hidden', 'true');
      const toolbar = wrapper.closest('.viewer-floating-toolbar') || wrapper.closest('.viewer-float-toolbar');
      if (toolbar) toolbar.classList.remove('popover-open');
      const viewerModal = document.getElementById('viewerModal');
      if (viewerModal) viewerModal.classList.remove('zoom-focus-active');
    }

    function openZoomPopover() {
      popover.classList.add('open');
      zoomPill.classList.add('active');
      if (chevronBtn) chevronBtn.setAttribute('aria-expanded', 'true');
      popover.setAttribute('aria-hidden', 'false');
      const toolbar = wrapper.closest('.viewer-floating-toolbar') || wrapper.closest('.viewer-float-toolbar');
      if (toolbar) toolbar.classList.add('popover-open');
      const viewerModal = document.getElementById('viewerModal');
      if (viewerModal) viewerModal.classList.add('zoom-focus-active');
    }

    function toggleZoomPopover() {
      if (popover.classList.contains('open')) {
        closeZoomPopover();
      } else {
        openZoomPopover();
      }
    }

    function applyInputZoom() {
      if (!zoomInput) return;
      const val = parseInt(zoomInput.value, 10);
      if (Number.isFinite(val) && val > 0 && osdViewer && osdViewer.viewport) {
        const targetZoom = getZoomFromPhysicalPercent(osdViewer, val);
        osdViewer.viewport.zoomTo(targetZoom);
        osdViewer.viewport.applyConstraints();
      }
    }

    zoomPill.addEventListener('click', (e) => {
      // 桌面端点击输入框时直接允许聚焦输入，不强制收起或展开下拉
      if (e.target === zoomInput && window.innerWidth > 768) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      toggleZoomPopover();
    });

    if (zoomInput) {
      zoomInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyInputZoom();
          zoomInput.blur();
          closeZoomPopover();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          updateZoomUI();
          zoomInput.blur();
          closeZoomPopover();
        }
      });

      zoomInput.addEventListener('blur', () => {
        applyInputZoom();
      });

      zoomInput.addEventListener('focus', () => {
        if (window.innerWidth > 768) {
          zoomInput.select();
        }
      });
    }

    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        closeZoomPopover();
      }
    });
  }

  function updateZoomUI() {
    if (!osdViewer || !osdViewer.viewport) return;
    const currentZoom = osdViewer.viewport.getZoom();
    const currentPercent = getPhysicalPercentFromZoom(osdViewer, currentZoom);

    const zoomInput = document.getElementById('zoomInlineInput');
    if (zoomInput && document.activeElement !== zoomInput) {
      zoomInput.value = currentPercent;
    }

    const presetItems = document.querySelectorAll('.zoom-preset-item');
    presetItems.forEach(item => {
      const p = parseInt(item.getAttribute('data-percent'), 10);
      item.classList.toggle('active', Math.abs(p - currentPercent) <= 2);
    });
  }

  function renderDynamicZoomPresets(item) {
    const presetsList = document.getElementById('zoomPresetsList');
    if (!presetsList || !osdViewer || !osdViewer.viewport) return;

    const base100 = getBase100PhysicalZoom(osdViewer);
    const homeZoom = osdViewer.viewport.getHomeZoom();
    const fitPercent = Math.max(1, Math.round((homeZoom / base100) * 100));

    const rawPresets = [
      { percent: fitPercent, isFit: true },
      { percent: 50 },
      { percent: 100 },
      { percent: 200 },
      { percent: 300 },
      { percent: 400 }
    ];

    const presets = [];
    const seen = new Set();
    rawPresets.sort((a, b) => a.percent - b.percent).forEach(p => {
      if (seen.has(p.percent)) return;
      seen.add(p.percent);
      presets.push(p);
    });

    presetsList.innerHTML = '';
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zoom-preset-item';
      btn.setAttribute('data-percent', p.percent);
      btn.innerHTML = `<span class="zoom-preset-num">${p.percent}%</span>`;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (p.isFit) {
          osdViewer.viewport.goHome();
        } else {
          const targetZoom = getZoomFromPhysicalPercent(osdViewer, p.percent);
          osdViewer.viewport.zoomTo(targetZoom);
          osdViewer.viewport.applyConstraints();
        }
        const popover = document.getElementById('zoomPopover');
        const zoomPill = document.getElementById('toolZoomPill');
        const chevronBtn = document.getElementById('btnZoomChevron');
        if (popover) {
          popover.classList.remove('open');
          popover.setAttribute('aria-hidden', 'true');
        }
        if (zoomPill) zoomPill.classList.remove('active');
        if (chevronBtn) chevronBtn.setAttribute('aria-expanded', 'false');
        const toolbar = document.querySelector('.viewer-floating-toolbar') || document.querySelector('.viewer-float-toolbar');
        if (toolbar) toolbar.classList.remove('popover-open');
        const viewerModal = document.getElementById('viewerModal');
        if (viewerModal) viewerModal.classList.remove('zoom-focus-active');
      });
      presetsList.appendChild(btn);
    });

    updateZoomUI();
  }


  const SVG_EXIT_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
  const SVG_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  const SVG_ZOOM = '<svg class="icon mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';
  const SVG_SPARKLE = '<svg class="badge-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L9.8 6.2L15 8L9.8 9.8L8 15L6.2 9.8L1 8L6.2 6.2L8 1Z"/></svg>';

  const QMAPFLOW_BASE_SVG = '<svg width="100%" height="100%" viewBox="0 0 154.11621 25.478886" version="1.1" style="display:inline-block;vertical-align:middle;" xmlns="http://www.w3.org/2000/svg">' +
    '<rect class="qmf-badge-bg" style="fill-opacity:1;fill-rule:evenodd;stroke-width:1.48054;stroke-linecap:round;stroke-linejoin:round" width="79.043427" height="42.77319" x="292.11685" y="-135.73831" transform="matrix(0.26458333,0,0,0.26458333,-6.5528481,42.781699)" />' +
    '<g transform="translate(-28.045834,-134.14375)"><g transform="matrix(0.26458333,0,0,0.26458333,21.492986,176.92545)">' +
    '<path class="qmf-lettermark" d="m 471.01947,-115.27477 c -1.45733,0 -2.68667,1.22933 -2.68667,2.68667 v 11.44533 c 0,1.454666 1.22934,2.683996 2.68667,2.683996 h 11.444 c 1.45733,0 2.68667,-1.22933 2.68667,-2.683996 v -11.44533 c 0,-1.45734 -1.22934,-2.68667 -2.68667,-2.68667 z m 11.444,25.138666 h -11.444 c -6.06933,0 -11.008,-4.93867 -11.008,-11.006666 v -11.44533 c 0,-6.07067 4.93867,-11.00934 11.008,-11.00934 h 11.444 c 6.06933,0 11.008,4.93867 11.008,11.00934 v 11.44533 c 0,6.067996 -4.93867,11.006666 -11.008,11.006666" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path class="qmf-lettermark" d="m 148.51553,-138.56637 h -6.548 c -2.55067,0 -4.89333,0.952 -6.752,2.53467 -1.86,-1.58267 -4.20267,-2.53467 -6.752,-2.53467 h -6.54933 c -6.01734,0 -10.91467,5.26667 -10.91467,11.74267 v 35.950656 c 0,0.82667 0.67067,1.49734 1.49733,1.49734 h 5.328 c 0.82667,0 1.49734,-0.67067 1.49734,-1.49734 V -126.8237 c 0,-1.85334 1.18666,-3.42 2.592,-3.42 h 6.54933 c 1.404,0 2.59067,1.56666 2.59067,3.42 v 35.950656 c 0,0.82667 0.67066,1.49734 1.49733,1.49734 h 5.328 c 0.82667,0 1.49733,-0.67067 1.49733,-1.49734 V -126.8237 c 0,-1.85334 1.18667,-3.42 2.59067,-3.42 h 6.548 c 1.40667,0 2.59333,1.56666 2.59333,3.42 v 35.950656 c 0,0.82667 0.67067,1.49734 1.49734,1.49734 h 5.32666 c 0.828,0 1.49867,-0.67067 1.49867,-1.49734 V -126.8237 c 0,-6.476 -4.89733,-11.74267 -10.916,-11.74267" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path class="qmf-lettermark" d="m 270.17707,-107.44597 c 0,4.956 -4.03067,8.986666 -8.98667,8.986666 h -13.81333 c -4.95333,0 -8.984,-4.030666 -8.984,-8.986666 v -6.904 -6.90667 c 0,-4.956 4.03067,-8.98666 8.984,-8.98666 h 13.81333 c 4.956,0 8.98667,4.03066 8.98667,8.98666 z m -8.98667,-31.12 h -13.81333 c -9.54267,0 -17.30667,7.76533 -17.30667,17.30933 v 6.90667 6.904 34.799996 h 8.32267 v -20.03467 c 2.62267,1.60267 5.692,2.544 8.984,2.544 h 13.81333 c 9.54267,0 17.30934,-7.76533 17.30934,-17.309326 v -13.81067 c 0,-9.544 -7.76667,-17.30933 -17.30934,-17.30933" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path class="qmf-lettermark" d="m 200.35086,-138.56637 h -13.81067 c -9.544,0 -17.30933,7.76667 -17.30933,17.30933 v 13.81067 c 0,9.543996 7.76533,17.309326 17.30933,17.309326 h 13.81067 c 1.57067,0 3.08533,-0.22666 4.53067,-0.624 v -8.968 c -1.336,0.78667 -2.87067,1.27067 -4.53067,1.27067 h -13.81067 c -4.956,0 -8.98666,-4.031996 -8.98666,-8.987996 v -13.81067 c 0,-4.95466 4.03066,-8.98666 8.98666,-8.98666 h 13.81067 c 4.956,0 8.98667,4.032 8.98667,8.98666 v 6.90667 6.904 c 0,0.25067 -0.0533,0.48533 -0.0733,0.73067 v 14.073326 c 0.024,-0.0147 0.0507,-0.024 0.0733,-0.0387 v 2.41467 h 8.32266 v -17.179996 -6.904 -6.90667 c 0,-9.54266 -7.76533,-17.30933 -17.30933,-17.30933" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path class="qmf-lettermark" d="m 403.6536,-144.18224 h 10.98267 v -8.32267 H 403.6536 c -8.58933,0 -15.57733,7.20934 -15.57733,16.068 v 47.811996 h 8.32266 v -25.219996 h 18.23734 v -8.32133 h -18.23734 v -14.27067 c 0,-4.27066 3.25334,-7.74533 7.25467,-7.74533" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path class="qmf-lettermark" d="m 450.50787,-90.136644 h -7.96933 c -9.03067,0 -16.37867,-6.008 -16.37867,-13.391996 v -49.552 h 8.32267 v 49.552 c 0,2.39733 3.308,5.069326 8.056,5.069326 h 7.96933 z" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path class="qmf-lettermark" d="m 568.63933,-142.86784 -0.552,5.17467 11.76667,1.25866 -42.456,32.19067 c -0.26667,0.20267 -0.64934,0.012 -0.64934,-0.32267 v -9.04666 c 0,-3.672 -4.17466,-5.784 -7.132,-3.60934 l -16.45066,12.09067 c -0.268,0.19733 -0.64534,0.005 -0.64534,-0.32667 v -18.49066 c 0,-1.01734 -0.82533,-1.84134 -1.84266,-1.84134 h -4.63734 c -1.01733,0 -1.84266,0.824 -1.84266,1.84134 v 28.091996 c 0,3.17066 3.60533,4.996 6.16,3.11733 l 18.068,-13.278666 v 11.233336 c 0,3.19733 3.65866,5.01466 6.20666,3.08266 l 50.31867,-38.154656 -1.31067,11.09333 5.16534,0.608 2.636,-22.27333 z" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path class="qmf-lettermark" d="M 88.750667,-91.703174 H 53.436001 c -7.834666,0 -14.185333,-6.35067 -14.185333,-14.183996 v -32.04533 c 0,-7.83467 6.352,-14.18667 14.186667,-14.18667 h 32.473332 c 7.836,0 14.186663,6.352 14.186663,14.18667 v 33.33733 c 0,1.35867 -0.663997,2.63333 -1.779997,3.412 -1.116,0.78 -2.537333,0.964 -3.817333,0.49333 l -23.997333,-8.82 2.873334,-7.81066 18.398666,6.76133 v -27.37333 c 0,-3.23867 -2.625333,-5.864 -5.864,-5.864 H 53.436001 c -3.238666,0 -5.862666,2.624 -5.862666,5.86266 v 32.04667 c 0,3.23733 2.624,5.86133 5.862666,5.86133 H 70.198667 L 88.992,-93.047174 c 0.725334,0.26933 0.532,1.344 -0.241333,1.344" style="fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '</g>' +
    '<text class="qmf-badge-num" xml:space="preserve" style="font-style:normal;font-weight:700;font-size:12.7032px;line-height:10.4398px;font-family:\'MiSans\',-apple-system,sans-serif;text-align:center;letter-spacing:-0.8px;text-anchor:middle;fill-opacity:1;" x="108.68931" y="151.41119"><tspan x="108.68931" y="151.41119">__PRECISION__</tspan></text>' +
    '</g></svg>';

  function getQMapFlowSvg(precision = 100) {
    const cleanVal = String(precision).replace(/%/g, '').trim() || '100';
    return QMAPFLOW_BASE_SVG.replace('__PRECISION__', cleanVal);
  }

  // Initialize
  async function init() {
    bindAntiTheft();

    if (window.OpenSeadragon && OpenSeadragon.setImageFormatsSupported) {
      OpenSeadragon.setImageFormatsSupported({ webp: true });
    }

    const manifestData = window.ATLAS_MANIFEST || window.CANGFENG_MANIFEST || window.GALLERY_MANIFEST;
    if (manifestData) {
      setupData(manifestData);
      initGallery();
      checkUrlDeepLink();
      return;
    }

    try {
      const res = await fetch('data/manifest.json');
      if (!res.ok) throw new Error('Manifest not found');
      const data = await res.json();
      setupData(data);
      initGallery();
      checkUrlDeepLink();
    } catch (err) {
      console.error('Failed to load Atlas manifest:', err);
      const grid = document.getElementById('galleryGrid');
      if (grid) {
        grid.innerHTML = '<div style="padding: 24px; color: #ff5555; font-family: var(--font-mono); font-size: 0.85rem;">' +
          '[Error] 无法读取成果索引 (data/manifest.json)，请检查网络或 data/manifest.js。</div>';
      }
    }
  }

  function setupData(rawItems) {
    const config = window.ATLAS_CONFIG || window.CANGFENG_CONFIG || {};
    const assetBase = (config.assetBaseUrl || '').replace(/\/+$/, '');

    galleryItems = rawItems.map((item, idx) => {
      item.globalIndex = idx;
      if (assetBase) {
        if (item.tileUrl && !item.tileUrl.startsWith('http')) {
          item.tileUrl = assetBase + '/' + item.tileUrl.replace(/^\/+/, '');
        }
        if (item.dzi && item.dzi.Image && item.dzi.Image.Url && !item.dzi.Image.Url.startsWith('http')) {
          item.dzi.Image.Url = assetBase + '/' + item.dzi.Image.Url.replace(/^\/+/, '');
        }
      }
      return item;
    });
  }

  let currentHeroItem = null;

  function initGallery() {
    const countEl = document.getElementById('pageItemCount');
    if (countEl) countEl.textContent = galleryItems.length;

    bindFilterEvents();
    bindViewModeEvents();
    bindViewerModalEvents();
    bindAboutModalEvents();
    bindPortalScrollEvents();
    bindFooterAccordion();
    bindLanguageDropdown();
    bindI18nEvents();
    initHero();

    applyFilter('all');
  }

  function bindPortalScrollEvents() {
    const portalBtn = document.getElementById('btnScrollToPortal');
    if (portalBtn) {
      portalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const footer = document.getElementById('portalFooter');
        if (footer) {
          footer.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  function bindFooterAccordion() {
    const groups = document.querySelectorAll('.footer-nav-group');
    groups.forEach(group => {
      const header = group.querySelector('.footer-group-header');
      if (!header) return;
      header.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const isOpen = group.classList.toggle('open');
          header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      });
    });
  }

  /* -------------------------------------------------------------
     Hero Screen (多级智能匹配 + 双层平滑轮播 + 边界对齐)
     ------------------------------------------------------------- */
  let heroTimer = null;
  let activeHeroLayerIndex = 0; // 0 for A, 1 for B
  let lastHeroItemId = null;

  function isHeroExcluded(item) {
    if (!item) return true;
    if (item.hero === false) return true;
    if (Array.isArray(item.tags)) {
      const lowerTags = item.tags.map(t => String(t).trim().toLowerCase());
      if (lowerTags.includes('no') || lowerTags.includes('no_hero') || lowerTags.includes('hero:no') || lowerTags.includes('hero=no')) {
        return true;
      }
    }
    return false;
  }

  function getEligibleHeroPool() {
    if (!galleryItems || galleryItems.length === 0) return [];

    // 1. 过滤掉作者标记为排除的画卷 ("hero": false 或 tag 为 "no")
    const allowedItems = galleryItems.filter(item => !isHeroExcluded(item));
    if (allowedItems.length === 0) return galleryItems;

    // 2. 检测显示器分辨率（考虑物理像素比 DPR）
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const screenW = window.innerWidth * dpr;
    const screenH = window.innerHeight * dpr;

    // 3. 计算以 cover 充满当前屏幕时的拉伸倍率 Scale = max(Ws / Wi, Hs / Hi)
    // Scale <= 1.05 表示原图像素足够，无损下采样；Scale > 1.05 表示需放大拉伸造成失真
    const scored = allowedItems.map(item => {
      const itemW = item.width || 1920;
      const itemH = item.height || 1080;
      const scale = Math.max(screenW / itemW, screenH / itemH);
      return { item, scale };
    });

    // 优先返回像素充足、无损覆盖的作品池
    const losslessPool = scored.filter(s => s.scale <= 1.05).map(s => s.item);
    if (losslessPool.length > 0) {
      return losslessPool;
    }

    // 极端高分屏降级兜底：挑选拉伸倍率最小（最合适）的作品
    scored.sort((a, b) => a.scale - b.scale);
    const bestScale = scored[0].scale;
    return scored.filter(s => s.scale <= bestScale * 1.15).map(s => s.item);
  }

  function initHero() {
    const heroScreen = document.getElementById('heroScreen');
    const heroScrollBtn = document.getElementById('heroScrollBtn');
    if (!heroScreen || !galleryItems || galleryItems.length === 0) return;

    const HERO_DWELL_MS = 8000; // 画面完全就绪后的专属驻留欣赏时间：8 秒
    let preloadedNextItem = null;
    let preloadImageObj = null;

    function updateArtworkTag(item) {
      const heroArtworkTag = document.getElementById('heroArtworkTag');
      const heroArtworkName = document.getElementById('heroArtworkName');
      if (heroArtworkTag && heroArtworkName && item) {
        const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(item) : item;
        heroArtworkName.textContent = locItem.title;
        heroArtworkTag.style.display = 'inline-flex';
      }
    }

    // 后台静默预加载下一卷 2K 画卷，确保到期切换时 0ms 瞬间无缝呈现
    function prepareAndPreloadNext() {
      const pool = getEligibleHeroPool();
      if (pool.length === 0) return null;

      let candidates = pool.filter(it => it.id !== (currentHeroItem ? currentHeroItem.id : null));
      if (candidates.length === 0) candidates = pool;

      preloadedNextItem = candidates[Math.floor(Math.random() * candidates.length)];
      if (preloadedNextItem) {
        preloadImageObj = new Image();
        preloadImageObj.src = `thumbs/hero/${preloadedNextItem.id}.webp`;
      }
      return preloadedNextItem;
    }

    // 安排下一次换图（必须在大图完全加载并展示完成后才开始倒计时 8 秒）
    function scheduleNextTransition() {
      stopHeroTimer();
      heroTimer = setTimeout(() => {
        if (window.scrollY < 80 && !document.hidden) {
          displayHeroArtwork(preloadedNextItem);
        }
      }, HERO_DWELL_MS);
    }

    function stopHeroTimer() {
      if (heroTimer) {
        clearTimeout(heroTimer);
        heroTimer = null;
      }
    }

    function displayHeroArtwork(itemToDisplay) {
      stopHeroTimer();
      const pool = getEligibleHeroPool();
      if (pool.length === 0) return;

      const targetItem = itemToDisplay || pool[Math.floor(Math.random() * pool.length)];
      currentHeroItem = targetItem;
      lastHeroItemId = targetItem.id;

      const layerA = document.getElementById('heroBgA') || document.getElementById('heroBg');
      const layerB = document.getElementById('heroBgB');

      const incoming = (activeHeroLayerIndex === 0 && layerB) ? layerB : layerA;
      const outgoing = (incoming === layerB) ? layerA : layerB;

      if (!incoming) return;

      // 0ms 瞬间挂上低清缩略图作底图，绝无黑屏等待
      incoming.style.backgroundImage = `url("${targetItem.thumb}")`;

      const highResUrl = `thumbs/hero/${targetItem.id}.webp`;
      const highResImg = new Image();
      let hasCompleted = false;

      const onImageReady = () => {
        if (hasCompleted) return;
        hasCompleted = true;

        // 大图加载就绪：上屏锐化并触发 1.4s 电影级淡入淡出
        incoming.style.backgroundImage = `url("${highResUrl}")`;
        incoming.classList.add('active');
        if (outgoing) {
          outgoing.classList.remove('active');
        }

        activeHeroLayerIndex = (incoming === layerB) ? 1 : 0;
        updateArtworkTag(targetItem);

        // 【关键逻辑】：大图完全加载呈现后，立即后台预加载下一张，并启动满额 8 秒停留倒计时
        prepareAndPreloadNext();
        scheduleNextTransition();
      };

      highResImg.onload = onImageReady;
      highResImg.onerror = () => {
        // 容错降级：大图网络异常时，以缩略图继续展示并正常计时
        onImageReady();
      };
      highResImg.src = highResUrl;

      // 命中浏览器内存/磁盘缓存时秒开
      if (highResImg.complete) {
        onImageReady();
      }
    }

    // 首帧加载展示
    displayHeroArtwork();

    // 页面不可见或向下滚动离开首屏时暂停倒计时以节省设备能耗
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopHeroTimer();
      } else if (window.scrollY < 80) {
        scheduleNextTransition();
      }
    });

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 120) {
        stopHeroTimer();
      } else {
        if (!heroTimer) scheduleNextTransition();
      }

      // 同步 Level 0 / Level 1 历史状态
      const modalEl = document.getElementById('viewerModal');
      if (!modalEl || !modalEl.classList.contains('open')) {
        const heroThreshold = Math.max(260, window.innerHeight * 0.45);
        if (scrollY >= heroThreshold && currentHistoryLevel === 0) {
          currentHistoryLevel = 1;
          const url = new URL(window.location.href);
          url.hash = 'gallery';
          window.history.pushState({ level: 1, view: 'gallery' }, '', url.toString());
        } else if (scrollY < 60 && currentHistoryLevel === 1) {
          currentHistoryLevel = 0;
          const url = new URL(window.location.href);
          url.hash = '';
          window.history.replaceState({ level: 0, view: 'hero' }, '', url.pathname + url.search);
        }
      }
    }, { passive: true });

    // 监听横竖屏切换（物理屏幕翻转时即刻计算最契合图幅）
    const mql = window.matchMedia('(orientation: landscape)');
    const handleOrientationChange = () => {
      displayHeroArtwork();
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', handleOrientationChange);
    } else if (mql.addListener) {
      mql.addListener(handleOrientationChange);
    }

    // 精准滚动定位至下一屏（即 siteHeader 与瀑布流大厅）
    function scrollToNextScreen() {
      const target = document.getElementById('siteHeader') || document.querySelector('.site-header');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }
      if (currentHistoryLevel === 0) {
        currentHistoryLevel = 1;
        const url = new URL(window.location.href);
        url.hash = 'gallery';
        window.history.pushState({ level: 1, view: 'gallery' }, '', url.toString());
      }
    }

    if (heroScrollBtn) {
      heroScrollBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToNextScreen();
      });
    }

    // 鼠标在开屏区域向下滚动时，平滑精准定位到下一屏
    let isSnapping = false;
    window.addEventListener('wheel', (e) => {
      if (isSnapping) return;
      const hero = document.getElementById('heroScreen');
      if (!hero) return;

      const heroHeight = hero.offsetHeight || window.innerHeight;

      // 处于开屏视图顶部且向下滚轮滑动时
      if (window.scrollY < 40 && e.deltaY > 15) {
        isSnapping = true;
        scrollToNextScreen();
        setTimeout(() => { isSnapping = false; }, 850);
      }
      // 处于次屏交界处且向上滚轮滑动时，回卷至开屏
      else if (window.scrollY > 0 && window.scrollY < heroHeight * 0.7 && e.deltaY < -15) {
        isSnapping = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { isSnapping = false; }, 850);
      }
    }, { passive: true });

    // 移动端触屏向上滑动时平滑过渡至下一屏
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!touchStartY) return;
      const touchEndY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : 0;
      const diff = touchStartY - touchEndY;
      if (window.scrollY < 40 && diff > 50) {
        scrollToNextScreen();
      }
      touchStartY = 0;
    }, { passive: true });
  }

  /* -------------------------------------------------------------
     Language Dropdown (中/EN 切换与扩展多语言支持)
     ------------------------------------------------------------- */
  function bindLanguageDropdown() {
    const dropdownConfigs = [
      { wrapperId: 'heroLangDropdownWrapper', btnId: 'btnHeroLangDropdown', menuId: 'heroLangDropdownMenu' },
      { wrapperId: 'langDropdownWrapper', btnId: 'btnLangDropdown', menuId: 'langDropdownMenu' },
      { wrapperId: 'viewerLangDropdownWrapper', btnId: 'viewerBtnLangDropdown', menuId: 'viewerLangMenu' }
    ];

    function closeAllLangDropdowns(exceptMenuId) {
      dropdownConfigs.forEach(({ btnId, menuId, wrapperId }) => {
        if (exceptMenuId && menuId === exceptMenuId) return;
        const menu = document.getElementById(menuId);
        const btn = document.getElementById(btnId);
        if (menu) menu.classList.remove('open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (wrapperId === 'viewerLangDropdownWrapper') {
          const topActions = document.getElementById('viewerTopActions');
          if (topActions) {
            topActions.classList.remove('has-open');
            if (!topActions.matches(':hover')) {
              topActions.classList.remove('expanded');
            }
          }
          if (typeof resetTopActionsIdleTimer === 'function') resetTopActionsIdleTimer();
        }
      });
    }

    dropdownConfigs.forEach(({ wrapperId, btnId, menuId }) => {
      const wrapper = document.getElementById(wrapperId);
      const btn = document.getElementById(btnId);
      const menu = document.getElementById(menuId);
      if (!wrapper || !btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeAllLangDropdowns(menuId);
        const isOpen = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (wrapperId === 'viewerLangDropdownWrapper') {
          const topActions = document.getElementById('viewerTopActions');
          if (topActions) {
            topActions.classList.toggle('expanded', isOpen);
            topActions.classList.toggle('has-open', isOpen);
          }
          if (typeof resetTopActionsIdleTimer === 'function') resetTopActionsIdleTimer();
        }
      });

      menu.querySelectorAll('.lang-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetLang = item.getAttribute('data-lang');
          if (targetLang && window.AtlasI18n) {
            window.AtlasI18n.setLang(targetLang);
          }
          closeAllLangDropdowns();
        });
      });
    });

    // 点击外部区域自动关闭下拉菜单
    document.addEventListener('click', (e) => {
      dropdownConfigs.forEach(({ wrapperId, btnId, menuId }) => {
        const wrapper = document.getElementById(wrapperId);
        const menu = document.getElementById(menuId);
        const btn = document.getElementById(btnId);
        if (wrapper && menu && !wrapper.contains(e.target)) {
          menu.classList.remove('open');
          if (btn) btn.setAttribute('aria-expanded', 'false');
          if (wrapperId === 'viewerLangDropdownWrapper') {
            const topActions = document.getElementById('viewerTopActions');
            if (topActions) {
              topActions.classList.remove('has-open');
              if (!topActions.matches(':hover')) {
                topActions.classList.remove('expanded');
              }
            }
          }
        }
      });
    });

    // 按 Esc 自动关闭下拉菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllLangDropdowns();
      }
    });

    window.closeAtlasLangDropdowns = closeAllLangDropdowns;
  }

  /* -------------------------------------------------------------
     i18n & Language Switcher Binding
     ------------------------------------------------------------- */
  function bindI18nEvents() {
    if (window.AtlasI18n) {
      window.AtlasI18n.updateDOM();
    }

    window.addEventListener('languageChanged', () => {
      // Re-render gallery grid with localized data
      renderGrid(currentFilteredItems);

      // Update hero active artwork title
      if (currentHeroItem) {
        const heroArtworkName = document.getElementById('heroArtworkName');
        if (heroArtworkName) {
          const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(currentHeroItem) : currentHeroItem;
          heroArtworkName.textContent = locItem.title;
        }
      }

      // If viewer modal is open, re-render metadata panel
      const modalEl = document.getElementById('viewerModal');
      if (modalEl && modalEl.classList.contains('open') && currentFilteredItems[currentViewerIndex]) {
        updateArtworkMetadata(currentFilteredItems[currentViewerIndex]);
      }

      // If poster modal is open, re-render artwork poster with localized typography
      const posterModal = document.getElementById('sharePosterModal');
      if (posterModal && posterModal.classList.contains('open') && currentPosterItem) {
        updatePosterRatioUI();
        renderCurrentPoster();
      }
    });
  }

  /* -------------------------------------------------------------
     About Modal Event Binding
     ------------------------------------------------------------- */
  function bindAboutModalEvents() {
    const modalEl = document.getElementById('aboutModal');
    const openBtn = document.getElementById('btnOpenAbout');
    const footerOpenBtn = document.getElementById('btnFooterOpenAbout');
    const closeBtn = document.getElementById('btnCloseAbout');
    const closeFooterBtn = document.getElementById('btnCloseAboutFooter');
    const backdropEl = document.getElementById('aboutBackdrop');
    if (!modalEl) return;

    function openAbout() {
      modalEl.style.display = 'flex';
      void modalEl.offsetWidth; // force reflow for smooth transition
      modalEl.classList.add('open');
      modalEl.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.scrollbarGutter = 'auto';
      document.body.style.scrollbarGutter = 'auto';
    }

    function closeAbout() {
      modalEl.classList.remove('open');
      modalEl.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.scrollbarGutter = '';
      document.body.style.scrollbarGutter = '';
      setTimeout(() => {
        if (!modalEl.classList.contains('open')) {
          modalEl.style.display = 'none';
        }
      }, 250);
    }

    if (openBtn) openBtn.addEventListener('click', openAbout);
    if (footerOpenBtn) footerOpenBtn.addEventListener('click', openAbout);
    if (closeBtn) closeBtn.addEventListener('click', closeAbout);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeAbout);
    if (backdropEl) backdropEl.addEventListener('click', closeAbout);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.classList.contains('open')) {
        closeAbout();
      }
    });
  }

  /* -------------------------------------------------------------
     Filters & Grid Rendering
     ------------------------------------------------------------- */
  function bindFilterEvents() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilter(chip.dataset.filter || 'all');
      });
    });
  }

  function applyFilter(filterVal) {
    currentFilter = filterVal;
    let pool = [...galleryItems];

    if (filterVal === 'wide') {
      pool = pool.filter(i => i.aspectRatio >= 1.2);
    } else if (filterVal === 'tall') {
      pool = pool.filter(i => i.aspectRatio <= 0.8);
    }

    currentFilteredItems = pool;
    renderGrid(pool);
  }

  function renderGrid(items) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (items.length === 0) {
      const emptyText = window.AtlasI18n ? window.AtlasI18n.t('emptyFilter') : '当前筛选条件下暂无收录成果';
      grid.innerHTML = '<div style="padding: 48px 24px; color: var(--text-muted); text-align: center; width: 100%;">' +
        emptyText + '</div>';
      return;
    }

    items.forEach((item, localIdx) => {
      grid.appendChild(createCard(item, localIdx));
    });
  }

  /**
   * 判断作品是否属于近 3 个月（约 93 天）发布的新作
   * 兼容 item.date 与 item.year 字段，支持 2026.8, 2026-08, 2026.09.15 等格式，
   * 亦兼容 tags: ["new"] 或 isNew: true 显式标记。
   */
  function isNewArtwork(item, maxDays = 93) {
    if (!item) return false;
    if (item.isNew === true) return true;
    if (item.isNew === false) return false;

    // 检查 tags 显式标记
    if (Array.isArray(item.tags)) {
      const lowerTags = item.tags.map(t => String(t).trim().toLowerCase());
      if (lowerTags.includes('new') || lowerTags.includes('新作') || lowerTags.includes('最新')) {
        return true;
      }
    }

    const rawDate = item.date || item.publishDate || item.releaseDate || item.year;
    if (!rawDate) return false;

    const str = String(rawDate).trim();
    let year = null;
    let month = null;
    let day = null;

    // 匹配常规年月[日]格式，如：
    // 2026-08-15, 2026.08.15, 2026/8/15, 2026年8月15日
    // 2026-08, 2026.8, 2026.08, 2026/8, 2026年8月
    const matchDate = str.match(/^(\d{4})[-/.年](\d{1,2})(?:[-/.月](\d{1,2}))?/);
    if (matchDate) {
      year = parseInt(matchDate[1], 10);
      month = parseInt(matchDate[2], 10);
      if (matchDate[3]) {
        day = parseInt(matchDate[3], 10);
      }
    } else {
      // 尝试标准 Date.parse
      const timestamp = Date.parse(str);
      if (!isNaN(timestamp)) {
        const d = new Date(timestamp);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
      }
    }

    if (!year || !month || month < 1 || month > 12) {
      return false;
    }

    const targetDay = day || 1;
    const itemDate = new Date(year, month - 1, targetDay);
    const now = new Date();

    const diffTime = now.getTime() - itemDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // 允许未来 14 天容错（防止发布预热或时区差），在过去 maxDays（默认 93 天，约 3 个月）内
    return diffDays >= -14 && diffDays <= maxDays;
  }

  /**
   * 格式化日期为仅显示年月 (YYYY.MM 或 YYYY)
   * 兼容 2024.07, 2024.7, 2024-07-15, 2024/07/15, 2024年7月, 2024 等多种格式
   */
  function formatYearMonth(rawDate) {
    if (!rawDate) return '';
    const str = String(rawDate).trim();
    const match = str.match(/^(\d{4})[-/.年](\d{1,2})/);
    if (match) {
      const year = match[1];
      const month = String(parseInt(match[2], 10)).padStart(2, '0');
      return year + '.' + month;
    }
    const matchYear = str.match(/^(\d{4})$/);
    if (matchYear) {
      return matchYear[1];
    }
    const timestamp = Date.parse(str);
    if (!isNaN(timestamp)) {
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return year + '.' + month;
    }
    return str;
  }

  function createCard(item, localIdx) {
    const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(item) : item;
    const card = document.createElement('article');
    card.className = 'gallery-card';
    card.id = 'artCard_' + item.id;
    card.dataset.id = item.id;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.style.setProperty('--aspect-ratio', item.aspectRatio);

    const tagsHtml = (locItem.tags || [])
      .filter(t => !['no', 'no_hero', 'hero:no', 'hero=no'].includes(String(t).trim().toLowerCase()))
      .map(t => '<span class="tag-pill">' + escapeHtml(t) + '</span>').join('');

    const isNew = isNewArtwork(item);
    const newBadgeAria = window.AtlasI18n ? (window.AtlasI18n.t('badgeNewAria') || '新作') : '新作';
    const newBadgeHtml = isNew ?
      '<span class="card-new-badge" aria-label="' + escapeHtml(newBadgeAria) + '">' +
        SVG_SPARKLE +
        '<span>NEW</span>' +
      '</span>' : '';

    card.innerHTML = 
      '<div class="card-media">' +
        newBadgeHtml +
        '<img class="card-img" src="' + item.thumb + '" alt="' + escapeHtml(locItem.title) + '" loading="lazy" />' +
        '<div class="card-scrim-mask">' +
          '<div class="card-scrim-content">' +
            '<h3 class="card-title" title="' + escapeHtml(locItem.title) + '">' + escapeHtml(locItem.title) + '</h3>' +
            (tagsHtml ? ('<div class="card-meta-row"><div class="card-tags">' + tagsHtml + '</div></div>') : '') +
          '</div>' +
        '</div>' +
      '</div>';

    const img = card.querySelector('.card-img');
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.onload = () => img.classList.add('loaded');
    }

    card.addEventListener('click', () => openViewerByItem(item, true));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openViewerByItem(item, true);
      }
    });

    if (window.MicroTileCompositor) {
      window.MicroTileCompositor.observe(card, item);
    }

    return card;
  }

  function bindViewModeEvents() {
    const grid = document.getElementById('galleryGrid');
    const btnDense = document.getElementById('btnGridDense');
    const btnComfort = document.getElementById('btnGridComfort');
    if (!grid || !btnDense || !btnComfort) return;

    btnDense.addEventListener('click', () => {
      btnDense.classList.add('active');
      btnComfort.classList.remove('active');
      grid.classList.remove('comfort-mode');
    });

    btnComfort.addEventListener('click', () => {
      btnComfort.classList.add('active');
      btnDense.classList.remove('active');
      grid.classList.add('comfort-mode');
    });
  }

  // ── 视口右上角全局操作胶囊：弹性手风琴悬停展开与看图沉浸式自动隐退引擎 ──
  let topActionsIdleTimer = null;
  const TOP_ACTIONS_IDLE_DELAY = 2800; // 2.8秒无操作后淡化为沉浸态

  function resetTopActionsIdleTimer() {
    const topActions = document.getElementById('viewerTopActions');
    if (!topActions) return;

    // 唤醒：立即恢复完全清晰
    topActions.classList.remove('idle-dimmed');

    if (topActionsIdleTimer) {
      clearTimeout(topActionsIdleTimer);
      topActionsIdleTimer = null;
    }

    // 检查是否正被鼠标悬停或下拉菜单处于打开状态
    const langMenu = document.getElementById('viewerLangMenu');
    const isMenuOpen = langMenu && langMenu.classList.contains('open');
    let isHovered = false;
    try { isHovered = topActions.matches(':hover'); } catch (e) {}

    if (isMenuOpen || isHovered) return;

    topActionsIdleTimer = setTimeout(() => {
      const modalEl = document.getElementById('viewerModal');
      if (!modalEl || !modalEl.classList.contains('open')) return;

      const stillMenuOpen = langMenu && langMenu.classList.contains('open');
      let stillHovered = false;
      try { stillHovered = topActions.matches(':hover'); } catch (e) {}

      if (!stillMenuOpen && !stillHovered) {
        topActions.classList.add('idle-dimmed');
        topActions.classList.remove('expanded');
      }
    }, TOP_ACTIONS_IDLE_DELAY);
  }

  function initViewerTopActions() {
    const topActions = document.getElementById('viewerTopActions');
    const modalEl = document.getElementById('viewerModal');
    if (!topActions || !modalEl) return;

    modalEl.addEventListener('mousemove', resetTopActionsIdleTimer, { passive: true });
    modalEl.addEventListener('pointerdown', resetTopActionsIdleTimer, { passive: true });

    topActions.addEventListener('mouseleave', () => {
      resetTopActionsIdleTimer();
    });

    topActions.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#btnCloseViewer');
      if (closeBtn) return;

      if (e.target.closest('.lang-dropdown-btn') || e.target.closest('.lang-dropdown-menu') || e.target.closest('#toolToggleTheme')) {
        return;
      }

      if (!topActions.classList.contains('expanded')) {
        topActions.classList.add('expanded');
        resetTopActionsIdleTimer();
      }
    });
  }

  /* -------------------------------------------------------------
     Deep Zoom Viewer Modal & Palette Drawer
     ------------------------------------------------------------- */
  function bindViewerModalEvents() {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl || modalEl.dataset.bound) return;
    modalEl.dataset.bound = 'true';

    initViewerTopActions();

    const backdropEl = document.getElementById('viewerBackdrop');
    const closeBtn = document.getElementById('btnCloseViewer');
    const closeRightBtn = document.getElementById('btnCloseViewerRight');
    const prevBtn = document.getElementById('btnPrevArtwork');
    const nextBtn = document.getElementById('btnNextArtwork');
    const edgePrevBtn = document.getElementById('btnEdgePrev');
    const edgeNextBtn = document.getElementById('btnEdgeNext');
    const toggleInfoBtn = document.getElementById('btnToggleInfo');
    const drawerEl = document.getElementById('viewerMetaDrawer') || document.getElementById('viewerDrawer');
    const drawerCloseBtn = document.getElementById('btnCloseDrawer') || document.getElementById('btnDrawerClose');

    const toolReset = document.getElementById('toolReset');
    const toolRotate = document.getElementById('toolRotate');
    const toolFullscreen = document.getElementById('toolFullscreen');

    function requestCloseViewer() {
      if (currentHistoryLevel === 2 && window.history.length > 1) {
        window.history.back();
      } else {
        closeViewer(true);
      }
    }

    if (backdropEl) backdropEl.addEventListener('click', requestCloseViewer);
    if (closeBtn) closeBtn.addEventListener('click', requestCloseViewer);
    if (closeRightBtn) closeRightBtn.addEventListener('click', requestCloseViewer);
    if (prevBtn) prevBtn.addEventListener('click', () => navigateArtwork(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateArtwork(1));
    if (edgePrevBtn) edgePrevBtn.addEventListener('click', () => navigateArtwork(-1));
    if (edgeNextBtn) edgeNextBtn.addEventListener('click', () => navigateArtwork(1));

    const shareBtn = document.getElementById('btnShareArtwork');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSharePopover();
      });
    }

    const toolToggleLang = document.getElementById('toolToggleLang');
    if (toolToggleLang) {
      toolToggleLang.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.AtlasI18n && typeof window.AtlasI18n.toggle === 'function') {
          window.AtlasI18n.toggle();
        }
      });
    }


    const copyShareUrlBtn = document.getElementById('btnCopyShareUrl');
    if (copyShareUrlBtn) {
      copyShareUrlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentViewerIndex >= 0 && currentFilteredItems[currentViewerIndex]) {
          shareDirectLink(currentFilteredItems[currentViewerIndex]);
        }
      });
    }

    function getCurrentViewerItem() {
      if (currentViewerIndex >= 0 && currentFilteredItems[currentViewerIndex]) {
        return currentFilteredItems[currentViewerIndex];
      }
      if (currentViewerIndex >= 0 && galleryItems[currentViewerIndex]) {
        return galleryItems[currentViewerIndex];
      }
      const urlParams = new URLSearchParams(window.location.search);
      const artId = urlParams.get('id') || urlParams.get('art');
      if (artId) {
        const found = galleryItems.find(i => i.id === artId);
        if (found) return found;
      }
      return galleryItems[0] || null;
    }

    const btnShareOptLink = document.getElementById('btnShareOptLink');
    if (btnShareOptLink) {
      btnShareOptLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = getCurrentViewerItem();
        if (item) shareDirectLink(item, e);
      });
    }

    const btnShareOptQr = document.getElementById('btnShareOptQr');
    if (btnShareOptQr) {
      btnShareOptQr.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = getCurrentViewerItem();
        if (item) openShareQrModal(item);
      });
    }

    const btnShareOptPoster = document.getElementById('btnShareOptPoster');
    if (btnShareOptPoster) {
      btnShareOptPoster.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = getCurrentViewerItem();
        if (item) openSharePosterModal(item);
      });
    }

    // 二维码弹窗事件
    const btnCloseShareQr = document.getElementById('btnCloseShareQr');
    const shareQrBackdrop = document.getElementById('shareQrBackdrop');
    if (btnCloseShareQr) btnCloseShareQr.addEventListener('click', closeShareQrModal);
    if (shareQrBackdrop) shareQrBackdrop.addEventListener('click', closeShareQrModal);

    const btnShareQrCopyLink = document.getElementById('btnShareQrCopyLink');
    if (btnShareQrCopyLink) {
      btnShareQrCopyLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = getCurrentViewerItem();
        if (item) shareDirectLink(item, e);
      });
    }

    const btnShareQrDownload = document.getElementById('btnShareQrDownload');
    if (btnShareQrDownload) {
      btnShareQrDownload.addEventListener('click', (e) => {
        const item = getCurrentViewerItem();
        if (item) downloadQrCodeImage(item, e);
      });
    }

    // 典藏海报弹窗事件
    const btnCloseSharePoster = document.getElementById('btnCloseSharePoster');
    const btnClosePosterBottom = document.getElementById('btnClosePosterBottom');
    const sharePosterBackdrop = document.getElementById('sharePosterBackdrop');
    if (btnCloseSharePoster) btnCloseSharePoster.addEventListener('click', closeSharePosterModal);
    if (btnClosePosterBottom) btnClosePosterBottom.addEventListener('click', closeSharePosterModal);
    if (sharePosterBackdrop) sharePosterBackdrop.addEventListener('click', closeSharePosterModal);

    const btnDownloadPoster = document.getElementById('btnDownloadPoster');
    if (btnDownloadPoster) {
      btnDownloadPoster.addEventListener('click', downloadPosterImage);
    }

    // 初始化海报画幅多比例选单事件
    initPosterRatioEvents();

    // 点击外部空白收起分享锚点弹窗
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('shareDropdownWrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        closeSharePopover();
      }
    });

    function updateEdgeNextOffset() {
      if (!modalEl || !drawerEl) return;
      if (!drawerEl.classList.contains('open')) {
        modalEl.style.removeProperty('--drawer-offset');
        return;
      }
      const container = modalEl.querySelector('.viewer-container') || modalEl;
      const cW = container.offsetWidth || window.innerWidth;

      // 提取未经 CSS transform（如 scale(0.94) 展开动效）干扰的真实布局宽度与左边缘绝对定位
      let dLeft, dWidth;
      if (drawerEl.style.left && drawerEl.style.left !== 'auto') {
        dLeft = parseFloat(drawerEl.style.left);
        dWidth = parseFloat(drawerEl.style.width) || drawerEl.offsetWidth || 320;
      } else {
        dWidth = parseFloat(drawerEl.style.width) || drawerEl.offsetWidth || 320;
        const dRight = parseFloat(drawerEl.style.right) || 20;
        dLeft = cW - dRight - dWidth;
      }

      const distFromRight = cW - (dLeft + dWidth);
      // 只要抽屉停靠在屏幕右侧区域（与右侧下一张按钮产生水平干涉），即主动向左推开留出 24px 充裕呼吸间隔
      if (distFromRight < 120 && dLeft < cW - 40) {
        const neededRight = (cW - dLeft) + 24;
        modalEl.style.setProperty('--drawer-offset', `${Math.max(20, Math.round(neededRight))}px`);
      } else {
        modalEl.style.setProperty('--drawer-offset', '20px');
      }
    }

    function setDrawerOpen(isOpen) {
      if (!drawerEl) return;
      if (isOpen) {
        drawerEl.classList.add('open');
        if (toggleInfoBtn) toggleInfoBtn.classList.add('active');
        if (modalEl) modalEl.classList.add('drawer-open');
        updateEdgeNextOffset();
        setTimeout(updateEdgeNextOffset, 300);
        if (typeof drawerEl._updateSpine === 'function') {
          requestAnimationFrame(() => drawerEl._updateSpine());
        }
      } else {
        drawerEl.classList.remove('open');
        if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
        if (modalEl) modalEl.classList.remove('drawer-open');
        updateEdgeNextOffset();
        setTimeout(updateEdgeNextOffset, 300);
      }
    }

    function toggleDrawer() {
      if (!drawerEl) return;
      setDrawerOpen(!drawerEl.classList.contains('open'));
    }

    if (toggleInfoBtn && drawerEl) {
      toggleInfoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDrawer();
      });
    }

    if (drawerCloseBtn && drawerEl) {
      drawerCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrawerOpen(false);
      });
    }

    // 初始化比例控制器浮层与输入交互
    bindZoomControllerEvents();

    if (toolReset) {
      toolReset.addEventListener('click', () => {
        if (osdViewer) osdViewer.viewport.goHome();
      });
    }

    if (toolRotate) {
      toolRotate.addEventListener('click', () => {
        if (osdViewer) {
          const curr = osdViewer.viewport.getRotation();
          osdViewer.viewport.setRotation((curr + 90) % 360);
        }
      });
    }

    if (toolFullscreen) {
      toolFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          modalEl.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    const navPanel = document.getElementById('viewerNavigatorPanel');
    const navCloseBtn = document.getElementById('btnCloseNavigator');

    function closeNavigatorPanel(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!navPanel) return;
      navPanel.classList.add('closed');
    }

    function openNavigatorPanel() {
      if (!navPanel) return;
      navPanel.classList.remove('closed');
      if (osdViewer && osdViewer.navigator) {
        setTimeout(() => {
          if (osdViewer && osdViewer.navigator) {
            osdViewer.navigator.updateSize();
          }
        }, 50);
      }
    }

    function toggleNavigatorPanel(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!navPanel) return;
      if (navPanel.classList.contains('closed')) {
        openNavigatorPanel();
      } else {
        closeNavigatorPanel();
      }
    }

    if (navCloseBtn) {
      navCloseBtn.addEventListener('click', closeNavigatorPanel);
      navCloseBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      navCloseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      navCloseBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    }

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      modalEl.classList.toggle('fullscreen-mode', isFs);
      if (toolFullscreen) {
        toolFullscreen.innerHTML = isFs ? SVG_EXIT_FULLSCREEN : SVG_FULLSCREEN;
        toolFullscreen.title = isFs ? '退出全屏 (F / Esc)' : '全屏阅览 (F)';
      }
      if (isFs && drawerEl) {
        setDrawerOpen(false);
      }
      if (osdViewer && osdViewer.viewport) {
        setTimeout(() => {
          osdViewer.viewport.applyConstraints();
        }, 60);
      }
      if (osdViewer && osdViewer.navigator) {
        setTimeout(() => {
          if (currentFilteredItems[currentViewerIndex]) {
            updateNavigatorDimensions(currentFilteredItems[currentViewerIndex]);
          }
          if (osdViewer && osdViewer.navigator) {
            osdViewer.navigator.updateSize();
          }
        }, 80);
      }
      if (!isFs && headerEl) {
        headerEl.classList.remove('peek');
      }
    });

    const headerEl = modalEl.querySelector('.viewer-header');
    modalEl.addEventListener('mousemove', (e) => {
      if (!modalEl.classList.contains('fullscreen-mode') || !headerEl) return;
      if (e.clientY < 28) {
        headerEl.classList.add('peek');
      } else if (e.clientY > 72) {
        headerEl.classList.remove('peek');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!modalEl.classList.contains('open')) return;

      switch (e.key) {
        case 'Escape':
          const posterRatioMenu = document.getElementById('posterRatioMenu');
          const posterModal = document.getElementById('sharePosterModal');
          const qrModal = document.getElementById('shareQrModal');
          const popover = document.getElementById('sharePopover');
          const vLangMenu = document.getElementById('viewerLangMenu');
          const zoomPopover = document.getElementById('zoomPopover');
          if (posterRatioMenu && posterRatioMenu.classList.contains('open')) {
            posterRatioMenu.classList.remove('open');
            const ratioBtn = document.getElementById('btnPosterRatioDropdown');
            if (ratioBtn) ratioBtn.setAttribute('aria-expanded', 'false');
          } else if (zoomPopover && zoomPopover.classList.contains('open')) {
            zoomPopover.classList.remove('open');
            zoomPopover.setAttribute('aria-hidden', 'true');
            const zoomPill = document.getElementById('toolZoomPill');
            if (zoomPill) zoomPill.classList.remove('active');
            const chevronBtn = document.getElementById('btnZoomChevron');
            if (chevronBtn) chevronBtn.setAttribute('aria-expanded', 'false');
            const toolbar = zoomPopover.closest('.viewer-floating-toolbar') || zoomPopover.closest('.viewer-float-toolbar');
            if (toolbar) toolbar.classList.remove('popover-open');
            const viewerModal = document.getElementById('viewerModal');
            if (viewerModal) viewerModal.classList.remove('zoom-focus-active');
            const badgeBtn = document.getElementById('toolZoomBadge');
            if (badgeBtn) badgeBtn.setAttribute('aria-expanded', 'false');
          } else if (posterModal && posterModal.classList.contains('open')) {
            closeSharePosterModal();
          } else if (qrModal && qrModal.classList.contains('open')) {
            closeShareQrModal();
          } else if (popover && popover.classList.contains('open')) {
            closeSharePopover();
          } else if (vLangMenu && vLangMenu.classList.contains('open')) {
            vLangMenu.classList.remove('open');
            const vLangBtn = document.getElementById('viewerBtnLangDropdown');
            if (vLangBtn) vLangBtn.setAttribute('aria-expanded', 'false');
          } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else if (drawerEl && drawerEl.classList.contains('open')) {
            setDrawerOpen(false);
          } else {
            requestCloseViewer();
          }
          break;
        case 'ArrowLeft':
          navigateArtwork(-1);
          break;
        case 'ArrowRight':
          navigateArtwork(1);
          break;
        case '1':
          if (osdViewer && osdViewer.viewport) {
            const targetZoom = getZoomFromPhysicalPercent(osdViewer, 100);
            osdViewer.viewport.zoomTo(targetZoom);
            osdViewer.viewport.applyConstraints();
          }
          break;
        case '+':
        case '=':
          if (osdViewer && osdViewer.viewport) {
            osdViewer.viewport.zoomBy(1.3);
            osdViewer.viewport.applyConstraints();
          }
          break;
        case '-':
        case '_':
          if (osdViewer && osdViewer.viewport) {
            osdViewer.viewport.zoomBy(1 / 1.3);
            osdViewer.viewport.applyConstraints();
          }
          break;
        case '0':
        case 'Home':
          if (toolReset) toolReset.click();
          break;
        case 'r':
        case 'R':
          if (toolRotate) toolRotate.click();
          break;
        case 'f':
        case 'F':
          if (toolFullscreen) toolFullscreen.click();
          break;
        case 'i':
        case 'I':
          if (toggleInfoBtn) toggleInfoBtn.click();
          break;
        case 'n':
        case 'N':
          toggleNavigatorPanel();
          break;
        case 'Tab':
          e.preventDefault();
          if (toggleInfoBtn) toggleInfoBtn.click();
          break;
        case 'w':
        case 'W':
          if (e.altKey || e.shiftKey) {
            e.preventDefault();
            StealthWatermark.toggleReveal();
          }
          break;
        case 's':
        case 'S':
          shareCurrentArtwork();
          break;
      }
    });

    window.addEventListener('popstate', (e) => {
      const modalEl = document.getElementById('viewerModal');
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id') || urlParams.get('art');
      const state = e.state || {};

      if (id) {
        const item = findArtworkByQuery(id);
        if (item) {
          if (!modalEl || !modalEl.classList.contains('open') || currentFilteredItems[currentViewerIndex]?.id !== item.id) {
            openViewerByItem(item, false);
          }
        }
        currentHistoryLevel = 2;
      } else {
        if (modalEl && modalEl.classList.contains('open')) {
          closeViewer(false);
        }

        // 判断是否退回到了首屏 Level 0
        if (state.level === 0 || (!window.location.hash && !state.level)) {
          currentHistoryLevel = 0;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          currentHistoryLevel = 1;
        }
      }
    });

    window.addEventListener('themeChanged', () => {
      if (modalEl && modalEl.classList.contains('open') && currentFilteredItems[currentViewerIndex]) {
        updateAmbientBackdrop(currentFilteredItems[currentViewerIndex]);
      }
    });

    window.addEventListener('resize', () => {
      if (modalEl && modalEl.classList.contains('open') && currentFilteredItems[currentViewerIndex]) {
        updateNavigatorDimensions(currentFilteredItems[currentViewerIndex]);
        updateEdgeNextOffset();
        if (osdViewer && osdViewer.navigator) {
          osdViewer.navigator.updateSize();
        }
      }
    });

    // 初始化浮动面板拖拽与 resize
    if (drawerEl) initFloatingDrawer(drawerEl, updateEdgeNextOffset);

    // 初始化底部工具栏鼠标磁吸弹簧微动跟随特效 (Framer / Apple Pill Dock 物理质感)
    initMagneticDock();
  }

  /* -------------------------------------------------------------
     Magnetic Cursor Follow Dock (底部悬浮工具栏磁吸微动物理特效)
     参考 Framer Motion / Apple Dock 物理微动吸附与弹簧回弹算法
     ------------------------------------------------------------- */
  function initMagneticDock() {
    const dock = document.querySelector('.viewer-floating-toolbar');
    if (!dock || dock.dataset.magneticBound) return;
    dock.dataset.magneticBound = 'true';

    // 触屏设备（移动端/平板）自然支持直接触控，跳过鼠标磁吸微动以确保零开销
    if (window.matchMedia('(hover: none)').matches) return;

    const buttons = dock.querySelectorAll('.tool-btn');
    buttons.forEach(btn => {
      let rafId = null;
      let targetX = 0, targetY = 0, targetRotX = 0, targetRotY = 0, targetScale = 1;
      let currentX = 0, currentY = 0, currentRotX = 0, currentRotY = 0, currentScale = 1;
      let isHovered = false;
      const innerTarget = btn.querySelector('.icon, .tool-btn-text, span') || btn.firstElementChild;

      function renderFrame() {
        const springK = 0.22;
        currentX += (targetX - currentX) * springK;
        currentY += (targetY - currentY) * springK;
        currentRotX += (targetRotX - currentRotX) * springK;
        currentRotY += (targetRotY - currentRotY) * springK;
        currentScale += (targetScale - currentScale) * springK;

        if (!isHovered && 
            Math.abs(currentX) < 0.05 && 
            Math.abs(currentY) < 0.05 && 
            Math.abs(currentRotX) < 0.05 && 
            Math.abs(currentRotY) < 0.05 && 
            Math.abs(currentScale - 1) < 0.005) {
          currentX = 0;
          currentY = 0;
          currentRotX = 0;
          currentRotY = 0;
          currentScale = 1;
          btn.style.transform = '';
          if (innerTarget) innerTarget.style.transform = '';
          rafId = null;
          return;
        }

        // 3D 空间磁吸与透视倾角 + 放大
        btn.style.transform = 'perspective(360px) translate3d(' + currentX.toFixed(2) + 'px, ' + currentY.toFixed(2) + 'px, 0) ' +
                              'rotateX(' + currentRotX.toFixed(2) + 'deg) rotateY(' + currentRotY.toFixed(2) + 'deg) ' +
                              'scale(' + currentScale.toFixed(3) + ')';
        // 内部图标深景深微视差 (深度 6px)
        if (innerTarget) {
          innerTarget.style.transform = 'translate3d(' + (currentX * 0.3).toFixed(2) + 'px, ' + (currentY * 0.3).toFixed(2) + 'px, 6px)';
        }

        rafId = requestAnimationFrame(renderFrame);
      }

      btn.addEventListener('mouseenter', () => {
        isHovered = true;
        targetScale = 1.18;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;
        const dx = e.clientX - (rect.left + halfW);
        const dy = e.clientY - (rect.top + halfH);
        
        // 强化位移 (±12px) 与 3D 空间倾角 (±14deg)
        const maxPull = 12;
        const maxRot = 14;
        const normX = Math.max(-1, Math.min(1, dx / halfW));
        const normY = Math.max(-1, Math.min(1, dy / halfH));

        targetX = normX * maxPull;
        targetY = normY * maxPull;
        targetRotX = -normY * maxRot;
        targetRotY = normX * maxRot;
        targetScale = 1.18;

        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mousedown', () => {
        targetScale = 0.94;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mouseup', () => {
        targetScale = isHovered ? 1.18 : 1.0;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mouseleave', () => {
        isHovered = false;
        targetX = 0;
        targetY = 0;
        targetRotX = 0;
        targetRotY = 0;
        targetScale = 1.0;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });
    });

    // 挂载高质感自定义毛玻璃悬浮气泡提示，彻底替换浏览器原生 title 丑提示
    initDockTooltips();
  }

  /* -------------------------------------------------------------
     Custom Frosted Tooltips for Bottom Dock (工具栏高质感悬浮气泡)
     彻底消除操作系统/浏览器默认原生白底黑框 title，替换为全站统一毛玻璃气泡
     ------------------------------------------------------------- */
  function initDockTooltips() {
    const dock = document.querySelector('.viewer-floating-toolbar');
    const tooltipEl = document.getElementById('dockTooltip');
    const tooltipText = document.getElementById('dockTooltipText');
    const tooltipKbd = document.getElementById('dockTooltipKbd');
    if (!dock || !tooltipEl || !tooltipText) return;

    const interactiveItems = dock.querySelectorAll('.tool-btn, .tool-zoom-pill, .tool-zoom-badge, #btnZoomChevron');
    interactiveItems.forEach(el => {
      // 提取原生 title 或 data-i18n-title，并移除原生 title 属性以彻底屏蔽操作系统丑陋黑白提示框
      const rawTitle = el.getAttribute('title') || '';
      if (rawTitle) {
        el.dataset.customTip = rawTitle;
        el.removeAttribute('title');
      }

      function showTip() {
        let text = '';
        if (el.dataset.i18nTitle && window.AtlasI18n && typeof AtlasI18n.t === 'function') {
          text = AtlasI18n.t(el.dataset.i18nTitle) || el.dataset.customTip || '';
        } else {
          text = el.dataset.customTip || '';
        }
        if (!text) return;

        // 智能提取括号内的快捷键提示 (如 "(I)", "(0)", "(R)", "(F)", "(S)")
        const match = text.match(/^(.*?)\s*\(([^)]+)\)$/);
        if (match) {
          tooltipText.textContent = match[1].trim();
          tooltipKbd.textContent = match[2].trim();
          tooltipKbd.style.display = 'inline-flex';
        } else {
          tooltipText.textContent = text.trim();
          tooltipKbd.textContent = '';
          tooltipKbd.style.display = 'none';
        }

        // 精确对齐到当前按钮正上方
        const dockRect = dock.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const centerOffset = (elRect.left + elRect.width / 2) - dockRect.left;
        tooltipEl.style.left = centerOffset.toFixed(1) + 'px';
        tooltipEl.classList.add('visible');
      }

      function hideTip() {
        tooltipEl.classList.remove('visible');
      }

      el.addEventListener('mouseenter', showTip);
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('click', hideTip);
    });

    dock.addEventListener('mouseleave', () => {
      tooltipEl.classList.remove('visible');
    });
  }

  function updateNavigatorDimensions(item) {
    const navEl = document.getElementById('viewerNavigator');
    if (!navEl || !item) return;

    const isMobile = window.innerWidth <= 768;
    const maxW = isMobile ? 130 : 200;
    const maxH = isMobile ? 90 : 130;

    const imgW = item.width || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Width) || 2000;
    const imgH = item.height || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Height) || 2000;
    const aspect = (imgW > 0 && imgH > 0) ? (imgW / imgH) : 1;

    let targetW, targetH;
    if (aspect >= maxW / maxH) {
      targetW = maxW;
      targetH = Math.max(Math.round(maxW / aspect), 24);
    } else {
      targetH = maxH;
      targetW = Math.max(Math.round(maxH * aspect), 28);
    }

    const dominantColor = (item.colors && item.colors[0]) || (item.color && item.color[0]) || '#07080b';
    const borderOffset = 3; // 1.5px * 2 borders
    const navPanel = document.getElementById('viewerNavigatorPanel');
    if (navPanel) {
      navPanel.style.width = (targetW + borderOffset) + 'px';
      navPanel.style.height = (targetH + borderOffset) + 'px';
      navPanel.style.setProperty('--nav-bg', dominantColor);
    }

    navEl.style.width = targetW + 'px';
    navEl.style.height = targetH + 'px';
    navEl.style.setProperty('--nav-bg', dominantColor);
    navEl.style.setProperty('background-color', dominantColor, 'important');
    if (item && item.thumb) {
      navEl.style.backgroundImage = 'url("' + item.thumb + '")';
      navEl.style.backgroundSize = 'contain';
      navEl.style.backgroundRepeat = 'no-repeat';
      navEl.style.backgroundPosition = 'center';
    }
    // 同步更新 navigator 内所有层级容器与 canvas 背景，画布透明以便即时透出底图
    const navCanvas = navEl.querySelector('canvas');
    if (navCanvas) {
      navCanvas.style.setProperty('background-color', 'transparent', 'important');
    }
    const navContainer = navEl.querySelector('.openseadragon-container');
    if (navContainer) {
      navContainer.style.setProperty('background-color', 'transparent', 'important');
    }
    const navOsdCanvas = navEl.querySelector('.openseadragon-canvas');
    if (navOsdCanvas) {
      navOsdCanvas.style.setProperty('background-color', 'transparent', 'important');
    }

    updateNavigatorCloseButtonColor(item);
  }

  let activeAmbientLayer = 'A';

  function hexToRgb(hex) {
    if (!hex) return { r: 128, g: 128, b: 128 };
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    if (isNaN(num)) return { r: 128, g: 128, b: 128 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  // 动态分析画作右上角局部图面底色，并为右上角关闭按钮赋予自适应数学反色与高对比度
  function updateNavigatorCloseButtonColor(item) {
    const btn = document.getElementById('btnCloseNavigator');
    if (!btn) return;

    function applyColors(bgR, bgG, bgB) {
      // 基础明度 (Rec. 601 Luma 测定人眼感知亮度)
      const lum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

      // 计算数学反色 (Inverted RGB)
      let invR = 255 - bgR;
      let invG = 255 - bgG;
      let invB = 255 - bgB;

      // 视觉反差保底强化：若反色与底色亮度差距不足 110，做极性强化，保证在任何复杂地图图面上绝对清晰可辨
      const invLum = 0.299 * invR + 0.587 * invG + 0.114 * invB;
      if (Math.abs(invLum - lum) < 110) {
        if (lum < 128) {
          invR = Math.min(255, invR + 85);
          invG = Math.min(255, invG + 85);
          invB = Math.min(255, invB + 85);
        } else {
          invR = Math.max(0, invR - 85);
          invG = Math.max(0, invG - 85);
          invB = Math.max(0, invB - 85);
        }
      }

      const iconColor = 'rgb(' + invR + ', ' + invG + ', ' + invB + ')';
      // 微型底托采用半透毛玻璃质感，避免与地图复杂地物纹理混杂
      const btnBg = lum < 128 ? 'rgba(10, 14, 20, 0.62)' : 'rgba(255, 255, 255, 0.72)';
      const btnBorder = 'rgba(' + invR + ', ' + invG + ', ' + invB + ', 0.38)';

      btn.style.setProperty('--nav-btn-color', iconColor);
      btn.style.setProperty('--nav-btn-bg', btnBg);
      btn.style.setProperty('--nav-btn-border', btnBorder);
      btn.style.setProperty('--nav-btn-hover-bg', iconColor);
      btn.style.setProperty('--nav-btn-hover-color', 'rgb(' + bgR + ', ' + bgG + ', ' + bgB + ')');
    }

    function fallback() {
      if (item && item.colors && item.colors.length > 0) {
        const rgb = hexToRgb(item.colors[0]);
        applyColors(rgb.r, rgb.g, rgb.b);
      } else {
        applyColors(20, 24, 32);
      }
    }

    const thumbUrl = item && (item.thumb || (item.dzi && item.dzi.Image ? item.thumb : null));
    if (thumbUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { fallback(); return; }
          ctx.drawImage(img, 0, 0, 64, 64);
          // 采样右上角 (x: 50..60, y: 3..12) 对应关闭按钮落座图面位置
          const p = ctx.getImageData(50, 3, 10, 9).data;
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let i = 0; i < p.length; i += 4) {
            sumR += p[i];
            sumG += p[i + 1];
            sumB += p[i + 2];
            count++;
          }
          if (count > 0) {
            applyColors(Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count));
            return;
          }
        } catch (e) {}
        fallback();
      };
      img.onerror = fallback;
      img.src = thumbUrl;
    } else {
      fallback();
    }
  }

  // 空间多区域色彩提取：采样画作左侧、中心、右侧纵向切片的代表色，构建真实的空间色彩流向
  function extractSpatialColors(thumbUrl, callback) {
    if (!thumbUrl) {
      callback(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 18;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { callback(null); return; }
        ctx.drawImage(img, 0, 0, 32, 18);
        const imgData = ctx.getImageData(0, 0, 32, 18).data;

        // 采样左侧切片 (cols 0..7), 中央切片 (cols 12..19), 右侧切片 (cols 24..31)
        let lR = 0, lG = 0, lB = 0, lC = 0;
        let cR = 0, cG = 0, cB = 0, cC = 0;
        let rR = 0, rG = 0, rB = 0, rC = 0;

        for (let y = 0; y < 18; y++) {
          for (let x = 0; x < 32; x++) {
            const idx = (y * 32 + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const a = imgData[idx + 3];
            if (a < 64) continue;

            if (x <= 7) {
              lR += r; lG += g; lB += b; lC++;
            } else if (x >= 12 && x <= 19) {
              cR += r; cG += g; cB += b; cC++;
            } else if (x >= 24) {
              rR += r; rG += g; rB += b; rC++;
            }
          }
        }

        if (lC > 0 && rC > 0) {
          callback({
            left: { r: Math.round(lR / lC), g: Math.round(lG / lC), b: Math.round(lB / lC) },
            center: { r: Math.round(cR / (cC || 1)), g: Math.round(cG / (cC || 1)), b: Math.round(cB / (cC || 1)) },
            right: { r: Math.round(rR / rC), g: Math.round(rG / rC), b: Math.round(rB / rC) }
          });
          return;
        }
      } catch (e) {}
      callback(null);
    };
    img.onerror = () => callback(null);
    img.src = thumbUrl;
  }

  // 方案 B：微型 Canvas 降采样 + GPU 硬件高斯弥散环境光 (Apple Music / Spotify 级流光底板)
  const ambientCanvasCache = new Map();

  function updateAmbientBackdrop(item) {
    if (!item) return;
    const backdropEl = document.getElementById('viewerAmbientBackdrop');
    const layerA = document.getElementById('ambientGlowA');
    const layerB = document.getElementById('ambientGlowB');
    const meshLayer = document.getElementById('ambientMeshLayer');
    if (!layerA || !layerB) return;

    // Cross-fade between layers A and B for silky smooth transitions
    const nextLayer = (activeAmbientLayer === 'A') ? layerB : layerA;
    const prevLayer = (activeAmbientLayer === 'A') ? layerA : layerB;
    activeAmbientLayer = (activeAmbientLayer === 'A') ? 'B' : 'A';

    // 辅助函数：将已解码图像通过 24x24 离屏 Canvas 双线性低频采样，消除压缩色偏与高频噪点并生成弥散底图
    function applyAmbientData(source) {
      try {
        let dataUrl = ambientCanvasCache.get(item.id);
        let avgLum = 100;

        if (!dataUrl) {
          const canvas = document.createElement('canvas');
          canvas.width = 24;
          canvas.height = 24;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return false;

          // 核心：浏览器双线性插值把全图平滑收缩到 24x24，物理滤除 JPEG/WebP 块噪点和振铃杂色
          ctx.drawImage(source, 0, 0, 24, 24);

          // 采样明暗调性（加权亮度）
          const p = ctx.getImageData(0, 0, 24, 24).data;
          let sumLum = 0, count = 0;
          for (let i = 0; i < p.length; i += 16) {
            sumLum += 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
            count++;
          }
          avgLum = sumLum / (count || 1);

          dataUrl = canvas.toDataURL('image/webp', 0.85);
          if (!dataUrl || dataUrl.length < 50) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
          if (dataUrl) {
            ambientCanvasCache.set(item.id, dataUrl);
          }
        }

        if (dataUrl) {
          nextLayer.style.backgroundImage = 'url("' + dataUrl + '")';
          nextLayer.classList.add('active');
          prevLayer.classList.remove('active');
        }

        const isDarkArtwork = avgLum < 135;
        if (backdropEl) {
          backdropEl.classList.toggle('artwork-dark', isDarkArtwork);
          backdropEl.classList.toggle('artwork-light', !isDarkArtwork);
        }
        if (meshLayer) {
          meshLayer.classList.remove('active');
          meshLayer.style.background = 'none';
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    // 1. 优先：同步获取主页画廊卡片中已完成解码的 <img> 节点 (0ms 瞬时无白屏呈现)
    const renderedCardImg = document.querySelector('.gallery-card[data-id="' + item.id + '"] img.gallery-card-thumb');
    if (renderedCardImg && renderedCardImg.complete && renderedCardImg.naturalWidth > 0) {
      if (applyAmbientData(renderedCardImg)) return;
    }

    // 2. 检查缓存
    if (ambientCanvasCache.has(item.id)) {
      if (applyAmbientData(null)) return;
    }

    // 3. 次选：异步加载缩略图
    if (item.thumb) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        applyAmbientData(img);
      };
      img.onerror = () => {
        const fallbackColor = (item.colors && item.colors[0]) || '#12161D';
        nextLayer.style.backgroundImage = 'radial-gradient(circle at 50% 50%, ' + fallbackColor + ' 0%, #07080b 100%)';
        nextLayer.classList.add('active');
        prevLayer.classList.remove('active');
      };
      img.src = item.thumb;
    }
  }

  function openViewerByItem(item, isNewOpen = false) {
    if (!item) return;
    preViewerScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    let idx = currentFilteredItems.findIndex(i => i.id === item.id);
    if (idx === -1) {
      applyFilter('all');
      idx = currentFilteredItems.findIndex(i => i.id === item.id);
      if (idx === -1) {
        currentFilteredItems.unshift(item);
        idx = 0;
      }
    }
    currentViewerIndex = idx;
    showArtwork(item, isNewOpen);
  }

  function navigateArtwork(direction) {
    if (currentFilteredItems.length === 0) return;
    currentViewerIndex = (currentViewerIndex + direction + currentFilteredItems.length) % currentFilteredItems.length;
    showArtwork(currentFilteredItems[currentViewerIndex], false);
  }

  function updateArtworkMetadata(item) {
    if (!item) return;
    const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(item) : item;
    const vTitle = document.getElementById('viewerTitle');
    const vDims = document.getElementById('viewerDims');
    const mTitle = document.getElementById('mTitle');
    const mCat = document.getElementById('mCategory');
    const mAuthor = document.getElementById('mAuthor');
    const mDate = document.getElementById('mDate');
    const mDateRow = document.getElementById('mDateRow');
    const mRes = document.getElementById('mResolution');
    const mRatio = document.getElementById('mRatio');
    const mDesc = document.getElementById('mDescription');

    if (vTitle) vTitle.textContent = locItem.title;

    // 依当前展品主底色智能计算反色（深底图->纯白字；浅底图->纯净深黑字，彻底杜绝白雾晕染）
    let isDarkArtwork = true;
    if (item && item.colors && item.colors.length > 0) {
      const hex = String(item.colors[0]).replace(/^#/, '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        isDarkArtwork = lum < 135;
      }
    }
    const badgeEl = document.getElementById('viewerArtworkBadge');
    if (badgeEl) {
      badgeEl.setAttribute('data-artwork-tone', isDarkArtwork ? 'dark' : 'light');
    }

    const qmfEl = document.getElementById('viewerQmapFlow');
    if (qmfEl) {
      let precision = '100';
      if (item && item.workflow && item.workflow.QGIS) {
        precision = String(item.workflow.QGIS).replace(/%/g, '').trim();
      }
      qmfEl.innerHTML = getQMapFlowSvg(precision);
      const qmfTitle = window.AtlasI18n && window.AtlasI18n.getLang() === 'en'
        ? `QMapFlow: QGIS Cartography Workflow ${precision}%`
        : (window.AtlasI18n && window.AtlasI18n.getLang() === 'ja'
          ? `QMapFlow: QGIS 独立作図比率 ${precision}%`
          : (window.AtlasI18n && window.AtlasI18n.getLang() === 'ko'
            ? `QMapFlow: QGIS 단독 지도 제작 비중 ${precision}%`
            : `QMapFlow: QGIS 独立制图内容占比 ${precision}%`));
      qmfEl.title = qmfTitle;
      if (!qmfEl.dataset.qmfBound) {
        qmfEl.dataset.qmfBound = 'true';
        qmfEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open('https://github.com/OpenQGIS/QMapFlow', '_blank', 'noopener,noreferrer');
        });
      }
    }
    if (vDims) vDims.textContent = item.width + ' × ' + item.height + ' px';
    if (mTitle) mTitle.textContent = locItem.title;
    if (mCat) mCat.textContent = locItem.categoryName + (locItem.subCategory ? ' · ' + locItem.subCategory : '');
    if (mAuthor) mAuthor.textContent = locItem.author || 'OpenQGIS';

    // 日期仅显示年月
    const rawDate = locItem.date || locItem.year || item.date || item.year;
    const formattedDate = formatYearMonth(rawDate);
    if (mDate) mDate.textContent = formattedDate || '-';
    if (mDateRow) mDateRow.style.display = formattedDate ? '' : 'none';

    if (mRes) mRes.textContent = locItem.physicalSize || (item.width + ' × ' + item.height + ' px');
    if (mRatio) {
      if (item.aspectRatio) {
        mRatio.textContent = item.aspectRatio + ' : 1';
      } else if (item.width && item.height) {
        mRatio.textContent = (item.width / item.height).toFixed(2) + ' : 1';
      } else {
        mRatio.textContent = '-';
      }
    }
    if (mDesc) {
      if (locItem.descriptionHtml) {
        mDesc.innerHTML = locItem.descriptionHtml;
      } else {
        mDesc.textContent = locItem.description || '';
      }
    }

    const drawerEl = document.getElementById('viewerMetaDrawer') || document.getElementById('viewerDrawer');
    if (drawerEl && typeof drawerEl._updateSpine === 'function') {
      const content = drawerEl.querySelector('.drawer-content');
      if (content) content.scrollTop = 0;
      requestAnimationFrame(() => drawerEl._updateSpine());
    }
  }

  function showArtwork(item, isNewOpen = false) {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl) return;

    if (!modalEl.classList.contains('open')) {
      preViewerScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('viewer-open');
    document.body.classList.add('viewer-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.scrollbarGutter = 'auto';
    document.body.style.scrollbarGutter = 'auto';
    resetTopActionsIdleTimer();

    updateAmbientBackdrop(item);
    updateArtworkMetadata(item);

    const mSwatches = document.getElementById('mPalette');
    const t = window.AtlasI18n ? window.AtlasI18n.t : (k => k);
    const activeItem = item;

    // Extract dominant palette
    if (mSwatches) {
      mSwatches.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">' + t('metaPaletteExtracting') + '</span>';
      extractDominantColors(item, 5, function (colors) {
        if (!modalEl.classList.contains('open')) return;
        if (currentViewerIndex >= 0 && galleryItems[currentViewerIndex] && galleryItems[currentViewerIndex].id !== activeItem.id) return;
        mSwatches.innerHTML = '';
        if (!colors || colors.length === 0) {
          mSwatches.innerHTML = '<span style="font-size:0.72rem;color:var(--text-muted);">' + t('metaPaletteEmpty') + '</span>';
          return;
        }
        colors.forEach(function (hex) {
          const btn = document.createElement('button');
          btn.className = 'meta-swatch';
          btn.title = t('metaPaletteHint') + hex;
          btn.innerHTML = '<span class="meta-swatch-dot" style="background-color: ' + hex + ';"></span>' +
                          '<span class="meta-swatch-hex">' + hex + '</span>';
          btn.addEventListener('click', function () {
            copyToClipboard(hex);
            btn.classList.add('copied');
            const hexSpan = btn.querySelector('.meta-swatch-hex');
            if (hexSpan) hexSpan.textContent = t('metaPaletteCopied');
            setTimeout(function () {
              btn.classList.remove('copied');
              if (hexSpan) hexSpan.textContent = hex;
            }, 1400);
          });
          mSwatches.appendChild(btn);
        });
      });
    }

    const mShareUrl = document.getElementById('metaShareUrl');
    const shareUrl = getShareUrlForItem(item);
    if (mShareUrl) {
      mShareUrl.textContent = shareUrl;
      mShareUrl.title = shareUrl;
    }

    updateBrowserUrl(item, isNewOpen);

    loadOpenSeadragon(item);
  }

  function ensureNavigatorElement(item) {
    const navBody = document.getElementById('navigatorBody');
    if (navBody) {
      navBody.innerHTML = '';
    }
    const navEl = document.createElement('div');
    navEl.id = 'viewerNavigator';
    navEl.className = 'viewer-navigator';
    if (navBody) {
      navBody.appendChild(navEl);
    }
    if (navEl && item) {
      updateNavigatorDimensions(item);
    }
    return navEl;
  }

  function loadOpenSeadragon(item) {
    const stage = document.getElementById('osdStage');
    if (!stage) return;
    stage.innerHTML = '';

    if (osdViewer) {
      try { osdViewer.destroy(); } catch (e) {}
      osdViewer = null;
    }

    // 确保在 osdViewer 销毁后重建导航器 DOM 节点，杜绝 null (setting 'id')
    const navEl = ensureNavigatorElement(item);

    const isDark = (document.documentElement.getAttribute('data-theme') !== 'light');
    const stageBg = isDark ? '#07080b' : '#e5e8ed';

    const config = window.ATLAS_CONFIG || window.CANGFENG_CONFIG || {};
    const assetBase = (config.assetBaseUrl || '').replace(/\/+$/, '');

    // Resolve tileBase URL (support remote Cloudflare CDN or local tiles)
    let tileBase = (item.tileUrl || (item.dzi && item.dzi.Image && item.dzi.Image.Url) || '');
    if (assetBase && !tileBase.startsWith('http')) {
      tileBase = assetBase + '/' + tileBase.replace(/^\/+/, '');
    }
    tileBase = tileBase.replace(/\/+$/, '') + '/';

    const tileWidth = item.width || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Width) || 2000;
    const tileHeight = item.height || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Height) || 2000;
    const tileMaxLevel = item.maxLevel !== undefined ? item.maxLevel : Math.ceil(Math.log2(Math.max(tileWidth, tileHeight)));

    const tileSource = {
      width: tileWidth,
      height: tileHeight,
      tileSize: item.tileSize || 256,
      tileOverlap: item.overlap || 0,
      minLevel: 0,
      maxLevel: tileMaxLevel,
      getTileUrl: function (level, x, y) {
        return tileBase + level + '/' + x + '_' + y + '.' + (item.format || 'webp');
      }
    };

    try {
      const dominantColor = (item.colors && item.colors[0]) || (item.color && item.color[0]) || '#07080b';

      osdViewer = OpenSeadragon({
        element: stage,
        prefixUrl: '',
        showNavigationControl: false,
        showNavigator: true,
        navigatorElement: navEl,
        navigatorId: 'viewerNavigator',
        navigatorAutoFade: false,
        navigatorRotate: true,
        navigatorBackground: dominantColor,
        autoResize: true,
        animationTime: 0.45,
        blendTime: 0.15,
        constrainDuringPan: true,
        maxZoomPixelRatio: 4.5,
        minZoomImageRatio: 0.1,
        minZoomLevel: 0.001,
        visibilityRatio: 0.9,
        wrapHorizontal: false,
        wrapVertical: false,
        tileSources: tileSource,
        placeholderImage: item.thumb,
        immediateRender: true,
        placeholderFillStyle: 'transparent',
        crossOriginPolicy: false,
        ajaxWithCredentials: false,
        backgroundColor: 'transparent'
      });

      StealthWatermark.init(stage, item);

      osdViewer.addHandler('update-viewport', function () {
        StealthWatermark.burnIn(osdViewer);
      });

      // 鹰眼导航器视野范围框边界自适应约束：消除 OSD 边框扣减偏差，并在全览总图时精准满格贴边
      function clampNavigatorDisplayRegion() {
        if (!osdViewer || !osdViewer.navigator) return;
        const nav = osdViewer.navigator;
        const dr = nav.displayRegion;
        if (!dr || !nav.element) return;
        const navW = nav.element.clientWidth || parseFloat(nav.element.style.width) || 0;
        const navH = nav.element.clientHeight || parseFloat(nav.element.style.height) || 0;
        if (navW <= 0 || navH <= 0) return;

        let l = parseFloat(dr.style.left) || 0;
        let t = parseFloat(dr.style.top) || 0;
        let w = parseFloat(dr.style.width) || 0;
        let h = parseFloat(dr.style.height) || 0;

        // OSD 在 content-box 假设下计算时预先扣减了 totalBorderWidths (3px)。
        // 本项目中 .displayregion 为 border-box，需补回该 3px 边框扣减，避免底部/右侧缩水 3px 空隙：
        const borderCompensation = (nav.totalBorderWidths && nav.totalBorderWidths.x) || 3;
        w += borderCompensation;
        h += borderCompensation;

        let r = l + w;
        let b = t + h;

        let clampedL = Math.max(0, Math.min(navW, l));
        let clampedT = Math.max(0, Math.min(navH, t));
        let clampedR = Math.max(0, Math.min(navW, r));
        let clampedB = Math.max(0, Math.min(navH, b));

        // 全览贴边吸附：在视口贴近整图四界时（容差 <= 2.5px），无缝贴紧图框边缘，消弭亚像素浮点折损
        if (clampedL <= 2.5) clampedL = 0;
        if (clampedT <= 2.5) clampedT = 0;
        if (navW - clampedR <= 2.5) clampedR = navW;
        if (navH - clampedB <= 2.5) clampedB = navH;

        let clampedW = Math.max(0, clampedR - clampedL);
        let clampedH = Math.max(0, clampedB - clampedT);

        dr.style.left = clampedL.toFixed(1) + 'px';
        dr.style.top = clampedT.toFixed(1) + 'px';
        dr.style.width = clampedW.toFixed(1) + 'px';
        dr.style.height = clampedH.toFixed(1) + 'px';
      }

      if (osdViewer && osdViewer.navigator && typeof osdViewer.navigator.update === 'function') {
        const origNavUpdate = osdViewer.navigator.update.bind(osdViewer.navigator);
        osdViewer.navigator.update = function (viewport) {
          origNavUpdate(viewport);
          clampNavigatorDisplayRegion();
        };
      }

      osdViewer.addHandler('update-viewport', clampNavigatorDisplayRegion);

      // 鹰眼导航器白边根治与底图透出：OSD 初始化后强制覆盖背景色、容器层级与精确重排画布
      function fixNavigatorBackground() {
        const navEl = document.getElementById('viewerNavigator');
        if (!navEl) return;
        const dominantColor = (item.colors && item.colors[0]) || (item.color && item.color[0]) || '#07080b';
        navEl.style.setProperty('--nav-bg', dominantColor);
        navEl.style.setProperty('background-color', dominantColor, 'important');
        if (item && item.thumb) {
          navEl.style.backgroundImage = 'url("' + item.thumb + '")';
          navEl.style.backgroundSize = 'contain';
          navEl.style.backgroundRepeat = 'no-repeat';
          navEl.style.backgroundPosition = 'center';
        }
        
        const container = navEl.querySelector('.openseadragon-container');
        if (container) {
          container.style.setProperty('background-color', 'transparent', 'important');
        }
        const osdCanvas = navEl.querySelector('.openseadragon-canvas');
        if (osdCanvas) {
          osdCanvas.style.setProperty('background-color', 'transparent', 'important');
        }
        const canvas = navEl.querySelector('canvas');
        if (canvas) {
          canvas.style.setProperty('display', 'block', 'important');
          canvas.style.setProperty('width', '100%', 'important');
          canvas.style.setProperty('height', '100%', 'important');
          canvas.style.setProperty('background-color', 'transparent', 'important');
        }
        if (osdViewer && osdViewer.navigator) {
          osdViewer.navigator.updateSize();
          clampNavigatorDisplayRegion();
        }
      }
      osdViewer.addHandler('open', function () {
        setTimeout(fixNavigatorBackground, 0);
        setTimeout(fixNavigatorBackground, 80);
        setTimeout(fixNavigatorBackground, 250);
        setTimeout(() => {
          renderDynamicZoomPresets(item);
        }, 80);
      });

      osdViewer.addHandler('zoom', function () {
        updateZoomUI();
      });

      // 移动端在移动或捏合画布时，自动关闭过高的信息抽屉，提升浏览沉浸感
      function autoCloseDrawerOnMobileCanvasMove() {
        if (window.innerWidth <= 768) {
          const drawerEl = document.getElementById('viewerMetaDrawer') || document.getElementById('viewerDrawer');
          if (drawerEl && drawerEl.classList.contains('open')) {
            const toggleInfoBtn = document.getElementById('btnToggleInfo');
            const modalEl = document.getElementById('viewerModal');
            drawerEl.classList.remove('open');
            if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
            if (modalEl) modalEl.classList.remove('drawer-open');
          }
        }
      }

      osdViewer.addHandler('canvas-drag', () => {
        autoCloseDrawerOnMobileCanvasMove();
        resetTopActionsIdleTimer();
      });
      osdViewer.addHandler('canvas-pinch', () => {
        autoCloseDrawerOnMobileCanvasMove();
        resetTopActionsIdleTimer();
      });
      osdViewer.addHandler('canvas-scroll', resetTopActionsIdleTimer);

      let tileFailCount = 0;
      let hasFailedOver = false;

      osdViewer.addHandler('tile-load-failed', function (e) {
        console.warn('OpenSeadragon tile-load-failed:', e);
        tileFailCount++;
        // 若远程切片请求连续失败（如移动端 GFW 拦截 *.workers.dev），自动优雅降级
        if (!hasFailedOver && tileFailCount >= 3) {
          hasFailedOver = true;
          console.warn('CangFeng: 远程瓦片请求受阻，正在自动无缝切换到本地同源切片/高清预览模式...');
          // 若原先使用的是远程 HTTP CDN，先尝试切换为本地同源相对路径 tiles/
          if (tileBase.startsWith('http')) {
            const localBase = 'tiles/' + item.id + '_files/';
            const fallbackTileSource = Object.assign({}, tileSource, {
              getTileUrl: function (level, x, y) {
                return localBase + level + '/' + x + '_' + y + '.' + (item.format || 'webp');
              }
            });
            try {
              osdViewer.open(fallbackTileSource);
              return;
            } catch (err) {
              console.warn('CangFeng: 本地瓦片加载尝试失败，将转入单图全览模式:', err);
            }
          }
          // 最终兜底：使用已成功加载的缩略/预览图全幅深览
          try {
            osdViewer.open({
              type: 'image',
              url: item.thumb
            });
          } catch (err2) {
            console.error('CangFeng: 占位预览图降级失败:', err2);
          }
        }
      });

      osdViewer.addHandler('open-failed', function (e) {
        console.error('OpenSeadragon open-failed:', e);
        try {
          osdViewer.open({
            type: 'image',
            url: item.thumb
          });
        } catch (err) {
          if (stage) {
            stage.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ff5555;font-family:var(--font-mono);">' +
              '[Error] 瓦片加载失败，请检查网络连接。</div>';
          }
        }
      });
    } catch (err) {
      console.error('OpenSeadragon init failed:', err);
      // 若因 Navigator 相关 DOM 问题失败，尝试无 Navigator 纯深览模式自愈恢复
      if (stage && !osdViewer) {
        try {
          osdViewer = OpenSeadragon({
            element: stage,
            prefixUrl: '',
            showNavigationControl: false,
            showNavigator: false,
            tileSources: tileSource,
            placeholderImage: item.thumb,
            immediateRender: true,
            crossOriginPolicy: false,
            backgroundColor: 'transparent'
          });
          console.warn('OpenSeadragon: 已自动降级为无导航图深览模式');
          return;
        } catch (retryErr) {
          console.error('OpenSeadragon retry without navigator also failed:', retryErr);
        }
      }
      if (stage) {
        stage.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ff5555;font-family:var(--font-mono);">' +
          '[Error] 瓦片初始化失败：' + (err.message || err) + '</div>';
      }
    }
  }

  /* -------------------------------------------------------------
     浮动信息面板 · 拖拽移动 & 8向 Resize 引擎
     ------------------------------------------------------------- */
  function initFloatingDrawer(el, onRectChange) {
    if (el._floatInited) return;
    el._floatInited = true;

    const MIN_W = 240, MIN_H = 200;
    const MARGIN = 16;

    function getRect() {
      return {
        left:   parseFloat(el.style.left)   || el.offsetLeft,
        top:    parseFloat(el.style.top)    || el.offsetTop,
        width:  parseFloat(el.style.width)  || el.offsetWidth,
        height: parseFloat(el.style.height) || el.offsetHeight
      };
    }

    function clamp(r) {
      var vw = el.parentElement ? el.parentElement.offsetWidth  : window.innerWidth;
      var vh = el.parentElement ? el.parentElement.offsetHeight : window.innerHeight;
      r.width  = Math.max(MIN_W, Math.min(r.width,  vw - MARGIN));
      r.height = Math.max(MIN_H, Math.min(r.height, vh - MARGIN));
      r.left   = Math.max(MARGIN, Math.min(r.left, vw - r.width  - MARGIN));
      r.top    = Math.max(MARGIN, Math.min(r.top,  vh - r.height - MARGIN));
      return r;
    }

    function applyRect(r) {
      el.style.left   = r.left   + 'px';
      el.style.top    = r.top    + 'px';
      el.style.width  = r.width  + 'px';
      el.style.height = r.height + 'px';
      el.style.right  = 'auto';
      el.style.bottom = 'auto';
      if (typeof onRectChange === 'function') onRectChange();
    }

    // ── 拖拽：标题栏 ──
    var dragHandle = el.querySelector('#drawerDragHandle') || el.querySelector('.drawer-header');
    var dragState  = null;

    function onDragStart(e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      var r = getRect();
      var t = e.touches ? e.touches[0] : e;
      dragState = { sx: t.clientX, sy: t.clientY, ol: r.left, ot: r.top };
      el.classList.add('dragging');
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup',   onDragEnd);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend',  onDragEnd);
    }

    function onDragMove(e) {
      if (!dragState) return;
      e.preventDefault();
      var t  = e.touches ? e.touches[0] : e;
      var r  = getRect();
      applyRect(clamp({ left: dragState.ol + t.clientX - dragState.sx, top: dragState.ot + t.clientY - dragState.sy, width: r.width, height: r.height }));
    }

    function onDragEnd() {
      dragState = null;
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup',   onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend',  onDragEnd);
    }

    if (dragHandle) {
      dragHandle.addEventListener('mousedown',  onDragStart);
      dragHandle.addEventListener('touchstart', onDragStart, { passive: false });
    }

    // ── 8向 Resize ──
    var resizeState = null;

    function onResizeStart(e) {
      e.preventDefault();
      e.stopPropagation();
      var dir = e.currentTarget.dataset.dir;
      var r   = getRect();
      var t   = e.touches ? e.touches[0] : e;
      resizeState = { dir: dir, sx: t.clientX, sy: t.clientY, orig: { left: r.left, top: r.top, width: r.width, height: r.height } };
      el.classList.add('dragging');
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup',   onResizeEnd);
      document.addEventListener('touchmove', onResizeMove, { passive: false });
      document.addEventListener('touchend',  onResizeEnd);
    }

    function onResizeMove(e) {
      if (!resizeState) return;
      e.preventDefault();
      var t    = e.touches ? e.touches[0] : e;
      var dx   = t.clientX - resizeState.sx;
      var dy   = t.clientY - resizeState.sy;
      var o    = resizeState.orig;
      var dir  = resizeState.dir;
      var left = o.left, top = o.top, width = o.width, height = o.height;
      if (dir.indexOf('e') >= 0) { width  = o.width  + dx; }
      if (dir.indexOf('s') >= 0) { height = o.height + dy; }
      if (dir.indexOf('w') >= 0) { width  = o.width  - dx; left = o.left + dx; }
      if (dir.indexOf('n') >= 0) { height = o.height - dy; top  = o.top  + dy; }
      applyRect(clamp({ left: left, top: top, width: width, height: height }));
    }

    function onResizeEnd() {
      resizeState = null;
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup',   onResizeEnd);
      document.removeEventListener('touchmove', onResizeMove);
      document.removeEventListener('touchend',  onResizeEnd);
    }

    el.querySelectorAll('.drawer-resize-handle').forEach(function(h) {
      h.addEventListener('mousedown',  onResizeStart);
      h.addEventListener('touchstart', onResizeStart, { passive: false });
    });

    // 视口变化时防溢出
    window.addEventListener('resize', function() {
      if (!el.classList.contains('open')) return;
      applyRect(clamp(getRect()));
    });

    // 阻止信息面板滚轮穿透冒泡，确保滚动条完全独占受控
    const drawerContent = el.querySelector('.drawer-content');
    if (drawerContent) {
      drawerContent.addEventListener('wheel', function(e) {
        e.stopPropagation();
      }, { passive: true });
    }

    initDrawerAnchorSpine(el);
  }

  function initDrawerAnchorSpine(el) {
    const spine = el.querySelector('#drawerAnchorSpine');
    const content = el.querySelector('.drawer-content');
    if (!spine || !content) return;

    const progressBar = spine.querySelector('#spineProgressBar');
    const nodes = spine.querySelectorAll('.spine-node');

    function updateSpine() {
      const scrollTop = content.scrollTop;
      const scrollHeight = content.scrollHeight;
      const clientHeight = content.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      if (progressBar) {
        const percent = (maxScroll > 0) ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;
        progressBar.style.height = percent + '%';
      }

      let activeIndex = 0;
      nodes.forEach((node, idx) => {
        const targetId = node.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const topDiff = targetEl.offsetTop - content.offsetTop - scrollTop;
          if (topDiff <= 36) {
            activeIndex = idx;
          }
        }
      });

      if (maxScroll > 0 && scrollTop >= maxScroll - 20) {
        activeIndex = nodes.length - 1;
      }

      nodes.forEach((node, idx) => {
        if (idx === activeIndex) {
          node.classList.add('active');
        } else {
          node.classList.remove('active');
        }
      });
    }

    content.addEventListener('scroll', function() {
      requestAnimationFrame(updateSpine);
    }, { passive: true });

    nodes.forEach(function(node) {
      node.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const targetId = node.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const targetOffset = targetEl.offsetTop - content.offsetTop;
          content.scrollTo({
            top: Math.max(0, targetOffset),
            behavior: 'smooth'
          });
        }
      });
    });

    el._updateSpine = updateSpine;
    updateSpine();
  }

  function closeViewer(updateHistory = true) {
    StealthWatermark.destroy();
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('viewer-open');
    document.body.classList.remove('viewer-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.documentElement.style.scrollbarGutter = '';
    document.body.style.scrollbarGutter = '';

    // 关键步骤 1：解除锁定后第一时间立即将滚动位置锁死在 preViewerScrollY，防止浏览器重绘置零
    if (typeof preViewerScrollY === 'number' && preViewerScrollY >= 0) {
      window.scrollTo({ top: preViewerScrollY, behavior: 'instant' });
    }

    const drawerEl = document.getElementById('viewerMetaDrawer') || document.getElementById('viewerDrawer');
    if (drawerEl) drawerEl.classList.remove('open');
    const toggleInfoBtn = document.getElementById('btnToggleInfo');
    if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
    modalEl.classList.remove('drawer-open');
    modalEl.style.removeProperty('--drawer-offset');
    closeSharePopover();
    closeShareQrModal();
    closeSharePosterModal();
    if (window.closeAtlasLangDropdowns) window.closeAtlasLangDropdowns();

    if (topActionsIdleTimer) {
      clearTimeout(topActionsIdleTimer);
      topActionsIdleTimer = null;
    }
    const topActions = document.getElementById('viewerTopActions');
    if (topActions) {
      topActions.classList.remove('idle-dimmed', 'expanded');
    }

    const zoomPopover = document.getElementById('zoomPopover');
    const zoomPill = document.getElementById('toolZoomPill');
    const zoomChevron = document.getElementById('btnZoomChevron');
    if (zoomPopover) {
      zoomPopover.classList.remove('open');
      zoomPopover.setAttribute('aria-hidden', 'true');
    }
    if (zoomPill) zoomPill.classList.remove('active');
    if (zoomChevron) zoomChevron.setAttribute('aria-expanded', 'false');
    const floatToolbar = document.querySelector('.viewer-floating-toolbar') || document.querySelector('.viewer-float-toolbar');
    if (floatToolbar) floatToolbar.classList.remove('popover-open');
    modalEl.classList.remove('zoom-focus-active');

    if (osdViewer) {
      try { osdViewer.destroy(); } catch (e) {}
      osdViewer = null;
    }
    const stage = document.getElementById('osdStage');
    if (stage) stage.innerHTML = '';
    ensureNavigatorElement(null);
    const navPanel = document.getElementById('viewerNavigatorPanel');
    if (navPanel) navPanel.classList.remove('closed');

    const glowA = document.getElementById('ambientGlowA');
    const glowB = document.getElementById('ambientGlowB');
    const meshLayer = document.getElementById('ambientMeshLayer');
    if (glowA) {
      glowA.classList.remove('active');
      glowA.style.backgroundImage = 'none';
    }
    if (glowB) {
      glowB.classList.remove('active');
      glowB.style.backgroundImage = 'none';
    }
    if (meshLayer) {
      meshLayer.classList.remove('active');
      meshLayer.style.background = 'none';
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (updateHistory) {
      clearBrowserUrl();
    }

    // 关键步骤 2：下一帧平滑/居中对齐目标卡片
    const currentItem = (currentFilteredItems && currentFilteredItems[currentViewerIndex]) || null;
    const targetCard = currentItem ? (document.getElementById('artCard_' + currentItem.id) || document.querySelector('.gallery-card[data-id="' + currentItem.id + '"]')) : null;

    requestAnimationFrame(() => {
      if (targetCard) {
        targetCard.scrollIntoView({ block: 'center', behavior: 'auto' });
      } else if (typeof preViewerScrollY === 'number' && preViewerScrollY >= 0) {
        window.scrollTo({ top: preViewerScrollY, behavior: 'instant' });
      }
    });
  }

  /* -------------------------------------------------------------
     Single Artwork Direct Share & Deep Linking
     ------------------------------------------------------------- */
  function getShareUrlForItem(item) {
    if (!item) return window.location.href;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('art');
      url.searchParams.set('id', item.id);
      url.hash = '';
      return url.toString();
    } catch (e) {
      return window.location.origin + window.location.pathname + '?id=' + encodeURIComponent(item.id);
    }
  }

  function toggleSharePopover(force) {
    const popover = document.getElementById('sharePopover');
    const shareBtn = document.getElementById('btnShareArtwork');
    const modalEl = document.getElementById('viewerModal');
    if (!popover || !shareBtn) return;
    const shouldOpen = typeof force === 'boolean' ? force : !popover.classList.contains('open');
    if (shouldOpen) {
      popover.classList.add('open');
      popover.setAttribute('aria-hidden', 'false');
      shareBtn.setAttribute('aria-expanded', 'true');
      modalEl?.classList.add('share-focus-active');
    } else {
      popover.classList.remove('open');
      popover.setAttribute('aria-hidden', 'true');
      shareBtn.setAttribute('aria-expanded', 'false');
      modalEl?.classList.remove('share-focus-active');
    }
  }

  function closeSharePopover() {
    toggleSharePopover(false);
  }

  function shareCurrentArtwork() {
    toggleSharePopover();
  }

  function showCursorTip(e, text) {
    const isEn = window.AtlasI18n && (typeof window.AtlasI18n.getLang === 'function' ? window.AtlasI18n.getLang() : window.AtlasI18n.getCurrentLang()) === 'en';
    const msg = text || (isEn ? 'Link Copied ✓' : '网址已复制 ✓');
    const tip = document.createElement('div');
    tip.className = 'cursor-toast-pill';
    tip.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>' + escapeHtml(msg) + '</span>';
    
    let x, y;
    if (e && typeof e.clientX === 'number' && e.clientX > 0) {
      x = e.clientX;
      y = e.clientY - 12;
    } else {
      const activeEl = (e && e.target) || document.activeElement;
      if (activeEl && activeEl.getBoundingClientRect) {
        const r = activeEl.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top - 8;
      } else {
        x = window.innerWidth / 2;
        y = window.innerHeight - 80;
      }
    }
    
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    document.body.appendChild(tip);
    
    setTimeout(() => {
      tip.classList.add('fade-out');
      setTimeout(() => {
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      }, 250);
    }, 900);
  }

  function shareDirectLink(item, e) {
    if (!item) return;
    const url = getShareUrlForItem(item);
    copyToClipboard(url);

    showCursorTip(e);

    const linkBtn = document.getElementById('btnShareOptLink');
    if (linkBtn) {
      const titleEl = linkBtn.querySelector('.share-item-title');
      const origText = titleEl ? titleEl.textContent : '';
      if (titleEl) titleEl.textContent = (window.AtlasI18n && window.AtlasI18n.getCurrentLang() === 'en') ? 'Copied Link ✓' : '已复制网址 ✓';
      linkBtn.classList.add('copied');
      setTimeout(() => {
        if (titleEl) titleEl.textContent = origText;
        linkBtn.classList.remove('copied');
      }, 1500);
    }

    const qrCopyBtn = document.getElementById('btnShareQrCopyLink');
    if (qrCopyBtn) {
      const origQrText = qrCopyBtn.textContent;
      const isEn = window.AtlasI18n && (typeof window.AtlasI18n.getLang === 'function' ? window.AtlasI18n.getLang() : window.AtlasI18n.getCurrentLang()) === 'en';
      qrCopyBtn.textContent = isEn ? 'Link Copied ✓' : '网址已复制 ✓';
      qrCopyBtn.classList.add('copied');
      setTimeout(() => {
        qrCopyBtn.textContent = origQrText;
        qrCopyBtn.classList.remove('copied');
      }, 1500);
    }

    const shareBtn = document.getElementById('btnShareArtwork');
    if (shareBtn) {
      shareBtn.classList.add('copied');
      setTimeout(() => shareBtn.classList.remove('copied'), 1500);
    }

    const copyBtn = document.getElementById('btnCopyShareUrl');
    const t = window.AtlasI18n ? window.AtlasI18n.t : (k => k);
    if (copyBtn) {
      copyBtn.textContent = t('actionShareCopied');
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = t('actionCopy');
        copyBtn.classList.remove('copied');
      }, 1500);
    }

    const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(item) : item;
    const title = (locItem && locItem.title) || item.title;
    const successMsg = window.AtlasI18n && window.AtlasI18n.getCurrentLang() === 'en'
      ? `Copied direct link for "${title}"`
      : `已复制画卷《${title}》专属直链`;
    showToast(successMsg);

    setTimeout(() => {
      closeSharePopover();
    }, 1200);
  }

  // ── 二维码专属深览弹窗 ──
  function openShareQrModal(item) {
    closeSharePopover();
    if (!item) return;
    const modal = document.getElementById('shareQrModal');
    const container = document.getElementById('shareQrContainer');
    const titleEl = document.getElementById('shareQrArtworkTitle');
    const catChip = document.getElementById('shareQrCategoryChip');
    const resChip = document.getElementById('shareQrResChip');
    if (!modal || !container) return;

    const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(item) : item;
    if (titleEl) titleEl.textContent = (locItem && locItem.title) || item.title;

    if (catChip) {
      catChip.textContent = (locItem && locItem.category) || item.category || '空间制图';
    }
    if (resChip) {
      if (item.width && item.height) {
        resChip.textContent = `${item.width.toLocaleString()} × ${item.height.toLocaleString()} px`;
      } else {
        resChip.textContent = '4K Deep Zoom';
      }
    }

    const url = getShareUrlForItem(item);
    if (window.qrcode) {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        container.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 1, scalable: true });
      } catch (err) {
        console.error('QR code generation error:', err);
      }
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeShareQrModal() {
    const modal = document.getElementById('shareQrModal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function downloadQrCodeImage(item, e) {
    if (!item) return;
    const url = getShareUrlForItem(item);
    if (!window.qrcode) return;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      const count = qr.getModuleCount();
      const cellSize = 10;
      const margin = 28;
      const qrW = count * cellSize + margin * 2;
      const bannerH = 88;
      const totalH = qrW + bannerH;

      const cvs = document.createElement('canvas');
      cvs.width = qrW;
      cvs.height = totalH;
      const ctx = cvs.getContext('2d');

      // Card Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, qrW, totalH);

      // QR Code Modules
      ctx.fillStyle = '#000000';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(margin + c * cellSize, margin + r * cellSize, cellSize, cellSize);
          }
        }
      }

      // Center Brand Emblem with OpenQGIS Avatar
      const cx = qrW / 2;
      const cy = (count * cellSize + margin * 2) / 2;
      const badgeSize = Math.max(46, Math.round(cellSize * 5.4));
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, cx - badgeSize / 2, cy - badgeSize / 2, badgeSize, badgeSize, 10);
      ctx.fill();

      const innerBadge = badgeSize - 10;
      ctx.fillStyle = '#000000';
      roundRect(ctx, cx - innerBadge / 2, cy - innerBadge / 2, innerBadge, innerBadge, 8);
      ctx.fill();

      // Separator Line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, qrW);
      ctx.lineTo(qrW - margin, qrW);
      ctx.stroke();

      // Title & Metadata
      const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(item) : item;
      const title = (locItem && locItem.title) || item.title || '地图录';

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, cx, qrW + 16, qrW - margin * 2);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const resText = (item.width && item.height)
        ? `${item.width.toLocaleString()} × ${item.height.toLocaleString()} px · 1:1 4K Deep Zoom`
        : '1:1 4K Deep Zoom';
      ctx.fillText(resText, cx, qrW + 40);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('OpenQGIS · 地图录', cx, qrW + 62);

      function triggerDownload() {
        const a = document.createElement('a');
        a.download = `${item.title || 'atlas'}_qrcode.png`;
        a.href = cvs.toDataURL('image/png');
        a.click();

        const isEn = window.AtlasI18n && (typeof window.AtlasI18n.getLang === 'function' ? window.AtlasI18n.getLang() : window.AtlasI18n.getCurrentLang()) === 'en';
        showCursorTip(e, isEn ? 'QR Code Saved ✓' : '二维码已保存 ✓');

        const saveBtn = document.getElementById('btnShareQrDownload');
        if (saveBtn) {
          const origText = saveBtn.textContent;
          saveBtn.textContent = isEn ? 'Saved ✓' : '已保存 ✓';
          saveBtn.classList.add('copied');
          setTimeout(() => {
            saveBtn.textContent = origText;
            saveBtn.classList.remove('copied');
          }, 1500);
        }
      }

      // Draw avatar image in center of downloaded QR
      const avatarImg = new Image();
      avatarImg.onload = function () {
        ctx.save();
        roundRect(ctx, cx - innerBadge / 2, cy - innerBadge / 2, innerBadge, innerBadge, 8);
        ctx.clip();
        ctx.drawImage(avatarImg, cx - innerBadge / 2, cy - innerBadge / 2, innerBadge, innerBadge);
        ctx.restore();
        triggerDownload();
      };
      avatarImg.onerror = function () {
        triggerDownload();
      };
      avatarImg.src = 'assets/avatar.png';
    } catch (e) {
      console.error('Download QR failed:', e);
    }
  }

  /* -------------------------------------------------------------
     Artwork Poster Multi-Aspect Ratio & Internationalized Engine
     典藏画卷海报多画幅比例与全语境国际化生成引擎
     支持 3:4 / 4:3 / 16:9 / 9:16 / 9:21 五主流比例与中英日韩自适应排版
     ------------------------------------------------------------- */
  let currentPosterBlob = null;
  let currentPosterDataUrl = null;
  let currentPosterItem = null;
  let currentPosterRatio = '3:4';
  let isPosterRendering = false;

  const POSTER_RATIO_CONFIGS = {
    '3:4': { width: 1080, height: 1440, isHorizontal: false, aspectValue: '3 / 4' },
    '4:3': { width: 1440, height: 1080, isHorizontal: true, aspectValue: '4 / 3' },
    '16:9': { width: 1920, height: 1080, isHorizontal: true, aspectValue: '16 / 9' },
    '9:16': { width: 1080, height: 1920, isHorizontal: false, aspectValue: '9 / 16' },
    '9:21': { width: 1080, height: 2520, isHorizontal: false, aspectValue: '9 / 21' }
  };

  const POSTER_I18N_TEXTS = {
    zh: {
      brand: 'OPENQGIS · ATLASLOG',
      slogan: '「一图一境 · 静观其详」',
      edition: '2026 EDITION',
      cartographerPrefix: '匠师：OpenQGIS',
      paletteTitle: 'COLOR PALETTE',
      qrTitle: '扫码 1:1 4K 原图深览',
      qrDomain: 'openqgis.github.io/atlas',
      copyright: '© 2026 OpenQGIS / AtlasLog · 个人空间工造与视觉成果典藏',
      generating: '正在生成高清典藏海报...',
      fallbackTitle: '空间地图成果',
      fallbackCategory: '空间制图'
    },
    en: {
      brand: 'OPENQGIS · ATLASLOG',
      slogan: 'One Map, One Realm · Contemplate the Nuance',
      edition: '2026 EDITION',
      cartographerPrefix: 'Cartographer: OpenQGIS',
      paletteTitle: 'COLOR PALETTE',
      qrTitle: 'Scan for 1:1 4K Deep Zoom',
      qrDomain: 'openqgis.github.io/atlas',
      copyright: '© 2026 OpenQGIS / AtlasLog · Spatial Cartography & Visual Archive',
      generating: 'Generating HD Artwork Poster...',
      fallbackTitle: 'Cartographic Work',
      fallbackCategory: 'Spatial Cartography'
    },
    ja: {
      brand: 'OPENQGIS · ATLASLOG',
      slogan: '「一図一境 · 静観其詳」',
      edition: '2026 EDITION',
      cartographerPrefix: '製作者：OpenQGIS',
      paletteTitle: 'COLOR PALETTE',
      qrTitle: 'スキャンして1:1 4K原図深覧',
      qrDomain: 'openqgis.github.io/atlas',
      copyright: '© 2026 OpenQGIS / AtlasLog · 空間地図工芸と視覚成果アーカイブ',
      generating: '高精細ポスターを生成中...',
      fallbackTitle: '空間地図成果',
      fallbackCategory: '空間地図制作'
    },
    ko: {
      brand: 'OPENQGIS · ATLASLOG',
      slogan: '한 지도 한 세계 · 고요히 음미하다',
      edition: '2026 EDITION',
      cartographerPrefix: '제작자: OpenQGIS',
      paletteTitle: 'COLOR PALETTE',
      qrTitle: '1:1 4K 원본 심층 감상 QR',
      qrDomain: 'openqgis.github.io/atlas',
      copyright: '© 2026 OpenQGIS / AtlasLog · 공간 지도 제작 및 시각 예술 아카이브',
      generating: '고해상도 소장용 포스터 생성 중...',
      fallbackTitle: '공간 지도 작품',
      fallbackCategory: '공간 지도 제작'
    }
  };

  function initPosterRatioEvents() {
    const dropdown = document.getElementById('posterRatioDropdown');
    const btn = document.getElementById('btnPosterRatioDropdown');
    const menu = document.getElementById('posterRatioMenu');
    if (!dropdown || !btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      if (isOpen) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        menu.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    const items = menu.querySelectorAll('.poster-ratio-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ratio = item.getAttribute('data-ratio');
        if (ratio) {
          setPosterRatio(ratio);
        }
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setPosterRatio(ratio) {
    if (!POSTER_RATIO_CONFIGS[ratio]) return;
    currentPosterRatio = ratio;
    updatePosterRatioUI();
    if (currentPosterItem) {
      renderCurrentPoster();
    }
  }

  function updatePosterRatioUI() {
    const ratio = currentPosterRatio;
    const config = POSTER_RATIO_CONFIGS[ratio] || POSTER_RATIO_CONFIGS['3:4'];

    const titleRatioEl = document.getElementById('posterTitleRatio');
    if (titleRatioEl) titleRatioEl.textContent = ratio;

    const curLabelEl = document.getElementById('posterCurrentRatioLabel');
    if (curLabelEl) curLabelEl.textContent = ratio;

    const menu = document.getElementById('posterRatioMenu');
    if (menu) {
      menu.querySelectorAll('.poster-ratio-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-ratio') === ratio);
      });
    }

    const dialog = document.querySelector('.poster-dialog');
    if (dialog) {
      dialog.classList.toggle('ratio-horizontal', !!config.isHorizontal);
    }

    const stage = document.getElementById('posterPreviewStage');
    if (stage) {
      stage.style.setProperty('--poster-ratio', config.aspectValue);
    }
  }

  async function openSharePosterModal(item) {
    closeSharePopover();
    if (!item) return;
    currentPosterItem = item;
    const modal = document.getElementById('sharePosterModal');
    if (!modal) return;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    updatePosterRatioUI();
    await renderCurrentPoster();
  }

  function closeSharePosterModal() {
    const modal = document.getElementById('sharePosterModal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    const menu = document.getElementById('posterRatioMenu');
    const btn = document.getElementById('btnPosterRatioDropdown');
    if (menu) menu.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  async function renderCurrentPoster() {
    if (!currentPosterItem) return;
    const loading = document.getElementById('posterLoading');
    const imgEl = document.getElementById('posterPreviewImg');
    const lang = (window.AtlasI18n && typeof window.AtlasI18n.getLang === 'function') ? window.AtlasI18n.getLang() : 'zh';
    const i18nTexts = POSTER_I18N_TEXTS[lang] || POSTER_I18N_TEXTS.en;

    if (loading) {
      loading.style.display = 'flex';
      loading.innerHTML = '<div class="poster-spinner"></div><span>' + escapeHtml(i18nTexts.generating) + '</span>';
    }
    if (imgEl) {
      imgEl.style.display = 'none';
      imgEl.src = '';
    }

    isPosterRendering = true;
    try {
      const canvas = await generateArtworkPoster(currentPosterItem, currentPosterRatio);
      if (canvas && imgEl) {
        const fallbackDataUrl = () => {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            currentPosterDataUrl = dataUrl;
            currentPosterBlob = null;
            imgEl.src = dataUrl;
            imgEl.style.display = 'block';
            if (loading) loading.style.display = 'none';
          } catch (err2) {
            console.error('Poster export fallback failed:', err2);
            if (loading) {
              loading.innerHTML = '<span style="color:#ff5555;font-size:0.85rem;">[海报生成失败，请重试]</span>';
            }
          }
        };

        try {
          canvas.toBlob((blob) => {
            if (blob) {
              currentPosterBlob = blob;
              currentPosterDataUrl = null;
              const blobUrl = URL.createObjectURL(blob);
              imgEl.src = blobUrl;
              imgEl.style.display = 'block';
              if (loading) loading.style.display = 'none';
            } else {
              fallbackDataUrl();
            }
          }, 'image/png', 0.95);
        } catch (e) {
          fallbackDataUrl();
        }
      }
    } catch (err) {
      console.error('Poster generation failed:', err);
      if (loading) {
        loading.innerHTML = '<span style="color:#ff5555;font-size:0.85rem;">[海报生成失败，请重试]</span>';
      }
    } finally {
      isPosterRendering = false;
    }
  }

  function downloadPosterImage() {
    if (!currentPosterItem) return;
    const lang = (window.AtlasI18n && typeof window.AtlasI18n.getLang === 'function') ? window.AtlasI18n.getLang() : 'zh';
    const locItem = (window.AtlasI18n && typeof window.AtlasI18n.getItem === 'function') ? window.AtlasI18n.getItem(currentPosterItem) : currentPosterItem;
    const rawTitle = (locItem && locItem.title) || currentPosterItem.title || 'atlas';
    const cleanTitle = rawTitle.replace(/[\\/:*?"<>|]/g, '_').trim();
    const ratioSuffix = currentPosterRatio.replace(':', 'x');
    const filename = (lang === 'zh')
      ? `${cleanTitle}_${ratioSuffix}典藏海报.png`
      : `${cleanTitle}_poster_${ratioSuffix}.png`;

    const a = document.createElement('a');
    a.download = filename;
    if (currentPosterBlob) {
      a.href = URL.createObjectURL(currentPosterBlob);
    } else if (currentPosterDataUrl) {
      a.href = currentPosterDataUrl;
    } else {
      return;
    }
    a.click();
  }

  function drawQrCodeMatrix(ctx, x, y, size, url) {
    if (!window.qrcode) return;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      const modCount = qr.getModuleCount();
      const cellSize = size / modCount;
      ctx.fillStyle = '#000000';
      for (let r = 0; r < modCount; r++) {
        for (let c = 0; c < modCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize + 0.4, cellSize + 0.4);
          }
        }
      }
    } catch (e) {
      console.warn('Poster QR render error:', e);
    }
  }

  async function drawContainedImage(ctx, src, boxX, boxY, boxW, boxH, radius, bgCard, borderColor) {
    ctx.fillStyle = bgCard;
    roundRect(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (!src) return;
    try {
      const img = await loadImageAsync(src);
      ctx.save();
      roundRect(ctx, boxX, boxY, boxW, boxH, radius);
      ctx.clip();

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const boxAspect = boxW / boxH;
      let dw, dh, dx, dy;
      if (imgAspect > boxAspect) {
        dw = boxW;
        dh = boxW / imgAspect;
        dx = boxX;
        dy = boxY + (boxH - dh) / 2;
      } else {
        dh = boxH;
        dw = boxH * imgAspect;
        dx = boxX + (boxW - dw) / 2;
        dy = boxY;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } catch (e) {
      console.warn('Poster artwork image load failed:', e);
    }
  }

  async function generateArtworkPoster(item, ratio = '3:4') {
    const config = POSTER_RATIO_CONFIGS[ratio] || POSTER_RATIO_CONFIGS['3:4'];
    const W = config.width;
    const H = config.height;
    const isHorizontal = !!config.isHorizontal;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const bgPrimary = isLight ? '#f6f7fa' : '#0a0d14';
    const bgCard = isLight ? '#ffffff' : '#141824';
    const textPrimary = isLight ? '#0f141c' : '#f0f3f8';
    const textSecondary = isLight ? '#596780' : '#8fa0ba';
    const accent = '#d4a373';
    const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

    const lang = (window.AtlasI18n && typeof window.AtlasI18n.getLang === 'function') ? window.AtlasI18n.getLang() : 'zh';
    const i18nTexts = POSTER_I18N_TEXTS[lang] || POSTER_I18N_TEXTS.en;
    const locItem = (window.AtlasI18n && typeof window.AtlasI18n.getItem === 'function') ? window.AtlasI18n.getItem(item) : item;

    const posterPalette = (Array.isArray(item.palette) && item.palette.length > 0) ? item.palette :
                          (Array.isArray(item.colors) && item.colors.length > 0) ? item.colors :
                          (Array.isArray(item.color) && item.color.length > 0) ? item.color :
                          (MASTER_PALETTES[item.id] || []);

    const titleText = (locItem && locItem.title) || item.title || i18nTexts.fallbackTitle;
    const categoryText = ((locItem && (locItem.categoryName || locItem.category)) || item.category || i18nTexts.fallbackCategory) +
                         '   |   ' + i18nTexts.cartographerPrefix;
    const descText = (locItem && locItem.description) || item.description || '';
    const shareUrl = getShareUrlForItem(item);
    const imgSrc = item.thumb || item.heroImage || (item.dzi && item.dzi.Image && item.dzi.Image.Url) || '';

    // 1. 全局底色与边框
    ctx.fillStyle = bgPrimary;
    ctx.fillRect(0, 0, W, H);

    const framePad = isHorizontal ? 28 : 36;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(framePad, framePad, W - framePad * 2, H - framePad * 2);

    if (!isHorizontal) {
      // ── 竖版海报布局引擎 (3:4, 9:16, 9:21) ──

      // 顶部页眉
      ctx.font = '700 20px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = accent;
      ctx.fillText(i18nTexts.brand, 64, 86);

      ctx.font = '500 18px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.slogan, 64, 118);

      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = '600 18px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.edition, W - 64, 102);
      ctx.restore();

      // 分隔线
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, 140);
      ctx.lineTo(W - 64, 140);
      ctx.stroke();

      // 画卷主展台
      const imgX = 64;
      const imgY = 165;
      const imgW = W - 128;
      let imgH = 730;
      if (ratio === '9:16') imgH = 1080;
      else if (ratio === '9:21') imgH = 1480;

      await drawContainedImage(ctx, imgSrc, imgX, imgY, imgW, imgH, 16, bgCard, borderColor);

      // 底部页脚线与版权声明
      const footerLineY = H - 75;
      const footerTextY = H - 45;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, footerLineY);
      ctx.lineTo(W - 64, footerLineY);
      ctx.stroke();

      ctx.font = '400 15px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.copyright, 64, footerTextY);

      // 右下角专属二维码卡片
      const qrSize = 136;
      const qrX = W - 64 - qrSize;
      const qrY = footerLineY - 175;

      ctx.fillStyle = '#ffffff';
      roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14);
      ctx.fill();

      drawQrCodeMatrix(ctx, qrX, qrY, qrSize, shareUrl);

      // 二维码左侧导引文案 (设置右对齐，确保多语言从二维码边框向左伸展，杜绝重叠)
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = '600 17px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText(i18nTexts.qrTitle, qrX - 24, qrY + 46);

      ctx.font = '400 15px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.qrDomain, qrX - 24, qrY + 74);
      ctx.restore();

      // 作品题名与元数据
      const metaY = imgY + imgH + 34;
      const maxInfoWidth = qrX - 220 - 64;

      ctx.font = '700 38px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textPrimary;
      wrapText(ctx, titleText, 64, metaY + 36, maxInfoWidth, 46, 2);

      ctx.font = '500 20px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textSecondary;
      ctx.fillText(categoryText, 64, metaY + 88);

      if (descText) {
        ctx.font = '400 18px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = textSecondary;
        const maxDescLines = (ratio === '3:4') ? 2 : (ratio === '9:16' ? 3 : 4);
        wrapText(ctx, descText, 64, metaY + 126, maxInfoWidth, 26, maxDescLines);
      }

      // 艺术色板圆角色块
      if (Array.isArray(posterPalette) && posterPalette.length > 0) {
        const swY = (ratio === '3:4') ? (metaY + 185) : (metaY + 225);
        ctx.font = '600 14px "JetBrains Mono", Consolas, monospace';
        ctx.fillStyle = textSecondary;
        ctx.fillText(i18nTexts.paletteTitle, 64, swY);

        const swW = 46, swH = 20, swGap = 8;
        posterPalette.slice(0, 6).forEach((col, idx) => {
          ctx.fillStyle = col;
          roundRect(ctx, 64 + idx * (swW + swGap), swY + 8, swW, swH, 4);
          ctx.fill();
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    } else {
      // ── 横版画廊与宽屏双栏布局引擎 (4:3, 16:9) ──
      const is16x9 = (ratio === '16:9');
      const imgX = is16x9 ? 48 : 40;
      const imgY = is16x9 ? 48 : 40;
      const imgW = is16x9 ? 1200 : 860;
      const imgH = H - imgY * 2;
      const rx = is16x9 ? 1284 : 932;
      const rw = W - rx - (is16x9 ? 48 : 40);

      // 左侧主展台
      await drawContainedImage(ctx, imgSrc, imgX, imgY, imgW, imgH, 16, bgCard, borderColor);

      // 右侧栏：页眉
      ctx.font = is16x9 ? '700 20px "JetBrains Mono", Consolas, monospace' : '700 19px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = accent;
      ctx.fillText(i18nTexts.brand, rx, 84);

      ctx.font = is16x9 ? '500 17px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '500 16px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.slogan, rx, 114);

      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = is16x9 ? '600 16px "JetBrains Mono", Consolas, monospace' : '600 15px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.edition, W - (is16x9 ? 48 : 40), 84);
      ctx.restore();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, 136);
      ctx.lineTo(W - (is16x9 ? 48 : 40), 136);
      ctx.stroke();

      // 右侧栏：作品题名与分类
      ctx.font = is16x9 ? '700 36px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '700 32px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textPrimary;
      const titleLineHeight = is16x9 ? 44 : 38;
      const afterTitleY = wrapText(ctx, titleText, rx, 188, rw, titleLineHeight, 2);

      const catY = Math.max(is16x9 ? 275 : 260, afterTitleY + 8);
      ctx.font = is16x9 ? '500 19px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '500 17px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textSecondary;
      ctx.fillText(categoryText, rx, catY);

      // 右侧栏：说明题记
      if (descText) {
        ctx.font = is16x9 ? '400 17px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                          : '400 16px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = textSecondary;
        wrapText(ctx, descText, rx, catY + 36, rw, 26, is16x9 ? 5 : 4);
      }

      // 右侧栏：调色板
      if (Array.isArray(posterPalette) && posterPalette.length > 0) {
        const swY = is16x9 ? 500 : 475;
        ctx.font = '600 14px "JetBrains Mono", Consolas, monospace';
        ctx.fillStyle = textSecondary;
        ctx.fillText(i18nTexts.paletteTitle, rx, swY);

        const swW = is16x9 ? 44 : 40, swH = 18, swGap = 8;
        posterPalette.slice(0, 6).forEach((col, idx) => {
          ctx.fillStyle = col;
          roundRect(ctx, rx + idx * (swW + swGap), swY + 8, swW, swH, 4);
          ctx.fill();
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // 右侧栏：专属二维码
      const qrSize = is16x9 ? 136 : 124;
      const qx = rx;
      const qy = is16x9 ? 705 : 710;

      ctx.fillStyle = '#ffffff';
      roundRect(ctx, qx - 8, qy - 8, qrSize + 16, qrSize + 16, 12);
      ctx.fill();

      drawQrCodeMatrix(ctx, qx, qy, qrSize, shareUrl);

      // 二维码右侧导引文案
      const guideX = qx + qrSize + 26;
      ctx.save();
      ctx.textAlign = 'left';
      ctx.font = is16x9 ? '600 17px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '600 16px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText(i18nTexts.qrTitle, guideX, qy + 46);

      ctx.font = '400 15px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.qrDomain, guideX, qy + 74);
      ctx.restore();

      // 右侧栏：页脚与版权
      const rightFootY = 1000;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, rightFootY);
      ctx.lineTo(W - (is16x9 ? 48 : 40), rightFootY);
      ctx.stroke();

      ctx.font = is16x9 ? '400 14px "JetBrains Mono", Consolas, monospace' : '400 12.5px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.copyright, rx, rightFootY + 28);
    }

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    if (!text) return y;
    const tokens = text.match(/\S+\s*|[\u4e00-\u9fa5]|[\u3040-\u30ff]|[\uac00-\ud7af]|\s+/g) || [text];
    let line = '';
    let lineCount = 0;
    let currentY = y;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const testLine = line + token;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText(line.trimEnd() + '...', x, currentY);
          return currentY + lineHeight;
        }
        ctx.fillText(line.trimEnd(), x, currentY);
        line = token.trimStart();
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line.trimEnd(), x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  }

  function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const isExternal = /^https?:\/\//i.test(src) && (!window.location.origin || !src.startsWith(window.location.origin));
      if (isExternal) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (img.crossOrigin) {
          const retryImg = new Image();
          retryImg.onload = () => resolve(retryImg);
          retryImg.onerror = () => reject(new Error('Image failed to load: ' + src));
          retryImg.src = src;
        } else {
          reject(new Error('Image failed to load: ' + src));
        }
      };
      img.src = src;
    });
  }

  function updateBrowserUrl(item, isNewOpen = false) {
    if (!item) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('id') !== item.id) {
        url.searchParams.delete('art');
        url.searchParams.set('id', item.id);
        url.hash = '';
        if (isNewOpen) {
          window.history.pushState({ level: 2, view: 'viewer', artworkId: item.id }, '', url.toString());
        } else {
          window.history.replaceState({ level: 2, view: 'viewer', artworkId: item.id }, '', url.toString());
        }
        currentHistoryLevel = 2;
      }
    } catch (e) {}
  }

  function clearBrowserUrl() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('id') || url.searchParams.has('art') || window.location.hash) {
        url.searchParams.delete('id');
        url.searchParams.delete('art');
        url.hash = 'gallery';
        window.history.replaceState({ level: 1, view: 'gallery' }, '', url.toString());
        currentHistoryLevel = 1;
      }
    } catch (e) {}
  }

  function findArtworkByQuery(query) {
    if (!query) return null;
    let q = '';
    try {
      q = decodeURIComponent(String(query)).trim().toLowerCase();
    } catch (e) {
      q = String(query).trim().toLowerCase();
    }
    if (!q) return null;

    return galleryItems.find(item => {
      if (item.id && item.id.toLowerCase() === q) return true;
      if (Array.isArray(item.aliases) && item.aliases.some(a => String(a).trim().toLowerCase() === q)) return true;
      if (item.title && item.title.trim().toLowerCase() === q) return true;
      if (item.filename) {
        const fn = item.filename.trim().toLowerCase();
        if (fn === q) return true;
        if (fn.replace(/\.[^.]+$/, '') === q) return true;
      }
      return false;
    });
  }

  function checkUrlDeepLink() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let target = urlParams.get('id') || urlParams.get('art');
      if (!target && window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '');
        if (hash.startsWith('id=')) target = hash.replace('id=', '');
        else if (hash.startsWith('art=')) target = hash.replace('art=', '');
        else target = hash;
      }
      if (target) {
        const match = findArtworkByQuery(target);
        if (match) {
          try {
            const galleryUrl = new URL(window.location.href);
            galleryUrl.searchParams.delete('id');
            galleryUrl.searchParams.delete('art');
            galleryUrl.hash = 'gallery';
            window.history.replaceState({ level: 1, view: 'gallery' }, '', galleryUrl.toString());
          } catch (e) {}
          setTimeout(() => {
            openViewerByItem(match, true);
          }, 120);
          return true;
        }
      }
    } catch (e) {
      console.warn('Error checking URL deep link:', e);
    }
    return false;
  }

  let toastTimer = null;
  function showToast(message, duration = 2200) {
    let toast = document.getElementById('galleryToast');
    const targetParent = document.fullscreenElement || document.getElementById('viewerModal') || document.body;
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'galleryToast';
      toast.className = 'gallery-toast';
      targetParent.appendChild(toast);
    } else if (toast.parentElement !== targetParent) {
      targetParent.appendChild(toast);
    }
    toast.innerHTML = '<span class="toast-indicator"></span><span class="toast-text">' + escapeHtml(message) + '</span>';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }


  /* -------------------------------------------------------------
     Stealth Digital Watermark & Anti-Theft Security Engine
     ------------------------------------------------------------- */
  const StealthWatermark = (function () {
    let overlayCanvas = null;
    let overlayCtx = null;
    let currentStage = null;
    let currentItem = null;
    let isRevealed = false;
    let observer = null;
    const sessionSignature = 'ATLAS-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + (new Date().toISOString().slice(0, 10).replace(/-/g, ''));

    function init(stageEl, item) {
      currentStage = stageEl;
      currentItem = item;
      if (!stageEl) return;

      let canvas = stageEl.querySelector('.stealth-watermark-overlay');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'stealth-watermark-overlay';
        canvas.setAttribute('aria-hidden', 'true');
        stageEl.appendChild(canvas);
      }
      overlayCanvas = canvas;
      overlayCtx = canvas.getContext('2d');

      resize();
      draw();

      // Anti-Tamper Guard: If removed in DevTools, immediately restore
      if (observer) observer.disconnect();
      observer = new MutationObserver(() => {
        if (currentStage && !currentStage.querySelector('.stealth-watermark-overlay')) {
          init(currentStage, currentItem);
        }
      });
      observer.observe(stageEl, { childList: true });
    }

    function resize() {
      if (!overlayCanvas || !currentStage) return;
      const rect = currentStage.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      overlayCanvas.width = Math.round(rect.width * dpr);
      overlayCanvas.height = Math.round(rect.height * dpr);
      overlayCanvas.style.width = rect.width + 'px';
      overlayCanvas.style.height = rect.height + 'px';
      draw();
    }

    function draw() {
      if (!overlayCanvas || !overlayCtx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = overlayCanvas.width;
      const h = overlayCanvas.height;

      overlayCtx.save();
      overlayCtx.clearRect(0, 0, w, h);

      const idStr = currentItem ? currentItem.id : 'atlas';
      const line1 = 'OpenQGIS · 地图录 · AtlasLog · 版权所有';
      const line2 = 'ATLASLOG · PROTECTED · ' + idStr;
      const line3 = 'TRACE: ' + sessionSignature;

      if (isRevealed) {
        overlayCtx.font = `bold ${Math.round(13 * dpr)}px monospace`;
        overlayCtx.fillStyle = 'rgba(245, 197, 24, 0.78)';
        overlayCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        overlayCtx.shadowBlur = 4 * dpr;
      } else {
        // Micro-alpha: 0.008 is completely imperceptible to human eyes on artwork textures
        // But under contrast equalization / threshold curves in Photoshop, it pops out crystal clear!
        overlayCtx.font = `${Math.round(12 * dpr)}px monospace`;
        overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.008)';
        overlayCtx.shadowColor = 'rgba(0, 0, 0, 0.008)';
        overlayCtx.shadowBlur = 1 * dpr;
        overlayCtx.shadowOffsetX = 1 * dpr;
        overlayCtx.shadowOffsetY = 1 * dpr;
      }

      overlayCtx.textAlign = 'center';
      overlayCtx.textBaseline = 'middle';

      const angle = -24 * Math.PI / 180;
      const stepX = 280 * dpr;
      const stepY = 140 * dpr;

      overlayCtx.translate(w / 2, h / 2);
      overlayCtx.rotate(angle);

      const diagonal = Math.ceil(Math.sqrt(w * w + h * h));
      let row = 0;
      for (let y = -diagonal; y < diagonal; y += stepY) {
        const xOffset = (row % 2 === 0) ? 0 : (stepX / 2);
        for (let x = -diagonal + xOffset; x < diagonal; x += stepX) {
          overlayCtx.fillText(line1, x, y - (12 * dpr));
          overlayCtx.fillText(line2, x, y + (4 * dpr));
          overlayCtx.fillText(line3, x, y + (20 * dpr));
        }
        row++;
      }
      overlayCtx.restore();
    }

    // Burn-in directly into OpenSeadragon's internal canvas bitmap for screenshot proofing
    function burnIn(osd) {
      if (!osd || !osd.drawer || !osd.drawer.context || !osd.drawer.canvas) return;
      const ctx = osd.drawer.context;
      const canvas = osd.drawer.canvas;
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.save();
      ctx.font = `${Math.round(12 * dpr)}px monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.006)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const angle = -24 * Math.PI / 180;
      const stepX = 300 * dpr;
      const stepY = 150 * dpr;

      ctx.translate(w / 2, h / 2);
      ctx.rotate(angle);

      const diagonal = Math.ceil(Math.sqrt(w * w + h * h));
      const line = 'OpenQGIS · 地图录 · AtlasLog · ' + sessionSignature;

      let r = 0;
      for (let y = -diagonal; y < diagonal; y += stepY) {
        const xOffset = (r % 2 === 0) ? 0 : (stepX / 2);
        for (let x = -diagonal + xOffset; x < diagonal; x += stepX) {
          ctx.fillText(line, x, y);
        }
        r++;
      }
      ctx.restore();
    }

    function toggleReveal(force) {
      isRevealed = (force !== undefined) ? force : !isRevealed;
      if (overlayCanvas) {
        overlayCanvas.classList.toggle('revealed', isRevealed);
      }
      draw();

      const modalEl = document.getElementById('viewerModal');
      let hud = document.getElementById('forensicHud');
      if (isRevealed) {
        if (!hud && modalEl) {
          hud = document.createElement('div');
          hud.id = 'forensicHud';
          hud.className = 'forensic-hud';
          hud.innerHTML = '<svg class="icon mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
            '<span>数字盲水印溯源系统已激活 · 隐形网格布防中 (按 Alt+W 恢复隐形)</span>';
          modalEl.appendChild(hud);
        }
      } else {
        if (hud) hud.remove();
      }
      return isRevealed;
    }

    function destroy() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (overlayCanvas) {
        overlayCanvas.remove();
        overlayCanvas = null;
        overlayCtx = null;
      }
      const hud = document.getElementById('forensicHud');
      if (hud) hud.remove();
      isRevealed = false;
      currentStage = null;
      currentItem = null;
    }

    return {
      init: init,
      resize: resize,
      burnIn: burnIn,
      toggleReveal: toggleReveal,
      destroy: destroy
    };
  })();

  /* -------------------------------------------------------------
     Palette & Helpers
     ------------------------------------------------------------- */
  /* -------------------------------------------------------------
     Palette & Helpers · 主调色板萃取与色谱聚类引擎
     ------------------------------------------------------------- */
  const MASTER_PALETTES = {
    shanghai: ['#12161D', '#C69C3A', '#4A535E', '#E6C66D', '#202934'],
    city_papercut_14pro: ['#EAE4D9', '#2E5077', '#8E8276', '#B75D69', '#F9F7F2'],
    chengdu_papercut_ipad: ['#EFEBE2', '#2A4365', '#8C7A6B', '#D69E2E', '#1A202C'],
    layout_pattern_02: ['#12141A', '#80CC28', '#F4F5F7', '#4A5568', '#2D3748'],
    jinjiang_greenway_section: ['#E57388', '#72B365', '#244933', '#F6F1EA', '#5E9C52'],
    pinglu_canal: ['#0B0E14', '#E65100', '#FF9800', '#E53935', '#455A64']
  };
  const DEFAULT_PALETTE = ['#80CC28', '#13171E', '#9EA5B3', '#5E6676', '#F4F5F7'];

  function extractDominantColors(target, maxColors, callback) {
    maxColors = maxColors || 5;

    // 优先采用创作者在 Markdown Frontmatter (color/colors) 中明确标定的色板（消除动态计算误差）
    let explicitColors = null;
    if (target && typeof target === 'object') {
      explicitColors = target.colors || target.color;
      if ((!explicitColors || explicitColors.length === 0) && target.id) {
        const found = galleryItems.find(i => i.id === target.id);
        if (found) explicitColors = found.colors || found.color;
      }
    } else if (typeof target === 'string') {
      const found = galleryItems.find(i => i.id === target || i.thumb === target);
      if (found) explicitColors = found.colors || found.color;
    }

    if (Array.isArray(explicitColors) && explicitColors.length > 0) {
      callback(explicitColors.slice(0, maxColors));
      return;
    }

    const thumbUrl = (typeof target === 'string') ? target : (target && target.thumb);
    const itemId = (target && typeof target === 'object') ? target.id : '';
    const fallbackColors = (itemId && MASTER_PALETTES[itemId]) || DEFAULT_PALETTE;

    if (!thumbUrl) {
      callback(fallbackColors);
      return;
    }

    // 核心提取与聚类算法
    function processImageElement(imgEl) {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;

        ctx.drawImage(imgEl, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets = {};

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          if (a < 96) continue;

          // 放宽亮度门限，涵盖黑夜与高光纸雕纹理
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < 10 || lum > 250) continue;

          const qr = Math.round(r / 20) * 20;
          const qg = Math.round(g / 20) * 20;
          const qb = Math.round(b / 20) * 20;
          const key = (qr << 16) | (qg << 8) | qb;
          colorBuckets[key] = (colorBuckets[key] || 0) + 1;
        }

        const sortedKeys = Object.keys(colorBuckets).sort((a, b) => colorBuckets[b] - colorBuckets[a]);
        if (sortedKeys.length === 0) return null;

        const candidates = sortedKeys.map(k => {
          const val = parseInt(k, 10);
          return {
            r: (val >> 16) & 0xff,
            g: (val >> 8) & 0xff,
            b: val & 0xff
          };
        });

        // 颜色欧氏距离去重，保证萃取的 5 色层次分明
        function colorDist(c1, c2) {
          const dr = c1.r - c2.r;
          const dg = c1.g - c2.g;
          const db = c1.b - c2.b;
          return Math.sqrt(dr * dr + dg * dg + db * db);
        }

        const distinctList = [];
        for (let i = 0; i < candidates.length && distinctList.length < maxColors; i++) {
          const c = candidates[i];
          const isTooClose = distinctList.some(exist => colorDist(exist, c) < 36);
          if (!isTooClose) {
            distinctList.push(c);
          }
        }

        // 若色差过大导致不足，平铺补充
        if (distinctList.length < maxColors) {
          for (let i = 0; i < candidates.length && distinctList.length < maxColors; i++) {
            if (!distinctList.includes(candidates[i])) {
              distinctList.push(candidates[i]);
            }
          }
        }

        const hexResults = distinctList.map(c => {
          const toHex = n => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
          return ('#' + toHex(c.r) + toHex(c.g) + toHex(c.b)).toUpperCase();
        });

        return hexResults.length > 0 ? hexResults : null;
      } catch (err) {
        console.warn('Canvas pixel extraction fallback:', err);
        return null;
      }
    }

    // 1. 优先尝试从 DOM 已渲染完毕的缩略图直接读取（极速 0ms，免二次网络请求）
    const cardImg = document.querySelector(`img[src*="${thumbUrl}"]`) || document.querySelector(`.card-img[src="${thumbUrl}"]`);
    if (cardImg && cardImg.complete && cardImg.naturalWidth > 0) {
      const fastResult = processImageElement(cardImg);
      if (fastResult && fastResult.length > 0) {
        callback(fastResult);
        return;
      }
    }

    // 2. 异步 Image 加载提取（补全关键的 img.src 赋值与 CORS 处理）
    const img = new Image();
    if (thumbUrl.startsWith('http://') || thumbUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = function () {
      const colors = processImageElement(img);
      callback(colors && colors.length > 0 ? colors : fallbackColors);
    };
    img.onerror = function () {
      callback(fallbackColors);
    };
    img.src = thumbUrl;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function bindAntiTheft() {
    // 1. 全局封锁右键菜单 (Prevent Save Image As, Inspect context)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, { capture: true });

    // 2. 全局禁止图片/画板拖拽
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
    }, { capture: true });

    // 3. 拦截常见扒图/保存快捷键 (Ctrl+S, Ctrl+P, Ctrl+U)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }
      // 取证盲水印自检快捷键: Alt+W 或 Shift+W
      if ((e.altKey || e.shiftKey) && (e.key === 'w' || e.key === 'W')) {
        const modalEl = document.getElementById('viewerModal');
        if (modalEl && modalEl.classList.contains('open')) {
          e.preventDefault();
          StealthWatermark.toggleReveal();
        }
      }
    });

    // 4. 监听窗口缩放同步水印画布尺寸
    window.addEventListener('resize', () => {
      StealthWatermark.resize();
    });

    // 5. 暴露全局开发者自检接口
    window.revealWatermark = function (state) {
      return StealthWatermark.toggleReveal(state);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
