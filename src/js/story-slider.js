document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.story-slide');
  const carousel = document.querySelector('.story-carousel');
  const navPrev = document.querySelector('.story-nav.prev');
  const navNext = document.querySelector('.story-nav.next');
  
  if (!slides.length) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  // --- Main Slider Logic ---
  function updateSlider() {
    slides.forEach((slide, index) => {
      // Clear dynamic transforms first
      slide.style.transform = '';
      slide.classList.remove('active', 'prev', 'next');
      slide.setAttribute('aria-hidden', 'true');
      
      if (index === currentIndex) {
        slide.classList.add('active');
        slide.setAttribute('aria-hidden', 'false');
      } else if (index === (currentIndex - 1 + totalSlides) % totalSlides) {
        slide.classList.add('prev');
      } else if (index === (currentIndex + 1) % totalSlides) {
        slide.classList.add('next');
      }
    });

    // Dynamic adjustment for mobile/tablet to ensure edges are visible
    if (window.innerWidth < 1024) {
      applyMobileTransforms();
    }

    // Sync fullscreen if open
    if (typeof modal !== 'undefined' && modal && modal.hasAttribute('open')) {
      updateModalImage();
    }
  }

  function applyMobileTransforms() {
    const activeSlide = slides[currentIndex];
    
    // Safety check just in case
    if (!activeSlide) return;
    
    // Indices
    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    const nextIndex = (currentIndex + 1) % totalSlides;
    
    const prevSlideEl = slides[prevIndex];
    const nextSlideEl = slides[nextIndex];
    
    /* 
       DYNAMIC CALCULATION:
       User wants side cards to utilize the full width of the screen if necessary.
       They should be pushed out as much as possible to be visible behind the center card.
    */
    
    const containerWidth = carousel.clientWidth;
    const cardWidth = activeSlide.offsetWidth; 
    
    // Scale factor for side cards
    const scale = 0.85;
    const scaledCardWidth = cardWidth * scale;
    
    // Calculate max translation to place the outer edge exactly at the screen edge (0 padding)
    // translation X = (ContainerWidth/2) - (ScaledHalfWidth).
    const safePadding = 0; 
    const maxTranslateX = (containerWidth / 2) - (scaledCardWidth / 2) - safePadding;
    
    // Use this max translation. 
    const translationPx = maxTranslateX; 
    
    if (prevSlideEl) {
      prevSlideEl.style.transform = `translateX(-${translationPx}px) translateZ(-100px) rotateY(15deg) scale(${scale})`;
      prevSlideEl.style.opacity = '1'; 
      prevSlideEl.style.zIndex = '1';
    }
    
    if (nextSlideEl) {
      nextSlideEl.style.transform = `translateX(${translationPx}px) translateZ(-100px) rotateY(-15deg) scale(${scale})`;
      nextSlideEl.style.opacity = '1';
      nextSlideEl.style.zIndex = '1';
    }
  
    // Reset any others
    slides.forEach((slide, idx) => {
        if(idx !== currentIndex && idx !== prevIndex && idx !== nextIndex) {
            slide.style.transform = '';
            slide.style.opacity = '';
        }
    });
  }

  // Debounced resize handler
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateSlider, 100);
  });

  function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlider();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlider();
  }

  navNext?.addEventListener('click', nextSlide);
  navPrev?.addEventListener('click', prevSlide);

  // Click on prev/next visible cards to navigate
  slides.forEach((slide, index) => {
    slide.addEventListener('click', (e) => {
      // If clicking the active slide (and not a button inside), ignore or toggle something?
      // If clicking prev/next, navigate
      if (slide.classList.contains('prev')) {
        prevSlide();
      } else if (slide.classList.contains('next')) {
        nextSlide();
      }
    });
  });

  // Swipe support for Carousel
  let touchStartX = 0;
  let touchEndX = 0;

  carousel?.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carousel?.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const threshold = 50;
    if (touchStartX - touchEndX > threshold) {
      nextSlide();
    }
    if (touchEndX - touchStartX > threshold) {
      prevSlide();
    }
  }

  // --- Fullscreen Modal Logic ---
  const modal = document.getElementById('storyModal');
  const modalImg = document.getElementById('modalImage');
  const modalClose = document.getElementById('modalClose');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  const triggers = document.querySelectorAll('.fullscreen-trigger');

  function openModal() {
    updateModalImage();
    modal.showModal(); // Native dialog method
    // Also set opacity/class for transition
    modal.setAttribute('open', '');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }

  function closeModal() {
    modal.close();
    modal.removeAttribute('open');
    document.body.style.overflow = '';
  }

  function updateModalImage() {
    const currentImg = slides[currentIndex].querySelector('img');
    if (currentImg && modalImg) {
      // Fade out slightly?
      modalImg.style.opacity = '0.5';
      setTimeout(() => {
        modalImg.src = currentImg.src;
        modalImg.alt = currentImg.alt;
        modalImg.style.opacity = '1';
      }, 150);
    }
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger slide navigation
      openModal();
    });
  });

  modalClose?.addEventListener('click', closeModal);
  modalPrev?.addEventListener('click', (e) => { e.stopPropagation(); prevSlide(); });
  modalNext?.addEventListener('click', (e) => { e.stopPropagation(); nextSlide(); });

  // Close on backdrop click
  modal?.addEventListener('click', (e) => {
    const rect = modalImg.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    
    // Check if click is on button
    if (e.target.closest('button')) return;

    // If click is outside image (on backdrop), close
    // Note: <dialog> backdrop handling varies, but clicking the element itself when it covers screen works
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Toggle controls on image click (especially for mobile)
  modalImg?.addEventListener('click', (e) => {
    e.stopPropagation(); 
    modal.classList.toggle('controls-hidden');
  });

  // Swipe for Modal
  modal?.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modal?.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  // Initial setup
  updateSlider();
});
