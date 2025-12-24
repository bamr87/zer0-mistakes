/**
 * ===================================================================
 * KEYBOARD SHORTCUTS - Navigation Enhancements
 * ===================================================================
 * 
 * File: keyboard.js
 * Path: assets/js/modules/navigation/keyboard.js
 * Purpose: Keyboard shortcuts for navigation and accessibility
 * 
 * Default Shortcuts:
 * - [ : Navigate to previous section
 * - ] : Navigate to next section
 * - / : Focus search (when implemented)
 * - b : Toggle left sidebar
 * - t : Toggle TOC sidebar
 * 
 * Usage:
 *   import { KeyboardShortcuts } from './keyboard.js';
 *   const shortcuts = new KeyboardShortcuts();
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
        return [];
    }
}

export class KeyboardShortcuts {
    constructor() {
        if (!config.keyboard.enabled) {
            console.log('KeyboardShortcuts: Disabled via config');
            return;
        }
        
        this.tocLinks = Array.from(getElements(config.selectors.tocLinks));
        this.currentIndex = -1;
        this._boundHandler = this._handleKeydown.bind(this);
        
        this._init();
    }

    /**
     * Initialize keyboard event listeners
     * @private
     */
    _init() {
        document.addEventListener('keydown', this._boundHandler);
        console.log('KeyboardShortcuts: Initialized');
    }

    /**
     * Handle keydown events
     * @private
     * @param {KeyboardEvent} event
     */
    _handleKeydown(event) {
        // Ignore if user is typing in an input
        if (event.target.matches('input, textarea, select, [contenteditable="true"]')) {
            return;
        }

        const { keys } = config.keyboard;

        switch(event.key) {
            case keys.previousSection:
                event.preventDefault();
                this._navigatePrevious();
                break;
                
            case keys.nextSection:
                event.preventDefault();
                this._navigateNext();
                break;
                
            case keys.search:
                event.preventDefault();
                this._focusSearch();
                break;
                
            case keys.toggleSidebar:
                // Only handle if not typing
                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();
                    this._toggleSidebar();
                }
                break;
                
            case keys.toggleToc:
                // Only handle if not typing
                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();
                    this._toggleToc();
                }
                break;
        }
    }

    /**
     * Navigate to previous section
     * @private
     */
    _navigatePrevious() {
        this._updateCurrentIndex();

        if (this.currentIndex > 0) {
            this.currentIndex--;
            this._navigateToIndex(this.currentIndex);
        }
    }

    /**
     * Navigate to next section
     * @private
     */
    _navigateNext() {
        this._updateCurrentIndex();

        if (this.currentIndex < this.tocLinks.length - 1) {
            this.currentIndex++;
            this._navigateToIndex(this.currentIndex);
        }
    }

    /**
     * Update current index based on active link
     * @private
     */
    _updateCurrentIndex() {
        const activeLink = document.querySelector(`${config.selectors.tocLinks}.active`);
        if (activeLink) {
            this.currentIndex = this.tocLinks.indexOf(activeLink);
        }
    }

    /**
     * Navigate to a specific index
     * @private
     * @param {number} index
     */
    _navigateToIndex(index) {
        const link = this.tocLinks[index];
        if (link) {
            link.click();
            
            // Dispatch event for tracking
            document.dispatchEvent(new CustomEvent('navigation:keyboardNav', {
                detail: { 
                    direction: index > this.currentIndex ? 'next' : 'previous',
                    index: index
                }
            }));
        }
    }

    /**
     * Focus search input
     * @private
     */
    _focusSearch() {
        const searchInput = document.querySelector('#search-input, [data-search-input]');
        if (searchInput) {
            searchInput.focus();
        } else {
            console.log('KeyboardShortcuts: Search not yet implemented');
            // Dispatch event so other modules can handle
            document.dispatchEvent(new CustomEvent('navigation:searchRequest'));
        }
    }

    /**
     * Toggle left sidebar
     * @private
     */
    _toggleSidebar() {
        const sidebar = document.querySelector(config.selectors.leftSidebar);
        if (sidebar && typeof bootstrap !== 'undefined') {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(sidebar);
            bsOffcanvas.toggle();
            
            document.dispatchEvent(new CustomEvent('navigation:sidebarToggle', {
                detail: { sidebar: 'left' }
            }));
        }
    }

    /**
     * Toggle TOC sidebar
     * @private
     */
    _toggleToc() {
        const toc = document.querySelector(config.selectors.rightSidebar);
        if (toc && typeof bootstrap !== 'undefined') {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(toc);
            bsOffcanvas.toggle();
            
            document.dispatchEvent(new CustomEvent('navigation:sidebarToggle', {
                detail: { sidebar: 'toc' }
            }));
        }
    }

    /**
     * Get available shortcuts for help display
     * @returns {Object} Map of key to description
     */
    getShortcuts() {
        const { keys } = config.keyboard;
        return {
            [keys.previousSection]: 'Previous section',
            [keys.nextSection]: 'Next section',
            [keys.search]: 'Focus search',
            [keys.toggleSidebar]: 'Toggle sidebar',
            [keys.toggleToc]: 'Toggle table of contents'
        };
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        document.removeEventListener('keydown', this._boundHandler);
        console.log('KeyboardShortcuts: Destroyed');
    }
}

export default KeyboardShortcuts;
