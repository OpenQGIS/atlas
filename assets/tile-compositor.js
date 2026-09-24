/**
 * AtlasLog · MicroTileCompositor (微型瓦片动态拼装引擎)
 * =====================================================================
 * 专为 2K/4K/Retina 高分屏与超宽全景长卷设计。
 * 突破传统静态缩略图放大 300%~500% 产生的模糊瓶颈：
 * 1. 零首屏白屏：保留底层 thumbnail 瞬间上屏；
 * 2. 视口感知（IntersectionObserver）：仅进入屏幕时按需调度；
 * 3. 物理像素自适应：根据 clientWidth * DPR 精确计算瓦片金字塔层级；
 * 4. 离屏 Canvas 并发组装后渐变淡入，实现 100% 物理像素点对点针尖级锐利。
 * =====================================================================
 */
(function () {
  'use strict';

  const TILE_SIZE = 256;
  const activeCompositors = new WeakMap();

  /**
   * 计算指定层级 Level 的总像素尺寸与行列切片数
   */
  function getLevelDimensions(width, height, maxLevel, level) {
    const scale = Math.pow(2, maxLevel - level);
    const w = Math.ceil(width / scale);
    const h = Math.ceil(height / scale);
    return {
      width: w,
      height: h,
      cols: Math.ceil(w / TILE_SIZE),
      rows: Math.ceil(h / TILE_SIZE)
    };
  }

  /**
   * 根据当前卡片的物理宽度计算最佳瓦片层级 (DPR-Aware Optimal Level)
   */
  function determineOptimalLevel(item, physicalWidth) {
    const width = item.width || 2000;
    const height = item.height || 2000;
    const maxDim = Math.max(width, height);
    const maxLevel = item.maxLevel !== undefined ? item.maxLevel : Math.ceil(Math.log2(maxDim));

    // 从 maxLevel - 6 往上遍历，寻找刚好能满足 physicalWidth 的最小有效层级
    let bestLevel = Math.max(0, maxLevel - 3);
    for (let l = Math.max(0, maxLevel - 6); l <= maxLevel; l++) {
      const dims = getLevelDimensions(width, height, maxLevel, l);
      if (dims.width >= physicalWidth) {
        bestLevel = l;
        break;
      }
      bestLevel = l;
    }

    // 安全保护门限：根据物理需求自适应切片预算（普通高分屏 <= 32 张切片，4K 极限屏 <= 64 张切片）
    const maxAllowedTiles = physicalWidth >= 2800 ? 64 : 32;
    let dims = getLevelDimensions(width, height, maxLevel, bestLevel);
    while (dims.cols * dims.rows > maxAllowedTiles && bestLevel > 0) {
      bestLevel--;
      dims = getLevelDimensions(width, height, maxLevel, bestLevel);
    }

    return {
      level: bestLevel,
      maxLevel,
      ...dims,
      totalTiles: dims.cols * dims.rows
    };
  }

  /**
   * 单张切片 Image 加载器 (Promise 封装)
   */
  function loadTileImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load tile: ' + url));
      img.src = url;
    });
  }

  /**
   * 执行单个卡片的瓦片动态组装渲染
   */
  async function compositeCardTiles(cardEl, item) {
    if (!cardEl || !item) return;

    // 防止同一个 DOM 节点重复执行拼片
    if (activeCompositors.has(cardEl)) return;
    activeCompositors.set(cardEl, true);

    const mediaEl = cardEl.querySelector('.card-media');
    if (!mediaEl) return;

    // 获取当前卡片在真实屏幕下的物理像素需求
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cardRect = cardEl.getBoundingClientRect();
    const clientW = cardRect.width || cardEl.clientWidth || 640;
    const physicalWidth = Math.ceil(clientW * dpr);

    // 针对普通非全景竖图（宽高比 < 1.6）且物理宽度不大的卡片，底层 thumbnail 已经完全够用，节约资源
    if (physicalWidth <= 640 && (!item.aspectRatio || item.aspectRatio < 1.6)) {
      return;
    }

    // 解析 tileBase 基础路径
    const config = window.ATLAS_CONFIG || window.CANGFENG_CONFIG || {};
    const assetBase = (config.assetBaseUrl || '').replace(/\/+$/, '');
    let tileBase = (item.tileUrl || (item.dzi && item.dzi.Image && item.dzi.Image.Url) || '');
    if (assetBase && !tileBase.startsWith('http')) {
      tileBase = assetBase + '/' + tileBase.replace(/^\/+/, '');
    }
    tileBase = tileBase.replace(/\/+$/, '') + '/';

    const levelInfo = determineOptimalLevel(item, physicalWidth);
    const { level, width: levelW, height: levelH, cols, rows } = levelInfo;

    // 创建或复用专属高分 Canvas 节点
    let canvas = mediaEl.querySelector('.card-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'card-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      const scrim = mediaEl.querySelector('.card-scrim-mask');
      if (scrim) {
        mediaEl.insertBefore(canvas, scrim);
      } else {
        mediaEl.appendChild(canvas);
      }
    }

    canvas.width = levelW;
    canvas.height = levelH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // 建立所有切片请求坐标队列
    const tileTasks = [];
    const format = item.format || 'webp';

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const tileUrl = `${tileBase}${level}/${c}_${r}.${format}`;
        tileTasks.push({ c, r, tileUrl });
      }
    }

    // 分批并发控制（每批 6 个 HTTP 并发请求，兼顾吞吐率与渲染流畅度）
    const BATCH_SIZE = 6;
    let loadedCount = 0;

    for (let i = 0; i < tileTasks.length; i += BATCH_SIZE) {
      const batch = tileTasks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async task => {
        try {
          const tileImg = await loadTileImage(task.tileUrl);
          ctx.drawImage(tileImg, task.c * TILE_SIZE, task.r * TILE_SIZE);
          loadedCount++;
        } catch (err) {
          // 容错机制：个别切片加载异常不影响卡片整体
        }
      }));
    }

    // 当切片加载率达标（>= 70%）时触发高精图层丝滑淡入
    if (loadedCount >= Math.ceil(tileTasks.length * 0.7)) {
      canvas.classList.add('loaded');
      cardEl.classList.add('canvas-composited');
    }
  }

  // 全局共享 IntersectionObserver
  let observer = null;
  function initObserver() {
    if (observer || typeof IntersectionObserver === 'undefined') return;
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cardEl = entry.target;
          observer.unobserve(cardEl);
          const item = cardEl._atlasItem;
          if (item) {
            compositeCardTiles(cardEl, item);
          }
        }
      });
    }, {
      rootMargin: '260px 0px', // 提前 260px 静默预拼装
      threshold: 0.05
    });
  }

  function observeCard(cardEl, item) {
    if (!cardEl || !item) return;
    cardEl._atlasItem = item;
    initObserver();
    if (observer) {
      observer.observe(cardEl);
    } else {
      setTimeout(() => compositeCardTiles(cardEl, item), 120);
    }
  }

  window.MicroTileCompositor = {
    observe: observeCard,
    render: compositeCardTiles,
    determineOptimalLevel: determineOptimalLevel
  };
})();
