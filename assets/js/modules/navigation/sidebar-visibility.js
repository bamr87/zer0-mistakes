/**
 * ===================================================================
 * SIDEBAR VISIBILITY - Hide/show left docs sidebar with persistence
 * ===================================================================
 *
 * File: sidebar-visibility.js
 * Path: assets/js/modules/navigation/sidebar-visibility.js
 * Purpose: Collapse the left sidebar column on desktop and persist preference
 *
 * ===================================================================
 */

import { config, isBelowBreakpoint } from './config.js';

export class SidebarVisibility {
    constructor() {
        this._storageKey = config.state.storagePrefix + config.state.keys.sidebarVisible;
        this._layout = document.querySelector(config.selectors.docsLayout);
        this._sidebarWrapper = document.querySelector(config.selectors.sidebarWrapper);
        this._sidebarOffcanvas = document.querySelector(config.selectors.leftSidebar);
        this._fab = document.querySelector(config.selectors.sidebarFab);
        this._hideToggles = Array.from(document.querySelectorAll(config.selectors.sidebarVisibilityToggle));
        this._fabToggle = document.querySelector(`${config.selectors.sidebarFab} .bd-sidebar-toggle`);

        if (!this._sidebarOffcanvas || !this._layout || this._layout.classList.contains('bd-layout--no-sidebar')) {
            return;
        }

        this._visible = this._loadPreference();
        this._applyState({ focus: false });
        this._bindEvents();

        console.log('SidebarVisibility: Initialized', { visible: this._visible });
    }

    /**
     * @private
     * @returns {boolean}
     */
    _loadPreference() {
        try {
            return localStorage.getItem(this._storageKey) !== 'false';
        } catch (error) {
            console.warn('SidebarVisibility: Could not read localStorage', error);
            return true;
        }
    }

    /**
     * @private
     * @param {boolean} visible
     */
    _savePreference(visible) {
        try {
            localStorage.setItem(this._storageKey, visible ? 'true' : 'false');
        } catch (error) {
            console.warn('SidebarVisibility: Could not write localStorage', error);
        }
    }

    /**
     * @private
     */
    _bindEvents() {
        this._hideToggles.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                this.toggle();
            });
        });

        if (this._fabToggle) {
            this._fabToggle.addEventListener('click', (event) => {
                event.preventDefault();

                if (!this._visible) {
                    this.setVisible(true, { focusTarget: this._hideToggles[0] });

                    if (isBelowBreakpoint('lg') && typeof bootstrap !== 'undefined') {
                        bootstrap.Offcanvas.getOrCreateInstance(this._sidebarOffcanvas).show();
                    }
                    return;
                }

                if (isBelowBreakpoint('lg') && typeof bootstrap !== 'undefined') {
                    bootstrap.Offcanvas.getOrCreateInstance(this._sidebarOffcanvas).toggle();
                }
            });
        }
    }

    /**
     * @private
     * @param {{ focus?: boolean, focusTarget?: Element|null }} [options]
     */
    _applyState(options = {}) {
        const { focus = false, focusTarget = null } = options;

        this._layout?.classList.toggle('bd-layout--sidebar-collapsed', !this._visible);
        this._sidebarWrapper?.classList.toggle('bd-sidebar--hidden', !this._visible);
        this._fab?.classList.toggle('bd-sidebar-fab--restore', !this._visible);
        document.documentElement.classList.toggle('bd-sidebar-pref-hidden', !this._visible);

        this._hideToggles.forEach((button) => {
            button.setAttribute('aria-expanded', String(this._visible));
            button.setAttribute(
                'aria-label',
                this._visible ? 'Hide documentation sidebar' : 'Show documentation sidebar'
            );
            const title = button.getAttribute('title');
            if (title !== null) {
                button.setAttribute(
                    'title',
                    this._visible ? 'Hide documentation sidebar' : 'Show documentation sidebar'
                );
            }
        });

        if (this._fabToggle) {
            this._fabToggle.setAttribute('aria-expanded', String(this._visible));
            this._fabToggle.setAttribute(
                'aria-label',
                this._visible ? 'Open documentation sidebar' : 'Show documentation sidebar'
            );
        }

        if (!this._visible && isBelowBreakpoint('lg') && typeof bootstrap !== 'undefined') {
            bootstrap.Offcanvas.getInstance(this._sidebarOffcanvas)?.hide();
        }

        if (focus && focusTarget instanceof Element) {
            requestAnimationFrame(() => focusTarget.focus());
        }
    }

    /**
     * @returns {boolean}
     */
    isVisible() {
        return this._visible;
    }

    /**
     * @param {boolean} visible
     * @param {{ focusTarget?: Element|null }} [options]
     */
    setVisible(visible, options = {}) {
        this._visible = visible;
        this._savePreference(visible);
        this._applyState({ focus: Boolean(options.focusTarget), focusTarget: options.focusTarget ?? null });

        document.dispatchEvent(new CustomEvent('navigation:sidebarVisibility', {
            detail: { visible }
        }));
    }

    /**
     * Toggle sidebar visibility (desktop) or offcanvas (mobile when visible)
     */
    toggle() {
        if (isBelowBreakpoint('lg')) {
            if (!this._visible) {
                this.setVisible(true, { focusTarget: this._fabToggle });
                if (typeof bootstrap !== 'undefined') {
                    bootstrap.Offcanvas.getOrCreateInstance(this._sidebarOffcanvas).show();
                }
                return;
            }

            if (typeof bootstrap !== 'undefined') {
                bootstrap.Offcanvas.getOrCreateInstance(this._sidebarOffcanvas).toggle();
            }
            return;
        }

        this.setVisible(!this._visible, {
            focusTarget: this._visible ? this._fabToggle : this._hideToggles[0]
        });
    }

    destroy() {
        console.log('SidebarVisibility: Destroyed');
    }
}

export default SidebarVisibility;
