/**
 * ===================================================================
 * SCROLL SPY - Intersection Observer Implementation
 * ===================================================================
 * 
 * File: scroll-spy.js
 * Path: assets/js/modules/navigation/scroll-spy.js
 * Purpose: Track visible sections and highlight corresponding TOC links
 * 
 * Features:
 * - Intersection Observer-based (better performance than scroll events)
 * - Active link highlighting with smooth transitions
 * - Auto-scroll TOC to keep active link visible
 * 
 * Usage:
 *   import { ScrollSpy } from './scroll-spy.js';
 *   const scrollSpy = new ScrollSpy();
 * 
 * ===================================================================
 */

import { config } from './config.js';

/**
 * Get element safely with error handling
 * @param {string} selector - CSS selector
 * @returns {Element|null}
 */
function getElement(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn(`ScrollSpy: Element not found - ${selector}`);
        return null;
    }
}

/**
 * Get all elements safely with error handling
 * @param {string} selector - CSS selector
 * @returns {NodeList}
 */
function getElements(selector) {
    try {
        return document.querySelectorAll(selector);
    } catch (error) {
        console.warn(`ScrollSpy: Elements not found - ${selector}`);
        return [];
    }
}

export class ScrollSpy {
    constructor() {
        this.tocLinks = getElements(config.selectors.tocLinks);
        this.headings = this._getHeadings();
        this.currentActive = null;
        this.observer = null;
        
        if (this.headings.length === 0 || this.tocLinks.length === 0) {
            console.log('ScrollSpy: No TOC or headings found, skipping initialization');
            return;
        }

        this._init();
    }

    /**
     * Get all headings that have corresponding TOC links
     * @private
     * @returns {Array<{element: Element, link: Element, id: string}>}
     */
    _getHeadings() {
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
     * @private
     */
    _init() {
        const observerOptions = {
            root: null,
            rootMargin: config.scrollSpy.rootMargin,
            threshold: config.scrollSpy.threshold
        };

        this.observer = new IntersectionObserver(
            entries => this._handleIntersection(entries),
            observerOptions
        );

        // Observe all headings
        this.headings.forEach(heading => {
            this.observer.observe(heading.element);
        });

        console.log(`ScrollSpy: Observing ${this.headings.length} headings`);
    }

    /**
     * Handle intersection events
     * @private
     * @param {IntersectionObserverEntry[]} entries
     */
    _handleIntersection(entries) {
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
            this._setActiveLink(mostVisible.link);
        }
    }

    /**
     * Set active link with visual feedback
     * @private
     * @param {Element} link
     */
    _setActiveLink(link) {
        if (this.currentActive === link) return;

        // Remove previous active state
        this.tocLinks.forEach(l => l.classList.remove('active'));

        // Add active state
        if (link) {
            link.classList.add('active');
            this.currentActive = link;

            // Scroll TOC to show active link (if needed)
            this._scrollTocToActiveLink(link);

            // Dispatch custom event for other modules
            document.dispatchEvent(new CustomEvent('navigation:sectionChange', {
                detail: { 
                    link: link,
                    href: link.getAttribute('href')
                }
            }));
        }
    }

    /**
     * Scroll TOC container to show active link
     * @private
     * @param {Element} link
     */
    _scrollTocToActiveLink(link) {
        const tocContainer = getElement(config.selectors.tocContainer);
        if (!tocContainer) return;

        const linkRect = link.getBoundingClientRect();
        const containerRect = tocContainer.getBoundingClientRect();

        // Check if link is out of view
        if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
            link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Manually set active section by ID
     * @param {string} id - Heading ID to activate
     */
    setActiveById(id) {
        const heading = this.headings.find(h => h.id === id);
        if (heading) {
            this._setActiveLink(heading.link);
        }
    }

    /**
     * Get current active heading
     * @returns {{element: Element, link: Element, id: string}|null}
     */
    getActive() {
        if (!this.currentActive) return null;
        return this.headings.find(h => h.link === this.currentActive) || null;
    }

    /**
     * Cleanup observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.tocLinks.forEach(l => l.classList.remove('active'));
        this.currentActive = null;
        console.log('ScrollSpy: Destroyed');
    }
}

export default ScrollSpy;
