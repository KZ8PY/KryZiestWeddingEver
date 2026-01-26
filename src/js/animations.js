// Micro-interactions & loading states
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.fade-in').forEach(el => {
    el.classList.add('fade-in');
  });

  // Simple full-viewport white fade overlay on first paint
  if (!document.getElementById('page-fade-overlay')) {
    const o = document.createElement('div');
    o.id = 'page-fade-overlay';
    o.className = 'page-fade-overlay';
    document.body.appendChild(o);
    // remove after animation completes (or after 900ms fallback)
    const remove = () => o.remove();
    o.addEventListener('animationend', remove, { once: true });
    setTimeout(() => { if (o.parentNode) o.remove(); }, 1200);
  }
});
