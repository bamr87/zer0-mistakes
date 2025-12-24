/**
 * ===================================================================
 * SMOOTH SCROLL - Enhanced Anchor Navigation
 * ===================================================================
 * 
 * File: smooth-scroll.js
 * Path: assets/js/modules/navigation/smooth-scroll.js
 * Purpose: Smooth scrolling to anchor links with header offset
 * 
 * Features:
 * - Smooth scroll with configurable offset for fixed headers
 * - URL hash update without page jump
 * - Closes mobile offcanvas after navigation
 * - Accessibility-focused with proper focus management
 * 
 * Usage:
 *   import { SmoothScroll } from './smooth-scroll.js';
 *   const smoothScroll = new SmoothScroll();
 * 
 * ===================================================================
 */

import { config, isBelowBreakpoint } from './config.js';

/**
 * Get all elements safely
 * @param {string} selector - CSS selector
 * @returns {NodeList}
 */
function getElements(selector) {
    try {
        return document.querySelectorAll(selector);
    } catch (error) {
        console.warn(`SmoothScroll: Elements not found - ${selector}`);
        return [];
    }
}

export class SmoothScroll {
    constructor() {
        this.tocLinks = getElements(config.selectors.tocLinks);
        this._init();
    }

    /**
     * Initialize click handlers
     * @private
     */
    _init() {
        this.tocLinks.forEach(link => {
            link.addEventListener('click', e => this._handleClick(e));
        });
        console.log(`SmoothScroll: Initialized with ${this.tocLinks.length} links`);
    }

    /**
     * Handle click on TOC link
     * @private
     * @param {Event} event
     */
    _handleClick(event) {
        const href = event.currentTarget.getAttribute('href');
        
        if (!href || !href.startsWith('#')) return;

        event.preventDefault();
        
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (!targetElement) {
            console.warn(`SmoothScroll: Target element #${targetId} not found`);
            return;
        }

        // Scroll to target
        this.scrollToElement(targetElement);

        // Update URL without jumping
        if (history.pushState) {
            history.pushState(null, null, href);
        }

        // Close mobile offcanvas if open
        this._closeMobileOffcanvas();

        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('navigation:scroll', {
            detail: { 
                targetId: targetId,
                targetElement: targetElement
            }
        }));
    }

    /**
     * Scroll to an element with offset
     * @param {Element} element - Target element
     * @param {number} [offset] - Optional custom offset
     */
    scrollToElement(element, offset = config.smoothScroll.offset) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: config.smoothScroll.behavior
        });

        // Update focus for accessibility
        element.setAttribute('tabindex', '-1');
        element.focus({ preventScroll: true });
    }

    /**
     * Scroll to element by ID
     * @param {string} id - Element ID (without #)
     * @param {number} [offset] - Optional custom offset
     */
    scrollToId(id, offset) {
        const element = document.getElementById(id);
        if (element) {
            this.scrollToElement(element, offset);
        }
    }

    /**
     * Close mobile offcanvas if viewport is below lg breakpoint
     * @private
     */
    _closeMobileOffcanvas() {
        if (!isBelowBreakpoint('lg')) return;

        const tocOffcanvas = document.getElementById('tocContents');
        if (tocOffcanvas && typeof bootstrap !== 'undefined') {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(tocOffcanvas);
            if (bsOffcanvas) {
                bsOffcanvas.hide();
            }
        }
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        // Note: We'd need to store bound handlers to properly remove them
        // For now, this is a no-op since the page will reload anyway
        console.log('SmoothScroll: Destroyed');
    }
}

export default SmoothScroll;
