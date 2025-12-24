/**
 * ===================================================================
 * SWIPE GESTURES - Mobile Offcanvas Control
 * ===================================================================
 * 
 * File: gestures.js
 * Path: assets/js/modules/navigation/gestures.js
 * Purpose: Touch gesture support for sidebar navigation on mobile
 * 
 * Features:
 * - Swipe from left edge to open left sidebar
 * - Swipe from right edge to open TOC sidebar
 * - Configurable threshold and edge zones
 * 
 * Usage:
 *   import { SwipeGestures } from './gestures.js';
 *   const gestures = new SwipeGestures();
 * 
 * ===================================================================
 */

import { config, isBelowBreakpoint } from './config.js';

export class SwipeGestures {
    constructor() {
        if (!config.gestures.enabled) {
            console.log('SwipeGestures: Disabled via config');
            return;
        }
        
        this.startX = 0;
        this.startY = 0;
        this.distX = 0;
        this.distY = 0;
        
        // Bound handlers for cleanup
        this._boundTouchStart = this._handleTouchStart.bind(this);
        this._boundTouchMove = this._handleTouchMove.bind(this);
        this._boundTouchEnd = this._handleTouchEnd.bind(this);
        
        this._init();
    }

    /**
     * Initialize touch event listeners
     * @private
     */
    _init() {
        document.addEventListener('touchstart', this._boundTouchStart, { passive: true });
        document.addEventListener('touchmove', this._boundTouchMove, { passive: true });
        document.addEventListener('touchend', this._boundTouchEnd);
        
        console.log('SwipeGestures: Initialized');
    }

    /**
     * Handle touch start
     * @private
     * @param {TouchEvent} event
     */
    _handleTouchStart(event) {
        const touch = event.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.distX = 0;
        this.distY = 0;
    }

    /**
     * Handle touch move
     * @private
     * @param {TouchEvent} event
     */
    _handleTouchMove(event) {
        if (!this.startX || !this.startY) return;

        const touch = event.touches[0];
        this.distX = touch.clientX - this.startX;
        this.distY = touch.clientY - this.startY;
    }

    /**
     * Handle touch end
     * @private
     * @param {TouchEvent} event
     */
    _handleTouchEnd(event) {
        const { threshold, edgeZone } = config.gestures;
        
        // Check if swipe distance meets threshold
        if (Math.abs(this.distX) < threshold) {
            this._reset();
            return;
        }

        // Only handle horizontal swipes (not vertical scroll)
        if (Math.abs(this.distX) > Math.abs(this.distY)) {
            if (this.distX > 0) {
                this._handleSwipeRight();
            } else {
                this._handleSwipeLeft();
            }
        }

        this._reset();
    }

    /**
     * Handle swipe right (open left sidebar)
     * @private
     */
    _handleSwipeRight() {
        const { edgeZone } = config.gestures;
        
        // Only if swipe started from left edge
        if (this.startX > edgeZone) return;
        
        // Only on mobile
        if (!isBelowBreakpoint('lg')) return;

        const leftSidebar = document.querySelector(config.selectors.leftSidebar);
        if (leftSidebar && typeof bootstrap !== 'undefined') {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(leftSidebar);
            bsOffcanvas.show();
            
            document.dispatchEvent(new CustomEvent('navigation:swipe', {
                detail: { direction: 'right', sidebar: 'left' }
            }));
        }
    }

    /**
     * Handle swipe left (open right/TOC sidebar)
     * @private
     */
    _handleSwipeLeft() {
        const { edgeZone } = config.gestures;
        const windowWidth = window.innerWidth;
        
        // Only if swipe started from right edge
        if (this.startX < windowWidth - edgeZone) return;
        
        // Only on mobile
        if (!isBelowBreakpoint('lg')) return;

        const rightSidebar = document.querySelector(config.selectors.rightSidebar);
        if (rightSidebar && typeof bootstrap !== 'undefined') {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(rightSidebar);
            bsOffcanvas.show();
            
            document.dispatchEvent(new CustomEvent('navigation:swipe', {
                detail: { direction: 'left', sidebar: 'toc' }
            }));
        }
    }

    /**
     * Reset touch tracking state
     * @private
     */
    _reset() {
        this.startX = 0;
        this.startY = 0;
        this.distX = 0;
        this.distY = 0;
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        document.removeEventListener('touchstart', this._boundTouchStart);
        document.removeEventListener('touchmove', this._boundTouchMove);
        document.removeEventListener('touchend', this._boundTouchEnd);
        console.log('SwipeGestures: Destroyed');
    }
}

export default SwipeGestures;
