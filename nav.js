const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
nav.addEventListener('click', event => { if (event.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); } });
const header = document.querySelector('.site-header');
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  const currentY = Math.max(0, window.scrollY);
  const delta = currentY - lastScrollY;
  if (currentY < 80 || delta < -5) header.classList.remove('header-hidden');
  else if (delta > 5 && !header.contains(document.activeElement) && !nav.classList.contains('open')) header.classList.add('header-hidden');
  if (Math.abs(delta) > 5 || currentY < 80) lastScrollY = currentY;
}, { passive: true });
header.addEventListener('focusin', () => header.classList.remove('header-hidden'));

fetch('/api/content').then(response => response.ok ? response.json() : null).then(data => { if (data?.profileImage) document.querySelectorAll('.brand-photo').forEach(image => { image.src = data.profileImage; }); }).catch(() => {});

const themeToggle = document.querySelector('.theme-toggle');
function syncThemeButton() { const light = document.documentElement.dataset.theme === 'light'; themeToggle.setAttribute('aria-checked', String(light)); }
syncThemeButton();
themeToggle.addEventListener('click', () => { const light = document.documentElement.dataset.theme !== 'light'; document.documentElement.dataset.theme = light ? 'light' : 'dark'; try { localStorage.setItem('site-theme', light ? 'light' : 'dark'); } catch {} syncThemeButton(); });
