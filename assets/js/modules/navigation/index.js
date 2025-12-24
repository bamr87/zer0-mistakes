/**
 * ===================================================================
 * NAVIGATION - Main Entry Point
 * ===================================================================
 * 
 * File: index.js
 * Path: assets/js/modules/navigation/index.js
 * Purpose: Main orchestrator for all navigation modules
 * 
 * This module imports and initializes all navigation-related modules:
 * - ScrollSpy: Highlights current section in TOC
 * - SmoothScroll: Smooth anchor navigation
 * - KeyboardShortcuts: Keyboard navigation
 * - SwipeGestures: Mobile gesture support
 * - FocusManager: Accessibility focus management
 * - SidebarState: Persistence of sidebar state
 * 
 * Usage:
 *   <script type="module" src="/assets/js/modules/navigation/index.js"></script>
 * 
 * Or import programmatically:
 *   import { Navigation } from './modules/navigation/index.js';
 *   const nav = new Navigation();
 * 
 * ===================================================================
 */

import { config } from './config.js';
import { ScrollSpy } from './scroll-spy.js';
import { SmoothScroll } from './smooth-scroll.js';
import { KeyboardShortcuts } from './keyboard.js';
import { SwipeGestures } from './gestures.js';
import { FocusManager } from './focus.js';
import { SidebarState } from './sidebar-state.js';

/**
 * Navigation Controller - Orchestrates all navigation modules
 */
export class Navigation {
    constructor() {
        this.modules = {};
        this._initialized = false;
    }

    /**
     * Initialize all navigation modules
     * @returns {Navigation} this instance for chaining
     */
    init() {
        if (this._initialized) {
            console.warn('Navigation: Already initialized');
            return this;
        }

        try {
            // Initialize sidebar state first (other modules may depend on it)
            this.modules.state = new SidebarState();
            
            // Initialize TOC-related modules only if TOC exists
            const toc = document.querySelector(config.selectors.toc);
            if (toc) {
                this.modules.scrollSpy = new ScrollSpy();
                this.modules.smoothScroll = new SmoothScroll();
            } else {
                console.log('Navigation: No TOC found, skipping scroll spy and smooth scroll');
            }
            
            // Initialize keyboard shortcuts
            this.modules.keyboard = new KeyboardShortcuts();
            
            // Initialize gesture support
            this.modules.gestures = new SwipeGestures();
            
            // Initialize focus management
            this.modules.focus = new FocusManager();

            this._initialized = true;
            
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('navigation:ready', {
                detail: { 
                    modules: Object.keys(this.modules)
                }
            }));

            console.log('Navigation: Successfully initialized modules:', Object.keys(this.modules));
            
        } catch (error) {
            console.error('Navigation: Initialization error', error);
        }

        return this;
    }

    /**
     * Get a specific module instance
     * @param {string} name - Module name
     * @returns {Object|undefined}
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * Get configuration
     * @returns {Object}
     */
    getConfig() {
        return config;
    }

    /**
     * Scroll to a specific element
     * @param {string|Element} target - Element ID or Element
     * @param {number} [offset] - Optional scroll offset
     */
    scrollTo(target, offset) {
        if (!this.modules.smoothScroll) return;
        
        if (typeof target === 'string') {
            this.modules.smoothScroll.scrollToId(target, offset);
        } else if (target instanceof Element) {
            this.modules.smoothScroll.scrollToElement(target, offset);
        }
    }

    /**
     * Expand sidebar tree to show a specific item
     * @param {string} targetId - ID of element to reveal
     */
    expandTo(targetId) {
        if (this.modules.state) {
            this.modules.state.expandPathTo(targetId);
        }
    }

    /**
     * Expand all sidebar tree nodes
     */
    expandAll() {
        if (this.modules.state) {
            this.modules.state.expandAll();
        }
    }

    /**
     * Collapse all sidebar tree nodes
     */
    collapseAll() {
        if (this.modules.state) {
            this.modules.state.collapseAll();
        }
    }

    /**
     * Get keyboard shortcuts for help display
     * @returns {Object|null}
     */
    getShortcuts() {
        if (this.modules.keyboard && this.modules.keyboard.getShortcuts) {
            return this.modules.keyboard.getShortcuts();
        }
        return null;
    }

    /**
     * Destroy all modules and cleanup
     */
    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules = {};
        this._initialized = false;
        
        document.dispatchEvent(new CustomEvent('navigation:destroyed'));
        console.log('Navigation: Destroyed all modules');
    }
}

// ===================================================================
// AUTO-INITIALIZATION
// ===================================================================

/**
 * Create and initialize navigation when DOM is ready
 */
function initNavigation() {
    // Create global instance
    window.zer0Navigation = new Navigation();
    
    // Check if Bootstrap is available
    if (typeof bootstrap === 'undefined') {
        console.warn('Navigation: Bootstrap not found, waiting for load event');
        window.addEventListener('load', () => {
            window.zer0Navigation.init();
        });
    } else {
        window.zer0Navigation.init();
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    // DOM already loaded
    initNavigation();
}

// ===================================================================
// EXPORTS
// ===================================================================

// Export individual modules for advanced usage
export { config } from './config.js';
export { ScrollSpy } from './scroll-spy.js';
export { SmoothScroll } from './smooth-scroll.js';
export { KeyboardShortcuts } from './keyboard.js';
export { SwipeGestures } from './gestures.js';
export { FocusManager } from './focus.js';
export { SidebarState } from './sidebar-state.js';

export default Navigation;
