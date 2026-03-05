import { TRANSLATIONS, type Lang } from './translations';

const LANGS: Lang[] = ['ru', 'en', 'es', 'ua'];
const LANG_KEY = 'ae_lang';
const DARK_KEY = 'ae_dark';

// ── Language ──────────────────────────────────────────
function detectLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY) as Lang | null;
  if (stored && LANGS.includes(stored)) return stored;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith('uk')) return 'ua';
  if (browser.startsWith('es')) return 'es';
  if (browser.startsWith('ru') || browser.startsWith('be')) return 'ru';
  return 'en';
}

function applyLang(lang: Lang): void {
  document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
  localStorage.setItem(LANG_KEY, lang);

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const map = TRANSLATIONS[el.dataset.i18n!];
    if (map) el.textContent = map[lang];
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const map = TRANSLATIONS[el.dataset.i18nHtml!];
    if (map) el.innerHTML = map[lang];
  });

  document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.langBtn === lang);
  });
}

function initLangSwitcher(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.langBtn as Lang;
      if (LANGS.includes(lang)) applyLang(lang);
    });
  });
}

// ── Dark mode ─────────────────────────────────────────
function applyTheme(dark: boolean): void {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem(DARK_KEY, dark ? '1' : '0');
  const btn = document.getElementById('dark-toggle');
  if (btn) {
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
  }
}

function initDarkMode(): void {
  const stored = localStorage.getItem(DARK_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored !== null ? stored === '1' : prefersDark;
  applyTheme(isDark);

  document.getElementById('dark-toggle')?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme !== 'dark');
  });

  // Sync with OS preference changes (when no stored preference)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(DARK_KEY) === null) applyTheme(e.matches);
  });
}

// ── Scroll animations ─────────────────────────────────
function initScrollAnimations(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
}

// ── Sticky nav ────────────────────────────────────────
function initStickyNav(): void {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── Mobile menu ───────────────────────────────────────
function initMobileMenu(): void {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initLangSwitcher();
  initStickyNav();
  initMobileMenu();
  applyLang(detectLang());
  requestAnimationFrame(() => initScrollAnimations());
});
