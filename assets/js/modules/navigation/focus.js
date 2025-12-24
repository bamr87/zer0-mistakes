/**
 * ===================================================================
 * FOCUS MANAGER - Accessibility Enhancements
 * ===================================================================
 * 
 * File: focus.js
 * Path: assets/js/modules/navigation/focus.js
 * Purpose: Focus management for accessibility in navigation components
 * 
 * Features:
 * - Returns focus to trigger element when offcanvas closes
 * - Manages focus trap in modal/offcanvas contexts
 * - Provides focus ring styling hooks
 * 
 * Usage:
 *   import { FocusManager } from './focus.js';
 *   const focus = new FocusManager();
 * 
 * ===================================================================
 */

import { config } from './config.js';

/**
 * Get all elements safely
 * @param {string} selector - CSS selector
 * @returns {NodeList}
 */
function getElements(selector) {
    try {
        return document.querySelectorAll(selector);
    } catch (error) {
        return [];
    }
}

export class FocusManager {
    constructor() {
        this._boundHandleHidden = this._handleOffcanvasHidden.bind(this);
        this._init();
    }

    /**
     * Initialize focus management
     * @private
     */
    _init() {
        // Handle focus return when offcanvas closes
        const offcanvasElements = getElements(config.selectors.offcanvas);
        
        offcanvasElements.forEach(offcanvas => {
            offcanvas.addEventListener('hidden.bs.offcanvas', this._boundHandleHidden);
        });

        // Add focus-visible polyfill behavior
        this._setupFocusVisible();

        console.log(`FocusManager: Initialized with ${offcanvasElements.length} offcanvas elements`);
    }

    /**
     * Handle offcanvas hidden event - return focus to trigger
     * @private
     * @param {Event} event
     */
    _handleOffcanvasHidden(event) {
        const offcanvas = event.target;
        this.returnFocus(offcanvas);
    }

    /**
     * Return focus to the trigger element that opened an offcanvas
     * @param {Element} offcanvas - The offcanvas element
     */
    returnFocus(offcanvas) {
        const triggerId = offcanvas.id;
        
        // Find the trigger button that opened this offcanvas
        const trigger = document.querySelector(
            `[data-bs-target="#${triggerId}"], [href="#${triggerId}"]`
        );
        
        if (trigger) {
            // Small delay to ensure offcanvas animation completes
            requestAnimationFrame(() => {
                trigger.focus();
            });
        }
    }

    /**
     * Setup focus-visible behavior for keyboard users
     * @private
     */
    _setupFocusVisible() {
        // Add class to body when user is navigating with keyboard
        let hadKeyboardEvent = false;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                hadKeyboardEvent = true;
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', () => {
            hadKeyboardEvent = false;
            document.body.classList.remove('keyboard-nav');
        });
    }

    /**
     * Focus the first focusable element within a container
     * @param {Element} container
     */
    focusFirst(container) {
        const focusable = container.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
            focusable.focus();
        }
    }

    /**
     * Focus the last focusable element within a container
     * @param {Element} container
     */
    focusLast(container) {
        const focusables = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
            focusables[focusables.length - 1].focus();
        }
    }

    /**
     * Trap focus within a container (for modals/offcanvas)
     * @param {Element} container
     * @returns {Function} Cleanup function to remove trap
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const handleKeydown = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeydown);

        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleKeydown);
        };
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        const offcanvasElements = getElements(config.selectors.offcanvas);
        offcanvasElements.forEach(offcanvas => {
            offcanvas.removeEventListener('hidden.bs.offcanvas', this._boundHandleHidden);
        });
        console.log('FocusManager: Destroyed');
    }
}

export default FocusManager;
