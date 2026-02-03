/**
 * ==============================================================================
 * NAVIGATION SCRIPTS - Zer0-Mistakes Theme
 * ==============================================================================
 * 
 * Handles offcanvas navigation, dropdowns, mobile interactions, and accessibility
 * Enhanced for better UX across all device sizes
 * ==============================================================================
 */

(function() {
  'use strict';

  const MOBILE_BREAKPOINT = 992;
  const TOOLTIP_DELAY = { show: 400, hide: 100 }; // Increased show delay for better UX
  
  function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  function isCompactDesktop() {
    return window.innerWidth >= 992 && window.innerWidth < 1200;
  }

  /**
   * Initialize navigation when DOM is ready
   */
  function initNavigation() {
    setupOffcanvasLinkClose();
    setupKeyboardAccessibility();
    setupMobileDropdowns();
    setupOutsideClickClose();
    setupOffcanvasReset();
    setupNavTooltips();
    setupDropdownHoverDelay();
    setupFocusTrap();
  }

  /**
   * Close offcanvas when navigation link is clicked
   */
  function setupOffcanvasLinkClose() {
    const offcanvasEl = document.getElementById('bdNavbar');
    if (!offcanvasEl) return;

    const navLinks = offcanvasEl.querySelectorAll(
      '.nav-link[href]:not(.dropdown-toggle), .dropdown-item[href]'
    );

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(() => {
          const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
          if (offcanvas) {
            offcanvas.hide();
          }
        }, 100);
      });
    });
  }

  /**
   * Enhanced keyboard accessibility for hover dropdowns
   */
  function setupKeyboardAccessibility() {
    const dropdowns = document.querySelectorAll('.nav-hover-dropdown');
    
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (!toggle || !menu) return;

      // Show on focus
      toggle.addEventListener('focus', () => {
        if (!isMobile()) {
          menu.classList.add('show');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });

      // Hide when focus leaves dropdown
      dropdown.addEventListener('focusout', (e) => {
        if (!dropdown.contains(e.relatedTarget)) {
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Enhanced arrow key navigation
      dropdown.addEventListener('keydown', (e) => {
        if (!menu.classList.contains('show')) {
          // Open dropdown with Enter or Space
          if ((e.key === 'Enter' || e.key === ' ') && e.target === toggle) {
            e.preventDefault();
            menu.classList.add('show');
            toggle.setAttribute('aria-expanded', 'true');
            // Focus first item
            const firstItem = menu.querySelector('.dropdown-item:not(:disabled)');
            if (firstItem) firstItem.focus();
          }
          return;
        }
        
        const items = menu.querySelectorAll('.dropdown-item:not(:disabled)');
        const currentIndex = Array.from(items).indexOf(document.activeElement);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          items[nextIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          items[prevIndex]?.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          items[0]?.focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          items[items.length - 1]?.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        } else if (e.key === 'Tab') {
          // Close dropdown on Tab
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /**
   * Mobile dropdown toggle handling with smooth animations
   */
  function setupMobileDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-hover-dropdown');
    
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle-split');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (!toggle || !menu) return;

      toggle.addEventListener('click', function(e) {
        if (!isMobile()) return;
        
        e.preventDefault();
        e.stopPropagation();

        const isOpen = menu.classList.contains('show');

        // Close all other dropdowns first
        document.querySelectorAll('.nav-hover-dropdown .dropdown-menu.show').forEach(otherMenu => {
          if (otherMenu !== menu) {
            otherMenu.classList.remove('show');
            const otherToggle = otherMenu.closest('.nav-hover-dropdown')?.querySelector('.dropdown-toggle-split');
            if (otherToggle) {
              otherToggle.classList.remove('show');
              otherToggle.setAttribute('aria-expanded', 'false');
            }
          }
        });

        if (isOpen) {
          menu.classList.remove('show');
          toggle.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('show');
          toggle.classList.add('show');
          toggle.setAttribute('aria-expanded', 'true');
          
          // Smooth scroll to show the opened menu
          setTimeout(() => {
            toggle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      });
    });
  }

  /**
   * Close dropdowns when clicking outside on mobile
   */
  function setupOutsideClickClose() {
    document.addEventListener('click', (e) => {
      if (!isMobile()) return;
      
      const clickedDropdown = e.target.closest('.nav-hover-dropdown');
      if (clickedDropdown) return;

      document.querySelectorAll('.nav-hover-dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle-split');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu && toggle) {
          menu.classList.remove('show');
          toggle.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /**
   * Reset dropdowns when offcanvas closes
   */
  function setupOffcanvasReset() {
    const offcanvasEl = document.getElementById('bdNavbar');
    if (!offcanvasEl) return;

    offcanvasEl.addEventListener('hide.bs.offcanvas', () => {
      document.querySelectorAll('.nav-hover-dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle-split');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu && toggle) {
          menu.classList.remove('show');
          toggle.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /**
   * Initialize Bootstrap tooltips for nav links
   * Shows link title on hover when labels are hidden (992px-1199px)
   */
  function setupNavTooltips() {
    if (typeof bootstrap === 'undefined' || !bootstrap.Tooltip) return;
    
    const navLinks = document.querySelectorAll('#bdNavbar .nav-link[title]');
    const tooltips = [];
    
    navLinks.forEach(link => {
      const tooltip = new bootstrap.Tooltip(link, {
        trigger: 'hover focus',
        placement: 'bottom',
        delay: TOOLTIP_DELAY,
        boundary: 'window',
        fallbackPlacements: ['top', 'bottom'],
        customClass: 'nav-tooltip'
      });
      tooltips.push(tooltip);
    });
    
    // Update tooltip state on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        tooltips.forEach(tooltip => {
          // Hide tooltips if not in compact desktop view
          if (!isCompactDesktop()) {
            tooltip.hide();
          }
        });
      }, 150);
    });
  }

  /**
   * Add slight delay to dropdown hover on desktop
   * Prevents accidental opening when moving cursor across menu
   */
  function setupDropdownHoverDelay() {
    if (isMobile()) return;
    
    const dropdowns = document.querySelectorAll('.nav-hover-dropdown');
    const hoverDelay = 150; // ms
    
    dropdowns.forEach(dropdown => {
      let hoverTimeout;
      
      dropdown.addEventListener('mouseenter', () => {
        hoverTimeout = setTimeout(() => {
          const menu = dropdown.querySelector('.dropdown-menu');
          if (menu && !isMobile()) {
            menu.classList.add('show');
          }
        }, hoverDelay);
      });
      
      dropdown.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu && !isMobile()) {
          menu.classList.remove('show');
        }
      });
    });
  }

  /**
   * Focus trap for offcanvas on mobile
   * Keeps focus within the menu for better accessibility
   */
  function setupFocusTrap() {
    const offcanvasEl = document.getElementById('bdNavbar');
    if (!offcanvasEl) return;

    offcanvasEl.addEventListener('shown.bs.offcanvas', () => {
      // Focus first focusable element
      const firstFocusable = offcanvasEl.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }

  // Re-initialize on window resize for responsive behavior
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Update mobile dropdown behavior
      const dropdowns = document.querySelectorAll('.nav-hover-dropdown .dropdown-menu');
      dropdowns.forEach(menu => {
        if (!isMobile()) {
          menu.classList.remove('show');
        }
      });
    }, 250);
  });

})();
