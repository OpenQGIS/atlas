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

  // 智能解析当前站点的根目录绝对基准路径 (自动兼容 GitHub Pages 项目子目录 /atlas/ 与根域名部署)
  function getAppBaseUrl() {
    let path = window.location.pathname.split('?')[0].split('#')[0];
    if (path.endsWith('.html') || path.endsWith('.htm')) {
      path = path.substring(0, path.lastIndexOf('/') + 1);
    } else if (!path.endsWith('/')) {
      path += '/';
    }
    return window.location.origin + path;
  }

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

  const SUBCATEGORY_ORDER = ['艺术制图', '工程制图', '空间形态', '图面排版'];

  function getSubCategoryParam(sub) {
    if (!sub) return '1';
    const idx = SUBCATEGORY_ORDER.indexOf(sub);
    if (idx !== -1) return String(idx + 1);
    return '1';
  }

  function parseSubCategoryParam(val) {
    if (!val && val !== 0) return null;
    val = String(val).trim().toLowerCase();
    if (!val) return null;
    // 支持数字与超简洁参数: '1', 's1', 'sub1', 'art' 等
    if (val === '1' || val === 's1' || val === 'sub1' || val === 'art') return SUBCATEGORY_ORDER[0];
    if (val === '2' || val === 's2' || val === 'sub2' || val === 'engineering' || val === 'eng') return SUBCATEGORY_ORDER[1];
    if (val === '3' || val === 's3' || val === 'sub3' || val === 'morphology' || val === 'morph') return SUBCATEGORY_ORDER[2];
    if (val === '4' || val === 's4' || val === 'sub4' || val === 'layout') return SUBCATEGORY_ORDER[3];
    if (SUBCATEGORY_ORDER.includes(val)) return val;
    const match = SUBCATEGORY_ORDER.find(s => s.toLowerCase() === val);
    return match || null;
  }

  function getSubFromUrl(urlParams) {
    if (!urlParams) return null;
    let val = urlParams.get('sub') || urlParams.get('s');
    if (!val) {
      for (let i = 1; i <= 4; i++) {
        if (urlParams.has('s' + i)) {
          val = String(i);
          break;
        }
      }
    }
    return parseSubCategoryParam(val);
  }

  function getQMapFlowSvg(precision = 100) {
    const cleanVal = String(precision).replace(/%/g, '').trim() || '100';
    return QMAPFLOW_BASE_SVG.replace('__PRECISION__', cleanVal);
  }

  // Initialize
  async function init() {
    bindAntiTheft();

    // 关闭浏览器默认滚动恢复机制，确保在瀑布流中刷新时始终从首屏全景图（Hero View）重新开始，杜绝跳过封面
    if ('scrollRestoration' in history) {
      try {
        history.scrollRestoration = 'manual';
      } catch (e) {}
    }

    // 预先检测是否有子页面或展品深链参数，若有立即施加 in-subview 类，避免首屏 Hero 闪烁
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isSub = getSubFromUrl(urlParams);
      const isArt = urlParams.has('id') || urlParams.has('art');
      if (isSub) {
        document.body.classList.add('in-subview');
      } else if (!isArt) {
        // 常规访问或在瀑布流中刷新时，清除残留的 #gallery hash 并确保视口重置在首屏全景
        if (window.location.hash === '#gallery') {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        document.documentElement.classList.remove('has-entered-gallery');
        document.body.classList.remove('in-gallery');
        window.scrollTo(0, 0);
      }
    } catch (e) {}

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
    const appBase = getAppBaseUrl();
    galleryItems = rawItems.map((item, idx) => {
      item.globalIndex = idx;
      if (item.thumb && !item.thumb.startsWith('http')) {
        item.thumb = new URL(item.thumb.replace(/^\/+/, ''), appBase).href;
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
    bindHeaderBrandEvents();
    bindFooterAccordion();
    bindLanguageDropdown();
    bindI18nEvents();
    initHero();

    applyFilter('all');
  }

  function bindHeaderBrandEvents() {
    const brandEl = document.querySelector('.site-header .brand');
    if (brandEl) {
      brandEl.style.cursor = 'pointer';
      brandEl.setAttribute('role', 'button');
      brandEl.setAttribute('tabindex', '0');
      brandEl.setAttribute('title', '返回画廊首页 / Back to Home');
      const handleHomeClick = () => {
        if (currentSubCategory) {
          exitSubcategoryView();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      brandEl.addEventListener('click', handleHomeClick);
      brandEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleHomeClick();
        }
      });
    }
  }

  function returnToHeroCover(smooth = true) {
    if (typeof startHeroTimer === 'function') {
      try { startHeroTimer(); } catch (_) {}
    }
    document.documentElement.classList.remove('has-entered-gallery');
    document.body.classList.remove('in-gallery');
    currentHistoryLevel = 0;

    if (smooth) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }

    try {
      window.history.pushState({ level: 0, view: 'hero' }, '', window.location.pathname + window.location.search);
    } catch (_) {}
  }

  function bindPortalScrollEvents() {
    const homeBtn = document.getElementById('btnReturnHero') || document.getElementById('btnScrollToPortal');
    if (homeBtn) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        returnToHeroCover(true);
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

    // 跨端精准视口高度测量 (彻底解决 iOS Safari 底部展开工具栏导致高度溢出漏边的问题)
    function syncHeroViewportHeight() {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--hero-real-vh', `${vh}px`);
    }
    syncHeroViewportHeight();
    window.addEventListener('resize', syncHeroViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(syncHeroViewportHeight, 150);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncHeroViewportHeight);
    }

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
      if (document.body.classList.contains('in-gallery')) {
        stopHeroTimer();
        const siteHeaderEl = document.getElementById('siteHeader');
        if (siteHeaderEl) {
          siteHeaderEl.classList.toggle('is-sticky', scrollY > 8);
        }
        return;
      }

      if (scrollY > 120) {
        stopHeroTimer();
      } else {
        if (!heroTimer) scheduleNextTransition();
      }

      // 处于开屏状态下的瀑布流吸顶标记
      const siteHeaderEl = document.getElementById('siteHeader');
      if (siteHeaderEl) {
        const heroHeight = heroScreen.offsetHeight || window.innerHeight;
        if (scrollY >= heroHeight - 8) {
          siteHeaderEl.classList.add('is-sticky');
        } else {
          siteHeaderEl.classList.remove('is-sticky');
        }
      }

      // 同步 Level 0 / Level 1 历史状态
      const modalEl = document.getElementById('viewerModal');
      if (!modalEl || !modalEl.classList.contains('open')) {
        const heroThreshold = Math.max(260, window.innerHeight * 0.45);
        if (scrollY >= heroThreshold && currentHistoryLevel === 0) {
          currentHistoryLevel = 1;
          try {
            window.history.pushState({ level: 1, view: 'gallery' }, '', window.location.pathname + window.location.search);
          } catch (e) {}
        }
      }
    }, { passive: true });

    // 监听横竖屏切换（物理屏幕翻转时经平滑防抖后计算最契合图幅，防止旋转中途闪烁）
    const mql = window.matchMedia('(orientation: landscape)');
    let orientTimer = null;
    const handleOrientationChange = () => {
      if (orientTimer) clearTimeout(orientTimer);
      orientTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          displayHeroArtwork();
        });
      }, 120);
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', handleOrientationChange);
    } else if (mql.addListener) {
      mql.addListener(handleOrientationChange);
    }

    // 精准步入瀑布流展厅，并将首屏收起，彻底杜绝向上回滚到全屏图
    function enterGalleryView(smooth = true) {
      if (document.body.classList.contains('in-gallery')) return;

      stopHeroTimer();
      const target = document.getElementById('siteHeader') || document.querySelector('.site-header');

      if (smooth) {
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        }

        // 平滑滚动到位后无缝切换为 in-gallery，将首屏全景收起，使 siteHeader 确立为页面最顶端
        setTimeout(() => {
          document.documentElement.style.scrollBehavior = 'auto';
          document.documentElement.classList.add('has-entered-gallery');
          document.body.classList.add('in-gallery');
          window.scrollTo(0, 0);
          requestAnimationFrame(() => {
            document.documentElement.style.scrollBehavior = '';
          });
        }, 650);
      } else {
        document.documentElement.style.scrollBehavior = 'auto';
        document.documentElement.classList.add('has-entered-gallery');
        document.body.classList.add('in-gallery');
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = '';
        });
      }

      if (currentHistoryLevel === 0) {
        currentHistoryLevel = 1;
        try {
          window.history.pushState({ level: 1, view: 'gallery' }, '', window.location.pathname + window.location.search);
        } catch (e) {}
      }
    }

    if (heroScrollBtn) {
      heroScrollBtn.addEventListener('click', (e) => {
        e.preventDefault();
        enterGalleryView(true);
      });
    }

    // 鼠标在开屏区域向下滚动时，平滑进入展厅
    let isSnapping = false;
    window.addEventListener('wheel', (e) => {
      if (isSnapping) return;
      if (document.body.classList.contains('in-gallery') || currentSubCategory || document.body.classList.contains('in-subview')) return;
      const hero = document.getElementById('heroScreen');
      if (!hero) return;

      // 处于开屏视图顶部且向下滚轮滑动时，平滑步入展厅
      if (window.scrollY < 40 && e.deltaY > 15) {
        isSnapping = true;
        enterGalleryView(true);
        setTimeout(() => { isSnapping = false; }, 850);
      }
    }, { passive: true });

    // 移动端触屏向上滑动时平滑过渡至展厅
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (document.body.classList.contains('in-gallery') || currentSubCategory || document.body.classList.contains('in-subview')) return;
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (document.body.classList.contains('in-gallery') || currentSubCategory || document.body.classList.contains('in-subview')) return;
      if (!touchStartY) return;
      const touchEndY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : 0;
      const diff = touchStartY - touchEndY;
      if (window.scrollY < 40 && diff > 50) {
        enterGalleryView(true);
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

  let currentSubCategory = null;
  let currentSubTopic = 'all';

  function getCurrentFilteredPool() {
    let pool = [...galleryItems];
    if (currentFilter === 'wide') {
      pool = pool.filter(i => i.aspectRatio >= 1.2);
    } else if (currentFilter === 'tall') {
      pool = pool.filter(i => i.aspectRatio <= 0.8);
    }
    return pool;
  }

  function applyFilter(filterVal) {
    currentFilter = filterVal;
    const pool = getCurrentFilteredPool();
    currentFilteredItems = pool;
    renderGrid(pool);
  }

  function enterSubcategoryView(subCategoryName, shouldPushHistory = true) {
    if (!subCategoryName) return;
    currentSubCategory = subCategoryName;
    currentSubTopic = 'all';

    document.body.classList.add('in-subview');

    // 关键：临时将页面根元素的滚动行为设为 auto，防止平滑滚动引起向上回滚动画
    document.documentElement.style.scrollBehavior = 'auto';

    const pool = getCurrentFilteredPool();
    renderGrid(pool);

    // 直接无动画瞬时跳转至页面顶端，子页作为独立沉浸式专题呈现
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });

    if (shouldPushHistory) {
      try {
        const url = new URL(window.location.href);
        url.search = 's' + getSubCategoryParam(subCategoryName);
        url.hash = '';
        window.history.pushState({ level: 1, view: 'gallery', subCategory: subCategoryName }, '', url.toString());
      } catch (e) {}
    }

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
      document.documentElement.style.scrollBehavior = '';
    });
  }

  function exitSubcategoryView(shouldPushHistory = true) {
    const prevSub = currentSubCategory;
    currentSubCategory = null;
    currentSubTopic = 'all';

    document.body.classList.remove('in-subview');

    document.documentElement.style.scrollBehavior = 'auto';

    const pool = getCurrentFilteredPool();
    currentFilteredItems = pool;
    renderGrid(pool);

    if (shouldPushHistory) {
      try {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        window.history.pushState({ level: 1, view: 'gallery' }, '', url.toString());
      } catch (e) {}
    }

    if (prevSub) {
      const slug = getSubCategorySlug(prevSub);
      const targetEl = document.getElementById('sec_' + slug);
      if (targetEl) {
        const siteHeader = document.querySelector('.site-header');
        const subbar = document.querySelector('.gallery-subbar');
        const headerH = (siteHeader ? siteHeader.getBoundingClientRect().height : 60);
        const subbarH = (subbar && window.getComputedStyle(subbar).display !== 'none' ? subbar.getBoundingClientRect().height : 0);
        const headerOffset = headerH + subbarH + 20;
        const top = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: 'instant'
        });
      }
    }

    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = '';
    });
  }

  const SUBCATEGORY_META = {
    '艺术制图': {
      en: 'Artistic Cartography',
      ja: '芸術的地図作図',
      ko: '예술적 지도 제작',
      desc: '艺术风格化与抽象视觉探索，弱化复杂标注，强化设计质感与情绪表达。',
      desc_en: 'Stylistic and abstract visual exploration, prioritizing tactile design and emotional resonance.',
      desc_ja: '芸術的スタイライズと抽象的視覚探求。複雑な注記を抑え、デザインの質感と感情表現を際立たせる。',
      desc_ko: '예술적 스타일화와 추상적 시각 탐구. 복잡한 주기를 줄이고 디자인의 질감과 감성적 표현을 강화함.'
    },
    '工程制图': {
      en: 'Engineering Cartography',
      ja: 'エンジニアリング作図',
      ko: '엔지니어링 지도 제작',
      desc: '工程示意制图与施工走向，展示通道骨架、纵坡标高与实际工造生产。',
      desc_en: 'Engineering schematics and alignment mapping, illustrating transit spines and elevations.',
      desc_ja: '土木工学の概念図とルート計画。回廊の骨格、縦断勾配の標高、実工造プロセスを提示する。',
      desc_ko: '엔지니어링 개념도 및 시공 경로. 회랑 골격, 종단 경사 표고 및 실제 시공 프로세스를 제시함.'
    },
    '空间形态': {
      en: 'Spatial Morphology',
      ja: '空間形態論',
      ko: '공간 형태학',
      desc: '聚焦空间形态学，解构宏观路网肌理、水系拓扑演进与枢纽几何构型。',
      desc_en: 'Decoupling spatial morphology, macroscopic road networks, and hydrological topologies.',
      desc_ja: '空間形態学に焦点を当て、マクロ道路網のテクスチャ、水系トポロジーの変遷、ハブの幾何構造を解体・分析する。',
      desc_ko: '공간 형태학에 초점을 맞춰 거시적 도로망 텍스처, 수계 토폴로지 발전 및 허브 기하 구성을 해체·분석함.'
    },
    '图面排版': {
      en: 'Map Layout & Composition',
      ja: '地図レイアウトと組版',
      ko: '지도 레이아웃 및 조판',
      desc: '侧重版面组织、图文配比与版式范式。',
      desc_en: 'Focusing on layout hierarchy, text-to-graphics ratio, and structural standards.',
      desc_ja: 'レイアウト構成、図版とテキストの調和、組版パラダイムを追求する。',
      desc_ko: '레이아웃 구성, 도면과 텍스트의 조화, 조판 패러다임을 추구함.'
    }
  };

  function getSubCategorySlug(sub) {
    const map = {
      '艺术制图': 'art',
      '工程制图': 'engineering',
      '空间形态': 'morphology',
      '图面排版': 'layout'
    };
    return map[sub] || ('sub_' + String(sub).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_'));
  }

  function getItemSubCategories(item) {
    if (!item) return [];
    if (Array.isArray(item.subCategories) && item.subCategories.length > 0) {
      return item.subCategories.filter(s => SUBCATEGORY_ORDER.includes(s));
    }
    if (typeof item.subCategory === 'string') {
      const parts = item.subCategory.split(/[\s·,、/|]+/).filter(Boolean);
      return parts.filter(s => SUBCATEGORY_ORDER.includes(s));
    }
    return [];
  }

  function itemMatchesSubCategory(item, targetCat) {
    if (!item || !targetCat) return false;
    const cats = getItemSubCategories(item);
    return cats.includes(targetCat);
  }

  // 首页展示平衡集合：确保两大图多的子分类（艺术制图与空间形态）均有约 9~13 幅作品构成饱满的 3 行拼贴，杜绝单图撑满整行的失衡排版
  const MORPHOLOGY_HOMEPAGE_IDS = new Set([
    'shanghai', 'china_top12_airports_2024', 'lake_poyang', 'longquanshan_slope_b',
    'chengdu_blueprint', 'chengdu_macaron', 'wuhan_low_saturation',
    'pearl_river_delta_dot_art', 'suzhou_dot_art', 'xian_papercut',
    'chongqing_cyan', 'chongqing_black_gold', 'changsha_emboss'
  ]);

  const ENGINEERING_HOMEPAGE_IDS = new Set([
    'pinglu_canal', 'yangtze_river_bridge_chongqing',
    'tianfu_luxihe_xinglong_lake', 'chengdu_greenway_ring', 'longquanshan_slope_a'
  ]);

  function getPrimarySubCategory(item) {
    if (!item) return '艺术制图';
    if (item.id === 'aba_cycling_route') return '图面排版';
    if (ENGINEERING_HOMEPAGE_IDS.has(item.id)) return '工程制图';
    if (MORPHOLOGY_HOMEPAGE_IDS.has(item.id)) return '空间形态';
    const cats = getItemSubCategories(item);
    if (cats.includes('艺术制图')) return '艺术制图';
    return cats[0] || '艺术制图';
  }

  let pageSpineScrollBound = false;
  let lastSpineGroups = [];

  function updatePageAnchorSpine(groups) {
    lastSpineGroups = groups;
    const spine = document.getElementById('pageAnchorSpine');
    const nodesContainer = document.getElementById('pageSpineNodes');
    const progressBar = document.getElementById('pageSpineProgressBar');
    if (!spine || !nodesContainer) return;

    if (!groups || groups.length === 0) {
      spine.style.display = 'none';
      return;
    }
    spine.style.display = 'flex';
    nodesContainer.innerHTML = '';

    const curLang = window.AtlasI18n ? window.AtlasI18n.getLang() : 'zh';
    groups.forEach((group, idx) => {
      const node = document.createElement('button');
      node.className = 'page-spine-node' + (idx === 0 ? ' active' : '');
      node.setAttribute('data-target', 'sec_' + group.slug);

      const meta = SUBCATEGORY_META[group.name] || {};
      const localizedName = (curLang !== 'zh' && meta[curLang]) ? meta[curLang] : (curLang === 'en' && meta.en ? meta.en : group.name);
      node.setAttribute('aria-label', localizedName);
      node.tabIndex = 0;

      const idxStr = String(idx + 1).padStart(2, '0');
      const countSuffix = curLang === 'en' ? ' works' : (curLang === 'ja' ? ' 作品' : (curLang === 'ko' ? ' 작품' : ' 件'));
      const displayCount = group.totalCount !== undefined ? group.totalCount : group.items.length;
      node.innerHTML =
        '<span class="page-spine-dot">' + idxStr + '</span>' +
        '<div class="page-spine-tooltip">' +
          '<span class="page-spine-idx">' + idxStr + '</span>' +
          '<span class="page-spine-name">' + escapeHtml(localizedName) + '</span>' +
          '<span class="page-spine-count">(' + displayCount + countSuffix + ')</span>' +
        '</div>';

      node.addEventListener('click', (e) => {
        e.preventDefault();
        const targetEl = document.getElementById('sec_' + group.slug);
        if (targetEl) {
          const siteHeader = document.querySelector('.site-header');
          const subbar = document.querySelector('.gallery-subbar');
          const headerH = (siteHeader ? siteHeader.getBoundingClientRect().height : 60);
          const subbarH = (subbar && window.getComputedStyle(subbar).display !== 'none' ? subbar.getBoundingClientRect().height : 0);
          const headerOffset = headerH + subbarH + 20;
          const top = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth'
          });
        }
      });

      nodesContainer.appendChild(node);
    });

    function onScrollSpine() {
      const galleryMain = document.getElementById('galleryMain') || document.querySelector('.gallery-main');
      if (!galleryMain) return;

      const rect = galleryMain.getBoundingClientRect();
      const viewportH = window.innerHeight;

      const footerEl = document.getElementById('portalFooter');
      const footerRect = footerEl ? footerEl.getBoundingClientRect() : null;

      // 仅当视口进入瀑布流卡片区域（首屏已滚出、且页脚未进入）时显示进度条
      const isHeroVisible = rect.top > (viewportH * 0.4);
      const isFooterVisible = footerRect ? (footerRect.top < viewportH * 0.75) : (rect.bottom < viewportH * 0.6);
      const inWaterfallCards = !isHeroVisible && !isFooterVisible;

      if (inWaterfallCards) {
        spine.classList.add('visible');
      } else {
        spine.classList.remove('visible');
      }

      // 计算纯瀑布流区域内部的滚动百分比
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const startY = galleryMain.offsetTop - 80;
      const totalDist = galleryMain.offsetHeight - viewportH + 160;
      let percent = 0;
      if (totalDist > 0) {
        percent = Math.min(100, Math.max(0, ((scrollY - startY) / totalDist) * 100));
      }

      if (progressBar) {
        progressBar.style.height = percent + '%';
      }

      const nodes = nodesContainer.querySelectorAll('.page-spine-node');
      let activeIdx = 0;
      const triggerThreshold = viewportH * 0.45;

      groups.forEach((group, idx) => {
        const targetEl = document.getElementById('sec_' + group.slug);
        if (targetEl) {
          const sRect = targetEl.getBoundingClientRect();
          if (sRect.top <= triggerThreshold) {
            activeIdx = idx;
          }
        }
      });

      if (rect.bottom <= viewportH * 0.6) {
        activeIdx = groups.length - 1;
      }

      nodes.forEach((node, idx) => {
        if (idx === activeIdx) {
          node.classList.add('active');
        } else {
          node.classList.remove('active');
        }
      });
    }

    if (!pageSpineScrollBound) {
      window.addEventListener('scroll', () => {
        requestAnimationFrame(onScrollSpine);
      }, { passive: true });
      window.addEventListener('resize', () => {
        requestAnimationFrame(onScrollSpine);
      }, { passive: true });
      pageSpineScrollBound = true;
    }

    requestAnimationFrame(onScrollSpine);
  }

  function getTopicSlug(topic) {
    let hash = 0;
    const str = String(topic || 'topic');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'topic_' + Math.abs(hash).toString(36);
  }

  function renderSubcategoryView(grid, items) {
    const subItems = items.filter(item => itemMatchesSubCategory(item, currentSubCategory));
    const catIdx = SUBCATEGORY_ORDER.indexOf(currentSubCategory);
    const idxStr = String(catIdx >= 0 ? catIdx + 1 : 1).padStart(2, '0');
    const meta = SUBCATEGORY_META[currentSubCategory] || {};
    const i18n = window.AtlasI18n || null;
    const curLang = (i18n && typeof i18n.getLang === 'function') ? i18n.getLang() : 'zh';
    const localizedTitle = (curLang !== 'zh' && meta[curLang]) ? meta[curLang] : (curLang === 'en' && meta.en ? meta.en : currentSubCategory);
    const descKey = 'desc_' + curLang;
    const desc = (curLang !== 'zh' && meta[descKey]) ? meta[descKey] : (meta.desc || '');
    const countSuffix = (i18n && i18n.t('subviewCountSuffix')) || (curLang === 'en' ? ' Works' : (curLang === 'ja' ? ' 作品' : (curLang === 'ko' ? ' 작품' : ' 件画卷收录')));
    const backText = (i18n && i18n.t('subviewBack')) || '返回全部成果';

    currentFilteredItems = subItems;

    // 1. 构建顶部专题子界面 Banner (干净双侧排版：左标题归属，右导言题记)
    const heroEl = document.createElement('div');
    heroEl.className = 'subcategory-view-hero';
    heroEl.innerHTML =
      '<div class="subview-nav-bar">' +
        '<button class="subview-back-btn" id="btnBackToOverview" type="button" aria-label="' + escapeHtml(backText) + '">' +
          '<svg class="subview-back-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
            '<polyline points="15 18 9 12 15 6"></polyline>' +
          '</svg>' +
          '<span>' + escapeHtml(backText) + '</span>' +
        '</button>' +
        '<span class="subview-nav-divider">/</span>' +
        '<span class="subview-nav-current">' + escapeHtml(localizedTitle) + '</span>' +
      '</div>' +
      '<div class="subview-content-row">' +
        '<div class="subview-lead-title-row">' +
          '<span class="subview-idx">' + idxStr + '</span>' +
          '<span class="subview-divider">/</span>' +
          '<h1 class="subview-title">' + escapeHtml(localizedTitle) + '</h1>' +
          '<span class="subview-badge">' + subItems.length + countSuffix + '</span>' +
        '</div>' +
        (desc ? ('<div class="subview-desc-col"><p class="subview-desc">' + escapeHtml(desc) + '</p></div>') : '') +
      '</div>';

    const btnBack = heroEl.querySelector('#btnBackToOverview');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.history.state && window.history.state.subCategory) {
          window.history.back();
        } else {
          exitSubcategoryView();
        }
      });
    }

    grid.appendChild(heroEl);

    // 2. 瀑布流画卷卡片区：全量连续瀑布流拼贴，根据各图宽高比自由拼贴
    if (subItems.length === 0) {
      const emptyWrap = document.createElement('div');
      emptyWrap.style.cssText = 'padding: 48px 24px; color: var(--text-muted); text-align: center; width: 100%;';
      emptyWrap.textContent = (window.AtlasI18n ? window.AtlasI18n.t('emptyFilter') : '当前专题下暂无收录成果');
      grid.appendChild(emptyWrap);
      updatePageAnchorSpine([]);
      return;
    }

    const isComfort = grid.classList.contains('comfort-mode');
    const section = document.createElement('section');
    section.className = 'gallery-category-section subview-unified-section';
    section.id = 'sec_' + getSubCategorySlug(currentSubCategory);
    section.innerHTML = '<div class="masonry-grid section-grid' + (isComfort ? ' comfort' : '') + '"></div>';

    const sectionGrid = section.querySelector('.section-grid');
    subItems.forEach((item, idx) => {
      sectionGrid.appendChild(createCard(item, idx));
    });

    grid.appendChild(section);

    // 子界面采用单体统一瀑布流，隐藏多段锚点导览轴
    updatePageAnchorSpine([]);
  }

  function shuffleList(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getCardAspect(item) {
    if (item.width && item.height) return item.width / item.height;
    return item.aspectRatio || 1;
  }

  function createMoreCard(group, totalInCat, remainingCount, curLang, unshownItems, allInCat) {
    const isEn = curLang === 'en';
    const meta = SUBCATEGORY_META[group.name] || {};
    const localizedName = (curLang !== 'zh' && meta[curLang]) ? meta[curLang] : (curLang === 'en' && meta.en ? meta.en : group.name);
    
    const card = document.createElement('div');
    card.className = 'gallery-card gallery-more-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('style', '--aspect-ratio: 0.92;');

    const titleText = isEn 
      ? `Explore All ${totalInCat} Works`
      : `探索全部 ${totalInCat} 件画卷`;

    const subText = remainingCount > 0
      ? (isEn ? `+${remainingCount} more in archives` : `另有 ${remainingCount} 件作品未在此屏展出`)
      : (isEn ? `All curated works` : `查看完整制图专题`);

    const btnText = isEn ? 'View Category' : '进入专栏全景';

    card.setAttribute('aria-label', `${titleText}, ${subText}`);

    // 构建九宫格背景缩略图池（优先使用未在此屏展出的作品，不足 9 张则由分类全量作品循环铺展）
    const mosaicPool = [];
    if (Array.isArray(unshownItems)) {
      unshownItems.forEach(it => {
        if (it && it.thumb) mosaicPool.push(it.thumb);
      });
    }
    if (Array.isArray(allInCat) && mosaicPool.length < 9) {
      allInCat.forEach(it => {
        if (it && it.thumb && !mosaicPool.includes(it.thumb)) {
          mosaicPool.push(it.thumb);
        }
      });
    }
    const mosaicThumbs = [];
    if (mosaicPool.length > 0) {
      let mIdx = 0;
      while (mosaicThumbs.length < 9) {
        mosaicThumbs.push(mosaicPool[mIdx % mosaicPool.length]);
        mIdx++;
      }
    }

    const mosaicCellsHtml = mosaicThumbs.map(thumb => 
      '<div class="more-mosaic-cell"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>'
    ).join('');

    const mosaicLayerHtml = mosaicThumbs.length > 0
      ? '<div class="more-card-mosaic-layer" aria-hidden="true">' +
          '<div class="more-card-mosaic-grid">' + mosaicCellsHtml + '</div>' +
          '<div class="more-card-mosaic-scrim"></div>' +
        '</div>'
      : '';

    card.innerHTML = 
      '<div class="more-card-inner">' +
        mosaicLayerHtml +
        '<div class="more-card-grid-bg" aria-hidden="true"></div>' +
        '<div class="more-card-content">' +
          '<div class="more-card-badge-row">' +
            '<span class="more-card-pill">' + escapeHtml(localizedName) + '</span>' +
            '<span class="more-card-count-badge">' + totalInCat + (isEn ? ' Works' : ' 件') + '</span>' +
          '</div>' +
          '<div class="more-card-center-lead">' +
            '<div class="more-card-compass-icon" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                '<circle cx="12" cy="12" r="9.5"></circle>' +
                '<polygon points="12 6 14.5 12 12 10.5 9.5 12 12 6" fill="currentColor" fill-opacity="0.3"></polygon>' +
                '<polygon points="12 18 14.5 12 12 13.5 9.5 12 12 18" fill="currentColor"></polygon>' +
              '</svg>' +
            '</div>' +
            '<h3 class="more-card-heading">' + escapeHtml(titleText) + '</h3>' +
            '<p class="more-card-desc">' + escapeHtml(subText) + '</p>' +
          '</div>' +
          '<div class="more-card-action-bar">' +
            '<span class="more-card-action-btn">' +
              '<span>' + escapeHtml(btnText) + '</span>' +
              '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polyline points="9 18 15 12 9 6"></polyline>' +
              '</svg>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    card.addEventListener('click', (e) => {
      e.preventDefault();
      enterSubcategoryView(group.name);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enterSubcategoryView(group.name);
      }
    });

    return card;
  }

  function renderOverviewSections(grid, items) {
    // 1. 统计当前池中各子分类的全量收录作品数
    const subCatTotalCounts = {};
    SUBCATEGORY_ORDER.forEach(cat => {
      subCatTotalCounts[cat] = items.filter(it => itemMatchesSubCategory(it, cat)).length;
    });

    // 2. 动态两行自适应装箱引擎（含全景长卷拼版、动态视窗配平、智能候补与单分类去重）
    const containerW = grid.clientWidth || (window.innerWidth ? Math.max(320, window.innerWidth - 48) : 1400);
    const isDesktop = containerW >= 900;
    const computedGridStyle = window.getComputedStyle ? window.getComputedStyle(grid) : null;
    const targetRowHeight = (computedGridStyle && parseFloat(computedGridStyle.getPropertyValue('--target-row-height'))) || ((containerW >= 1920) ? 280 : (containerW >= 2560 ? 250 : (containerW <= 1200 ? 260 : 320)));
    const gridGap = (computedGridStyle && parseFloat(computedGridStyle.getPropertyValue('--grid-gap'))) || 16;

    // 单行在当前容器物理宽度下的宽高比安全视窗 [minRowAr, maxRowAr]
    // maxRowAr：单行容积上限，确保严格不折行溢出至第 3 行
    // minRowAr：单行容积下限，配合 flex-grow 撑满容器，确保末行右侧 0 死白空隙
    const maxRowAr = isDesktop ? Math.max(2.8, (containerW - 3 * gridGap) / targetRowHeight) : 3.65;
    const minRowAr = isDesktop ? (maxRowAr / 1.55) : 1.8;

    const usedGlobally = new Set();
    const groups = [];

    // 针对作品较少或特色的专用作品保留优先级（如阿坝骑行、平陆运河等）
    const reservedItems = new Set([
      'aba_cycling_route', 'pinglu_canal', 'yangtze_river_bridge_chongqing',
      'shanghai', 'china_top12_airports_2024', 'lake_poyang', 'longquanshan_slope_b'
    ]);

    SUBCATEGORY_ORDER.forEach(cat => {
      const allInCat = items.filter(it => itemMatchesSubCategory(it, cat));
      const totalCount = allInCat.length;
      if (totalCount === 0) return;

      // 如果属于单品或极少品类（如“图面排版”仅 1 件），直接呈现
      if (totalCount <= 2) {
        allInCat.forEach(it => usedGlobally.add(it.id));
        groups.push({
          name: cat,
          slug: getSubCategorySlug(cat),
          items: allInCat,
          totalCount: totalCount
        });
        return;
      }

      // 每次加载打乱候选池：优先挑选本屏之前分类未展出的画卷；若未展出画卷不足以丰满填满两整行，
      // 由分类其余画卷无缝候补，确保每一分类展区都充盈饱满，绝不在末行出现大片空白
      const pool = shuffleList(allInCat);
      let unused = pool.filter(it => !usedGlobally.has(it.id));
      if (cat === '艺术制图') {
        unused = unused.filter(it => !reservedItems.has(it.id));
      }
      const used = pool.filter(it => usedGlobally.has(it.id));
      const candidatePool = [...unused, ...used];

      const selected = [];
      const selectedIds = new Set();
      function getRemaining() {
        return candidatePool.filter(it => !selectedIds.has(it.id));
      }

      let rowCount = 0;
      const rem1 = getRemaining();
      const wideItem = rem1.find(it => getCardAspect(it) >= 2.5);

      // 若有全景长图且为桌面宽屏：长图占 ~75% + 搭配 1 张方/竖图占 ~25%，严丝合缝拼满第 1 行
      if (wideItem && isDesktop) {
        selected.push(wideItem);
        selectedIds.add(wideItem.id);
        const comp = rem1.find(it => it.id !== wideItem.id && getCardAspect(it) <= 1.05);
        if (comp) {
          selected.push(comp);
          selectedIds.add(comp.id);
        }
        rowCount = 1;
      }

      // 拼满剩余行至严格 2 整行即止，绝不在末行遗留落单孤图或挤入第 3 行
      if (rowCount === 0) {
        let sumAr1 = 0;
        let count1 = 0;
        const candidates1 = getRemaining();
        for (const it of candidates1) {
          const ar = getCardAspect(it);
          const effectiveAr = ar >= 2.5 ? ar * 0.72 : ar;
          // 预判：若加入当前卡片导致第 1 行总宽高比溢出（> maxRowAr），跳过此卡尝试更紧凑卡片
          if (count1 >= 2 && (sumAr1 + effectiveAr > maxRowAr)) {
            continue;
          }
          selected.push(it);
          selectedIds.add(it.id);
          sumAr1 += effectiveAr;
          count1++;
          // 达标即刻成行封顶
          if (sumAr1 >= minRowAr && count1 >= (containerW >= 1400 ? 3 : 2)) {
            break;
          }
        }
        rowCount = 1;
      }

      if (rowCount === 1) {
        let sumAr2 = 0;
        let count2 = 0;
        const candidates2 = getRemaining();
        // 判断第 2 行末尾是否需要压入 MoreCard 终点卡片（MoreCard 宽高比约 0.92）
        const willHaveMore = isDesktop && (totalCount > (selected.length + 2));
        const moreAr = willHaveMore ? 0.92 : 0;

        for (const it of candidates2) {
          const ar = getCardAspect(it);
          const effectiveAr = ar >= 2.5 ? ar * 0.72 : ar;

          // 预判：若加入当前卡片会导致第 2 行加上 MoreCard 后溢出折行，跳过尝试更紧凑卡片
          if (count2 >= 1 && (sumAr2 + effectiveAr + moreAr > maxRowAr)) {
            continue;
          }

          selected.push(it);
          selectedIds.add(it.id);
          sumAr2 += effectiveAr;
          count2++;

          // 达标即刻成行封顶，把末席稳稳留给 MoreCard
          if ((sumAr2 + moreAr) >= minRowAr && count2 >= (willHaveMore ? (containerW >= 1400 ? 3 : 2) : 2)) {
            break;
          }
        }
        rowCount = 2;
      }

      selected.forEach(it => usedGlobally.add(it.id));

      groups.push({
        name: cat,
        slug: getSubCategorySlug(cat),
        items: selected,
        totalCount: totalCount
      });
    });

    const isComfort = grid.classList.contains('comfort-mode');
    let globalIdx = 0;
    const curLang = window.AtlasI18n ? window.AtlasI18n.getLang() : 'zh';
    const isEn = curLang === 'en';

    groups.forEach((group, gIdx) => {
      const meta = SUBCATEGORY_META[group.name] || {};
      const idxStr = String(gIdx + 1).padStart(2, '0');
      const localizedName = (curLang !== 'zh' && meta[curLang]) ? meta[curLang] : (curLang === 'en' && meta.en ? meta.en : group.name);
      const descKey = 'desc_' + curLang;
      const desc = (curLang !== 'zh' && meta[descKey]) ? meta[descKey] : (meta.desc || '');
      const countSuffix = curLang === 'en' ? ' Works' : (curLang === 'ja' ? ' 作品' : (curLang === 'ko' ? ' 작품' : ' 件画卷'));

      const totalInCat = group.totalCount;
      const displayedCount = group.items.length;
      let badgeText = '';
      if (totalInCat > displayedCount && displayedCount > 0) {
        badgeText = curLang === 'en' 
          ? `${totalInCat} Works (${displayedCount} shown)`
          : (curLang === 'ja'
            ? `全 ${totalInCat} 作品 · 本画面 ${displayedCount} 作品`
            : (curLang === 'ko'
              ? `총 ${totalInCat} 작품 · 화면 ${displayedCount} 작품`
              : `共 ${totalInCat} 件 · 本屏 ${displayedCount} 件`));
      } else {
        badgeText = `${totalInCat}${countSuffix}`;
      }

      const enterText = curLang === 'en'
        ? (totalInCat > displayedCount ? `View All (${totalInCat})` : 'Enter')
        : (curLang === 'ja'
          ? (totalInCat > displayedCount ? `全作品を見る (${totalInCat})` : '詳細を見る')
          : (curLang === 'ko'
            ? (totalInCat > displayedCount ? `전체 보기 (${totalInCat})` : '입장')
            : (totalInCat > displayedCount ? `进入分类全景 (${totalInCat} 件)` : (window.AtlasI18n ? window.AtlasI18n.t('subviewEnter') || '进入专题' : '进入专题'))));

      const section = document.createElement('section');
      section.className = 'gallery-category-section gallery-overview-section';
      section.id = 'sec_' + group.slug;
      section.dataset.subcategory = group.name;

      section.innerHTML = 
        '<header class="category-section-header clickable" role="button" tabindex="0" title="' + (curLang === 'en' ? `Enter ${escapeHtml(localizedName)} Category View` : `进入「${escapeHtml(localizedName)}」分类瀑布流（全 ${totalInCat} 件）`) + '">' +
          '<div class="category-header-main-row">' +
            '<div class="category-header-lead">' +
              '<span class="category-section-idx">' + idxStr + '</span>' +
              '<span class="category-section-divider">/</span>' +
              '<h2 class="category-section-title">' + escapeHtml(localizedName) + '</h2>' +
              '<span class="category-section-badge">' + escapeHtml(badgeText) + '</span>' +
            '</div>' +
            '<div class="category-header-action" aria-label="' + escapeHtml(enterText) + '">' +
              '<span class="category-enter-label">' + escapeHtml(enterText) + '</span>' +
              '<svg class="category-enter-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
                '<polyline points="9 18 15 12 9 6"></polyline>' +
              '</svg>' +
            '</div>' +
          '</div>' +
          (desc ? ('<p class="category-section-desc">' + escapeHtml(desc) + '</p>') : '') +
        '</header>' +
        '<div class="masonry-grid section-grid' + (isComfort ? ' comfort' : '') + '"></div>';

      const header = section.querySelector('.category-section-header');
      if (header) {
        header.addEventListener('click', () => {
          enterSubcategoryView(group.name);
        });
        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            enterSubcategoryView(group.name);
          }
        });
      }

      const sectionGrid = section.querySelector('.section-grid');
      group.items.forEach(item => {
        sectionGrid.appendChild(createCard(item, globalIdx++));
      });

      // 如果属于作品较多、收紧为 2 行的分类，在桌面端网格末尾内嵌专席终点卡片，并在移动端追加高质感底部操作按钮
      const isMoreNeeded = (totalInCat > displayedCount);
      if (isMoreNeeded) {
        // 1. 桌面端网格内嵌“合集终点卡片”（More Card），完美填补末行留空
        const remainingCount = totalInCat - displayedCount;
        const unshownItems = (items || []).filter(it => itemMatchesSubCategory(it, group.name) && !group.items.some(s => s.id === it.id));
        const allCatItems = (items || []).filter(it => itemMatchesSubCategory(it, group.name));
        sectionGrid.appendChild(createMoreCard(group, totalInCat, remainingCount, curLang, unshownItems, allCatItems));

        // 2. 移动端独立底部胶囊操作栏（大拇指舒适触控区）
        const moreWrap = document.createElement('div');
        moreWrap.className = 'category-section-bottom-action';
        const moreBtnText = isEn
          ? `View All ${totalInCat} Works in ${group.name} →`
          : `进入「${group.name}」查看全部 ${totalInCat} 件画卷 →`;
        moreWrap.innerHTML =
          '<button type="button" class="category-section-more-btn" aria-label="' + escapeHtml(moreBtnText) + '">' +
            '<span>' + escapeHtml(moreBtnText) + '</span>' +
            '<svg class="category-enter-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
          '</button>';
        const btnMore = moreWrap.querySelector('.category-section-more-btn');
        if (btnMore) {
          btnMore.addEventListener('click', (e) => {
            e.preventDefault();
            enterSubcategoryView(group.name);
          });
        }
        section.appendChild(moreWrap);
      }

      grid.appendChild(section);
    });

    // 渲染完成后在下一帧检测并禁用被截断隐藏超出 3 行卡片的 Tab 聚焦
    requestAnimationFrame(() => {
      document.querySelectorAll('.gallery-overview-section').forEach(sec => {
        const g = sec.querySelector('.section-grid');
        if (!g) return;
        const maxH = g.clientHeight;
        if (maxH > 0) {
          g.querySelectorAll('.gallery-card').forEach(card => {
            if (card.offsetTop >= maxH - 8) {
              card.setAttribute('tabindex', '-1');
              card.setAttribute('aria-hidden', 'true');
            }
          });
        }
      });
    });

    updatePageAnchorSpine(groups);
  }

  function renderGrid(items) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (items.length === 0) {
      const emptyText = window.AtlasI18n ? window.AtlasI18n.t('emptyFilter') : '当前筛选条件下暂无收录成果';
      grid.innerHTML = '<div style="padding: 48px 24px; color: var(--text-muted); text-align: center; width: 100%;">' +
        emptyText + '</div>';
      updatePageAnchorSpine([]);
      return;
    }

    if (currentSubCategory) {
      renderSubcategoryView(grid, items);
    } else {
      renderOverviewSections(grid, items);
    }
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
      const month = parseInt(match[2], 10);
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
      const month = d.getMonth() + 1;
      return year + '.' + month;
    }
    return str;
  }

  function createCard(item, localIdx) {
    const locItem = window.AtlasI18n ? window.AtlasI18n.getItem(item) : item;
    const curLang = window.AtlasI18n ? window.AtlasI18n.getLang() : 'zh';
    const card = document.createElement('article');
    const isUltraWide = (item.aspectRatio >= 2.0);
    const isLandscape = (item.aspectRatio >= 1.2);
    const isPortrait = (item.aspectRatio < 1.2);
    card.className = 'gallery-card' +
      (isUltraWide ? ' is-ultrawide' : '') +
      (isLandscape ? ' is-landscape' : ' is-portrait');
    card.id = 'artCard_' + item.id;
    card.dataset.id = item.id;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.style.setProperty('--aspect-ratio', item.aspectRatio);

    const FORMAT_TAGS = new Set([
      'no', 'no_hero', 'hero:no', 'hero=no',
      '标准竖构图', '标准横幅画幅', '排版横版', 'iPad画幅', '手机壁纸',
      '标准海报', '标准登书版', '排版横幅'
    ]);
    const validTags = (locItem.tags || [])
      .filter(t => !FORMAT_TAGS.has(String(t).trim()));

    const tagsHtml = validTags
      .map(t => '<span class="tag-pill">' + escapeHtml(t) + '</span>').join('');
    const allTagsTooltip = validTags.length > 0 
      ? (curLang === 'en' ? `Tags: ${validTags.join(' · ')}` : (curLang === 'ja' ? `タグ: ${validTags.join(' · ')}` : (curLang === 'ko' ? `태그: ${validTags.join(' · ')}` : `标签：${validTags.join(' · ')}`)))
      : '';

    const isNew = isNewArtwork(item);
    const newBadgeAria = window.AtlasI18n ? (window.AtlasI18n.t('badgeNewAria') || '新作') : '新作';
    const newBadgeHtml = isNew ?
      '<span class="card-new-badge" aria-label="' + escapeHtml(newBadgeAria) + '">' +
        SVG_SPARKLE +
        '<span>NEW</span>' +
      '</span>' : '';

    const clickHintText = window.AtlasI18n ? (window.AtlasI18n.t('cardClickHint') || '点击查看详图') : '点击查看详图';
    const centerHintHtml = 
      '<div class="card-center-action" aria-hidden="true">' +
        '<span class="card-center-btn">' +
          '<svg class="card-center-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="11" cy="11" r="7"></circle>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
            '<line x1="11" y1="8" x2="11" y2="14"></line>' +
            '<line x1="8" y1="11" x2="14" y2="11"></line>' +
          '</svg>' +
          '<span class="card-center-text" data-i18n="cardClickHint">' + escapeHtml(clickHintText) + '</span>' +
        '</span>' +
      '</div>';

    card.innerHTML = 
      '<div class="card-media">' +
        newBadgeHtml +
        '<img class="card-img" src="' + item.thumb + '" alt="' + escapeHtml(locItem.title) + '" loading="lazy" />' +
        centerHintHtml +
        '<div class="card-scrim-mask">' +
          '<div class="card-scrim-content">' +
            '<h3 class="card-title">' + escapeHtml(locItem.title) + '</h3>' +
            '<div class="card-meta-row">' +
              '<div class="card-tags"' + (allTagsTooltip ? ' title="' + escapeHtml(allTagsTooltip) + '"' : '') + '>' + tagsHtml + '</div>' +
            '</div>' +
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
      grid.querySelectorAll('.section-grid').forEach(g => g.classList.remove('comfort'));
    });

    btnComfort.addEventListener('click', () => {
      btnComfort.classList.add('active');
      btnDense.classList.remove('active');
      grid.classList.add('comfort-mode');
      grid.querySelectorAll('.section-grid').forEach(g => g.classList.add('comfort'));
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
    function blurBtn(btn) {
      if (btn) {
        btn.style.transform = '';
        const inner = btn.querySelector('.icon, .tool-btn-text, span') || btn.firstElementChild;
        if (inner) inner.style.transform = '';
        if (typeof btn._resetMagnetic === 'function') btn._resetMagnetic();
        if (typeof btn.blur === 'function') {
          try { btn.blur(); } catch (e) {}
        }
      }
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        try { document.activeElement.blur(); } catch (e) {}
      }
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => { blurBtn(prevBtn); navigateArtwork(-1); });
      prevBtn.addEventListener('touchend', () => setTimeout(() => blurBtn(prevBtn), 20), { passive: true });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { blurBtn(nextBtn); navigateArtwork(1); });
      nextBtn.addEventListener('touchend', () => setTimeout(() => blurBtn(nextBtn), 20), { passive: true });
    }
    if (edgePrevBtn) {
      edgePrevBtn.addEventListener('click', () => { blurBtn(edgePrevBtn); navigateArtwork(-1); });
      edgePrevBtn.addEventListener('touchend', () => setTimeout(() => blurBtn(edgePrevBtn), 20), { passive: true });
    }
    if (edgeNextBtn) {
      edgeNextBtn.addEventListener('click', () => { blurBtn(edgeNextBtn); navigateArtwork(1); });
      edgeNextBtn.addEventListener('touchend', () => setTimeout(() => blurBtn(edgeNextBtn), 20), { passive: true });
    }

    // 桌面端两侧大翻页按钮边缘微隐唤出 (Hover-to-Reveal · 零遮挡画布)
    let edgeNavRaf = null;
    function handleEdgeNavReveal(e) {
      if (!edgePrevBtn || !edgeNextBtn) return;
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if (edgeNavRaf) return;
      edgeNavRaf = requestAnimationFrame(() => {
        edgeNavRaf = null;
        const x = e.clientX;
        const winWidth = window.innerWidth;
        const isDrawerOpen = modalEl.classList.contains('drawer-open') || (drawerEl && drawerEl.classList.contains('open'));
        const drawerWidth = (drawerEl && drawerEl.offsetWidth > 0) ? drawerEl.offsetWidth : 364;
        const rightBoundary = isDrawerOpen ? (winWidth - drawerWidth) : winWidth;

        // 视口左右两端 110px 灵敏感应区
        const showPrev = x >= 0 && x <= 110;
        const showNext = x >= (rightBoundary - 110) && x <= rightBoundary;

        if (showPrev) {
          edgePrevBtn.classList.add('edge-revealed');
        } else {
          edgePrevBtn.classList.remove('edge-revealed');
        }

        if (showNext) {
          edgeNextBtn.classList.add('edge-revealed');
        } else {
          edgeNextBtn.classList.remove('edge-revealed');
        }
      });
    }

    function handleEdgeNavMouseLeave() {
      if (edgePrevBtn) edgePrevBtn.classList.remove('edge-revealed');
      if (edgeNextBtn) edgeNextBtn.classList.remove('edge-revealed');
    }

    modalEl.addEventListener('mousemove', handleEdgeNavReveal, { passive: true });
    modalEl.addEventListener('mouseleave', handleEdgeNavMouseLeave, { passive: true });
    if (toolReset) {
      toolReset.addEventListener('click', () => {
        if (osdViewer && osdViewer.viewport) {
          osdViewer.viewport.goHome();
        }
        blurBtn(toolReset);
      });
      toolReset.addEventListener('touchend', () => setTimeout(() => blurBtn(toolReset), 50), { passive: true });
    }

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
        toolFullscreen.dataset.customTip = isFs ? '退出全屏 (F / Esc)' : '全屏阅览 (F)';
        toolFullscreen.removeAttribute('title');
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
      const sub = getSubFromUrl(urlParams);
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

        if (sub) {
          if (currentSubCategory !== sub) {
            enterSubcategoryView(sub, false);
          }
        } else {
          if (currentSubCategory !== null) {
            exitSubcategoryView(false);
          }
        }

        // 判断是否退回到了首屏 Level 0
        if ((state.level === 0 || (!window.location.hash && !state.level)) && !sub) {
          currentHistoryLevel = 0;
          document.documentElement.classList.remove('has-entered-gallery');
          document.body.classList.remove('in-gallery');
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

    function isTouchOrMobile() {
      return window.innerWidth <= 768 ||
             window.matchMedia('(hover: none)').matches ||
             window.matchMedia('(pointer: coarse)').matches ||
             ('ontouchstart' in window && window.innerWidth <= 1024) ||
             (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);
    }

    const buttons = dock.querySelectorAll('.tool-btn');
    buttons.forEach(btn => {
      let rafId = null;
      let targetX = 0, targetY = 0, targetRotX = 0, targetRotY = 0, targetScale = 1;
      let currentX = 0, currentY = 0, currentRotX = 0, currentRotY = 0, currentScale = 1;
      let isHovered = false;
      const innerTarget = btn.querySelector('.icon, .tool-btn-text, span') || btn.firstElementChild;

      function resetBtn() {
        isHovered = false;
        targetX = 0;
        targetY = 0;
        targetRotX = 0;
        targetRotY = 0;
        targetScale = 1.0;
        currentX = 0;
        currentY = 0;
        currentRotX = 0;
        currentRotY = 0;
        currentScale = 1.0;
        btn.style.transform = '';
        if (innerTarget) innerTarget.style.transform = '';
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }

      btn._resetMagnetic = resetBtn;

      function renderFrame() {
        if (isTouchOrMobile()) {
          resetBtn();
          return;
        }

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
          resetBtn();
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

      btn.addEventListener('mouseenter', (e) => {
        if (isTouchOrMobile() || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
        isHovered = true;
        targetScale = 1.18;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mousemove', (e) => {
        if (isTouchOrMobile() || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) {
          resetBtn();
          return;
        }
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

      btn.addEventListener('mousedown', (e) => {
        if (isTouchOrMobile() || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
        targetScale = 0.94;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mouseup', () => {
        if (isTouchOrMobile()) {
          resetBtn();
          return;
        }
        targetScale = isHovered ? 1.18 : 1.0;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mouseleave', resetBtn);
      btn.addEventListener('click', () => {
        if (isTouchOrMobile()) resetBtn();
      });
      btn.addEventListener('touchend', resetBtn, { passive: true });
      btn.addEventListener('touchcancel', resetBtn, { passive: true });
      btn.addEventListener('blur', resetBtn);
    });

    window.addEventListener('resize', () => {
      if (isTouchOrMobile()) {
        buttons.forEach(b => {
          if (typeof b._resetMagnetic === 'function') b._resetMagnetic();
        });
      }
    }, { passive: true });

    // 挂载高质感自定义毛玻璃悬浮气泡提示，彻底替换浏览器原生 title 丑提示
    initDockTooltips();
  }

  /* -------------------------------------------------------------
     Custom Frosted Tooltips for Bottom Dock (工具栏高质感悬浮气泡)
     彻底消除操作系统/浏览器默认原生白底黑框 title，替换为全站统一毛玻璃气泡
     ------------------------------------------------------------- */
  function initDockTooltips() {
    setupGroupTooltip(
      document.querySelector('.viewer-floating-toolbar'),
      document.getElementById('dockTooltip'),
      document.getElementById('dockTooltipText'),
      document.getElementById('dockTooltipKbd'),
      '.tool-btn, .tool-zoom-pill, .tool-zoom-badge, #btnZoomChevron'
    );

    setupGroupTooltip(
      document.querySelector('.viewer-top-actions'),
      document.getElementById('topTooltip'),
      document.getElementById('topTooltipText'),
      document.getElementById('topTooltipKbd'),
      '.lang-dropdown-btn, .tool-btn'
    );

    // 左右侧边翻卷悬浮按钮气泡提示
    initEdgeNavTooltips();

    // 左上角 QMapFlow 精度徽标气泡提示
    initQmapFlowTooltip();

    // 防御性彻底清除看图器内所有原生 title 属性，绝不触发操作系统老式黑白/黄色方框提示
    document.querySelectorAll('.viewer-container [title], .viewer-modal [title]').forEach(el => {
      if (!el.dataset.customTip) {
        el.dataset.customTip = el.getAttribute('title');
      }
      el.removeAttribute('title');
    });
  }

  /* -------------------------------------------------------------
     Edge Navigation Tooltips (两侧悬浮翻卷按钮微胶囊提示)
     ------------------------------------------------------------- */
  function initEdgeNavTooltips() {
    const prevBtn = document.getElementById('btnEdgePrev');
    const nextBtn = document.getElementById('btnEdgeNext');
    const prevTip = document.getElementById('edgePrevTooltip');
    const nextTip = document.getElementById('edgeNextTooltip');
    const prevText = document.getElementById('edgePrevTooltipText');
    const nextText = document.getElementById('edgeNextTooltipText');
    const prevKbd = document.getElementById('edgePrevTooltipKbd');
    const nextKbd = document.getElementById('edgeNextTooltipKbd');

    function bindEdgeTip(btn, tip, textEl, kbdEl, fallbackTip, defaultKbd) {
      if (!btn || !tip) return;
      btn.removeAttribute('title');

      function showTip() {
        btn.removeAttribute('title');
        let raw = '';
        if (btn.dataset.i18nTitle && window.AtlasI18n && typeof AtlasI18n.t === 'function') {
          raw = AtlasI18n.t(btn.dataset.i18nTitle) || btn.dataset.customTip || fallbackTip;
        } else {
          raw = btn.dataset.customTip || fallbackTip;
        }
        const m = raw.match(/^(.*?)\s*\(([^)]+)\)$/);
        if (m) {
          if (textEl) textEl.textContent = m[1].trim();
          if (kbdEl) { kbdEl.textContent = m[2].trim(); kbdEl.style.display = 'inline-flex'; }
        } else {
          if (textEl) textEl.textContent = raw.trim();
          if (kbdEl) { kbdEl.textContent = defaultKbd; kbdEl.style.display = defaultKbd ? 'inline-flex' : 'none'; }
        }

        const rect = btn.getBoundingClientRect();
        if (btn.classList.contains('edge-prev')) {
          tip.style.left = (rect.right + 12) + 'px';
          tip.style.right = 'auto';
          tip.style.top = (rect.top + rect.height / 2) + 'px';
        } else {
          tip.style.right = (window.innerWidth - rect.left + 12) + 'px';
          tip.style.left = 'auto';
          tip.style.top = (rect.top + rect.height / 2) + 'px';
        }
        tip.classList.add('visible');
      }

      function hideTip() {
        tip.classList.remove('visible');
      }

      btn.addEventListener('mouseenter', showTip);
      btn.addEventListener('mouseleave', hideTip);
      btn.addEventListener('click', hideTip);
    }

    bindEdgeTip(prevBtn, prevTip, prevText, prevKbd, '上一卷 (←)', '←');
    bindEdgeTip(nextBtn, nextTip, nextText, nextKbd, '下一卷 (→)', '→');
  }

  /* -------------------------------------------------------------
     QMapFlow Tooltip (左上角制图工作流精度微胶囊提示)
     ------------------------------------------------------------- */
  function initQmapFlowTooltip() {
    const qmfBtn = document.getElementById('viewerQmapFlow');
    const qmfTip = document.getElementById('qmapflowTooltip');
    const qmfText = document.getElementById('qmapflowTooltipText');
    if (!qmfBtn || !qmfTip) return;

    qmfBtn.removeAttribute('title');

    function showTip() {
      qmfBtn.removeAttribute('title');
      const text = qmfBtn.dataset.customTip || (qmfText ? qmfText.textContent : 'QMapFlow: QGIS 独立制图内容占比 100%');
      if (qmfText) qmfText.textContent = text;

      const badge = document.getElementById('viewerArtworkBadge');
      if (badge) {
        const badgeRect = badge.getBoundingClientRect();
        const qmfRect = qmfBtn.getBoundingClientRect();
        const leftOffset = qmfRect.left - badgeRect.left;
        qmfTip.style.left = Math.max(0, leftOffset) + 'px';
      }
      qmfTip.classList.add('visible');
    }

    function hideTip() {
      qmfTip.classList.remove('visible');
    }

    qmfBtn.addEventListener('mouseenter', showTip);
    qmfBtn.addEventListener('mouseleave', hideTip);
    qmfBtn.addEventListener('click', hideTip);
  }

  function setupGroupTooltip(container, tooltipEl, tooltipText, tooltipKbd, selector) {
    if (!container || !tooltipEl || !tooltipText) return;

    const interactiveItems = container.querySelectorAll(selector);
    interactiveItems.forEach(el => {
      // 提取原生 title 或 data-i18n-title，并移除原生 title 属性以彻底屏蔽操作系统丑陋黑白提示框
      const rawTitle = el.getAttribute('title') || '';
      if (rawTitle) {
        el.dataset.customTip = rawTitle;
        el.removeAttribute('title');
      }

      function showTip() {
        // 彻底清除并拦截任何可能的原生 title 属性，杜绝系统老式黄色/深灰色矩形框双重弹出
        if (el.hasAttribute('title')) {
          const tVal = el.getAttribute('title');
          if (tVal && !el.dataset.customTip) el.dataset.customTip = tVal;
          el.removeAttribute('title');
        }
        let text = '';
        if (el.dataset.i18nTitle && window.AtlasI18n && typeof AtlasI18n.t === 'function') {
          text = AtlasI18n.t(el.dataset.i18nTitle) || el.dataset.customTip || '';
        } else {
          text = el.dataset.customTip || '';
        }
        if (!text) return;

        // 智能提取括号内的快捷键提示 (如 "(I)", "(0)", "(R)", "(F)", "(S)", "(Esc)", "(T)")
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

        // 精确对齐到当前按钮正上方或正下方中轴线
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const centerOffset = (elRect.left + elRect.width / 2) - containerRect.left;
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

    container.addEventListener('mouseleave', () => {
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

    const dominantColor = (item.navGradient && item.navGradient[1]) || (item.navGradient && item.navGradient[0]) || (item.colors && item.colors[0]) || (item.color && item.color[0]) || '#07080b';
    const gradientCss = (function (it) {
      if (it && it.navGradient && Array.isArray(it.navGradient) && it.navGradient.length >= 2) {
        if (it.navGradient.length === 3) {
          return `linear-gradient(135deg, ${it.navGradient[0]} 0%, ${it.navGradient[1]} 50%, ${it.navGradient[2]} 100%)`;
        }
        return `linear-gradient(135deg, ${it.navGradient[0]} 0%, ${it.navGradient[1]} 100%)`;
      }
      return `linear-gradient(135deg, ${dominantColor} 0%, #07080b 100%)`;
    })(item);

    const borderOffset = 3; // 1.5px * 2 borders
    const navPanel = document.getElementById('viewerNavigatorPanel');
    if (navPanel) {
      navPanel.style.width = (targetW + borderOffset) + 'px';
      navPanel.style.height = (targetH + borderOffset) + 'px';
      navPanel.style.setProperty('--nav-bg', dominantColor);
      navPanel.style.setProperty('--nav-gradient', gradientCss);
    }

    navEl.style.width = targetW + 'px';
    navEl.style.height = targetH + 'px';
    navEl.style.setProperty('--nav-bg', dominantColor);
    navEl.style.setProperty('--nav-gradient', gradientCss);
    if (item && item.thumb) {
      const fullThumbUrl = new URL(item.thumb, window.location.href).href;
      navEl.style.setProperty('--nav-thumb', 'url("' + fullThumbUrl + '")');
      navEl.style.setProperty('--nav-thumb-opacity', '1');
    }
    // 同步更新 navigator 内所有层级容器与 canvas 背景，画布透明以便即时透出三锚点底图
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

    // 0ms 同步提取三锚点专属渐变色，消灭黑屏与上一幅图残留杂色
    const dominantColor = (item.navGradient && item.navGradient[1]) || (item.navGradient && item.navGradient[0]) || (item.colors && item.colors[0]) || (item.color && item.color[0]) || '#07080b';
    const gradientCss = (function (it) {
      if (it && it.navGradient && Array.isArray(it.navGradient) && it.navGradient.length >= 2) {
        if (it.navGradient.length === 3) {
          return `linear-gradient(135deg, ${it.navGradient[0]} 0%, ${it.navGradient[1]} 50%, ${it.navGradient[2]} 100%)`;
        }
        return `linear-gradient(135deg, ${it.navGradient[0]} 0%, ${it.navGradient[1]} 100%)`;
      }
      return `linear-gradient(135deg, ${dominantColor} 0%, #07080b 100%)`;
    })(item);

    // 依三锚点采样色即时测算明暗调性
    let isDarkInitial = detectArtworkIsDark(item);
    if (item.navGradient && Array.isArray(item.navGradient) && item.navGradient.length > 0) {
      const hex = item.navGradient[1] || item.navGradient[0];
      const rgb = hexToRgb(hex);
      const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      isDarkInitial = lum < 135;
    }

    if (backdropEl) {
      backdropEl.style.setProperty('--viewer-ambient-gradient', gradientCss);
      backdropEl.classList.toggle('artwork-dark', isDarkInitial);
      backdropEl.classList.toggle('artwork-light', !isDarkInitial);
    }

    // 0ms 瞬间清空上一幅作品的残留模糊光斑，确保当前作品的三锚点专属渐变色 0ms 纯净首发透出
    layerA.classList.remove('active');
    layerB.classList.remove('active');
    if (meshLayer) meshLayer.classList.remove('active');

    // Cross-fade between layers A and B for silky smooth transitions
    const nextLayer = (activeAmbientLayer === 'A') ? layerB : layerA;
    const prevLayer = (activeAmbientLayer === 'A') ? layerA : layerB;
    activeAmbientLayer = (activeAmbientLayer === 'A') ? 'B' : 'A';

    // 辅助函数：将已解码图像通过 24x24 离屏 Canvas 双线性低频采样，消除压缩色偏与高频噪点并生成弥散底图
    function applyAmbientData(source) {
      try {
        let cached = ambientCanvasCache.get(item.id);
        let dataUrl = cached ? cached.dataUrl : null;
        let avgLum = cached ? cached.avgLum : 100;

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
            ambientCanvasCache.set(item.id, { dataUrl, avgLum });
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
        const fallbackColor = dominantColor;
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
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      try { document.activeElement.blur(); } catch (e) {}
    }
    const dock = document.querySelector('.viewer-floating-toolbar');
    if (dock) {
      dock.querySelectorAll('.tool-btn').forEach(btn => {
        if (typeof btn._resetMagnetic === 'function') {
          btn._resetMagnetic();
        } else {
          btn.style.transform = '';
          const inner = btn.querySelector('.icon, .tool-btn-text, span') || btn.firstElementChild;
          if (inner) inner.style.transform = '';
        }
        if (typeof btn.blur === 'function') {
          try { btn.blur(); } catch (e) {}
        }
      });
    }
    currentViewerIndex = (currentViewerIndex + direction + currentFilteredItems.length) % currentFilteredItems.length;
    showArtwork(currentFilteredItems[currentViewerIndex], false);
  }

  function detectArtworkIsDark(item) {
    if (!item) return true;
    const textMeta = (item.title || '') + ' ' + (item.topics || []).join(' ') + ' ' + (item.tags || []).join(' ') + ' ' + (item.description || '').substring(0, 80);
    if (/(?:黑金|暗夜|暗黑|夜景|深色|黑底|蓝图|black|dark|night)/i.test(textMeta)) {
      return true;
    }
    if (/(?:剪纸|白底|拟态|纸质|浅色|马卡龙|papercut|light|white)/i.test(textMeta)) {
      return false;
    }
    if (item.colors && item.colors.length > 0) {
      const lums = item.colors.map(c => {
        const hex = String(c).replace(/^#/, '');
        if (hex.length !== 6) return 128;
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b;
      });
      const hasPitchBlack = lums.some(l => l < 35);
      if (hasPitchBlack && !/(?:剪纸|拟态|白)/.test(textMeta)) {
        return true;
      }
      const avgLum = lums.reduce((a, b) => a + b, 0) / lums.length;
      return avgLum < 135;
    }
    return true;
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

    // 依当前展品综合色板与元数据智能计算作品调性 (dark/light)
    const isDarkArtwork = detectArtworkIsDark(item);
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
      qmfEl.dataset.customTip = qmfTitle;
      qmfEl.removeAttribute('title');
      const qmfTipText = document.getElementById('qmapflowTooltipText');
      if (qmfTipText) qmfTipText.textContent = qmfTitle;
      if (!qmfEl.dataset.qmfBound) {
        qmfEl.dataset.qmfBound = 'true';
        qmfEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open('https://github.com/OpenQGIS/QMapFlow', '_blank', 'noopener,noreferrer');
        });
      }
    }
    if (vDims) vDims.textContent = item.width + ' × ' + item.height + ' px';
    if (mCat) {
      let catStr = locItem.categoryName || locItem.category || '';
      if (locItem.subCategory) catStr += ' · ' + locItem.subCategory;
      if (locItem.topic) catStr += ' · ' + locItem.topic;
      mCat.textContent = catStr;
    }

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
      const curLang = window.AtlasI18n ? window.AtlasI18n.getLang() : 'zh';
      if (curLang === 'zh' && locItem.descriptionHtml) {
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

    // Extract dominant palette / render markdown annotated palette
    if (mSwatches) {
      function renderSwatches(colors) {
        if (!modalEl.classList.contains('open')) return;
        const currentItem = (currentViewerIndex >= 0 && currentFilteredItems[currentViewerIndex]) ? currentFilteredItems[currentViewerIndex] : activeItem;
        if (currentItem && currentItem.id !== activeItem.id) return;

        mSwatches.innerHTML = '';
        if (!colors || colors.length === 0) {
          mSwatches.innerHTML = '<span style="font-size:0.72rem;color:var(--text-muted);">' + t('metaPaletteEmpty') + '</span>';
          return;
        }
        colors.forEach(function (hex) {
          const btn = document.createElement('button');
          btn.className = 'meta-swatch';
          btn.dataset.customTip = t('metaPaletteHint') + hex;
          btn.setAttribute('aria-label', t('metaPaletteHint') + hex);
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
      }

      // 优先从当前对象或全局列表中提取 Markdown 标注的色板
      let explicitColors = (item.colors && item.colors.length > 0) ? item.colors : ((item.color && item.color.length > 0) ? item.color : null);
      if ((!explicitColors || explicitColors.length === 0) && item.id) {
        const found = galleryItems.find(i => i.id === item.id);
        if (found) explicitColors = found.colors || found.color;
      }
      if (typeof explicitColors === 'string') {
        explicitColors = explicitColors.match(/#[0-9a-fA-F]{3,8}/g) || [explicitColors];
      }

      if (Array.isArray(explicitColors) && explicitColors.length > 0) {
        // Markdown 中已标定色板：直接秒级同步呈现，彻底杜绝“提取中...”停留
        renderSwatches(explicitColors.slice(0, 5));
      } else {
        // 未标定时才异步提取
        mSwatches.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">' + t('metaPaletteExtracting') + '</span>';
        extractDominantColors(item, 5, function (colors) {
          renderSwatches(colors);
        });
      }
    }

    const mShareUrl = document.getElementById('metaShareUrl');
    const shareUrl = getShareUrlForItem(item);
    if (mShareUrl) {
      mShareUrl.textContent = shareUrl;
      mShareUrl.dataset.customTip = shareUrl;
      mShareUrl.removeAttribute('title');
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

    const dominantColor = (item.navGradient && item.navGradient[1]) || (item.navGradient && item.navGradient[0]) || (item.colors && item.colors[0]) || (item.color && item.color[0]) || '#07080b';
    const gradientCss = (function (it) {
      if (it && it.navGradient && Array.isArray(it.navGradient) && it.navGradient.length >= 2) {
        if (it.navGradient.length === 3) {
          return `linear-gradient(135deg, ${it.navGradient[0]} 0%, ${it.navGradient[1]} 50%, ${it.navGradient[2]} 100%)`;
        }
        return `linear-gradient(135deg, ${it.navGradient[0]} 0%, ${it.navGradient[1]} 100%)`;
      }
      return `linear-gradient(135deg, ${dominantColor} 0%, #07080b 100%)`;
    })(item);

    // 1. 大图背景环境光：0ms 同步应用 3 锚点空间柔光渐变，彻底消灭黑屏死底板
    const ambientBackdrop = document.getElementById('viewerAmbientBackdrop');
    if (ambientBackdrop) {
      ambientBackdrop.style.setProperty('--viewer-ambient-gradient', gradientCss);
    }
    const appBase = getAppBaseUrl();
    const fullThumbUrl = (item && item.thumb) ? (item.thumb.startsWith('http') ? item.thumb : new URL(item.thumb, appBase).href) : '';

    // 2. 视口 0ms 瞬时缩略底图占位（在切片到达前，Retina 级 640px 缩略图铺满居中，消灭黑屏真空期）
    if (stage && fullThumbUrl) {
      stage.style.setProperty('--stage-thumb', 'url("' + fullThumbUrl + '")');
      stage.style.setProperty('--stage-thumb-opacity', '1');
    }

    const config = window.ATLAS_CONFIG || window.CANGFENG_CONFIG || {};
    const assetBase = (config.assetBaseUrl || '').replace(/\/+$/, '');

    const localTileBase = appBase + 'tiles/' + item.id + '_files/';
    const remoteTileBase = assetBase ? (assetBase + '/tiles/' + item.id + '_files/') : localTileBase;

    const dpr = window.devicePixelRatio || 1;
    const isPhone = window.innerWidth <= 768;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 1024;

    // 全设备通用 DPR 自适应阈值：
    // 1. 触控移动端/平板（iPhone DPR=3, 安卓旗舰 DPR=3.5, iPad Retina DPR=2）：
    //    将阈值精调为 1.0 ~ 1.25，彻底杜绝开屏即过载拉取 70+ 张最高清切片，确保全景瞬开；
    // 2. 4K / 5K / Retina PC 桌面端：
    //    维持 0.5 ~ 0.75，充分释放宽带与桌面显卡性能，保障 27-32 寸大屏原生极致细节。
    let optimalMinPixelRatio = 0.5;
    if (isTouchDevice) {
      optimalMinPixelRatio = dpr >= 2.5 ? 1.25 : (dpr >= 1.8 ? 1.0 : 0.8);
    } else if (dpr >= 2.0) {
      optimalMinPixelRatio = 0.75;
    }

    const tileWidth = item.width || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Width) || 2000;
    const tileHeight = item.height || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Height) || 2000;
    const tileMaxLevel = item.maxLevel !== undefined ? item.maxLevel : Math.ceil(Math.log2(Math.max(tileWidth, tileHeight)));
    const calculatedMinLevel = 0;

    // 4K Ultra-HD Tile Loading Capsule HUD (Lottie Animation)
    const hdLoaderEl = document.getElementById('viewerHdLoader');
    const hdLoaderAnimEl = document.getElementById('viewerHdLoaderAnim');
    const hdLoaderTitleEl = document.getElementById('viewerHdLoaderTitle');
    const hdLoaderSubEl = document.getElementById('viewerHdLoaderSub');

    let lottieInstance = null;
    if (window.lottie && window.LOADING_LOTTIE_DATA && hdLoaderAnimEl) {
      if (window._hdLottieAnim) {
        try { window._hdLottieAnim.destroy(); } catch (e) {}
      }
      hdLoaderAnimEl.innerHTML = '';
      try {
        window._hdLottieAnim = window.lottie.loadAnimation({
          container: hdLoaderAnimEl,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData: window.LOADING_LOTTIE_DATA
        });
        lottieInstance = window._hdLottieAnim;
      } catch (err) {
        console.warn('Lottie initialization failed:', err);
      }
    }

    const pendingCdnTiles = new Set();
    let hdLoaderTimer = null;
    let isHdLoaderVisible = false;
    let isInitialOpening = true;
    let openingSafetyTimer = null;
    let lastStableZoom = 1.0;
    let isDrasticZoomPending = false;
    let hasRequestedCdnForZoom = false;

    function showHdLoader() {
      if (!hdLoaderEl) return;
      isHdLoaderVisible = true;
      hdLoaderEl.classList.add('active');
      if (hdLoaderSubEl) hdLoaderSubEl.style.display = 'none';
      if (hdLoaderTitleEl) {
        hdLoaderTitleEl.textContent = (window.AtlasI18n && window.AtlasI18n.t('viewerHdLoading')) || '加载中…';
      }
      if (lottieInstance) lottieInstance.play();
    }

    function hideHdLoader() {
      if (!hdLoaderEl) return;
      clearTimeout(hdLoaderTimer);
      hdLoaderTimer = null;
      clearTimeout(openingSafetyTimer);
      openingSafetyTimer = null;
      isHdLoaderVisible = false;
      hdLoaderEl.classList.remove('active');
      if (lottieInstance) lottieInstance.pause();
      if (hdLoaderSubEl) hdLoaderSubEl.style.display = 'none';
    }

    function checkAndTriggerDrasticLoader() {
      if (!isDrasticZoomPending || isHdLoaderVisible) return;
      if (hdLoaderTimer) return;
      hdLoaderTimer = setTimeout(() => {
        hdLoaderTimer = null;
        if (isDrasticZoomPending && pendingCdnTiles.size > 0 && !isHdLoaderVisible) {
          showHdLoader();
        }
      }, 100);
    }

    // 阶段一：打开大图，底图切片尚未绘制前，显示居中加载动画提醒
    showHdLoader();
    openingSafetyTimer = setTimeout(() => {
      if (isInitialOpening) {
        isInitialOpening = false;
        hideHdLoader();
      }
    }, 5000);

    const tileSource = {
      width: tileWidth,
      height: tileHeight,
      tileSize: item.tileSize || 256,
      tileOverlap: item.overlap || 0,
      minLevel: calculatedMinLevel,
      maxLevel: tileMaxLevel,
      getTileUrl: function (level, x, y) {
        // 混合切片加载架构：
        // 0~11 级骨架切片走 GitHub Pages 同源 (0ms 本地瞬开，1080P视网膜点对点，完全不可逆向原图)
        // 12 级及以上高保真切片走 Cloudflare Workers CDN (按需深度放大拉取，源图隔离保护)
        const isRemote = (level >= 12 && assetBase);
        const base = isRemote ? remoteTileBase : localTileBase;
        const url = base + level + '/' + x + '_' + y + '.' + (item.format || 'webp');
        if (isRemote) {
          hasRequestedCdnForZoom = true;
          pendingCdnTiles.add(url);
          // 阶段二与阶段三：普通平滑放大与局部清晰度升级后台偷偷加载，不弹动画提醒，保持视界沉浸
          // 仅当地图变化差异很大（缩放跳变 >= 2.5 倍），且高保真切片加载持续超 100ms 时才唤起提示
          checkAndTriggerDrasticLoader();
        }
        return url;
      }
    };

    try {
      osdViewer = OpenSeadragon({
        element: stage,
        prefixUrl: '',
        showNavigationControl: false,
        showNavigator: true,
        navigatorElement: navEl,
        navigatorId: 'viewerNavigator',
        navigatorAutoFade: false,
        navigatorRotate: true,
        navigatorBackground: 'transparent',
        autoResize: true,
        animationTime: 0.45,
        blendTime: isPhone ? 0.05 : 0.15,
        constrainDuringPan: true,
        maxZoomPixelRatio: 4.5,
        minPixelRatio: optimalMinPixelRatio,
        imageLoaderLimit: isPhone ? 16 : 24,
        maxImageCacheCount: isPhone ? 160 : 300,
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
      window.osdViewer = osdViewer;

      if (navEl) {
        navEl.querySelectorAll('.openseadragon-container, .openseadragon-canvas, canvas').forEach(el => {
          el.style.setProperty('background', 'transparent', 'important');
          el.style.setProperty('background-color', 'transparent', 'important');
        });
      }

      StealthWatermark.init(stage, item);

      // 视口顶端 2px 极细微光流线进度条（瓦片加载状态反馈）
      let tileProgressBar = document.getElementById('viewerTileProgress');
      if (!tileProgressBar) {
        tileProgressBar = document.createElement('div');
        tileProgressBar.id = 'viewerTileProgress';
        tileProgressBar.className = 'viewer-tile-progress';
        const viewerBody = document.querySelector('.viewer-body');
        if (viewerBody) {
          viewerBody.appendChild(tileProgressBar);
        } else if (stage) {
          stage.appendChild(tileProgressBar);
        }
      }

      function fadeOutStageThumb() {
        if (stage) {
          stage.style.setProperty('--stage-thumb-opacity', '0');
        }
      }

      let progressTimer = null;
      let tilesLoadedCount = 0;
      function triggerTileProgressStart() {
        if (!tileProgressBar) return;
        tilesLoadedCount = 0;
        tileProgressBar.classList.add('active');
        clearTimeout(progressTimer);
        progressTimer = setTimeout(() => {
          triggerTileProgressDone();
        }, 3500);
      }

      function triggerTileProgressDone() {
        if (!tileProgressBar) return;
        clearTimeout(progressTimer);
        progressTimer = setTimeout(() => {
          if (tileProgressBar) tileProgressBar.classList.remove('active');
        }, 320);
        fadeOutStageThumb();
      }

      triggerTileProgressStart();

      // 当 Canvas 真正开始绘制瓦片时：
      // 1. 静态 CSS 底图淡出；
      // 2. 阶段一（无图加载中）结束，静默关闭加载动画（不提示加载成果）
      osdViewer.addHandler('tile-drawn', function () {
        fadeOutStageThumb();
        if (isInitialOpening) {
          isInitialOpening = false;
          hideHdLoader();
          if (osdViewer && osdViewer.viewport) {
            lastStableZoom = osdViewer.viewport.getZoom();
          }
        }
      });

      // 缩放监听：仅当地图发生剧烈跨越（差异很大如跳变 >= 2.5 倍），且高保真切片加载持续超 600ms 时才唤起提示
      // 简单的平滑放大、清晰度差异不明显时偷偷加载，不弹任何加载动画
      osdViewer.addHandler('zoom', function () {
        if (isInitialOpening) return;
        fadeOutStageThumb();
        if (!osdViewer || !osdViewer.viewport) return;

        const currentZoom = osdViewer.viewport.getZoom();
        const baseZ = lastStableZoom || currentZoom || 1;
        const zoomDelta = Math.max(currentZoom / baseZ, baseZ / currentZoom);

        if (zoomDelta >= 2.5) {
          isDrasticZoomPending = true;
          checkAndTriggerDrasticLoader();
        }
      });

      osdViewer.addHandler('pan', function () {
        if (isInitialOpening) return;
        fadeOutStageThumb();
      });

      function handleTileCompletionCleanup() {
        if (hasRequestedCdnForZoom && pendingCdnTiles.size === 0) {
          clearTimeout(hdLoaderTimer);
          hdLoaderTimer = null;
          isDrasticZoomPending = false;
          hasRequestedCdnForZoom = false;
          if (isHdLoaderVisible) {
            hideHdLoader();
          }
          if (osdViewer && osdViewer.viewport) {
            lastStableZoom = osdViewer.viewport.getZoom();
          }
        }
      }

      osdViewer.addHandler('open', function () {
        triggerTileProgressStart();
        if (osdViewer && osdViewer.navigator && osdViewer.navigator.element) {
          osdViewer.navigator.element.querySelectorAll('.openseadragon-container, .openseadragon-canvas, canvas').forEach(el => {
            el.style.setProperty('background', 'transparent', 'important');
            el.style.setProperty('background-color', 'transparent', 'important');
          });
        }
        if (osdViewer.world) {
          const tiledImg = osdViewer.world.getItemAt(0);
          if (tiledImg) {
            tiledImg.addHandler('fully-loaded-change', function (e) {
              if (e && e.fullyLoaded) {
                triggerTileProgressDone();
                pendingCdnTiles.clear();
                handleTileCompletionCleanup();
              }
            });
          }
        }
      });

      function getSafeTileUrl(tile) {
        if (!tile) return '';
        if (typeof tile.getUrl === 'function') return tile.getUrl();
        return tile.url || '';
      }

      osdViewer.addHandler('tile-loaded', function (e) {
        tilesLoadedCount++;
        const u = getSafeTileUrl(e && e.tile);
        if (u) pendingCdnTiles.delete(u);
        handleTileCompletionCleanup();
        // 移动端若加载超过首屏基础瓦片数（通常10-16块），亦可视为首屏基本就绪
        if (isPhone && tilesLoadedCount >= 12) {
          triggerTileProgressDone();
        }
      });
      osdViewer.addHandler('tile-load-failed', function (e) {
        const u = getSafeTileUrl(e && e.tile);
        console.warn('OpenSeadragon tile-load-failed:', u || e);
        if (u) pendingCdnTiles.delete(u);
        handleTileCompletionCleanup();
        triggerTileProgressDone();
      });
      osdViewer.addHandler('tile-load-cancelled', function (e) {
        const u = getSafeTileUrl(e && e.tile);
        if (u) pendingCdnTiles.delete(u);
        handleTileCompletionCleanup();
      });

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
        navEl.style.setProperty('--nav-gradient', gradientCss);
        if (item && item.thumb) {
          const fullThumbUrl = new URL(item.thumb, window.location.href).href;
          navEl.style.setProperty('--nav-thumb', 'url("' + fullThumbUrl + '")');
          navEl.style.setProperty('--nav-thumb-opacity', '1');
          navEl.style.setProperty('background-image', 'url("' + fullThumbUrl + '")', 'important');
          navEl.style.setProperty('background-size', 'contain', 'important');
          navEl.style.setProperty('background-repeat', 'no-repeat', 'important');
          navEl.style.setProperty('background-position', 'center', 'important');
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

      // 移动端在移动、捏合或轻触画布时，自动收起信息抽屉，平滑复原底栏
      function autoCloseDrawerOnMobileCanvasMove() {
        if (window.innerWidth <= 768 || window.innerHeight <= 500) {
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

      osdViewer.addHandler('canvas-click', (e) => {
        if (e && e.quick) {
          autoCloseDrawerOnMobileCanvasMove();
        }
      });
      osdViewer.addHandler('canvas-drag', () => {
        autoCloseDrawerOnMobileCanvasMove();
        resetTopActionsIdleTimer();
      });
      osdViewer.addHandler('canvas-pinch', () => {
        autoCloseDrawerOnMobileCanvasMove();
        resetTopActionsIdleTimer();
      });
      osdViewer.addHandler('canvas-scroll', resetTopActionsIdleTimer);

      osdViewer.addHandler('tile-load-failed', function (e) {
        console.warn('OpenSeadragon tile-load-failed:', e && e.tile ? e.tile.url : e);
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
          const isPhoneFallback = window.innerWidth <= 768;
          osdViewer = OpenSeadragon({
            element: stage,
            prefixUrl: '',
            showNavigationControl: false,
            showNavigator: false,
            imageLoaderLimit: isPhoneFallback ? 8 : 16,
            maxZoomPixelRatio: 4.5,
            minPixelRatio: isPhoneFallback ? 0.8 : 0.5,
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
    const hdLoaderEl = document.getElementById('viewerHdLoader');
    if (hdLoaderEl) hdLoaderEl.classList.remove('active');
    if (window._hdLottieAnim) {
      try { window._hdLottieAnim.stop(); } catch (e) {}
    }
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
    if (drawerEl) {
      drawerEl.classList.remove('open');
      drawerEl.style.removeProperty('left');
      drawerEl.style.removeProperty('top');
      drawerEl.style.removeProperty('width');
      drawerEl.style.removeProperty('height');
      drawerEl.style.removeProperty('right');
      drawerEl.style.removeProperty('bottom');
    }
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
    if (stage) {
      stage.innerHTML = '';
      stage.style.setProperty('--stage-thumb-opacity', '0');
    }
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
      const base = window.location.origin + window.location.pathname;
      let sNum = '1';
      if (currentSubCategory) {
        sNum = getSubCategoryParam(currentSubCategory);
      } else if (item) {
        const subCats = getItemSubCategories(item);
        if (subCats && subCats.length > 0) {
          sNum = getSubCategoryParam(subCats[0]);
        }
      }
      return `${base}?s${sNum}&id=${encodeURIComponent(item.id)}`;
    } catch (e) {
      return `${window.location.origin}${window.location.pathname}?s1&id=${encodeURIComponent(item.id)}`;
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
      let chipText = (locItem && (locItem.subCategory || locItem.category)) || item.category || '空间制图';
      if (locItem && locItem.topic) chipText += ' · ' + locItem.topic;
      catChip.textContent = chipText;
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

    let catMain = ((locItem && (locItem.categoryName || locItem.category)) || item.category || i18nTexts.fallbackCategory);
    if (locItem && locItem.subCategory) catMain += ' · ' + locItem.subCategory;
    if (locItem && locItem.topic) catMain += ' · ' + locItem.topic;
    const categoryText = catMain + '   |   ' + i18nTexts.cartographerPrefix;
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

      ctx.font = '500 18px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
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
      ctx.font = '600 17px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText(i18nTexts.qrTitle, qrX - 24, qrY + 46);

      ctx.font = '400 15px "JetBrains Mono", Consolas, monospace';
      ctx.fillStyle = textSecondary;
      ctx.fillText(i18nTexts.qrDomain, qrX - 24, qrY + 74);
      ctx.restore();

      // 作品题名与元数据
      const metaY = imgY + imgH + 34;
      const maxInfoWidth = qrX - 220 - 64;

      ctx.font = '700 38px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textPrimary;
      wrapText(ctx, titleText, 64, metaY + 36, maxInfoWidth, 46, 2);

      ctx.font = '500 20px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textSecondary;
      ctx.fillText(categoryText, 64, metaY + 88);

      if (descText) {
        ctx.font = '400 18px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
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

      ctx.font = is16x9 ? '500 17px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '500 16px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
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
      ctx.font = is16x9 ? '700 36px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '700 32px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textPrimary;
      const titleLineHeight = is16x9 ? 44 : 38;
      const afterTitleY = wrapText(ctx, titleText, rx, 188, rw, titleLineHeight, 2);

      const catY = Math.max(is16x9 ? 275 : 260, afterTitleY + 8);
      ctx.font = is16x9 ? '500 19px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '500 17px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = textSecondary;
      ctx.fillText(categoryText, rx, catY);

      // 右侧栏：说明题记
      if (descText) {
        ctx.font = is16x9 ? '400 17px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                          : '400 16px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
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
      ctx.font = is16x9 ? '600 17px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        : '600 16px "MiSans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
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
      if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html') && !url.pathname.endsWith('.htm')) {
        url.pathname += '/';
      }
      let sNum = '1';
      if (currentSubCategory) {
        sNum = getSubCategoryParam(currentSubCategory);
      } else if (item) {
        const subCats = getItemSubCategories(item);
        if (subCats && subCats.length > 0) {
          sNum = getSubCategoryParam(subCats[0]);
        }
      }
      url.search = `s${sNum}&id=${encodeURIComponent(item.id)}`;
      url.hash = '';
      if (isNewOpen) {
        window.history.pushState({ level: 2, view: 'viewer', artworkId: item.id }, '', url.toString());
      } else {
        window.history.replaceState({ level: 2, view: 'viewer', artworkId: item.id }, '', url.toString());
      }
      currentHistoryLevel = 2;
    } catch (e) {}
  }

  function clearBrowserUrl() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('id') || url.searchParams.has('art') || window.location.hash) {
        if (currentSubCategory) {
          url.search = 's' + getSubCategoryParam(currentSubCategory);
          url.hash = '';
        } else {
          url.search = '';
          url.hash = '';
        }
        window.history.replaceState({ level: 1, view: 'gallery', subCategory: currentSubCategory }, '', url.toString());
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

      // 检查是否深链至特定 subCategory 专题子界面 (支持 ?s1, ?s=1, ?sub=1, ?sub=art, ?sub=艺术制图 等)
      let subTarget = getSubFromUrl(urlParams);
      if (!subTarget && window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '');
        for (let i = 1; i <= 4; i++) {
          if (hash === 's' + i || hash.startsWith('s' + i + '&') || hash.startsWith('s' + i + '/')) {
            subTarget = SUBCATEGORY_ORDER[i - 1];
            break;
          }
        }
        if (!subTarget) {
          if (hash.startsWith('sub=')) {
            subTarget = parseSubCategoryParam(decodeURIComponent(hash.replace('sub=', '')));
          } else if (hash.startsWith('s=')) {
            subTarget = parseSubCategoryParam(decodeURIComponent(hash.replace('s=', '')));
          }
        }
      }
      if (subTarget) {
        const canonical = subTarget;
        try {
          // 将历史基底设为画廊全景概览，如此用户点击浏览器“后退”时会返回上一层画廊全景，绝不会直接关掉网页
          const overviewUrl = new URL(window.location.href);
          overviewUrl.search = '';
          overviewUrl.hash = '';
          window.history.replaceState({ level: 1, view: 'gallery' }, '', overviewUrl.toString());

          // 将当前状态推入子分类视图，使浏览器后退键生效 (URL 强制保持纯净数字无中文 ?s1)
          const subUrl = new URL(window.location.href);
          subUrl.search = 's' + getSubCategoryParam(canonical);
          subUrl.hash = '';
          window.history.pushState({ level: 1, view: 'gallery', subCategory: canonical }, '', subUrl.toString());
        } catch (e) {}

        enterSubcategoryView(canonical, false);
      }

      let target = urlParams.get('id') || urlParams.get('art');
      if (!target && window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '');
        if (hash.startsWith('id=')) target = hash.replace('id=', '');
        else if (hash.startsWith('art=')) target = hash.replace('art=', '');
        else if (!hash.startsWith('sub=') && !hash.startsWith('s=') && !/^s[1-4]$/i.test(hash) && hash !== 'gallery') target = hash;
      }
      if (target) {
        const match = findArtworkByQuery(target);
        if (match) {
          try {
            const galleryUrl = new URL(window.location.href);
            let sNum = '1';
            if (currentSubCategory) {
              sNum = getSubCategoryParam(currentSubCategory);
            } else {
              const subCats = getItemSubCategories(match);
              if (subCats && subCats.length > 0) {
                sNum = getSubCategoryParam(subCats[0]);
              }
            }
            galleryUrl.search = `s${sNum}&id=${encodeURIComponent(match.id)}`;
            galleryUrl.hash = '';
            window.history.replaceState({ level: 1, view: 'gallery', subCategory: currentSubCategory }, '', galleryUrl.toString());
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

    if (typeof explicitColors === 'string') {
      explicitColors = explicitColors.match(/#[0-9a-fA-F]{3,8}/g) || [explicitColors];
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

    // 3. 全景阅览模式下防止画板与UI意外触发文本选区或长按气泡 (保留输入框与分享直链正常交互)
    document.addEventListener('selectstart', (e) => {
      if (e.target && e.target.closest('#metaShareUrl, .meta-share-url, #zoomInlineInput, input, textarea')) {
        return;
      }
      const modalEl = document.getElementById('viewerModal');
      if (modalEl && modalEl.classList.contains('open')) {
        e.preventDefault();
      }
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
