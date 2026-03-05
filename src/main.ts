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
  if (browser.startsWith('en') && !browser.startsWith('ru')) return 'en';
  return 'ru'; // default to Russian
}

let currentLang: Lang = 'ru';

function applyLang(lang: Lang): void {
  currentLang = lang;
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

  // Re-sync breathing widget text if it's open
  syncBreathingText();
  // Re-sync quiz text if active
  syncQuizText();
}

function t(key: string): string {
  return TRANSLATIONS[key]?.[currentLang] ?? key;
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
  }
}

function initDarkMode(): void {
  const stored = localStorage.getItem(DARK_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored !== null ? stored === '1' : prefersDark);
  document.getElementById('dark-toggle')?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme !== 'dark');
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(DARK_KEY) === null) applyTheme(e.matches);
  });
}

// ── Scroll progress bar ───────────────────────────────
function initScrollProgress(): void {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    bar.style.width = `${Math.min(pct * 100, 100)}%`;
  }, { passive: true });
}

// ── Floating CTA ──────────────────────────────────────
function initFloatingCTA(): void {
  const btn = document.getElementById('floating-cta');
  if (!btn) return;
  const heroHeight = (document.getElementById('hero')?.offsetHeight ?? 600) * 0.8;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > heroHeight);
  }, { passive: true });
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
    { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
  );
  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
}

// ── Counter animations ────────────────────────────────
function animateCounter(el: HTMLElement, target: number, decimals = 0, duration = 1800): void {
  const start = performance.now();
  const from = 0;
  function step(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = from + (target - from) * ease;
    el.textContent = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters(): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      const target = parseFloat(el.dataset.counter ?? '0');
      const decimals = parseInt(el.dataset.decimals ?? '0');
      animateCounter(el, target, decimals);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-counter]').forEach((el) => observer.observe(el));
}

// ── Breathing exercise ────────────────────────────────
const BREATHE_PHASES = [
  { key: 'breathing_inhale', scale: 1.0, transitionMs: 4000 },
  { key: 'breathing_hold', scale: 1.0, transitionMs: 200 },
  { key: 'breathing_exhale', scale: 0.45, transitionMs: 4000 },
  { key: 'breathing_hold_empty', scale: 0.45, transitionMs: 200 },
];
const BREATHE_HOLD_S = 4; // seconds per hold phase shown to user

let breatheInterval: ReturnType<typeof setInterval> | null = null;
let breathePhaseIdx = 0;
let breatheCycles = 0;
let breatheRunning = false;

function syncBreathingText(): void {
  const phaseEl = document.getElementById('breathing-phase');
  const cycleEl = document.getElementById('breathing-cycle-display');
  if (!phaseEl || !cycleEl) return;
  if (!breatheRunning) return;
  const phase = BREATHE_PHASES[breathePhaseIdx];
  phaseEl.textContent = t(phase.key);
  cycleEl.textContent = breatheCycles > 0 ? `${t('breathing_cycle')} ${breatheCycles}` : '';
}

function runBreathePhase(idx: number): void {
  breathePhaseIdx = idx;
  const phase = BREATHE_PHASES[idx];
  const circle = document.getElementById('breathe-circle');
  const phaseEl = document.getElementById('breathing-phase');
  const numEl = document.getElementById('breathe-number');

  if (circle) {
    circle.style.transition = `transform ${phase.transitionMs}ms ease-in-out`;
    circle.style.transform = `scale(${phase.scale})`;
  }
  if (phaseEl) phaseEl.textContent = t(phase.key);

  const isCountPhase = idx === 0 || idx === 2; // inhale or exhale
  let secondsLeft = BREATHE_HOLD_S;
  if (numEl) numEl.textContent = isCountPhase ? String(secondsLeft) : '';

  if (isCountPhase && numEl) {
    breatheInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(breatheInterval!);
        breatheInterval = null;
        if (idx === 2) breatheCycles++;
        syncBreathingText();
        runBreathePhase((idx + 1) % BREATHE_PHASES.length);
      } else {
        numEl.textContent = String(secondsLeft);
      }
    }, 1000);
  } else {
    // hold phase: countdown then move on
    let holdLeft = 4;
    if (numEl) numEl.textContent = String(holdLeft);
    breatheInterval = setInterval(() => {
      holdLeft--;
      if (numEl) numEl.textContent = holdLeft > 0 ? String(holdLeft) : '';
      if (holdLeft <= 0) {
        clearInterval(breatheInterval!);
        breatheInterval = null;
        runBreathePhase((idx + 1) % BREATHE_PHASES.length);
      }
    }, 1000);
  }
}

function startBreathing(): void {
  breatheRunning = true;
  breathePhaseIdx = 0;
  breatheCycles = 0;
  const startBtn = document.getElementById('breathing-start-btn');
  if (startBtn) startBtn.style.display = 'none';
  const tipEl = document.querySelector<HTMLElement>('.breathing-tip');
  if (tipEl) tipEl.style.display = 'none';
  const cycleEl = document.getElementById('breathing-cycle-display');
  if (cycleEl) cycleEl.textContent = `${t('breathing_cycle')} 1`;
  runBreathePhase(0);
}

function stopBreathing(): void {
  if (breatheInterval) { clearInterval(breatheInterval); breatheInterval = null; }
  breatheRunning = false;
  breathePhaseIdx = 0;
  const circle = document.getElementById('breathe-circle');
  if (circle) {
    circle.style.transition = 'transform 0.8s ease';
    circle.style.transform = 'scale(0.45)';
  }
  const numEl = document.getElementById('breathe-number');
  if (numEl) numEl.textContent = '';
  const phaseEl = document.getElementById('breathing-phase');
  if (phaseEl) phaseEl.textContent = t('breathing_tip');
  const cycleEl = document.getElementById('breathing-cycle-display');
  if (cycleEl) cycleEl.textContent = '';
  const startBtn = document.getElementById('breathing-start-btn');
  if (startBtn) { startBtn.style.display = ''; startBtn.textContent = t('breathing_start'); }
  const tipEl = document.querySelector<HTMLElement>('.breathing-tip');
  if (tipEl) tipEl.style.display = '';
}

function openBreathingModal(): void {
  const modal = document.getElementById('breathing-modal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBreathingModal(): void {
  const modal = document.getElementById('breathing-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  stopBreathing();
}

function initBreathing(): void {
  document.getElementById('breathing-btn')?.addEventListener('click', openBreathingModal);
  document.getElementById('breathing-close')?.addEventListener('click', closeBreathingModal);
  document.getElementById('breathing-start-btn')?.addEventListener('click', startBreathing);
  document.getElementById('breathing-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'breathing-modal') closeBreathingModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBreathingModal();
  });
}

// ── Self-check quiz ───────────────────────────────────
const QUIZ_QUESTIONS = ['quiz_q1', 'quiz_q2', 'quiz_q3', 'quiz_q4', 'quiz_q5'];
let quizAnswers: boolean[] = [];
let quizCurrentQ = 0;
let quizActive = false;

function syncQuizText(): void {
  if (!quizActive) return;
  // Re-render current question text in new language
  const qText = document.getElementById('q-text');
  if (qText && quizCurrentQ < QUIZ_QUESTIONS.length) {
    qText.textContent = t(QUIZ_QUESTIONS[quizCurrentQ]);
  }
  const yesBtn = document.getElementById('q-yes');
  const noBtn = document.getElementById('q-no');
  if (yesBtn) yesBtn.textContent = t('quiz_yes');
  if (noBtn) noBtn.textContent = t('quiz_no');
}

function showQuizScreen(id: string): void {
  ['quiz-welcome', 'quiz-question', 'quiz-result'].forEach((s) => {
    const el = document.getElementById(s);
    if (el) el.hidden = s !== id;
  });
}

function renderQuestion(idx: number): void {
  quizCurrentQ = idx;
  quizActive = true;
  const qText = document.getElementById('q-text');
  const qNum = document.getElementById('q-num');
  const yesBtn = document.getElementById('q-yes');
  const noBtn = document.getElementById('q-no');
  const dots = document.getElementById('quiz-dots');

  if (qText) qText.textContent = t(QUIZ_QUESTIONS[idx]);
  if (qNum) qNum.textContent = `${idx + 1} ${t('quiz_of')} ${QUIZ_QUESTIONS.length}`;
  if (yesBtn) yesBtn.textContent = t('quiz_yes');
  if (noBtn) noBtn.textContent = t('quiz_no');

  if (dots) {
    dots.innerHTML = QUIZ_QUESTIONS.map((_, i) =>
      `<span class="quiz-dot${i === idx ? ' active' : i < idx ? ' done' : ''}"></span>`
    ).join('');
  }

  showQuizScreen('quiz-question');
}

function answerQuestion(yes: boolean): void {
  quizAnswers[quizCurrentQ] = yes;
  const nextIdx = quizCurrentQ + 1;
  if (nextIdx < QUIZ_QUESTIONS.length) {
    renderQuestion(nextIdx);
  } else {
    showQuizResult();
  }
}

function showQuizResult(): void {
  quizActive = false;
  const score = quizAnswers.filter(Boolean).length;
  const titleEl = document.getElementById('r-title');
  const textEl = document.getElementById('r-text');
  const iconEl = document.getElementById('r-icon');
  const disclaimerEl = document.getElementById('r-disclaimer');
  const ctaBookEl = document.getElementById('r-cta-book');
  const ctaRetryEl = document.getElementById('r-cta-retry');

  let level: 'low' | 'mid' | 'high' = score <= 1 ? 'low' : score <= 3 ? 'mid' : 'high';
  if (titleEl) titleEl.textContent = t(`quiz_result_${level}_title`);
  if (textEl) textEl.textContent = t(`quiz_result_${level}`);
  if (disclaimerEl) disclaimerEl.textContent = t('quiz_disclaimer');
  if (ctaBookEl) ctaBookEl.textContent = t('quiz_cta_book');
  if (ctaRetryEl) ctaRetryEl.textContent = t('quiz_cta_retry');

  const colors = { low: '#22c55e', mid: '#f59e0b', high: '#3db4c8' };
  const icons = { low: '✓', mid: '!', high: '♡' };
  if (iconEl) {
    iconEl.textContent = icons[level];
    iconEl.style.background = colors[level];
  }

  const card = document.getElementById('r-card');
  if (card) {
    card.dataset.level = level;
  }

  showQuizScreen('quiz-result');
}

function resetQuiz(): void {
  quizAnswers = [];
  quizCurrentQ = 0;
  quizActive = false;
  const startBtn = document.getElementById('quiz-start-btn');
  if (startBtn) startBtn.textContent = t('quiz_start');
  showQuizScreen('quiz-welcome');
}

function initQuiz(): void {
  document.getElementById('quiz-start-btn')?.addEventListener('click', () => {
    quizAnswers = [];
    renderQuestion(0);
  });
  document.getElementById('q-yes')?.addEventListener('click', () => answerQuestion(true));
  document.getElementById('q-no')?.addEventListener('click', () => answerQuestion(false));
  document.getElementById('r-cta-retry')?.addEventListener('click', resetQuiz);
  showQuizScreen('quiz-welcome');
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initLangSwitcher();
  initStickyNav();
  initMobileMenu();
  initScrollProgress();
  initFloatingCTA();
  initBreathing();
  initQuiz();
  applyLang(detectLang());
  requestAnimationFrame(() => {
    initScrollAnimations();
    initCounters();
  });
});
