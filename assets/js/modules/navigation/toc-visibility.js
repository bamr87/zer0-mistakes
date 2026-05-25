/**
 * ===================================================================
 * TOC VISIBILITY - Hide/show table of contents with persistence
 * ===================================================================
 *
 * File: toc-visibility.js
 * Path: assets/js/modules/navigation/toc-visibility.js
 * Purpose: Collapse the right TOC column on desktop and persist preference
 *
 * ===================================================================
 */

import { config, isBelowBreakpoint } from './config.js';

export class TocVisibility {
    constructor() {
        this._storageKey = config.state.storagePrefix + config.state.keys.tocVisible;
        this._main = document.querySelector(config.selectors.mainArea);
        this._tocWrapper = document.querySelector(config.selectors.tocWrapper);
        this._tocOffcanvas = document.querySelector(config.selectors.rightSidebar);
        this._fab = document.querySelector(config.selectors.tocFab);
        this._hideToggles = Array.from(document.querySelectorAll(config.selectors.tocVisibilityToggle));
        this._fabToggle = document.querySelector(`${config.selectors.tocFab} .bd-toc-toggle`);

        if (!this._tocOffcanvas) {
            return;
        }

        this._visible = this._loadPreference();
        this._applyState({ focus: false });
        this._bindEvents();

        console.log('TocVisibility: Initialized', { visible: this._visible });
    }

    /**
     * @private
     * @returns {boolean}
     */
    _loadPreference() {
        try {
            return localStorage.getItem(this._storageKey) !== 'false';
        } catch (error) {
            console.warn('TocVisibility: Could not read localStorage', error);
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
            console.warn('TocVisibility: Could not write localStorage', error);
        }
    }

    /**
     * @private
     */
    _bindEvents() {
        this._hideToggles.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                this.setVisible(false, { focusTarget: this._fabToggle });
            });
        });

        if (this._fabToggle) {
            this._fabToggle.addEventListener('click', (event) => {
                event.preventDefault();

                if (!this._visible) {
                    this.setVisible(true, { focusTarget: this._hideToggles[0] });

                    if (isBelowBreakpoint('lg') && typeof bootstrap !== 'undefined') {
                        bootstrap.Offcanvas.getOrCreateInstance(this._tocOffcanvas).show();
                    }
                    return;
                }

                if (isBelowBreakpoint('lg') && typeof bootstrap !== 'undefined') {
                    bootstrap.Offcanvas.getOrCreateInstance(this._tocOffcanvas).toggle();
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

        this._main?.classList.toggle('bd-main--no-toc', !this._visible);
        this._tocWrapper?.classList.toggle('bd-toc--hidden', !this._visible);
        this._fab?.classList.toggle('bd-toc-fab--restore', !this._visible);
        document.documentElement.classList.toggle('bd-toc-pref-hidden', !this._visible);

        this._hideToggles.forEach((button) => {
            button.hidden = !this._visible;
            button.setAttribute('aria-expanded', String(this._visible));
        });

        if (this._fabToggle) {
            this._fabToggle.setAttribute('aria-expanded', String(this._visible));
            this._fabToggle.setAttribute(
                'aria-label',
                this._visible ? 'Open table of contents' : 'Show table of contents'
            );
        }

        if (!this._visible && isBelowBreakpoint('lg') && typeof bootstrap !== 'undefined') {
            bootstrap.Offcanvas.getInstance(this._tocOffcanvas)?.hide();
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

        document.dispatchEvent(new CustomEvent('navigation:tocVisibility', {
            detail: { visible }
        }));
    }

    /**
     * Toggle TOC visibility (desktop) or offcanvas (mobile when visible)
     */
    toggle() {
        if (isBelowBreakpoint('lg')) {
            if (!this._visible) {
                this.setVisible(true, { focusTarget: this._fabToggle });
                if (typeof bootstrap !== 'undefined') {
                    bootstrap.Offcanvas.getOrCreateInstance(this._tocOffcanvas).show();
                }
                return;
            }

            if (typeof bootstrap !== 'undefined') {
                bootstrap.Offcanvas.getOrCreateInstance(this._tocOffcanvas).toggle();
            }
            return;
        }

        this.setVisible(!this._visible, {
            focusTarget: this._visible ? this._fabToggle : this._hideToggles[0]
        });
    }

    destroy() {
        console.log('TocVisibility: Destroyed');
    }
}

export default TocVisibility;
