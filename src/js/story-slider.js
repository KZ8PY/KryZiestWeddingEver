document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.story-slide');
  const carousel = document.querySelector('.story-carousel');
  const navPrev = document.querySelector('.story-nav.prev');
  const navNext = document.querySelector('.story-nav.next');
  const storyPagination = document.getElementById('storyPagination'); // Main page dots
  
  if (!slides.length) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  // --- Initialize Pagination Dots ---
  if (storyPagination) {
    storyPagination.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `story-dot ${idx === currentIndex ? 'active' : ''}`;
      // Add aria label for accessibility
      dot.setAttribute('role', 'button');
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', () => {
        currentIndex = idx;
        updateSlider();
      });
      storyPagination.appendChild(dot);
    });
  }

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

    // Update Dots
    if (storyPagination) {
      const dots = storyPagination.querySelectorAll('.story-dot');
      dots.forEach((d, i) => {
        if (i === currentIndex) d.classList.add('active');
        else d.classList.remove('active');
      });
    }

    // Dynamic adjustment for mobile/tablet to ensure edges are visible
    if (window.innerWidth < 1024) {
      applyMobileTransforms();
    }

    // Sync fullscreen if open
    if (typeof modal !== 'undefined' && modal && modal.hasAttribute('open')) {
      updateModalImage(true);
      updatePagination();
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
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  const pagination = document.getElementById('modalPagination');
  const triggers = document.querySelectorAll('.fullscreen-trigger');

  let modalGhostImg = null;
  let filmSwipeDirection = 0;

  function ensureModalGhost() {
    if (!modalWrapper) return null;
    if (modalGhostImg) return modalGhostImg;

    modalGhostImg = document.createElement('img');
    modalGhostImg.className = 'modal-image-ghost';
    modalGhostImg.alt = '';
    modalGhostImg.setAttribute('aria-hidden', 'true');
    modalGhostImg.draggable = false;
    modalWrapper.appendChild(modalGhostImg);
    return modalGhostImg;
  }

  function hideModalGhost() {
    if (!modalGhostImg) return;
    modalGhostImg.style.opacity = '0';
    modalGhostImg.style.transition = 'none';
    modalGhostImg.style.transform = 'translateX(0px)';
  }

  function getAdjacentSlideIndex(direction) {
    return direction === 1
      ? (currentIndex + 1) % totalSlides
      : (currentIndex - 1 + totalSlides) % totalSlides;
  }

  function openModal() {
    updateModalImage();
    updatePagination();
    modal.showModal(); // Native dialog method
    // Also set opacity/class for transition
    modal.setAttribute('open', '');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    hideModalGhost();
    resetZoom();
  }

  function closeModal() {
    modal.close();
    modal.removeAttribute('open');
    document.body.style.overflow = '';
    hideModalGhost();
    resetZoom();
  }

  function updateModalImage(immediate = false) {
    const currentImg = slides[currentIndex].querySelector('img');
    if (!currentImg || !modalImg) return;

    if (immediate) {
      modalImg.src = currentImg.src;
      modalImg.alt = currentImg.alt;
      modalImg.style.opacity = '1';
      hideModalGhost();
      resetZoom();
      return;
    }

    // Fade out slightly
    modalImg.style.opacity = '0.5';
    setTimeout(() => {
      modalImg.src = currentImg.src;
      modalImg.alt = currentImg.alt;
      modalImg.style.opacity = '1';
      hideModalGhost();
      resetZoom();
    }, 150);
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
  modalPrev?.addEventListener('click', (e) => { e.stopPropagation(); prevSlide(); });
  modalNext?.addEventListener('click', (e) => { e.stopPropagation(); nextSlide(); });
  
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

  // --- Zoom, Swipe & Tap Logic ---
  let scale = 1;
  let pointX = 0, pointY = 0;
  let startX = 0, startY = 0;
  // State tracking
  let isDragging = false;
  let isPinching = false;
  let startDist = 0;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let lastTap = 0;
  let hasMoved = false;

  function beginFilmRollSwipe(diff) {
    if (!modalImg || !modalWrapper) return;
    if (Math.abs(diff) < 8) {
      hideModalGhost();
      filmSwipeDirection = 0;
      return;
    }

    const direction = diff < 0 ? 1 : -1;
    const adjacentIndex = getAdjacentSlideIndex(direction);
    const adjacentImg = slides[adjacentIndex]?.querySelector('img');
    const ghost = ensureModalGhost();
    if (!adjacentImg || !ghost) return;

    const wrapperWidth = modalWrapper.clientWidth || window.innerWidth;

    if (filmSwipeDirection !== direction || ghost.src !== adjacentImg.src) {
      ghost.src = adjacentImg.src;
      ghost.alt = adjacentImg.alt || '';
    }

    filmSwipeDirection = direction;
    modalImg.style.transition = 'none';
    ghost.style.transition = 'none';

    modalImg.style.transform = `translateX(${diff}px)`;
    ghost.style.opacity = '1';
    const ghostStart = direction === 1 ? wrapperWidth : -wrapperWidth;
    ghost.style.transform = `translateX(${ghostStart + diff}px)`;
  }

  function settleFilmRollSwipe(shouldAdvance) {
    if (!modalImg || !modalWrapper) return;
    const ghost = ensureModalGhost();
    if (!ghost || filmSwipeDirection === 0) {
      resetZoom();
      return;
    }

    const wrapperWidth = modalWrapper.clientWidth || window.innerWidth;
    const settleMs = 180;
    modalImg.style.transition = `transform ${settleMs}ms linear`;
    ghost.style.transition = `transform ${settleMs}ms linear, opacity ${settleMs}ms linear`;

    if (!shouldAdvance) {
      modalImg.style.transform = 'translateX(0px)';
      const ghostOffscreen = filmSwipeDirection === 1 ? wrapperWidth : -wrapperWidth;
      ghost.style.transform = `translateX(${ghostOffscreen}px)`;
      ghost.style.opacity = '0';
      window.setTimeout(() => {
        filmSwipeDirection = 0;
        resetZoom();
      }, settleMs + 20);
      return;
    }

    const currentOut = filmSwipeDirection === 1 ? -wrapperWidth : wrapperWidth;
    // Camera-roll style: next/prev image lands instantly, only current image animates out
    ghost.style.transition = 'none';
    ghost.style.transform = 'translateX(0px)';
    ghost.style.opacity = '1';
    modalImg.style.transform = `translateX(${currentOut}px)`;

    window.setTimeout(() => {
      if (filmSwipeDirection === 1) currentIndex = (currentIndex + 1) % totalSlides;
      else currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      filmSwipeDirection = 0;
      updateSlider();
    }, settleMs + 20);
  }

  function resetZoom(animate = true) {
    scale = 1;
    pointX = 0;
    pointY = 0;
    hideModalGhost();
    filmSwipeDirection = 0;
    if (modalImg) {
      modalImg.style.transition = animate ? '' : 'none';
      modalImg.style.transform = `translate(0px, 0px) scale(1)`;
    }
  }

  function zoomTo(newScale, cx, cy) {
    if(!modalImg) return;
    // Simple zoom logic centered on tap (imperfect but functional)
    scale = newScale;
    pointX = 0; // Reset pan on zoom toggle for simplicity
    pointY = 0;
    modalImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
  }

  if (modalWrapper) {
    modalWrapper.addEventListener('touchstart', (e) => {
      // If multi-touch, it's a pinch
      if (e.touches.length === 2) {
        isPinching = true;
        isDragging = false;
        startDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        isDragging = true;
        isPinching = false;
        hasMoved = false; // Reset movement flag
        
        // Record start positions for both Swipe (screen-relative) and Pan (transform-relative)
        startX = e.touches[0].clientX - pointX;
        startY = e.touches[0].clientY - pointY;
        
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
      }
    }, { passive: false });

    modalWrapper.addEventListener('touchmove', (e) => {
      // Prevent default to stop scrolling/refreshing details page behind modal
      if (e.cancelable) e.preventDefault(); 

      if (isPinching && e.touches.length === 2) {
        hasMoved = true;
        hideModalGhost();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = dist / startDist;
        const newScale = Math.max(1, Math.min(scale * delta, 4)); // clamp scale
        
        scale = newScale;
        startDist = dist; 
        modalImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;

      } else if (isDragging && e.touches.length === 1) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        // Check if actually moved significantly (avoid jitter being counted as move)
        if (Math.abs(currentX - swipeStartX) > 5 || Math.abs(currentY - swipeStartY) > 5) {
            hasMoved = true;
        }

        if (scale > 1) {
          // PAN logic when zoomed
          hideModalGhost();
          pointX = currentX - startX;
          pointY = currentY - startY;
          modalImg.style.transition = 'none';
          modalImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        } else {
          // Film-roll swipe visual feedback
          const diff = currentX - swipeStartX;
          beginFilmRollSwipe(diff);
        }
      }
    }, { passive: false });

    modalWrapper.addEventListener('touchend', (e) => {
      isPinching = false;
      isDragging = false;
      
      const now = Date.now();
      const isDoubleTap = (now - lastTap < 300);

      // --- Tap Handling (No movement) ---
      if (!hasMoved && e.changedTouches.length === 1) {
         if (isDoubleTap) {
            // Double Tap: Toggle Zoom
            if (scale > 1) resetZoom();
            else zoomTo(2, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            lastTap = 0; // consumed
         } else {
            // Single Tap: Just update timestamp for double-tap detection
            // Controls are now always visible, so no toggle logic here.
            lastTap = now;
         }
         return; 
      }
      
      lastTap = now; // update for next potential double tap sequence even if moved? (Usually valid)

      // --- Swipe/Drag End Handling ---
      if (e.touches.length === 0) {
        if (scale === 1) {
          // Resolve Swipe
          const endX = e.changedTouches[0].clientX;
          const diff = endX - swipeStartX;
          
           if (Math.abs(diff) > 50) {
             // Successful Swipe
             settleFilmRollSwipe(true);
           } else {
             // Snap back (incomplete swipe)
             settleFilmRollSwipe(false);
          }
        } else {
          // If zoomed out below 1 during pinch, reset
          if (scale < 1) resetZoom();
        }
      }
    });
  }

  // Initial setup
  updateSlider();
});
