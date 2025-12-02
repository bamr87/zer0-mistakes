/**
 * ===================================================================
 * SIDEBAR NAVIGATION - Enhanced JavaScript Functionality
 * ===================================================================
 * 
 * File: sidebar.js
 * Path: assets/js/sidebar.js
 * Purpose: Enhanced sidebar navigation with scroll spy, smooth scrolling,
 *          keyboard shortcuts, and mobile gesture support
 * 
 * Features:
 * - Intersection Observer-based scroll spy for better performance
 * - Smooth scroll to TOC anchors with offset for fixed headers
 * - Keyboard shortcuts for navigation ([ and ] for prev/next)
 * - Swipe gesture support for mobile offcanvas
 * - Active section highlighting in TOC
 * - Focus management for accessibility
 * - Error handling for missing elements
 * 
 * Dependencies:
 * - Bootstrap 5 (for offcanvas functionality)
 * - Modern browser with Intersection Observer support
 * 
 * Browser Support:
 * - Chrome/Edge 58+
 * - Firefox 55+
 * - Safari 12.1+
 * 
 * ===================================================================
 */

(function() {
    'use strict';

    // ===================================================================
    // CONFIGURATION
    // ===================================================================
    
    const config = {
        tocSelector: '#TableOfContents',
        tocLinkSelector: '#TableOfContents a',
        mainContentSelector: '.bd-content',
        observerRootMargin: '-80px 0px -80px 0px', // Account for fixed headers
        smoothScrollOffset: 80, // Offset for fixed headers
        debounceDelay: 100,
        enableKeyboardShortcuts: true,
        enableSwipeGestures: true,
        swipeThreshold: 50 // Minimum distance for swipe gesture
    };

    // ===================================================================
    // UTILITY FUNCTIONS
    // ===================================================================

    /**
     * Debounce function to limit function calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get element safely with error handling
     */
    function getElement(selector) {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.warn(`Sidebar.js: Element not found - ${selector}`);
            return null;
        }
    }

    /**
     * Get all elements safely with error handling
     */
    function getElements(selector) {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.warn(`Sidebar.js: Elements not found - ${selector}`);
            return [];
        }
    }

    // ===================================================================
    // SCROLL SPY - Intersection Observer Implementation
    // ===================================================================

    class ScrollSpy {
        constructor() {
            this.tocLinks = getElements(config.tocLinkSelector);
            this.headings = this.getHeadings();
            this.currentActive = null;
            
            if (this.headings.length === 0 || this.tocLinks.length === 0) {
                console.log('Sidebar.js: No TOC or headings found, skipping scroll spy');
                return;
            }

            this.init();
        }

        /**
         * Get all headings that have corresponding TOC links
         */
        getHeadings() {
            const headings = [];
            this.tocLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const id = href.substring(1);
                    const heading = document.getElementById(id);
                    if (heading) {
                        headings.push({
                            element: heading,
                            link: link,
                            id: id
                        });
                    }
                }
            });
            return headings;
        }

        /**
         * Initialize Intersection Observer
         */
        init() {
            const observerOptions = {
                root: null,
                rootMargin: config.observerRootMargin,
                threshold: [0, 0.25, 0.5, 0.75, 1]
            };

            this.observer = new IntersectionObserver(
                entries => this.handleIntersection(entries),
                observerOptions
            );

            // Observe all headings
            this.headings.forEach(heading => {
                this.observer.observe(heading.element);
            });
        }

        /**
         * Handle intersection events
         */
        handleIntersection(entries) {
            // Find the most visible heading
            let mostVisible = null;
            let maxRatio = 0;

            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    mostVisible = this.headings.find(h => h.element === entry.target);
                }
            });

            // If we found a visible heading, activate it
            if (mostVisible) {
                this.setActiveLink(mostVisible.link);
            }
        }

        /**
         * Set active link with visual feedback
         */
        setActiveLink(link) {
            if (this.currentActive === link) return;

            // Remove previous active state
            this.tocLinks.forEach(l => l.classList.remove('active'));

            // Add active state
            if (link) {
                link.classList.add('active');
                this.currentActive = link;

                // Scroll TOC to show active link (if needed)
                this.scrollTocToActiveLink(link);
            }
        }

        /**
         * Scroll TOC container to show active link
         */
        scrollTocToActiveLink(link) {
            const tocContainer = getElement('.bd-toc .offcanvas-body');
            if (!tocContainer) return;

            const linkRect = link.getBoundingClientRect();
            const containerRect = tocContainer.getBoundingClientRect();

            // Check if link is out of view
            if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
                link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        /**
         * Cleanup observer
         */
        destroy() {
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    }

    // ===================================================================
    // SMOOTH SCROLL - Enhanced anchor navigation
    // ===================================================================

    class SmoothScroll {
        constructor() {
            this.tocLinks = getElements(config.tocLinkSelector);
            this.init();
        }

        init() {
            this.tocLinks.forEach(link => {
                link.addEventListener('click', e => this.handleClick(e));
            });
        }

        handleClick(event) {
            const href = event.currentTarget.getAttribute('href');
            
            if (!href || !href.startsWith('#')) return;

            event.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (!targetElement) return;

            // Calculate scroll position with offset
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - config.smoothScrollOffset;

            // Smooth scroll to target
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Update URL without jumping
            if (history.pushState) {
                history.pushState(null, null, href);
            }

            // Close mobile offcanvas if open
            this.closeMobileOffcanvas();

            // Update focus for accessibility
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus();
        }

        closeMobileOffcanvas() {
            const tocOffcanvas = document.getElementById('tocContents');
            if (tocOffcanvas && window.innerWidth < 992) {
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(tocOffcanvas);
                if (bsOffcanvas) {
                    bsOffcanvas.hide();
                }
            }
        }
    }

    // ===================================================================
    // KEYBOARD SHORTCUTS - Navigation enhancements
    // ===================================================================

    class KeyboardShortcuts {
        constructor() {
            if (!config.enableKeyboardShortcuts) return;
            
            this.tocLinks = Array.from(getElements(config.tocLinkSelector));
            this.currentIndex = -1;
            this.init();
        }

        init() {
            document.addEventListener('keydown', e => this.handleKeydown(e));
        }

        handleKeydown(event) {
            // Ignore if user is typing in an input
            if (event.target.matches('input, textarea, select')) return;

            switch(event.key) {
                case '[':
                    event.preventDefault();
                    this.navigatePrevious();
                    break;
                case ']':
                    event.preventDefault();
                    this.navigateNext();
                    break;
                case '/':
                    event.preventDefault();
                    this.focusSearch();
                    break;
            }
        }

        navigatePrevious() {
            const activeLink = document.querySelector(`${config.tocLinkSelector}.active`);
            if (activeLink) {
                this.currentIndex = this.tocLinks.indexOf(activeLink);
            }

            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.tocLinks[this.currentIndex].click();
            }
        }

        navigateNext() {
            const activeLink = document.querySelector(`${config.tocLinkSelector}.active`);
            if (activeLink) {
                this.currentIndex = this.tocLinks.indexOf(activeLink);
            }

            if (this.currentIndex < this.tocLinks.length - 1) {
                this.currentIndex++;
                this.tocLinks[this.currentIndex].click();
            }
        }

        focusSearch() {
            // Future: focus sidebar search if implemented
            console.log('Sidebar.js: Search functionality not yet implemented');
        }
    }

    // ===================================================================
    // SWIPE GESTURES - Mobile offcanvas control
    // ===================================================================

    class SwipeGestures {
        constructor() {
            if (!config.enableSwipeGestures) return;
            
            this.startX = 0;
            this.startY = 0;
            this.distX = 0;
            this.distY = 0;
            this.init();
        }

        init() {
            document.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: true });
            document.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: true });
            document.addEventListener('touchend', e => this.handleTouchEnd(e));
        }

        handleTouchStart(event) {
            const touch = event.touches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
        }

        handleTouchMove(event) {
            if (!this.startX || !this.startY) return;

            const touch = event.touches[0];
            this.distX = touch.clientX - this.startX;
            this.distY = touch.clientY - this.startY;
        }

        handleTouchEnd(event) {
            if (Math.abs(this.distX) < config.swipeThreshold) {
                this.reset();
                return;
            }

            // Only handle horizontal swipes
            if (Math.abs(this.distX) > Math.abs(this.distY)) {
                if (this.distX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }

            this.reset();
        }

        handleSwipeRight() {
            // Open left sidebar
            const leftSidebar = document.getElementById('bdSidebar');
            if (leftSidebar && this.startX < 50) { // Only if started from left edge
                const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(leftSidebar);
                bsOffcanvas.show();
            }
        }

        handleSwipeLeft() {
            // Open right TOC sidebar
            const rightSidebar = document.getElementById('tocContents');
            const windowWidth = window.innerWidth;
            
            if (rightSidebar && this.startX > windowWidth - 50) { // Only if started from right edge
                const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(rightSidebar);
                bsOffcanvas.show();
            }
        }

        reset() {
            this.startX = 0;
            this.startY = 0;
            this.distX = 0;
            this.distY = 0;
        }
    }

    // ===================================================================
    // FOCUS MANAGEMENT - Accessibility enhancements
    // ===================================================================

    class FocusManager {
        constructor() {
            this.init();
        }

        init() {
            // Handle focus return when offcanvas closes
            const offcanvasElements = getElements('.offcanvas');
            
            offcanvasElements.forEach(offcanvas => {
                offcanvas.addEventListener('hidden.bs.offcanvas', () => {
                    this.returnFocus(offcanvas);
                });
            });
        }

        returnFocus(offcanvas) {
            // Find the trigger button that opened this offcanvas
            const triggerId = offcanvas.id;
            const trigger = document.querySelector(`[data-bs-target="#${triggerId}"]`);
            
            if (trigger) {
                trigger.focus();
            }
        }
    }

    // ===================================================================
    // INITIALIZATION
    // ===================================================================

    /**
     * Initialize all sidebar enhancements when DOM is ready
     */
    function init() {
        // Check if we're on a page that needs sidebar enhancements
        const toc = getElement(config.tocSelector);
        if (!toc) {
            console.log('Sidebar.js: No table of contents found, skipping initialization');
            return;
        }

        try {
            // Initialize all modules
            const scrollSpy = new ScrollSpy();
            const smoothScroll = new SmoothScroll();
            const keyboardShortcuts = new KeyboardShortcuts();
            const swipeGestures = new SwipeGestures();
            const focusManager = new FocusManager();

            console.log('Sidebar.js: Successfully initialized all modules');

            // Cleanup on page unload
            window.addEventListener('beforeunload', () => {
                if (scrollSpy && scrollSpy.destroy) {
                    scrollSpy.destroy();
                }
            });
        } catch (error) {
            console.error('Sidebar.js: Initialization error', error);
        }
    }

    // Wait for DOM and Bootstrap to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        if (typeof bootstrap !== 'undefined') {
            init();
        } else {
            // Wait for Bootstrap to load
            window.addEventListener('load', init);
        }
    }

})();
