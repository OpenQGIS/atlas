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
  let triggerMapZooming = null;

  const SVG_EXIT_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
  const SVG_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  const SVG_ZOOM = '<svg class="icon mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';

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
      return;
    }

    try {
      const res = await fetch('data/manifest.json');
      if (!res.ok) throw new Error('Manifest not found');
      const data = await res.json();
      setupData(data);
      initGallery();
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

  function initGallery() {
    const countEl = document.getElementById('pageItemCount');
    if (countEl) countEl.textContent = galleryItems.length;

    bindFilterEvents();
    bindViewModeEvents();
    bindViewerModalEvents();
    bindAboutModalEvents();

    applyFilter('all');
  }

  /* -------------------------------------------------------------
     About Modal Event Binding
     ------------------------------------------------------------- */
  function bindAboutModalEvents() {
    const modalEl = document.getElementById('aboutModal');
    const openBtn = document.getElementById('btnOpenAbout');
    const closeBtn = document.getElementById('btnCloseAbout');
    const closeFooterBtn = document.getElementById('btnCloseAboutFooter');
    const backdropEl = document.getElementById('aboutBackdrop');
    if (!modalEl) return;

    function openAbout() {
      modalEl.style.display = 'flex';
      void modalEl.offsetWidth; // force reflow for smooth transition
      modalEl.classList.add('open');
      modalEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeAbout() {
      modalEl.classList.remove('open');
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!modalEl.classList.contains('open')) {
          modalEl.style.display = 'none';
        }
      }, 250);
    }

    if (openBtn) openBtn.addEventListener('click', openAbout);
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
      grid.innerHTML = '<div style="padding: 48px 24px; color: var(--text-muted); text-align: center; width: 100%;">' +
        '当前筛选条件下暂无收录成果</div>';
      return;
    }

    items.forEach((item, localIdx) => {
      grid.appendChild(createCard(item, localIdx));
    });
  }

  function createCard(item, localIdx) {
    const card = document.createElement('article');
    card.className = 'gallery-card';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.style.setProperty('--aspect-ratio', item.aspectRatio);

    const tagsHtml = (item.tags || []).map(t => '<span class="tag-pill">' + escapeHtml(t) + '</span>').join('');

    card.innerHTML = 
      '<div class="card-media">' +
        '<img class="card-img" src="' + item.thumb + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />' +
        '<div class="card-scrim-mask">' +
          '<div class="card-scrim-content">' +
            '<h3 class="card-title" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</h3>' +
            '<div class="card-meta-row">' +
              '<div class="card-tags">' +
                tagsHtml +
              '</div>' +
              '<div class="card-action-hint">' +
                SVG_ZOOM +
                ' <span>深览</span>' +
              '</div>' +
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

    card.addEventListener('click', () => openViewerByItem(item));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openViewerByItem(item);
      }
    });

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

  /* -------------------------------------------------------------
     Deep Zoom Viewer Modal & Palette Drawer
     ------------------------------------------------------------- */
  function bindViewerModalEvents() {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl || modalEl.dataset.bound) return;
    modalEl.dataset.bound = 'true';

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

    const toolZoomIn = document.getElementById('toolZoomIn');
    const toolZoomOut = document.getElementById('toolZoomOut');
    const toolReset = document.getElementById('toolReset');
    const toolRotate = document.getElementById('toolRotate');
    const toolFullscreen = document.getElementById('toolFullscreen');
    const toolActualSize = document.getElementById('toolActualSize');

    if (backdropEl) backdropEl.addEventListener('click', closeViewer);
    if (closeBtn) closeBtn.addEventListener('click', closeViewer);
    if (closeRightBtn) closeRightBtn.addEventListener('click', closeViewer);
    if (prevBtn) prevBtn.addEventListener('click', () => navigateArtwork(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateArtwork(1));
    if (edgePrevBtn) edgePrevBtn.addEventListener('click', () => navigateArtwork(-1));
    if (edgeNextBtn) edgeNextBtn.addEventListener('click', () => navigateArtwork(1));

    if (toggleInfoBtn && drawerEl) {
      toggleInfoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = drawerEl.classList.toggle('open');
        toggleInfoBtn.classList.toggle('active', isOpen);
      });
    }

    if (drawerCloseBtn && drawerEl) {
      drawerCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        drawerEl.classList.remove('open');
        if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
      });
    }

    if (toolActualSize) {
      toolActualSize.addEventListener('click', () => {
        if (osdViewer && osdViewer.viewport) {
          const targetZoom = osdViewer.viewport.imageToViewportZoom(1);
          osdViewer.viewport.zoomTo(targetZoom);
          osdViewer.viewport.applyConstraints();
        }
      });
    }

    if (toolZoomIn) {
      toolZoomIn.addEventListener('click', () => {
        if (osdViewer) {
          osdViewer.viewport.zoomBy(1.35);
          osdViewer.viewport.applyConstraints();
        }
      });
    }

    if (toolZoomOut) {
      toolZoomOut.addEventListener('click', () => {
        if (osdViewer) {
          osdViewer.viewport.zoomBy(1 / 1.35);
          osdViewer.viewport.applyConstraints();
        }
      });
    }

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

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      modalEl.classList.toggle('fullscreen-mode', isFs);
      if (toolFullscreen) {
        toolFullscreen.innerHTML = isFs ? SVG_EXIT_FULLSCREEN : SVG_FULLSCREEN;
      }
      if (isFs && drawerEl) {
        drawerEl.classList.remove('open');
        if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!modalEl.classList.contains('open')) return;

      switch (e.key) {
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else if (drawerEl && drawerEl.classList.contains('open')) {
            drawerEl.classList.remove('open');
            if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
          } else {
            closeViewer();
          }
          break;
        case 'ArrowLeft':
          navigateArtwork(-1);
          break;
        case 'ArrowRight':
          navigateArtwork(1);
          break;
        case '1':
          if (toolActualSize) toolActualSize.click();
          break;
        case '+':
        case '=':
          if (toolZoomIn) toolZoomIn.click();
          break;
        case '-':
        case '_':
          if (toolZoomOut) toolZoomOut.click();
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
      }
    });

    window.addEventListener('themeChanged', (e) => {
      if (osdViewer) {
        const isDark = (e.detail.theme === 'dark');
        const stage = document.getElementById('osdStage');
        if (stage) stage.style.backgroundColor = isDark ? '#07080b' : '#e5e8ed';
      }
    });

    // 初始化浮动面板拖拽与 resize
    if (drawerEl) initFloatingDrawer(drawerEl);
  }

  function openViewerByItem(item) {
    const idx = currentFilteredItems.findIndex(i => i.id === item.id);
    currentViewerIndex = (idx !== -1) ? idx : 0;
    showArtwork(item);
  }

  function navigateArtwork(direction) {
    if (currentFilteredItems.length === 0) return;
    currentViewerIndex = (currentViewerIndex + direction + currentFilteredItems.length) % currentFilteredItems.length;
    showArtwork(currentFilteredItems[currentViewerIndex]);
  }

  function showArtwork(item) {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl) return;

    const vTitle = document.getElementById('viewerTitle');
    const vDims = document.getElementById('viewerDims');
    const mTitle = document.getElementById('mTitle');
    const mCat = document.getElementById('mCategory');
    const mAuthor = document.getElementById('mAuthor');
    const mRes = document.getElementById('mResolution');
    const mRatio = document.getElementById('mRatio');
    const mDesc = document.getElementById('mDescription');
    const mSwatches = document.getElementById('mPalette');

    if (vTitle) vTitle.textContent = item.title;
    if (vDims) vDims.textContent = item.width + ' × ' + item.height + ' px';
    if (mTitle) mTitle.textContent = item.title;
    if (mCat) mCat.textContent = item.categoryName + (item.subCategory ? ' · ' + item.subCategory : '');
    if (mAuthor) mAuthor.textContent = item.author || '原创';
    if (mRes) mRes.textContent = item.width + ' × ' + item.height + ' px';
    if (mRatio) mRatio.textContent = item.aspectRatio + ':1';
    if (mDesc) mDesc.textContent = item.description || '精密切线与空间几何工造代表作。';

    // Extract dominant palette
    if (mSwatches) {
      mSwatches.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">提取中...</span>';
      extractDominantColors(item, 5, function (colors) {
        if (!modalEl.classList.contains('open')) return;
        mSwatches.innerHTML = '';
        if (!colors || colors.length === 0) {
          mSwatches.innerHTML = '<span style="font-size:0.72rem;color:var(--text-muted);">暂无色彩数据</span>';
          return;
        }
        colors.forEach(function (hex) {
          const btn = document.createElement('button');
          btn.className = 'meta-swatch';
          btn.title = '点击复制色彩 ' + hex;
          btn.innerHTML = '<span class="meta-swatch-dot" style="background-color: ' + hex + ';"></span>' +
                          '<span class="meta-swatch-hex">' + hex + '</span>';
          btn.addEventListener('click', function () {
            copyToClipboard(hex);
            btn.classList.add('copied');
            const hexSpan = btn.querySelector('.meta-swatch-hex');
            if (hexSpan) hexSpan.textContent = '已复制!';
            setTimeout(function () {
              btn.classList.remove('copied');
              if (hexSpan) hexSpan.textContent = hex;
            }, 1400);
          });
          mSwatches.appendChild(btn);
        });
      });
    }

    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    loadOpenSeadragon(item);
  }

  function loadOpenSeadragon(item) {
    const stage = document.getElementById('osdStage');
    if (!stage) return;
    stage.innerHTML = '';

    if (osdViewer) {
      try { osdViewer.destroy(); } catch (e) {}
      osdViewer = null;
    }

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
      osdViewer = OpenSeadragon({
        element: stage,
        prefixUrl: '',
        showNavigationControl: false,
        showNavigator: false,
        autoResize: true,
        animationTime: 0.45,
        blendTime: 0.15,
        constrainDuringPan: true,
        maxZoomPixelRatio: 3.5,
        minZoomImageRatio: 0.8,
        visibilityRatio: 0.9,
        wrapHorizontal: false,
        wrapVertical: false,
        tileSources: tileSource,
        placeholderImage: item.thumb,
        immediateRender: true,
        placeholderFillStyle: stageBg,
        crossOriginPolicy: false,
        ajaxWithCredentials: false,
        backgroundColor: stageBg
      });

      StealthWatermark.init(stage, item);

      osdViewer.addHandler('update-viewport', function () {
        StealthWatermark.burnIn(osdViewer);
      });

      const badge = document.getElementById('toolZoomBadge');
      osdViewer.addHandler('zoom', function () {
        if (typeof triggerMapZooming === 'function') triggerMapZooming();
        if (!badge || !osdViewer || !osdViewer.viewport) return;
        const currentZoom = osdViewer.viewport.getZoom();
        const baseZoom = osdViewer.viewport.getHomeZoom();
        const ratio = baseZoom > 0 ? (currentZoom / baseZoom) : 1;
        badge.textContent = Math.round(ratio * 100) + '%';
      });

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
      if (stage) {
        stage.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ff5555;font-family:var(--font-mono);">' +
          '[Error] 瓦片初始化失败：' + (err.message || err) + '</div>';
      }
    }
  }

  /* -------------------------------------------------------------
     浮动信息面板 · 拖拽移动 & 8向 Resize 引擎
     ------------------------------------------------------------- */
  function initFloatingDrawer(el) {
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

    // ── 悬浮窗动态不透明度联动机制 ──
    // 鼠标在悬浮窗悬停由 CSS :hover 保持 80%，在地图上缩放时激活 map-zooming 降至 30%
    let zoomOpacityTimer = null;
    triggerMapZooming = function () {
      if (!el.classList.contains('open')) return;
      el.classList.add('map-zooming');
      if (zoomOpacityTimer) clearTimeout(zoomOpacityTimer);
      zoomOpacityTimer = setTimeout(function () {
        el.classList.remove('map-zooming');
      }, 650);
    };

    const stageEl = document.getElementById('osdStage');
    if (stageEl) {
      stageEl.addEventListener('wheel', function () {
        triggerMapZooming();
      }, { passive: true });
    }

    // 视口变化时防溢出
    window.addEventListener('resize', function() {
      if (!el.classList.contains('open')) return;
      applyRect(clamp(getRect()));
    });
  }

  function closeViewer() {
    StealthWatermark.destroy();
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    const drawerEl = document.getElementById('viewerMetaDrawer') || document.getElementById('viewerDrawer');
    if (drawerEl) drawerEl.classList.remove('open', 'map-zooming');
    const toggleInfoBtn = document.getElementById('btnToggleInfo');
    if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');

    if (osdViewer) {
      try { osdViewer.destroy(); } catch (e) {}
      osdViewer = null;
    }
    const stage = document.getElementById('osdStage');
    if (stage) stage.innerHTML = '';
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
    jinjiang_greenway_section: ['#234E70', '#5B84B1', '#9FB1BC', '#DCE2E6', '#D4AF37']
  };
  const DEFAULT_PALETTE = ['#80CC28', '#13171E', '#9EA5B3', '#5E6676', '#F4F5F7'];

  function extractDominantColors(target, maxColors, callback) {
    maxColors = maxColors || 5;
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
      navigator.clipboard.writeText(text).catch(() => {});
    }
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

  document.addEventListener('DOMContentLoaded', init);
})();
