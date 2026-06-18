// Inspira Ranch — scroll reveals, staggering, and stat count-up.
// Enhances the existing .fade-in markup. Respects prefers-reduced-motion.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Staggered, eased scroll reveals ──────────────────────────────────────
  var revealEls = Array.prototype.slice
    .call(document.querySelectorAll('.fade-in'))
    .filter(function (el) { return !el.closest('.hero'); }); // hero handled by CSS

  // Add a stagger delay to .fade-in children of any [data-stagger] container.
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseInt(group.getAttribute('data-stagger'), 10) || 70;
    Array.prototype.slice.call(group.querySelectorAll('.fade-in')).forEach(function (el, i) {
      el.style.transitionDelay = (i * step) + 'ms';
      el.addEventListener('transitionend', function clr() {
        el.style.transitionDelay = '';            // snappy hover after the reveal
        el.removeEventListener('transitionend', clr);
      });
    });
  });

  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { obs.observe(el); });
  }

  // ── Count-up for numeric stats (skips ★★★★★ and other non-numerics) ───────
  function countUp(el) {
    var raw = (el.getAttribute('data-count') || el.textContent || '').trim();
    var m = raw.match(/^(\d+)(\D*)$/);     // integer + optional suffix like %
    if (!m) return;
    var target = parseInt(m[1], 10), suffix = m[2] || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1100, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var stats = document.querySelectorAll('.stat-number, [data-count]');
  if (stats.length && 'IntersectionObserver' in window) {
    var sObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { countUp(entry.target); sObs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { sObs.observe(el); });
  }
})();
