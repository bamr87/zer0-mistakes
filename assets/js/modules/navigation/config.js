/**
 * ===================================================================
 * NAVIGATION CONFIG - Shared Configuration for Navigation Modules
 * ===================================================================
 * 
 * File: config.js
 * Path: assets/js/modules/navigation/config.js
 * Purpose: Centralized configuration for all navigation modules
 * 
 * Usage:
 *   import { config } from './config.js';
 *   const toc = document.querySelector(config.selectors.toc);
 * 
 * ===================================================================
 */

export const config = {
    // ===================================================================
    // DOM SELECTORS
    // ===================================================================
    selectors: {
        // Table of Contents
        toc: '#TableOfContents',
        tocLinks: '#TableOfContents a',
        tocContainer: '.bd-toc .offcanvas-body',
        
        // Sidebars
        leftSidebar: '#bdSidebar',
        rightSidebar: '#tocContents',
        
        // Content areas
        mainContent: '.bd-content',
        
        // Navigation elements
        navTree: '.nav-tree',
        navTreeToggle: '[data-nav-toggle]',
        
        // Offcanvas
        offcanvas: '.offcanvas'
    },

    // ===================================================================
    // SCROLL SPY SETTINGS
    // ===================================================================
    scrollSpy: {
        // Root margin for Intersection Observer
        // Negative values account for fixed headers
        rootMargin: '-80px 0px -80px 0px',
        
        // Intersection threshold levels
        threshold: [0, 0.25, 0.5, 0.75, 1]
    },

    // ===================================================================
    // SMOOTH SCROLL SETTINGS
    // ===================================================================
    smoothScroll: {
        // Offset for fixed headers when scrolling to anchor
        offset: 80,
        
        // Scroll behavior
        behavior: 'smooth'
    },

    // ===================================================================
    // KEYBOARD SHORTCUTS
    // ===================================================================
    keyboard: {
        // Enable/disable keyboard shortcuts
        enabled: true,
        
        // Key mappings
        keys: {
            previousSection: '[',
            nextSection: ']',
            search: '/',
            toggleSidebar: 'b',
            toggleToc: 't'
        }
    },

    // ===================================================================
    // SWIPE GESTURES
    // ===================================================================
    gestures: {
        // Enable/disable swipe gestures
        enabled: true,
        
        // Minimum distance (px) for swipe to register
        threshold: 50,
        
        // Edge detection zone (px) for sidebar swipes
        edgeZone: 50
    },

    // ===================================================================
    // SIDEBAR STATE PERSISTENCE
    // ===================================================================
    state: {
        // localStorage key prefix
        storagePrefix: 'zer0-nav-',
        
        // Keys for different state values
        keys: {
            expandedNodes: 'expanded-nodes',
            sidebarOpen: 'sidebar-open',
            tocOpen: 'toc-open'
        }
    },

    // ===================================================================
    // DEBOUNCE/THROTTLE TIMINGS
    // ===================================================================
    timing: {
        debounceDelay: 100,
        scrollDebounce: 50
    },

    // ===================================================================
    // BREAKPOINTS (match Bootstrap 5)
    // ===================================================================
    breakpoints: {
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1400
    }
};

/**
 * Check if viewport is below a breakpoint
 * @param {string} breakpoint - Breakpoint name (sm, md, lg, xl, xxl)
 * @returns {boolean}
 */
export function isBelowBreakpoint(breakpoint) {
    return window.innerWidth < config.breakpoints[breakpoint];
}

/**
 * Check if viewport is at or above a breakpoint
 * @param {string} breakpoint - Breakpoint name (sm, md, lg, xl, xxl)
 * @returns {boolean}
 */
export function isAtOrAboveBreakpoint(breakpoint) {
    return window.innerWidth >= config.breakpoints[breakpoint];
}

export default config;
