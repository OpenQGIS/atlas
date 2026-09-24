/**
 * Gallery Theme Controller
 * Implements Design Tokens architecture reading data/themes.json
 * Decouples colors completely from HTML/CSS/JS codebase.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'gallery-theme-preference';
  let themeConfig = null;
  let currentTheme = 'dark';

  const SVG_SUN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const SVG_MOON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  // Determine initial theme before paint
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    currentTheme = saved;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    currentTheme = 'light';
  } else {
    currentTheme = 'dark';
  }
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Load tokens from config (supports direct file:// via data/themes.js and HTTP via themes.json)
  async function loadTokens() {
    if (window.GALLERY_THEMES) {
      themeConfig = window.GALLERY_THEMES;
      injectTokensCSS(themeConfig);
      updateUI();
      return;
    }
    try {
      const res = await fetch('data/themes.json');
      if (!res.ok) throw new Error('Theme config not reachable');
      themeConfig = await res.json();
      injectTokensCSS(themeConfig);
      updateUI();
    } catch (err) {
      console.warn('Failed to load data/themes.json, applying inline fallback tokens:', err);
    }
  }

  function injectTokensCSS(config) {
    let styleEl = document.getElementById('injected-theme-tokens');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'injected-theme-tokens';
      document.head.appendChild(styleEl);
    }

    let css = ':root {\n';
    if (config.global && config.global.accent) {
      const acc = config.global.accent;
      css += '  --accent: ' + acc.primary + ';\n';
      css += '  --accent-rgb: ' + acc.rgb + ';\n';
      css += '  --accent-hover: ' + acc.hover + ';\n';
      css += '  --accent-subtle: ' + acc.subtle + ';\n';
    }
    css += '}\n\n';

    if (config.themes) {
      for (const themeName in config.themes) {
        const tokens = config.themes[themeName];
        css += ':root[data-theme="' + themeName + '"] {\n';
        for (const key in tokens) {
          css += '  --' + key + ': ' + tokens[key] + ';\n';
        }
        css += '}\n\n';
      }
    }

    styleEl.textContent = css;
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem(STORAGE_KEY, currentTheme);
    updateUI();
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: currentTheme } }));
  }

  function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function updateUI() {
    const buttons = [
      document.getElementById('btnToggleTheme'),
      document.getElementById('toolToggleTheme')
    ].filter(Boolean);

    buttons.forEach(btn => {
      if (currentTheme === 'dark') {
        btn.innerHTML = SVG_SUN;
        btn.title = '切换至浅色模式 (Light Mode)';
        btn.setAttribute('aria-label', '切换至浅色模式');
      } else {
        btn.innerHTML = SVG_MOON;
        btn.title = '切换至深色模式 (Dark Mode)';
        btn.setAttribute('aria-label', '切换至深色模式');
      }
    });
  }

  // Bind toggle buttons after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    ['btnToggleTheme', 'toolToggleTheme'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', toggleTheme);
      }
    });
  });

  // Watch system color scheme changes if not explicitly overridden
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Immediately kick off token fetch
  loadTokens();

  // Public API
  window.GalleryTheme = {
    get current() { return currentTheme; },
    setTheme,
    toggleTheme,
    loadTokens
  };
})();