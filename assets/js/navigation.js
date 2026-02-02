/**
 * ==============================================================================
 * NAVIGATION SCRIPTS - Zer0-Mistakes Theme
 * ==============================================================================
 * 
 * Handles offcanvas navigation, dropdowns, and mobile interactions
 * Extracted from navbar.html inline scripts
 * ==============================================================================
 */

(function() {
  'use strict';

  const MOBILE_BREAKPOINT = 992;
  
  function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
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
   * Desktop keyboard accessibility for hover dropdowns
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
        }
      });

      // Hide when focus leaves dropdown
      dropdown.addEventListener('focusout', (e) => {
        if (!dropdown.contains(e.relatedTarget)) {
          menu.classList.remove('show');
        }
      });

      // Arrow key navigation
      dropdown.addEventListener('keydown', (e) => {
        if (!menu.classList.contains('show')) return;
        
        const items = menu.querySelectorAll('.dropdown-item:not(:disabled)');
        const currentIndex = Array.from(items).indexOf(document.activeElement);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          items[(currentIndex + 1) % items.length]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          items[(currentIndex - 1 + items.length) % items.length]?.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          menu.classList.remove('show');
          toggle.focus();
        }
      });
    });
  }

  /**
   * Mobile dropdown toggle handling
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

        if (isOpen) {
          menu.classList.remove('show');
          toggle.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('show');
          toggle.classList.add('show');
          toggle.setAttribute('aria-expanded', 'true');
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
    const navLinks = document.querySelectorAll('#bdNavbar .nav-link[title]');
    navLinks.forEach(link => {
      // Only initialize tooltip if Bootstrap is available
      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        new bootstrap.Tooltip(link, {
          trigger: 'hover',
          placement: 'bottom',
          delay: { show: 300, hide: 0 }
        });
      }
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initNavigation();
      setupNavTooltips();
    });
  } else {
    initNavigation();
    setupNavTooltips();
  }

})();
