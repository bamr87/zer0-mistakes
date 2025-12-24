/**
 * ===================================================================
 * SIDEBAR STATE - Persistence and State Management
 * ===================================================================
 * 
 * File: sidebar-state.js
 * Path: assets/js/modules/navigation/sidebar-state.js
 * Purpose: Manage and persist navigation state across page loads
 * 
 * Features:
 * - Persist expanded/collapsed state of tree nodes in localStorage
 * - Emit custom events for state changes
 * - Restore state on page load
 * - Track sidebar open/close state
 * 
 * Usage:
 *   import { SidebarState } from './sidebar-state.js';
 *   const state = new SidebarState();
 *   state.setExpanded('docs-section', true);
 * 
 * ===================================================================
 */

import { config } from './config.js';

export class SidebarState {
    constructor() {
        this._storagePrefix = config.state.storagePrefix;
        this._expandedNodes = new Set();
        
        this._init();
    }

    /**
     * Initialize state management
     * @private
     */
    _init() {
        // Load persisted state
        this._loadState();
        
        // Listen for collapse events from Bootstrap
        this._setupCollapseListeners();
        
        // Restore expanded states on page load
        this._restoreExpandedStates();

        console.log('SidebarState: Initialized');
    }

    /**
     * Load state from localStorage
     * @private
     */
    _loadState() {
        try {
            const key = this._storagePrefix + config.state.keys.expandedNodes;
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                this._expandedNodes = new Set(parsed);
            }
        } catch (error) {
            console.warn('SidebarState: Could not load state from localStorage', error);
        }
    }

    /**
     * Save state to localStorage
     * @private
     */
    _saveState() {
        try {
            const key = this._storagePrefix + config.state.keys.expandedNodes;
            const value = JSON.stringify([...this._expandedNodes]);
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('SidebarState: Could not save state to localStorage', error);
        }
    }

    /**
     * Setup listeners for Bootstrap collapse events
     * @private
     */
    _setupCollapseListeners() {
        // Listen for collapse show events
        document.addEventListener('show.bs.collapse', (event) => {
            const nodeId = event.target.id;
            if (nodeId && this._isNavNode(event.target)) {
                this.setExpanded(nodeId, true);
            }
        });

        // Listen for collapse hide events
        document.addEventListener('hide.bs.collapse', (event) => {
            const nodeId = event.target.id;
            if (nodeId && this._isNavNode(event.target)) {
                this.setExpanded(nodeId, false);
            }
        });
    }

    /**
     * Check if element is a navigation node
     * @private
     * @param {Element} element
     * @returns {boolean}
     */
    _isNavNode(element) {
        // Check if element is within sidebar or has nav-related classes
        return element.closest('.bd-sidebar, .nav-tree, [data-nav-tree]') !== null;
    }

    /**
     * Restore expanded states from persisted data
     * @private
     */
    _restoreExpandedStates() {
        // Wait for DOM to be ready
        requestAnimationFrame(() => {
            this._expandedNodes.forEach(nodeId => {
                const element = document.getElementById(nodeId);
                if (element && typeof bootstrap !== 'undefined') {
                    // Show the collapse without animation
                    element.classList.add('show');
                    
                    // Update the toggle button state
                    const toggle = document.querySelector(`[data-bs-target="#${nodeId}"]`);
                    if (toggle) {
                        toggle.classList.remove('collapsed');
                        toggle.setAttribute('aria-expanded', 'true');
                    }
                }
            });
        });
    }

    /**
     * Set expanded state for a node
     * @param {string} nodeId - The ID of the collapse element
     * @param {boolean} expanded - Whether the node should be expanded
     */
    setExpanded(nodeId, expanded) {
        if (expanded) {
            this._expandedNodes.add(nodeId);
        } else {
            this._expandedNodes.delete(nodeId);
        }
        
        this._saveState();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('navigation:toggle', {
            detail: { 
                nodeId: nodeId,
                expanded: expanded
            }
        }));
    }

    /**
     * Check if a node is expanded
     * @param {string} nodeId
     * @returns {boolean}
     */
    isExpanded(nodeId) {
        return this._expandedNodes.has(nodeId);
    }

    /**
     * Expand all nodes
     */
    expandAll() {
        const collapses = document.querySelectorAll('.bd-sidebar .collapse, .nav-tree .collapse');
        collapses.forEach(collapse => {
            if (collapse.id) {
                this._expandedNodes.add(collapse.id);
                if (typeof bootstrap !== 'undefined') {
                    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse, { toggle: false });
                    bsCollapse.show();
                }
            }
        });
        this._saveState();
        
        document.dispatchEvent(new CustomEvent('navigation:expandAll'));
    }

    /**
     * Collapse all nodes
     */
    collapseAll() {
        const collapses = document.querySelectorAll('.bd-sidebar .collapse.show, .nav-tree .collapse.show');
        collapses.forEach(collapse => {
            if (collapse.id) {
                this._expandedNodes.delete(collapse.id);
                if (typeof bootstrap !== 'undefined') {
                    const bsCollapse = bootstrap.Collapse.getInstance(collapse);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    }
                }
            }
        });
        this._saveState();
        
        document.dispatchEvent(new CustomEvent('navigation:collapseAll'));
    }

    /**
     * Expand path to a specific element (expand all parents)
     * @param {string} targetId - The ID of the target element to reveal
     */
    expandPathTo(targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;

        // Find all parent collapses
        let parent = target.closest('.collapse');
        while (parent) {
            if (parent.id) {
                this.setExpanded(parent.id, true);
                if (typeof bootstrap !== 'undefined') {
                    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(parent, { toggle: false });
                    bsCollapse.show();
                }
            }
            parent = parent.parentElement?.closest('.collapse');
        }
    }

    /**
     * Get all expanded node IDs
     * @returns {string[]}
     */
    getExpandedNodes() {
        return [...this._expandedNodes];
    }

    /**
     * Clear all persisted state
     */
    clearState() {
        this._expandedNodes.clear();
        
        try {
            Object.values(config.state.keys).forEach(key => {
                localStorage.removeItem(this._storagePrefix + key);
            });
        } catch (error) {
            console.warn('SidebarState: Could not clear localStorage', error);
        }
        
        document.dispatchEvent(new CustomEvent('navigation:stateCleared'));
    }

    /**
     * Cleanup
     */
    destroy() {
        // State is persisted, nothing to clean up
        console.log('SidebarState: Destroyed');
    }
}

export default SidebarState;
