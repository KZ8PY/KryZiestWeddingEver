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
  const modalWrapper = document.getElementById('modalImageWrapper');
  const modalClose = document.getElementById('modalClose');
  const pagination = document.getElementById('modalPagination');
  const triggers = document.querySelectorAll('.fullscreen-trigger');

  function openModal() {
    updateModalImage();
    updatePagination();
    modal.showModal(); // Native dialog method
    // Also set opacity/class for transition
    modal.setAttribute('open', '');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    resetZoom();
  }

  function closeModal() {
    modal.close();
    modal.removeAttribute('open');
    document.body.style.overflow = '';
    resetZoom();
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
        resetZoom();
      }, 150);
    }
  }

  function updatePagination() {
    if (!pagination) return;
    pagination.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `modal-dot ${idx === currentIndex ? 'active' : ''}`;
      pagination.appendChild(dot);
    });
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger slide navigation
      openModal();
    });
  });

  modalClose?.addEventListener('click', closeModal);
  
  // Close on backdrop click
  modal?.addEventListener('click', (e) => {
    // If click is on close button
    if (e.target.closest('#modalClose')) {
      closeModal();
      return;
    }

    // Identify if click is inside the image wrapper or controls
    if (e.target.closest('.modal-content') || e.target.closest('.modal-close-faq')) return;

    // If click is outside image (on backdrop), close
    if (e.target === modal) {
      closeModal();
    }
  });

  // Toggle controls on single tap (if not zoomed)
  let lastTap = 0;
  modalWrapper?.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
       // Double tap - toggle zoom
       if (scale > 1) resetZoom();
       else zoomTo(2, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    } else {
       // Single tap logic (delayed to check for double)
       // Simplified: toggle controls if scale is 1 and no drag occurred
       if (scale === 1 && !isDragging) {
         modal.classList.toggle('controls-hidden');
       }
    }
    lastTap = now;
  });

  // --- Zoom & Swipe Logic ---
  let scale = 1;
  let pointX = 0, pointY = 0;
  let startX = 0, startY = 0;
  let isDragging = false;
  let isPinching = false;
  let startDist = 0;
  
  // For swipe navigation
  let swipeStartX = 0;

  function resetZoom() {
    scale = 1;
    pointX = 0;
    pointY = 0;
    if (modalImg) modalImg.style.transform = `translate(0px, 0px) scale(1)`;
  }

  function zoomTo(newScale, cx, cy) {
    if(!modalImg) return;
    const rect = modalImg.getBoundingClientRect();
    // Logic for zoom-to-point could be complex; defaulting to simple 2x for now
    scale = newScale;
    modalImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
  }

  if (modalWrapper) {
    modalWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        startDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX - pointX;
        startY = e.touches[0].clientY - pointY;
        swipeStartX = e.touches[0].clientX;
      }
    }, { passive: false });

    modalWrapper.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent browser behavior

      if (isPinching && e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = dist / startDist;
        const newScale = Math.max(1, Math.min(scale * delta, 4)); // clamp scale
        // Ideally should adjust pointX/Y to pivot around center
        
        scale = newScale;
        startDist = dist; // Update for continuous relative scaling
        modalImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;

      } else if (isDragging && e.touches.length === 1 && scale > 1) {
        // Pan logic when zoomed
        pointX = e.touches[0].clientX - startX;
        pointY = e.touches[0].clientY - startY;
        modalImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
      } else if (isDragging && e.touches.length === 1 && scale === 1) {
          // Swipe logic preview (drag image slightly)
          const currentX = e.touches[0].clientX;
          const diff = currentX - swipeStartX;
          modalImg.style.transform = `translate(${diff}px, 0px)`;
      }
    }, { passive: false });

    modalWrapper.addEventListener('touchend', (e) => {
      isPinching = false;
      isDragging = false;
      
      if (e.touches.length === 0) {
        // Check swipe if not zoomed
        if (scale === 1) {
          const endX = e.changedTouches[0].clientX;
          const diff = endX - swipeStartX;
          if (Math.abs(diff) > 50) {
             if (diff > 0) prevSlide();
             else nextSlide();
          } else {
             // Snap back
             modalImg.style.transform = `translate(0px, 0px)`;
          }
          // Ensure we reset properly after slide change
          setTimeout(() => {
             updatePagination();
          }, 200);
        } else {
          // If zoomed out below 1, reset
          if (scale < 1) resetZoom();
        }
      }
    });
  }

  // Initial setup
  updateSlider();
});
