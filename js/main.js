// Lead log — fire-and-forget copy of every form submission to the site Worker (/api/lead → KV).
// Capture phase so it runs regardless of per-form handlers; never blocks or breaks the EmailJS flow.
document.addEventListener('submit', e => {
  try {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    const data = Object.fromEntries(new FormData(form));
    delete data.password;
    data._page = location.pathname;
    data._lang = document.documentElement.lang || 'en';
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(() => {});
  } catch (_) { /* never interfere with the actual submit */ }
}, true);

// Nav scroll — supports both #mainNav (new) and generic nav (legacy pages)
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav') || document.querySelector('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// Hamburger
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// Form submissions
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = '#c0392b';
        valid = false;
      }
    });
    if (valid) {
      const success = form.querySelector('.form-success');
      if (success) {
        success.style.display = 'block';
        setTimeout(() => form.reset(), 100);
      }
    }
  });
});

// Package selector (booking page)
window.selectPackage = function (pkgValue) {
  const sel = document.getElementById('b-package');
  if (sel) sel.value = pkgValue;
  const formSection = document.getElementById('booking-form');
  if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.pkg-select-card').forEach(c => c.classList.remove('selected'));
  const clicked = document.querySelector('[data-pkg="' + pkgValue + '"]');
  if (clicked) clicked.classList.add('selected');
};

// Reviews filter
window.filterReviews = function (type) {
  const cards = document.querySelectorAll('.review-card');
  const btns  = document.querySelectorAll('.filter-btn');
  btns.forEach(b => b.classList.remove('active'));
  const active = document.querySelector('[data-filter="' + type + '"]');
  if (active) active.classList.add('active');
  cards.forEach(c => {
    c.style.display = (type === 'all' || c.dataset.type === type) ? '' : 'none';
  });
};

// ── Hero scroll hint — bounce after fade-in ───────────────────────────────
(function() {
  const hint = document.querySelector('.hero-scroll-hint');
  if (!hint) return;
  setTimeout(function() { hint.classList.add('bouncing'); }, 2100);
})();


// ── Hero scroll parallax ──────────────────────────────────────────────────
(function setupParallax() {
  const heroBg = document.querySelector('.hero-bg');
  const heroSection = document.querySelector('.hero');
  if (!heroBg || !heroSection) return;

  // Set initial transform to match CSS scale
  heroBg.style.transform = 'translateY(0px) scale(1.12)';

  window.addEventListener('scroll', function() {
    const scrolled = window.scrollY;
    const heroH = heroSection.offsetHeight;
    if (scrolled > heroH * 1.5) return;
    const shift = scrolled * 0.45;
    heroBg.style.transform = 'translateY(' + shift + 'px) scale(1.12)';
  }, { passive: true });
})();


// ── Active nav link ───────────────────────────────────────────────────────
(function setActiveNav() {
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  document.querySelectorAll('#nav-links a[href]').forEach(function(a) {
    const href = a.getAttribute('href') || '';
    const hrefNoHash = href.split('#')[0];
    if (!hrefNoHash) return; // Skip pure anchor links like #galeria
    const hrefFile = hrefNoHash.split('/').pop() || 'index.html';
    if (hrefFile === file) {
      a.classList.add('active');
    }
  });
})();


// ── Stats count-up animation ──────────────────────────────────────────────
(function setupCountUp() {
  var statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var raw = el.textContent.trim();
      // Only animate numeric stat-numbers (skip star ratings)
      if (raw.indexOf('★') !== -1) return;
      var num = parseInt(raw.replace(/[^\d]/g, ''), 10);
      var suffix = raw.replace(/[\d]/g, '');
      if (isNaN(num) || num <= 0) return;
      statsObserver.unobserve(el);
      var t0 = performance.now();
      var dur = 1400;
      (function tick(now) {
        var p = Math.min((now - t0) / dur, 1);
        var ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(num * ease) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = num + suffix; // Ensure exact final value
      })(performance.now());
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.stat-number').forEach(function(el) {
    statsObserver.observe(el);
  });
})();


// ── Gallery image fade-in on lazy load ────────────────────────────────────
(function setupGalleryFadeIn() {
  document.querySelectorAll('.gal-item img').forEach(function(img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', function() {
        img.classList.add('loaded');
      });
      img.addEventListener('error', function() {
        img.classList.add('loaded'); // Show broken state too
      });
    }
  });
})();


// ── Lang button mobile repositioning ──────────────────────────────────────
// On mobile (≤768px) the lang button is hidden inside the nav dropdown.
// This moves it outside nav-links so it sits in the top-right nav bar
// and is always visible. On resize back to desktop it moves back inside.
(function setupLangBtn() {
  const langBtn   = document.getElementById('langBtn');
  const navLinks  = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  if (!langBtn || !navLinks || !hamburger) return;
  const navInner = hamburger.parentElement;

  function moveLangBtn() {
    if (window.innerWidth <= 768) {
      if (langBtn.parentElement !== navInner) {
        navInner.insertBefore(langBtn, hamburger);
      }
    } else {
      if (langBtn.parentElement !== navLinks) {
        navLinks.appendChild(langBtn);
      }
    }
  }

  moveLangBtn();
  window.addEventListener('resize', moveLangBtn);
})();

// ── Smooth momentum scrolling (Lenis) — site-wide, skipped on reduced-motion ─
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js';
  s.defer = true;
  s.onload = function () {
    if (typeof Lenis === 'undefined') return;
    var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;
    // Route in-page anchor links through Lenis for smooth, offset jumps
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) {
          var target = document.querySelector(id);
          if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
        }
      });
    });
  };
  document.head.appendChild(s);
})();
