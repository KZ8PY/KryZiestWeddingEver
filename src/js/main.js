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

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Very lightweight device tiering to keep visuals while avoiding jank on weaker devices.
    const cores = (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number') ? navigator.hardwareConcurrency : 4;
    const mem = (typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number') ? navigator.deviceMemory : 4;
    const isLowTier = (cores <= 4) || (mem <= 4);

    const container = document.createElement('div');
    container.id = 'latte-bg';
    container.setAttribute('aria-hidden', 'true');
    container.classList.add((isLowTier || isSaveTheDatePage) ? 'latte-tier-low' : 'latte-tier-high');

    // Save-the-Date page: keep a minimal, static background for smoother video playback.
    if (isSaveTheDatePage) {
      container.classList.add('latte-minimal');
      container.innerHTML = `<div class="latte-layer latte-gradient"></div>`;
      document.body.prepend(container);

      container.__latteAnimControls = {
        stop: () => {},
        start: () => {},
        isRunning: () => false
      };
      return;
    }

    container.innerHTML = `
      <div class="latte-layer latte-gradient"></div>

      <div class="latte-layer latte-orbs">
        <div class="latte-orb lg1"></div>
        <div class="latte-orb lg2"></div>
        <div class="latte-orb md1"></div>
        <div class="latte-orb md2"></div>
      </div>

      <div class="latte-layer latte-blobs" id="latte-blobs" aria-hidden="true"></div>

      <div class="latte-layer latte-foam"></div>
    `;

    document.body.prepend(container);

    // Create hero-like circular gradient blobs across the full page.
    const blobLayer = container.querySelector('#latte-blobs');
    const blobs = [];

    if (blobLayer) {
      // Weighted palette: cream-dominant for a milkier latte look.
      const palette = [
        { color: 'rgba(250, 247, 240, 0.22)', kind: 'cream', weight: 0.46 },
        { color: 'rgba(210, 180, 140, 0.20)', kind: 'lightCoffee', weight: 0.22 },
        { color: 'rgba(135, 169, 107, 0.20)', kind: 'matcha', weight: 0.16 },
        { color: 'rgba(139, 69, 19, 0.18)', kind: 'coffee', weight: 0.10 },
        { color: 'rgba(74, 44, 42, 0.18)', kind: 'darkCoffee', weight: 0.06 }
      ];

      const pick = () => {
        let r = Math.random();
        for (const p of palette) {
          r -= p.weight;
          if (r <= 0) return p;
        }
        return palette[0];
      };

      const baseCount = isLowTier
        ? (prefersReducedMotion ? 8 : 10)
        : (prefersReducedMotion ? 12 : 16);
      const count = isSaveTheDatePage
        ? Math.max(5, Math.floor(baseCount * 0.6))
        : baseCount;
      for (let i = 0; i < count; i += 1) {
        const el = document.createElement('div');
        el.className = 'latte-blob';
        const chosen = pick();

        // Milkier dominance: cream blobs are larger and slightly more present.
        const size = (chosen.kind === 'cream')
          ? (520 + Math.random() * 980)
          : (360 + Math.random() * 820);

        // More defined: higher opacity and less blur overall.
        const opacity = (chosen.kind === 'cream')
          ? (0.20 + Math.random() * 0.14)
          : (0.16 + Math.random() * 0.12);

        // Lower blur cost: rely more on gradient falloff + less on filter blur.
        const blur = (chosen.kind === 'cream')
          ? (4 + Math.random() * 6)
          : (3 + Math.random() * 4);

        const color = chosen.color;

        // Blend: keep milky softness while allowing some overlay depth.
        el.style.mixBlendMode = (chosen.kind === 'cream')
          ? ((i % 2 === 0) ? 'soft-light' : 'screen')
          : ((i % 3 === 0) ? 'overlay' : (i % 3 === 1) ? 'soft-light' : 'screen');
        el.style.setProperty('--blob-size', size.toFixed(0) + 'px');
        el.style.setProperty('--blob-opacity', opacity.toFixed(3));
        el.style.setProperty('--blob-blur', blur.toFixed(1) + 'px');
        el.style.setProperty('--blob-color', color);

        blobLayer.appendChild(el);

        // Seeded motion params (kept tiny but frequent; swirly not linear)
        blobs.push({
          el,
          ax: -0.08 + Math.random() * 1.16,
          ay: -0.05 + Math.random() * 1.1,
          size,
          rotation: (Math.random() * 0.8) - 0.4,
          scale: 0.9 + Math.random() * 0.2
        });
      }
    }

    let measureRafId = 0;

    let bgWidth = 0;
    let bgHeight = 0;

    const positionBlobs = () => {
      if (!blobs.length) return;
      const w = bgWidth || window.innerWidth || 1000;
      const h = bgHeight || document.documentElement.scrollHeight || 2000;
      for (const b of blobs) {
        const baseX = b.ax * w;
        const baseY = b.ay * h;
        const x = (baseX - b.size / 2).toFixed(2);
        const y = (baseY - b.size / 2).toFixed(2);
        b.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${b.rotation.toFixed(3)}rad) scale(${b.scale.toFixed(3)})`;
      }
    };

    const measure = () => {
      measureRafId = 0;
      const doc = document.documentElement;
      const body = document.body;
      const height = Math.max(
        doc.scrollHeight,
        body.scrollHeight,
        doc.offsetHeight,
        body.offsetHeight,
        window.innerHeight
      );
      bgHeight = height;
      bgWidth = Math.max(doc.clientWidth || 0, window.innerWidth || 0);
      positionBlobs();
    };

    const requestMeasure = () => {
      if (measureRafId) return;
      measureRafId = window.requestAnimationFrame(measure);
    };

    // Resize: re-measure the scrollable page height used to distribute blobs.
    window.addEventListener('resize', () => {
      requestMeasure();
    });

    // Content changes (images loading, dynamic layout): keep height correct.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => requestMeasure());
      ro.observe(document.body);
    } else {
      // fallback: re-measure after load
      window.addEventListener('load', requestMeasure, { once: true });
    }

    requestMeasure();

    // Expose controls so other features (e.g. video playback) can temporarily pause the background.
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
      let docScrollable = 0;

      const recomputeScrollable = () => {
        // Reading scrollHeight can trigger layout; do it on resize instead of on every scroll.
        const doc = document.documentElement;
        docScrollable = Math.max(0, (doc.scrollHeight || 0) - window.innerHeight);
      };

      const applyScrollEffects = () => {
        scrollRafId = 0;

        const y = window.scrollY || 0;
        if (y > threshold) header.classList.add('scrolled'); else header.classList.remove('scrolled');

        // Back-to-top visibility (appears near bottom of page)
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
          const progress = docScrollable <= 0 ? 0 : y / docScrollable;
          if (progress >= 0.7) backToTop.classList.add('visible'); else backToTop.classList.remove('visible');
        }
      };

      const requestScrollEffects = () => {
        if (scrollRafId) return;
        scrollRafId = window.requestAnimationFrame(applyScrollEffects);
      };

      window.addEventListener('scroll', requestScrollEffects, { passive: true });
      window.addEventListener('resize', () => {
        recomputeScrollable();
        requestScrollEffects();
      }, { passive: true });
      window.addEventListener('load', () => {
        recomputeScrollable();
        requestScrollEffects();
      }, { once: true });

      recomputeScrollable();
      requestScrollEffects();
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
