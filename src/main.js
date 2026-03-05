import { TRANSLATIONS } from './translations';
const LANGS = ['ru', 'en', 'es', 'ua'];
const STORAGE_KEY = 'ae_lang';
function detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGS.includes(stored))
        return stored;
    const browser = navigator.language.toLowerCase();
    if (browser.startsWith('uk'))
        return 'ua';
    if (browser.startsWith('es'))
        return 'es';
    if (browser.startsWith('ru') || browser.startsWith('be'))
        return 'ru';
    return 'en';
}
function applyLang(lang) {
    document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
    localStorage.setItem(STORAGE_KEY, lang);
    // Update text nodes
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        const map = TRANSLATIONS[key];
        if (map)
            el.textContent = map[lang];
    });
    // Update HTML content
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const key = el.dataset.i18nHtml;
        const map = TRANSLATIONS[key];
        if (map)
            el.innerHTML = map[lang];
    });
    // Update lang switcher buttons
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.langBtn === lang);
    });
}
function initLangSwitcher() {
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.langBtn;
            if (LANGS.includes(lang))
                applyLang(lang);
        });
    });
}
// ── Scroll animations ─────────────────────────────────
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
}
// ── Sticky nav ────────────────────────────────────────
function initStickyNav() {
    const nav = document.getElementById('main-nav');
    if (!nav)
        return;
    const onScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
}
// ── Mobile menu ───────────────────────────────────────
function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu)
        return;
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
    initLangSwitcher();
    initStickyNav();
    initMobileMenu();
    applyLang(detectLang());
    // slight delay so DOM is ready
    requestAnimationFrame(() => initScrollAnimations());
});
