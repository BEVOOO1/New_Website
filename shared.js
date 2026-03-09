/* ════════════════════════════════════════
   BAVLY CMS — shared.js v4
   Canvas · Nav · Reveal · Lightbox · Menu
   + Lazy image loading
   + Performance optimizations
   + Security helpers (XSS sanitizer)
════════════════════════════════════════ */

// ── CANVAS BACKGROUND (throttled to 24fps, paused when hidden) ──
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, animId, lastFrame = 0;
  const INTERVAL = 1000 / 24; // 24fps — orbs move slowly, no need for 60fps
  const isMobile = window.matchMedia('(max-width:767px)').matches;

  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(document.documentElement);

  const orbs = [
    { x: .15, y: .2,  r: .45, hue: 38,  s: 65, base: .055, phase: 0   },
    { x: .85, y: .1,  r: .55, hue: 220, s: 60, base: .04,  phase: 1.8 },
    { x: .5,  y: .85, r: .4,  hue: 38,  s: 50, base: .03,  phase: 3.2 },
    { x: .9,  y: .7,  r: .35, hue: 270, s: 55, base: .025, phase: .9  },
    { x: .05, y: .75, r: .3,  hue: 195, s: 60, base: .025, phase: 2.4 },
  ];

  // Fewer particles on mobile to save GPU
  const DUST_COUNT = isMobile ? 20 : 38;
  const CONNECT_DIST = isMobile ? 0 : 90; // skip connections on mobile entirely
  const dust = Array.from({ length: DUST_COUNT }, () => ({
    x: Math.random(), y: Math.random(),
    r: .3 + Math.random() * 1.1,
    vx: (Math.random() - .5) * .00012,
    vy: -.00007 - Math.random() * .00018,
    a: .06 + Math.random() * .25,
    b: Math.random() * Math.PI * 2,
  }));

  let t = 0;
  const draw = (ts) => {
    animId = requestAnimationFrame(draw);
    if (ts - lastFrame < INTERVAL) return; // throttle
    lastFrame = ts;
    ctx.clearRect(0, 0, W, H);
    t += .004;

    orbs.forEach(o => {
      const x = o.x * W + Math.sin(t * .4 + o.phase) * .06 * W;
      const y = o.y * H + Math.cos(t * .3 + o.phase) * .05 * H;
      const r = o.r * Math.min(W, H);
      const alpha = o.base * (.7 + .3 * Math.sin(t * .5 + o.phase));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `hsla(${o.hue},${o.s}%,70%,${alpha})`);
      g.addColorStop(.5, `hsla(${o.hue},${o.s}%,55%,${alpha * .3})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    dust.forEach(p => {
      p.x += p.vx + Math.sin(t * .8 + p.b) * .00007;
      p.y += p.vy;
      p.b += .011;
      if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
      if (p.x < -.02) p.x = 1.02;
      if (p.x > 1.02) p.x = -.02;
      const alpha = p.a * (.4 + .6 * Math.abs(Math.sin(p.b * .7)));
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,120,${alpha * .6})`;
      ctx.fill();
    });

    // Particle connections — desktop only, uses squared distance (no sqrt)
    if (CONNECT_DIST > 0) {
      const distSq = CONNECT_DIST * CONNECT_DIST;
      for (let i = 0; i < dust.length; i++) {
        for (let j = i + 1; j < dust.length; j++) {
          const dx = (dust[i].x - dust[j].x) * W;
          const dy = (dust[i].y - dust[j].y) * H;
          const dSq = dx * dx + dy * dy;
          if (dSq < distSq) {
            ctx.beginPath();
            ctx.moveTo(dust[i].x * W, dust[i].y * H);
            ctx.lineTo(dust[j].x * W, dust[j].y * H);
            ctx.strokeStyle = `rgba(212,175,120,${(1 - Math.sqrt(dSq) / CONNECT_DIST) * .05})`;
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animId); animId = null; }
    else if (!animId) animId = requestAnimationFrame(draw);
  });

  animId = requestAnimationFrame(draw);
})();

// ── SCROLL PROGRESS BAR ──
(function () {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  const update = () => {
    const h = document.documentElement;
    const pct = (window.scrollY / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// ── LIQUID GLASS NAV + SLIDER ──
(function () {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  // Scroll glass deepening
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const linksDiv = nav.querySelector('.nav-links');
  if (!linksDiv) return;

  // Upgrade to pill track
  linksDiv.classList.add('nav-pill-track');
  linksDiv.classList.remove('nav-links');

  // Inject slider
  const slider = document.createElement('div');
  slider.className = 'nav-slider';
  linksDiv.insertBefore(slider, linksDiv.firstChild);

  let _hoverTarget = null;

  function positionSlider(el, instant) {
    if (!el) { slider.style.opacity = '0'; return; }
    // Get positions relative to the track itself (not viewport)
    // Use offsetLeft which is layout-stable and doesn't need rects
    const left  = el.offsetLeft;
    const width = el.offsetWidth;
    if (!width) { slider.style.opacity = '0'; return; }
    if (instant) slider.style.transition = 'none';
    slider.style.opacity = '1';
    slider.style.left    = left + 'px';
    slider.style.width   = width + 'px';
    if (instant) {
      // Force reflow then re-enable transition
      slider.getBoundingClientRect();
      slider.style.transition = '';
    }
  }

  const active = linksDiv.querySelector('a.active');

  // Wait for fonts + layout then set initial position instantly
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => positionSlider(active, true));
  } else {
    window.addEventListener('load', () => positionSlider(active, true));
  }

  // Hover — preview slider on hover
  linksDiv.querySelectorAll('a').forEach(a => {
    a.addEventListener('mouseenter', () => {
      _hoverTarget = a;
      positionSlider(a);
    });
    a.addEventListener('mouseleave', () => {
      _hoverTarget = null;
      positionSlider(linksDiv.querySelector('a.active'));
    });
  });

  // Stable resize handler — debounced
  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      positionSlider(_hoverTarget || linksDiv.querySelector('a.active'), true);
    }, 80);
  }, { passive: true });
})();

// ── MOBILE MENU ──
(function () {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });
  document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', () => { menu.classList.remove('open'); btn.setAttribute('aria-expanded', false); });
  });
  // Close on outside click
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    }
  });
})();

// ── SCROLL REVEAL (using IntersectionObserver) ──
function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.revealed)');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible', 'revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => { el.classList.add('revealed'); obs.observe(el); });
}
document.addEventListener('DOMContentLoaded', initReveal);
window.initReveal = initReveal;

// ── LAZY IMAGE LOADING — blur-up reveal ──
function initLazyImages() {
  // Handle both data-src (deferred load) and regular src with lazy-img class
  function attachLoad(img) {
    const onLoad = () => {
      img.classList.add('loaded');
      img.parentElement?.classList?.add('img-loaded');
    };
    if (img.complete && img.naturalWidth) { onLoad(); return; }
    img.addEventListener('load',  onLoad, { once: true });
    img.addEventListener('error', onLoad, { once: true });
  }

  const dataSrcImgs = document.querySelectorAll('img[data-src]');
  const lazyImgs    = document.querySelectorAll('img.lazy-img:not([data-src])');

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const img = e.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        attachLoad(img);
        o.unobserve(img);
      });
    }, { rootMargin: '300px' });

    dataSrcImgs.forEach(img => obs.observe(img));
    lazyImgs.forEach(img    => obs.observe(img));
  } else {
    dataSrcImgs.forEach(img => { if (img.dataset.src) img.src = img.dataset.src; img.classList.add('loaded'); });
    lazyImgs.forEach(img    => img.classList.add('loaded'));
  }
}
document.addEventListener('DOMContentLoaded', initLazyImages);
window.initLazyImages = initLazyImages;

// ── LIGHTBOX ──
function initLightbox() {
  let lb = document.getElementById('_lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = '_lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(7,8,15,.94);backdrop-filter:blur(20px);display:none;align-items:center;justify-content:center;cursor:zoom-out;';
    const img = document.createElement('img');
    img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:14px;box-shadow:0 30px 100px rgba(0,0,0,.8);border:1px solid rgba(212,175,120,.2);';
    img.alt = '';
    lb.appendChild(img);
    document.body.appendChild(lb);
    lb.addEventListener('click', () => lb.style.display = 'none');
    document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.style.display = 'none'; });
  }
  document.querySelectorAll('[data-lightbox]').forEach(el => {
    el.addEventListener('click', () => {
      lb.querySelector('img').src = el.dataset.lightbox;
      lb.style.display = 'flex';
    });
  });
}
window.initLightbox = initLightbox;

// ── TOAST ──
function toast(msg, type = 'info') {
  const colors = {
    info:    'rgba(100,160,255,.92)',
    success: 'rgba(56,200,130,.92)',
    error:   'rgba(220,80,80,.92)',
    warning: 'rgba(255,180,50,.92)',
  };
  const t = document.createElement('div');
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  t.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:9999;padding:.9rem 1.6rem;border-radius:10px;background:${colors[type] || colors.info};color:#fff;font-family:'Tenor Sans',sans-serif;font-size:.8rem;letter-spacing:.05em;backdrop-filter:blur(12px);box-shadow:0 8px 30px rgba(0,0,0,.4);transform:translateY(10px);opacity:0;transition:all .3s;max-width:320px;word-break:break-word;`;
  t.textContent = String(msg).slice(0, 200); // limit toast length
  document.body.appendChild(t);
  setTimeout(() => { t.style.transform = 'translateY(0)'; t.style.opacity = '1'; }, 10);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2800);
}
window.toast = toast;

// ── DATE FORMATTER ──
function fmtDate(str) {
  if (!str) return '';
  try { return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { return str; }
}
window.fmtDate = fmtDate;

// ── SECURITY: HTML sanitizer for display ──
// Use this when rendering user content into innerHTML
function sanitizeHTML(str) {
  if (!str) return '';
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}
window.sanitizeHTML = sanitizeHTML;

// Safe HTML escape for attributes
function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
window.escAttr = escAttr;

// ── DRAG-AND-DROP FILE UPLOAD HELPER ──
function initDropZone(dropEl, fileInput, onFile) {
  if (!dropEl || !fileInput) return;
  ['dragenter', 'dragover'].forEach(evt => {
    dropEl.addEventListener(evt, e => {
      e.preventDefault();
      dropEl.style.borderColor = 'var(--border-glow)';
      dropEl.style.background = 'rgba(212,175,120,0.07)';
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropEl.addEventListener(evt, e => {
      e.preventDefault();
      dropEl.style.borderColor = '';
      dropEl.style.background = '';
    });
  });
  dropEl.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && onFile) onFile(file);
  });
}
window.initDropZone = initDropZone;

// ── UPLOAD PROGRESS UI ──
function showUploadProgress(container) {
  const bar = document.createElement('div');
  bar.className = '_upload-progress';
  bar.style.cssText = 'margin-top:.5rem;height:3px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-light));width:0;transition:width .3s;border-radius:100px;';
  bar.appendChild(fill);
  container.appendChild(bar);
  return {
    set: (pct) => { fill.style.width = `${pct}%`; },
    remove: () => bar.remove(),
  };
}
window.showUploadProgress = showUploadProgress;

// ── STATE HELPERS ──
function loadingHTML() {
  return `<div class="loading-state"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>`;
}
function emptyHTML(icon, title, sub) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-title">${title}</div><div class="empty-state-sub">${sub}</div></div>`;
}
window.loadingHTML = loadingHTML;
window.emptyHTML = emptyHTML;

// ── CONTENT SECURITY: Validate embed URLs ──
function isSafeEmbedUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const safeDomains = ['youtube.com', 'www.youtube.com', 'vimeo.com', 'player.vimeo.com', 'soundcloud.com', 'w.soundcloud.com', 'drive.google.com'];
    return safeDomains.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
  } catch { return false; }
}
window.isSafeEmbedUrl = isSafeEmbedUrl;

// ── URL SAFETY ──
function safeUrl(url) {
  if (!url) return '#';
  if (url.startsWith('data:image/')) return url;
  try {
    const u = new URL(url, window.location.href);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch {}
  return '#';
}
window.safeUrl = safeUrl;


// ── CURSOR LIGHT ON NAV PILL ──
// Sets --cx/--cy CSS vars via lerped rAF — zero layout reads, no jitter
(function () {
  var tx = -999, ty = -999, cx = -999, cy = -999, raf = null;
  var root = document.documentElement;
  document.addEventListener('mousemove', function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener('mouseleave', function () {
    tx = -999; ty = -999;
  });
  function tick() {
    cx += (tx - cx) * 0.14;
    cy += (ty - cy) * 0.14;
    root.style.setProperty('--cx', cx.toFixed(1) + 'px');
    root.style.setProperty('--cy', cy.toFixed(1) + 'px');
    raf = (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4)
      ? requestAnimationFrame(tick) : null;
  }
})();
