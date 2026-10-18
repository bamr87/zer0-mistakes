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

import { config, syncBreakpointsFromCss } from './config.js';
import { ScrollSpy } from './scroll-spy.js';
import { SmoothScroll } from './smooth-scroll.js';
import { KeyboardShortcuts } from './keyboard.js';
import { SwipeGestures } from './gestures.js';
import { FocusManager } from './focus.js';
import { SidebarState } from './sidebar-state.js';
import { TocVisibility } from './toc-visibility.js';
import { SidebarVisibility } from './sidebar-visibility.js';
import { Navbar } from './navbar.js';

/** Marker in an init step list: give the main thread back before continuing. */
const YIELD = Symbol('yield');

/**
 * Yield to the main thread so pending input and rendering can run.
 * Uses scheduler.yield() where available (keeps our priority), otherwise a
 * macrotask via MessageChannel (no 4ms setTimeout clamp).
 * @returns {Promise<void>}
 */
function yieldToMain() {
    if (typeof window !== 'undefined' && window.scheduler && typeof window.scheduler.yield === 'function') {
        return window.scheduler.yield();
    }
    return new Promise(resolve => {
        if (typeof MessageChannel === 'function') {
            const channel = new MessageChannel();
            channel.port1.onmessage = () => resolve();
            channel.port2.postMessage(null);
        } else {
            setTimeout(resolve, 0);
        }
    });
}

/**
 * Run init steps in order, yielding at each YIELD marker. A step that throws
 * is logged and does not stop the steps after it.
 * @param {Array<Function|symbol>} steps
 * @returns {Promise<void>}
 */
async function runSteps(steps) {
    for (const step of steps) {
        if (step === YIELD) {
            await yieldToMain();
            continue;
        }
        try {
            step();
        } catch (error) {
            console.error('Navigation: Initialization error', error);
        }
    }
}

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
        this._initialized = true;

        // Start-up is split across tasks so it never becomes one long task.
        // Phase 1 (this task) wires the controls a user can reach right away:
        // sidebar state, keyboard shortcuts, focus management and the navbar.
        // None of them read layout. Each later step reads styles or layout
        // (breakpoints, TOC/sidebar visibility, scroll spy), so each one runs
        // in its own task after yielding to the main thread, letting the
        // browser paint and handle input in between. `navigation:ready` is
        // still dispatched once every module exists.
        const steps = [
            () => { this.modules.state = new SidebarState(); },
            () => { this.modules.keyboard = new KeyboardShortcuts(); },
            () => { this.modules.focus = new FocusManager(); },
            () => {
                // Initialize navbar (hover dropdowns, mobile menu, tooltips,
                // focus trap) — formerly the standalone assets/js/navigation.js IIFE.
                this.modules.navbar = new Navbar(config);
                this.modules.navbar.init();
            },
            YIELD,
            // Sync breakpoints from --zer0-bp-* CSS custom properties so a fork
            // overriding tokens in SCSS automatically propagates to JS checks.
            // getComputedStyle forces a full style recalc, so it runs after the
            // first yield, before the modules that use breakpoints.
            () => { syncBreakpointsFromCss(); },
            () => { this.modules.gestures = new SwipeGestures(); },
            YIELD,
            () => {
                const leftSidebar = document.querySelector(config.selectors.leftSidebar);
                const docsLayout = document.querySelector(config.selectors.docsLayout);
                if (leftSidebar && docsLayout && !docsLayout.classList.contains('bd-layout--no-sidebar')) {
                    this.modules.sidebarVisibility = new SidebarVisibility();
                }
            },
            YIELD,
            () => {
                // Initialize TOC-related modules only if TOC exists
                if (!document.querySelector(config.selectors.toc)) {
                    console.log('Navigation: No TOC found, skipping scroll spy and smooth scroll');
                    return;
                }
                this.modules.tocVisibility = new TocVisibility();
                this.modules.smoothScroll = new SmoothScroll();
            },
            YIELD,
            () => {
                if (!this.modules.tocVisibility) return;
                // ScrollSpy defers its own first measurement to idle time.
                this.modules.scrollSpy = new ScrollSpy();
            }
        ];

        runSteps(steps).then(() => {
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('navigation:ready', {
                detail: {
                    modules: Object.keys(this.modules)
                }
            }));

            console.log('Navigation: Successfully initialized modules:', Object.keys(this.modules));
        });

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
export { TocVisibility } from './toc-visibility.js';
export { SidebarVisibility } from './sidebar-visibility.js';

export default Navigation;
