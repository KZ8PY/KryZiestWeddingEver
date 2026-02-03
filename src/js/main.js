// Main JS: navigation, smooth scroll
window.addEventListener('DOMContentLoaded', () => {
  const locationPath = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
  const isSaveTheDatePage = locationPath.includes('savethedate-rsvp');

  if (isSaveTheDatePage) {
    document.body.classList.add('page-save-the-date');
  }

  // Decorative latte background (injected once per page) + rAF-driven sizing.
  (function initLatteBackground() {
    if (document.getElementById('latte-bg')) return;

    // Device tiering disabled per request: ensure full effects on all devices.
    // Previously checked hardwareConcurrency and deviceMemory.
    const isLowTier = false; 
    
    const container = document.createElement('div');
    container.id = 'latte-bg';
    container.setAttribute('aria-hidden', 'true');
    container.classList.add((isLowTier || isSaveTheDatePage) ? 'latte-tier-low' : 'latte-tier-high');

    // Save-the-Date page: keep a minimal, static background for smoother video playback.
    if (isSaveTheDatePage) {
      container.classList.add('latte-minimal');
    }

    // Simplified to just the gradient layer which will animate via CSS
    container.innerHTML = `
      <div class="latte-layer latte-gradient"></div>
    `;

    document.body.prepend(container);

    container.__latteAnimControls = {
      stop: () => {},
      start: () => {},
      isRunning: () => false
    };
  })();

  // Lightweight accessible custom audio player
  (function initCustomAudioPlayers() {
    const players = Array.from(document.querySelectorAll('.custom-audio-player'));
    if (!players.length) return;

    const fmt = (s) => {
      if (!isFinite(s) || s < 0) return '0:00';
      const sec = Math.floor(s % 60).toString().padStart(2, '0');
      const min = Math.floor(s / 60);
      return `${min}:${sec}`;
    };

    players.forEach((wrap) => {
      const audio = wrap.querySelector('.site-audio');
      const btn = wrap.querySelector('.cap-play');
      const progress = wrap.querySelector('.cap-progress');
      const filled = wrap.querySelector('.cap-progress-filled');
      const time = wrap.querySelector('.cap-time');

      if (!audio || !btn || !progress || !filled || !time) return;

      // Ensure preload set if not present
      if (!audio.getAttribute('preload')) audio.setAttribute('preload', 'none');

      let isPlaying = false;

      const updatePlayState = () => {
        btn.textContent = audio.paused ? '▶' : '▌▌';
        isPlaying = !audio.paused;
      };

      const updateProgress = () => {
        const pct = (audio.duration && isFinite(audio.duration)) ? (audio.currentTime / audio.duration) * 100 : 0;
        filled.style.width = `${Math.max(0, Math.min(100, pct))}%`;
        time.textContent = fmt(audio.currentTime);
        progress.setAttribute('aria-valuenow', Math.round(pct));
      };

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (audio.paused) audio.play(); else audio.pause();
        updatePlayState();
      });

      audio.addEventListener('play', updatePlayState);
      audio.addEventListener('pause', updatePlayState);
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', () => {
        time.textContent = fmt(0);
        progress.setAttribute('aria-valuemax', 100);
        updateProgress();
      });

      // Seek on click
      progress.addEventListener('click', (ev) => {
        const rect = progress.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        if (audio.duration && isFinite(audio.duration)) audio.currentTime = x * audio.duration;
        updateProgress();
      });

      // Keyboard seek (left/right arrows) and space to toggle
      progress.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
          ev.preventDefault();
          const delta = (ev.key === 'ArrowRight') ? 5 : -5;
          if (audio.duration && isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
        } else if (ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();
          if (audio.paused) audio.play(); else audio.pause();
        }
      });

      // Accessibility: reflect initial state
      updatePlayState();
      updateProgress();
    });
  })();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Header scroll behavior: toggle .scrolled to allow CSS-driven translucency
  const header = document.querySelector('.site-header');
  if (header) {
    if (!isSaveTheDatePage) {
      const threshold = 24; // px scrolled before applying effect

      let scrollRafId = 0;

      const applyScrollEffects = () => {
        scrollRafId = 0;

        const y = window.scrollY || 0;
        if (y > threshold) header.classList.add('scrolled'); else header.classList.remove('scrolled');

        // Back-to-top visibility (state-based check, robust on all devices)
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
          if (y > 5000) backToTop.classList.add('visible'); else backToTop.classList.remove('visible');
        }
      };

      const requestScrollEffects = () => {
        if (scrollRafId) return;
        scrollRafId = window.requestAnimationFrame(applyScrollEffects);
      };

      window.addEventListener('scroll', requestScrollEffects, { passive: true });
      window.addEventListener('resize', requestScrollEffects, { passive: true });
      window.addEventListener('load', requestScrollEffects, { once: true });

      // Initial setup
      requestScrollEffects();
    } else {
      // On Save-the-Date page, still allow back-to-top to work but without scroll effects
      const backToTop = document.getElementById('backToTop');
      if (backToTop) {
        const simpleScrollCheck = () => {
          const y = window.scrollY || 0;
          if (y > 400) backToTop.classList.add('visible');
          else backToTop.classList.remove('visible');
        };
        window.addEventListener('scroll', simpleScrollCheck, { passive: true });
        simpleScrollCheck(); // Initialize
      }
    }

    // Measure header height and publish as a CSS variable so components (hero)
    // can offset themselves to avoid overlap with the sticky header. This also
    // accounts for dynamic sizing (font changes, toolbars) and safe-area insets.
    const setHeaderHeightVar = () => {
      const root = document.documentElement;
      const rect = header.getBoundingClientRect();
      const height = Math.ceil(rect.height || header.offsetHeight || 64);
      root.style.setProperty('--site-header-height', height + 'px');
    };
    window.addEventListener('resize', setHeaderHeightVar);
    // Run after a tick to allow layout to stabilize
    requestAnimationFrame(setHeaderHeightVar);
  }

  // Sidebar toggle behavior (hamburger)
  (function initSidebar() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    // Ensure the sidebar is visible once JS initializes it (prevents FOUC)
    if (sidebar) sidebar.style.visibility = 'visible';
    if (!hamburgerBtn || !sidebar) return;

    // overlay element (single-instance)
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }

    const openSidebar = () => {
      hamburgerBtn.classList.add('active');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      // animate to the close (X) icon by adding a class the CSS will crossfade
      hamburgerBtn.classList.add('is-open');
      hamburgerBtn.setAttribute('aria-label', 'Close menu');
      sidebar.classList.add('open');
      document.body.classList.add('sidebar-open');
      sidebar.setAttribute('aria-hidden', 'false');
      overlay.classList.add('visible');
      document.body.classList.add('no-scroll');
    };
    const closeSidebar = () => {
      hamburgerBtn.classList.remove('active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      // animate back to hamburger by removing the class
      hamburgerBtn.classList.remove('is-open');
      hamburgerBtn.setAttribute('aria-label', 'Open menu');
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
      sidebar.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('visible');
      document.body.classList.remove('no-scroll');
    };

    hamburgerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
      if (expanded) closeSidebar(); else openSidebar();
    });
    overlay.addEventListener('click', closeSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    // Close when clicking a nav link
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSidebar));
    // Close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });
  })();

  // Section header reveal: animate the whole heading once (no letter-by-letter)
  (function initHeaderReveal() {
    const selector = '.welcome-panel-welcome h2, .section h2';
    const headings = Array.from(document.querySelectorAll(selector))
      .filter(h => !h.closest('#hero'));
    if (!headings.length) return;

    // If an older build already wrapped letters, restore plain text.
    headings.forEach((h) => {
      const letters = h.querySelectorAll('.write-letter');
      if (!letters.length) return;
      h.textContent = h.textContent;
    });

    if (!('IntersectionObserver' in window)) {
      headings.forEach(h => h.classList.add('h2-reveal'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const h = entry.target;

        // Simply add the class; CSS transitions handle the rest.
        h.classList.add('h2-reveal');
        obs.unobserve(h);
      });
    }, { threshold: 0.1 });

    headings.forEach((h) => {
      const rect = h.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      if (inView) {
        requestAnimationFrame(() => h.classList.add('h2-reveal'));
      } else {
        observer.observe(h);
      }
    });
  })();

  // Back-to-top visibility & scroll handling (appears near bottom of page)
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // "Coming soon" tooltip buttons (e.g., Prenup Photos)
  (function initComingSoonButtons() {
    const buttons = document.querySelectorAll('.coming-soon-btn[data-tooltip]');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      const show = () => {
        const tip = btn.closest('.prenup-cta')?.querySelector('.coming-soon-tip') || null;
        if (!tip) return;

        tip.textContent = btn.getAttribute('data-tooltip') || 'COMING SOON';
        tip.hidden = false;
        window.clearTimeout(tip.__hideTimer);
        tip.__hideTimer = window.setTimeout(() => {
          tip.hidden = true;
        }, 1200);
      };

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        show();
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          show();
        }
      });
    });
  })();
});
