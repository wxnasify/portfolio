(() => {
  'use strict';

  // ---------- Проверки окружения ----------
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReduced = motionQuery.matches;
  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
  const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Утилиты ----------
  const rafThrottle = (fn) => {
    let tick = false;
    return (...args) => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        fn(...args);
        tick = false;
      });
    };
  };

  // Если пользователь просит меньше анимаций — не инициализируем их вовсе
  if (prefersReduced) {
    // Всё равно показываем контент, который мог бы быть скрыт reveal-классами
    document.querySelectorAll('.reveal').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  // ---------- 1. Reveal-анимации ----------
  const revealTargets = [
    { sel: '.hero h1', delay: 0 },
    { sel: '.intro', delay: 120 },
    { sel: '.about-photos', delay: 220 },
    { sel: '.projects h2', delay: 0 },
    { sel: '.process h2', delay: 0 },
  ];

  revealTargets.forEach(({ sel, delay }) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add('reveal');
      el.style.setProperty('--delay', `${delay}ms`);
    });
  });

  // Проекты: анимируем только саму карточку, ссылку не трогаем
  document.querySelectorAll('.projects > a').forEach((link) => {
    const project = link.querySelector('.project');
    if (project) {
      project.classList.add('reveal');
      project.style.setProperty('--delay', '0ms');
    }
  });

  // Шаги процесса с каскадом
  document.querySelectorAll('.step').forEach((step, i) => {
    step.classList.add('reveal');
    step.style.setProperty('--delay', `${i * 90}ms`);
  });

  // Футер
  document.querySelectorAll('.footer > h2, .footer-columns > div').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--delay', `${i * 100}ms`);
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  } else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }

  // ---------- 2. Параллакс фото в hero (только desktop) ----------
  const heroPhoto = document.querySelector('.about-photos');

  if (heroPhoto) {
    let baseTop = null;

    const resetParallax = () => {
      heroPhoto.style.transform = '';
      baseTop = null;
    };

    const onScroll = rafThrottle(() => {
      // На мобильных/планшетах параллакс не нужен —
      // там фото центрируется через CSS translateX(-50%)
      if (!isDesktop()) {
        resetParallax();
        return;
      }

      // Пока фото не появилось — не двигаем
      if (!heroPhoto.classList.contains('is-visible')) return;

      if (baseTop === null) {
        baseTop = heroPhoto.getBoundingClientRect().top + window.scrollY;
      }

      const scrolled = window.scrollY;
      // Ограничиваем сдвиг ±10px, чтобы не было ощущения «отрыва»
      const shift = Math.max(-10, Math.min(10, (baseTop - scrolled) * 0.02));
      heroPhoto.style.transform = `translateY(${shift}px)`;
    });

    window.addEventListener('scroll', onScroll, { passive: true });

    // При ресайзе сбрасываем базовую позицию,
    // а при переходе на мобильную ширину — полностью отключаем параллакс
    window.addEventListener(
      'resize',
      rafThrottle(() => {
        baseTop = null;
        if (!isDesktop()) resetParallax();
      })
    );
  }

  // ---------- 3. Кнопка «наверх» ----------
  const toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Наверх');
  toTop.textContent = '↑';
  document.body.appendChild(toTop);

  const toggleToTop = rafThrottle(() => {
    toTop.classList.toggle('is-visible', window.scrollY > 400);
  });
  window.addEventListener('scroll', toggleToTop, { passive: true });
  toggleToTop();

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- 4. Мягкий hover-подъём ссылок (только устройства с hover) ----------
  if (canHover()) {
    document.querySelectorAll('.nav a, .footer a').forEach((a) => {
      a.style.transition = 'transform .3s var(--ease-soft), opacity .3s var(--ease-soft)';

      a.addEventListener('mouseenter', () => {
        a.style.transform = 'translateY(-1px)';
      });
      a.addEventListener('mouseleave', () => {
        a.style.transform = 'translateY(0)';
      });
    });
  }
})();