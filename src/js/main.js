// Main JS: navigation, smooth scroll
window.addEventListener('DOMContentLoaded', () => {
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
    const onScroll = () => {
      const threshold = 24; // px scrolled before applying effect
      if (window.scrollY > threshold) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

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

  // Back-to-top visibility & scroll handling (appears near bottom of page)
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const updateBackToTop = () => {
      const scrollY = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const progress = docHeight <= 0 ? 0 : scrollY / docHeight;
      if (progress >= 0.7) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', () => {
      updateBackToTop();
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    updateBackToTop();
  }
});
