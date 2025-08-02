// Gallery lightbox & lazy loading
window.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.gallery-grid img');
  images.forEach(img => {
    img.loading = 'lazy';
    img.addEventListener('click', () => {
      // Simple lightbox
      const overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.innerHTML = `<img src="${img.src}" alt="${img.alt}"><span class="close">&times;</span>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.close').onclick = () => overlay.remove();
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    });
  });
});
