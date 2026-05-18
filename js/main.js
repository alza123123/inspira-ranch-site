// Nav scroll — supports both #mainNav (new) and generic nav (legacy pages)
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav') || document.querySelector('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 80);
});

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
