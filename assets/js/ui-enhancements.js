/**
 * UI/UX Enhancements for zer0-mistakes Theme
 * Adds smooth scroll animations, intersection observer effects, and enhanced interactions
 */

(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Initialize scroll animations for elements with animate-on-scroll class
   */
  /**
   * True if any part of the element is in the viewport (avoids hiding above-the-fold
   * content until IntersectionObserver runs — that caused layout “jumps” on the landing hero).
   */
  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom > 0 && rect.top < vh;
  }

  function initScrollAnimations() {
    if (prefersReducedMotion) return;

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if (!animatedElements.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => {
      if (isInViewport(el)) {
        return;
      }
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });
  }

  /**
   * Add loading state to images
   */
  function initImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function() {
          this.classList.add('loaded');
        });
      }
    });
  }

  /**
   * Enhance button ripple effect
   */
  function initButtonRipples() {
    if (prefersReducedMotion) return;

    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
  }

  /**
   * Add active state to in-page navigation links on scroll.
   *
   * Deliberately excludes `#TableOfContents` links (and the section-page
   * sidebar): those are owned by assets/js/modules/navigation/scroll-spy.js.
   * This observer used to claim every `a[href^="#"]` on the page and clear
   * `.active` from all of them, which fought the TOC scroll spy and made the
   * active heading flicker between entries.
   */
  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id], [id^="get-started"], [id^="features"]');
    const navLinks = Array.from(document.querySelectorAll('a[href^="#"]')).filter(
      link => !link.closest('#TableOfContents, .bd-toc, .sidebar-nav')
    );

    if (!sections.length || !navLinks.length) return;

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-80px 0px -50% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }

  /**
   * Give every GFM task-list checkbox an accessible name (#573).
   *
   * kramdown emits `<li class="task-list-item"><input class="task-list-item-checkbox">Text`
   * with no `<label>`, so axe `label` fires on every box (WCAG 1.3.1 / 4.1.2).
   * The item's own text — the nodes after the box, stopping at a nested list —
   * is wrapped in a `<span id>` and the box points at it with `aria-labelledby`.
   * A `<label>` wrapper is deliberately not used: it would make the text a click
   * target, which changes behaviour for sites that make the boxes interactive.
   * Boxes that already carry `aria-label` / `aria-labelledby` are left alone.
   */
  let taskLabelSeq = 0;

  function labelTaskListCheckboxes(root) {
    const scope = root || document;
    scope.querySelectorAll('.task-list-item-checkbox').forEach(box => {
      if (box.hasAttribute('aria-label') || box.hasAttribute('aria-labelledby')) return;
      const container = box.parentNode;
      if (!container) return;

      const own = [];
      for (let node = box.nextSibling; node; node = node.nextSibling) {
        if (node.nodeType === Node.ELEMENT_NODE && /^(UL|OL)$/.test(node.nodeName)) break;
        own.push(node);
      }
      const text = own.map(node => node.textContent).join('').trim();
      if (!text) return;

      let id;
      do {
        taskLabelSeq += 1;
        id = 'task-list-label-' + taskLabelSeq;
      } while (document.getElementById(id));

      const span = document.createElement('span');
      span.id = id;
      container.insertBefore(span, own[0]);
      own.forEach(node => span.appendChild(node));
      box.setAttribute('aria-labelledby', id);
    });
  }

  // Exposed so content rendered after load (and tests) can label new lists.
  window.zer0LabelTaskLists = labelTaskListCheckboxes;

  /**
   * Initialize all enhancements
   */
  function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initScrollAnimations();
    // Note: Smooth scrolling for anchor links is handled entirely by CSS
    // (scroll-behavior: smooth + scroll-padding-top: 80px in custom.scss)
    initImageLoading();
    initButtonRipples();
    initScrollSpy();
    labelTaskListCheckboxes();
  }

  // Start initialization
  init();
})();

