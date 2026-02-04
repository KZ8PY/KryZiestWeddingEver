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
    // Expose programmatic controls for other modules (used by tour)
    try { window.openSidebar = openSidebar; window.closeSidebar = closeSidebar; } catch (e) { /* ignore */ }

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
        // If this heading belongs to the story section, trigger the sidebar tour
        try {
          if (h.closest && h.closest('#story')) showSidebarTourOnce();
        } catch (e) { /* ignore */ }
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

  // Mini tour: show a one-time popover pointing out the sidebar/hamburger
  function showSidebarTourOnce() {
    // Only show once per day using a cookie (per-browser, persists across sessions)
    const _tourStorageKey = 'sidebarTourLastShown';
    const _todayKey = new Date().toISOString().slice(0,10);
    const getCookie = (name) => {
      try {
        const v = document.cookie.split('; ').find(row => row.startsWith(name + '='));
        return v ? decodeURIComponent(v.split('=')[1]) : null;
      } catch (e) { return null; }
    };
    const setCookie = (name, value, days) => {
      try {
        let expires = '';
        if (typeof days === 'number') {
          const d = new Date(); d.setTime(d.getTime() + (days*24*60*60*1000));
          expires = '; expires=' + d.toUTCString();
        }
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; samesite=lax`;
      } catch (e) { /* ignore */ }
    };
    try { if (getCookie(_tourStorageKey) === _todayKey) return; } catch (e) { /* ignore */ }
    const btn = document.getElementById('hamburgerBtn');
    if (!btn) return;
    // Prefer highlighting the whole floating menu group if present
    const highlightTarget = document.querySelector('.floating-menu-group.header-menu') || btn;

    // Create a compact pointer popover
    const pop = document.createElement('div');
    pop.className = 'tour-popover';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-describedby', 'tour-desc');
    pop.innerHTML = `<div id="tour-desc">Navigate quickly through the sidebar and access RSVP</div>`;

    document.body.appendChild(pop);
    // Highlight the whole floating menu group (or button fallback)
    highlightTarget.classList.add('tour-highlight', 'tour-pulse');

    // Position popover near the highlighted element (below it)
    const rect = (highlightTarget.getBoundingClientRect && highlightTarget.getBoundingClientRect()) || btn.getBoundingClientRect();
    const top = Math.min(window.innerHeight - 64, rect.bottom + 8);
    const left = Math.max(8, rect.left);
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;

    // Cleanup will run only when user clicks the hamburger (or highlighted group)
    const cleanup = (openSidebar = false) => {
      try { setCookie(_tourStorageKey, _todayKey, 30); } catch (e) { /* ignore */ }
      try { highlightTarget.classList.remove('tour-highlight', 'tour-pulse'); } catch (e) { btn.classList.remove('tour-highlight'); }
      if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    };

    // If the user clicks the popover, open the sidebar then dismiss
    pop.addEventListener('click', (e) => { try { if (window.openSidebar) window.openSidebar(); else btn.click(); } catch (er) {} ; cleanup(true); });

    // If the highlighted group is not the actual button, clicking it should open sidebar
    if (highlightTarget === btn) {
      // When the real hamburger is clicked by user, dismiss the tour afterwards.
      // If the native handler for the hamburger doesn't open the sidebar
      // (race conditions on some browsers), programmatically open it.
      const onBtnClick = () => { // run after existing handlers
        requestAnimationFrame(() => cleanup(true));
        // ensure sidebar opened — call the canonical opener
        try { if (window.openSidebar) window.openSidebar(); } catch (e) { /* ignore */ }
      };
      btn.addEventListener('click', onBtnClick, { once: true });
    } else {
      const onGroupClick = () => { try { if (window.openSidebar) window.openSidebar(); else btn.click(); } catch (er) {} ; cleanup(true); };
      highlightTarget.addEventListener('click', onGroupClick, { once: true });
    }
  }

  // Expose for manual invocation from console (useful for testing)
  try { window.showSidebarTourOnce = showSidebarTourOnce; } catch (e) { /* ignore */ }

  // Back-to-top visibility & scroll handling (appears near bottom of page)
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Prenup "coming soon" logic removed — prenup CTA is now a standard button
  // Add a small popover for Prenup Photos that mirrors the mini-tour popover style
  (function initPrenupPopover() {
    const btn = document.querySelector('#prenup .prenup-cta .contact-action[data-tooltip], #prenup .prenup-cta .contact-action');
    if (!btn) return;

    const showTip = () => {
      let pop = document.querySelector('.coming-soon-pop');
      const text = btn.getAttribute('data-tooltip') || 'COMING SOON';
      if (!pop) {
        pop = document.createElement('div');
        pop.className = 'tour-popover coming-soon-pop';
        pop.setAttribute('role', 'status');
        pop.setAttribute('aria-live', 'polite');
        pop.innerHTML = `<div>${text}</div>`;
        document.body.appendChild(pop);
      } else {
        pop.innerHTML = `<div>${text}</div>`;
      }

      // Position above the button, centered horizontally, and set arrow position
      const rect = btn.getBoundingClientRect();
      // Allow DOM to render the pop so we can measure its size
      const measured = pop.getBoundingClientRect();
      const popW = measured.width || 200;
      const popH = measured.height || 40;
      // Place pop above the button (with 8px gap for the arrow)
      let top = rect.top - popH - 12; // 12 accounts for arrow + small gap
      if (top < 8) top = rect.bottom + 8; // fallback below if not enough room
      let left = rect.left + (rect.width / 2) - (popW / 2);
      // clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));
      pop.style.top = `${top}px`;
      pop.style.left = `${left}px`;
      // compute arrow left offset relative to pop left, center the arrow on the button
      const arrowLeft = Math.max(12, (rect.left + rect.width / 2) - left - 8);
      pop.style.setProperty('--arrow-left', `${arrowLeft}px`);

      // Reset any existing hide timer
      window.clearTimeout(pop.__hideTimer);
      pop.__hideTimer = window.setTimeout(() => {
        try { if (pop && pop.parentNode) pop.parentNode.removeChild(pop); } catch (e) {}
      }, 1200);
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showTip();
    });
  })();
});
