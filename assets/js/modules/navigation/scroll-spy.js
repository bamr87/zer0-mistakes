// Feature: ZER0-008
/**
 * ===================================================================
 * SCROLL SPY - Reading-position TOC highlighting
 * ===================================================================
 *
 * File: scroll-spy.js
 * Path: assets/js/modules/navigation/scroll-spy.js
 * Purpose: Track the section being read and bold its TOC link
 *
 * How the active heading is chosen:
 *   The active heading is the LAST heading whose top has crossed the
 *   "reading line" - a horizontal line `offset` pixels below the top of the
 *   viewport, matching the `scroll-padding-top` that anchor navigation uses.
 *   Once the page is scrolled to the bottom, the last heading wins (trailing
 *   sections can be shorter than the viewport and would never reach the
 *   line). The answer is recomputed from scratch on every scroll frame, so
 *   the highlight cannot drift out of sync with the page.
 *
 *   The previous implementation asked IntersectionObserver for the "most
 *   visible" heading. Headings are only a few pixels tall, so every heading
 *   inside the observer band reported the same intersectionRatio and the
 *   winner was whichever entry happened to be in that callback's batch -
 *   headings leaving the band never triggered a re-evaluation at all. That
 *   is what made the bolding jump around and stick on the wrong entry.
 *
 * Features:
 * - Deterministic, position-based active section (no ratio guessing)
 * - rAF-throttled passive scroll listener; heading offsets are cached and
 *   re-measured on resize / content reflow
 * - Holds the clicked link active while a smooth scroll animates, so
 *   intermediate headings don't flash
 * - Keeps the active link visible inside the TOC without ever scrolling
 *   the page itself
 *
 * Usage:
 *   import { ScrollSpy } from './scroll-spy.js';
 *   const scrollSpy = new ScrollSpy();
 *
 * ===================================================================
 */

import { config } from './config.js';

const ACTIVE_CLASS = 'active';

/** How long (ms) to keep a clicked TOC link active while the page animates. */
const CLICK_GUARD_MS = 1200;

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

/**
 * Current vertical scroll position, normalized across browsers.
 * @returns {number}
 */
function scrollTop() {
    return window.scrollY !== undefined ? window.scrollY : window.pageYOffset;
}

export class ScrollSpy {
    constructor() {
        this.tocLinks = getElements(config.selectors.tocLinks);
        this.headings = this._getHeadings();
        this.currentActive = null;

        // Cached measurements - invalidated (not recomputed) by resize and
        // content reflow, then refreshed inside the next animation frame.
        this._offsetPx = 0;
        this._needsMeasure = true;
        this._frame = null;

        // Click guard: id of the heading a TOC click is scrolling towards.
        this._pendingId = null;
        this._pendingExpires = 0;

        this._resizeObserver = null;

        if (this.headings.length === 0 || this.tocLinks.length === 0) {
            console.log('ScrollSpy: No TOC or headings found, skipping initialization');
            return;
        }

        this._onScroll = () => this._requestUpdate();
        this._onReflow = () => this._invalidate();
        this._onNavigationScroll = event => this._handleNavigationScroll(event);
        this._onUserScroll = () => this._cancelClickGuard();

        this._init();
    }

    /**
     * Get all headings that have corresponding TOC links, in document order.
     * Duplicate links to the same heading keep the first link.
     * @private
     * @returns {Array<{element: Element, link: Element, id: string, top: number}>}
     */
    _getHeadings() {
        const headings = [];
        const seen = new Set();

        this.tocLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#') || href.length < 2) return;

            const id = decodeURIComponent(href.substring(1));
            if (seen.has(id)) return;

            const heading = document.getElementById(id);
            if (!heading) return;

            seen.add(id);
            headings.push({ element: heading, link: link, id: id, top: 0 });
        });

        return headings;
    }

    /**
     * Attach listeners and paint the initial active link.
     * @private
     */
    _init() {
        window.addEventListener('scroll', this._onScroll, { passive: true });
        window.addEventListener('resize', this._onReflow);
        window.addEventListener('load', this._onReflow);
        window.addEventListener('hashchange', this._onScroll);

        // A TOC click starts an animated scroll; hold that link active until
        // the page lands (see _handleNavigationScroll)...
        document.addEventListener('navigation:scroll', this._onNavigationScroll);

        // ...but a reader who grabs the wheel mid-animation has taken over —
        // drop the hold and follow them immediately.
        window.addEventListener('wheel', this._onUserScroll, { passive: true });
        window.addEventListener('touchstart', this._onUserScroll, { passive: true });

        // Images, embeds, mermaid diagrams and collapsibles change heading
        // offsets after load - re-measure when the content box resizes.
        if (typeof ResizeObserver !== 'undefined') {
            const content = getElement(config.selectors.mainContent) || document.body;
            this._resizeObserver = new ResizeObserver(this._onReflow);
            this._resizeObserver.observe(content);
        }

        this._update();

        console.log(`ScrollSpy: Tracking ${this.headings.length} headings`);
    }

    /**
     * Mark cached offsets stale and schedule a recompute.
     * @private
     */
    _invalidate() {
        this._needsMeasure = true;
        this._requestUpdate();
    }

    /**
     * Coalesce updates into one per animation frame.
     * @private
     */
    _requestUpdate() {
        if (this._frame !== null) return;
        this._frame = requestAnimationFrame(() => this._update());
    }

    /**
     * Distance (px) from the top of the viewport to the reading line.
     * Derived from the document's `scroll-padding-top` so the highlight lines
     * up with where anchor navigation parks a heading; `config.scrollSpy.offset`
     * pins it explicitly when a fork needs to.
     * @private
     * @returns {number}
     */
    _readingOffset() {
        const configured = config.scrollSpy.offset;
        if (typeof configured === 'number' && Number.isFinite(configured)) {
            return configured;
        }

        const padding = parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop
        );
        if (Number.isFinite(padding)) return padding;

        return config.smoothScroll.offset;
    }

    /**
     * Cache each heading's document offset and sort into document order.
     * @private
     */
    _measure() {
        const offset = scrollTop();

        this.headings.forEach(heading => {
            heading.top = heading.element.getBoundingClientRect().top + offset;
        });
        this.headings.sort((a, b) => a.top - b.top);

        this._offsetPx = this._readingOffset();
        this._needsMeasure = false;
    }

    /**
     * True when the page cannot scroll any further down.
     * @private
     * @returns {boolean}
     */
    _atBottom() {
        const doc = document.documentElement;
        const tolerance = config.scrollSpy.tolerance;
        return window.innerHeight + scrollTop() >= doc.scrollHeight - tolerance;
    }

    /**
     * Resolve which heading the reader is currently in.
     * @private
     * @returns {{element: Element, link: Element, id: string, top: number}|null}
     */
    _resolveActive() {
        if (this.headings.length === 0) return null;

        // Trailing sections shorter than the viewport can never reach the
        // reading line, so the bottom of the page belongs to the last heading.
        if (this._atBottom()) return this.headings[this.headings.length - 1];

        const line = scrollTop() + this._offsetPx + config.scrollSpy.tolerance;

        let active = null;
        for (let i = 0; i < this.headings.length; i++) {
            if (this.headings[i].top > line) break;
            active = this.headings[i];
        }

        // Above the first heading, the first section is the one being read.
        return active || this.headings[0];
    }

    /**
     * Recompute and apply the active link. Runs at most once per frame.
     * @private
     */
    _update() {
        this._frame = null;

        if (this._needsMeasure) this._measure();

        const active = this._resolveActive();
        if (!active) return;

        if (this._pendingId !== null) {
            const arrived = active.id === this._pendingId;
            const expired = performance.now() > this._pendingExpires;
            if (!arrived && !expired) return;
            this._pendingId = null;
        }

        this._setActiveLink(active.link);
    }

    /**
     * Light the clicked link immediately and hold it until the animated
     * scroll lands on it, so headings passed on the way don't flash.
     * @private
     * @param {CustomEvent} event
     */
    _handleNavigationScroll(event) {
        const targetId = event && event.detail ? event.detail.targetId : null;
        if (!targetId) return;

        const heading = this.headings.find(h => h.id === targetId);
        if (!heading) return;

        this._pendingId = targetId;
        this._pendingExpires = performance.now() + CLICK_GUARD_MS;
        this._setActiveLink(heading.link);
    }

    /**
     * Release the click guard so the positional rule takes over again.
     * @private
     */
    _cancelClickGuard() {
        if (this._pendingId === null) return;
        this._pendingId = null;
        this._requestUpdate();
    }

    /**
     * Set active link with visual feedback
     * @private
     * @param {Element} link
     */
    _setActiveLink(link) {
        if (!link) return;
        // Re-apply if something else stripped the class, so the highlight
        // heals itself rather than silently disappearing.
        if (this.currentActive === link && link.classList.contains(ACTIVE_CLASS)) return;

        // Remove previous active state
        this.tocLinks.forEach(l => {
            if (l === link) return;
            l.classList.remove(ACTIVE_CLASS);
            l.removeAttribute('aria-current');
        });

        // Add active state
        link.classList.add(ACTIVE_CLASS);
        link.setAttribute('aria-current', 'true');
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

    /**
     * Nearest scrollable ancestor of the TOC link, if any.
     * `.bd-toc` scrolls on desktop and `.offcanvas-body` on mobile, so the
     * container is resolved at call time rather than assumed.
     * @private
     * @param {Element} link
     * @returns {Element|null}
     */
    _getTocScrollContainer(link) {
        const hinted = getElement(config.selectors.tocContainer);
        const scrolls = el =>
            el.scrollHeight > el.clientHeight + 1 &&
            /(auto|scroll)/.test(getComputedStyle(el).overflowY);

        if (hinted && hinted.contains(link) && scrolls(hinted)) return hinted;

        let node = link.parentElement;
        while (node && node !== document.body) {
            if (scrolls(node)) return node;
            node = node.parentElement;
        }
        return null;
    }

    /**
     * Keep the active link visible inside the TOC's own scroll container.
     * Adjusts `scrollTop` directly - `scrollIntoView()` would bubble up and
     * scroll the page, which feeds straight back into the spy.
     * @private
     * @param {Element} link
     */
    _scrollTocToActiveLink(link) {
        const container = this._getTocScrollContainer(link);
        if (!container) return;

        const linkRect = link.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const margin = 8;

        if (linkRect.top < containerRect.top + margin) {
            container.scrollTop -= (containerRect.top + margin) - linkRect.top;
        } else if (linkRect.bottom > containerRect.bottom - margin) {
            container.scrollTop += linkRect.bottom - (containerRect.bottom - margin);
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
     * Cleanup listeners and observers
     */
    destroy() {
        if (this._onScroll) {
            window.removeEventListener('scroll', this._onScroll);
            window.removeEventListener('hashchange', this._onScroll);
        }
        if (this._onReflow) {
            window.removeEventListener('resize', this._onReflow);
            window.removeEventListener('load', this._onReflow);
        }
        if (this._onNavigationScroll) {
            document.removeEventListener('navigation:scroll', this._onNavigationScroll);
        }
        if (this._onUserScroll) {
            window.removeEventListener('wheel', this._onUserScroll);
            window.removeEventListener('touchstart', this._onUserScroll);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._frame !== null) {
            cancelAnimationFrame(this._frame);
            this._frame = null;
        }

        this.tocLinks.forEach(l => {
            l.classList.remove(ACTIVE_CLASS);
            l.removeAttribute('aria-current');
        });
        this.currentActive = null;
        console.log('ScrollSpy: Destroyed');
    }
}

export default ScrollSpy;
