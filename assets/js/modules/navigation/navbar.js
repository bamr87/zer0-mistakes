/**
 * ===================================================================
 * NAVBAR — Hover dropdowns, mobile menu, focus trap, tooltips
 * ===================================================================
 *
 * Path: assets/js/modules/navigation/navbar.js
 *
 * Ported from the legacy assets/js/navigation.js IIFE. Reads shared config
 * (breakpoints, selectors) from ./config.js so a fork can adjust behaviour
 * in a single place. Exported as the `Navbar` class — the parent
 * Navigation orchestrator constructs and initialises it.
 *
 * Public surface:
 *   const nav = new Navbar(config);
 *   nav.init();    // wires all listeners
 *   nav.destroy(); // removes them (used during hot reload / SPA navigation)
 *
 * Backward compatibility: the orchestrator continues to live at
 * window.zer0Navigation; new methods are added rather than renamed.
 * ===================================================================
 */

const TOOLTIP_DELAY = { show: 400, hide: 100 };

export class Navbar {
    /**
     * @param {object} config - The shared navigation config (see ./config.js)
     */
    constructor(config) {
        this.config = config;
        this._tooltips = [];
        this._listeners = [];
        this._resizeTimer = null;
    }

    // -----------------------------------------------------------------
    // Breakpoint helpers — use the live config so token updates propagate
    // -----------------------------------------------------------------
    _isMobile() {
        return window.innerWidth < this.config.breakpoints.lg;
    }

    _isCompactDesktop() {
        return window.innerWidth >= this.config.breakpoints.lg && window.innerWidth < this.config.breakpoints.xl;
    }

    // -----------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------
    init() {
        this._setupOffcanvasLinkClose();
        this._setupKeyboardAccessibility();
        this._setupMobileDropdowns();
        this._setupOutsideClickClose();
        this._setupOffcanvasReset();
        this._setupNavTooltips();
        this._setupDropdownHoverDelay();
        this._setupFocusTrap();
        this._setupResponsiveReset();
    }

    destroy() {
        this._listeners.forEach(({ target, type, handler, options }) => {
            target.removeEventListener(type, handler, options);
        });
        this._listeners = [];
        this._tooltips.forEach((t) => { try { t.dispose(); } catch (e) { /* noop */ } });
        this._tooltips = [];
    }

    /** Internal: track listeners so destroy() can clean them up */
    _on(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        this._listeners.push({ target, type, handler, options });
    }

    // -----------------------------------------------------------------
    // Behaviour
    // -----------------------------------------------------------------
    _setupOffcanvasLinkClose() {
        const offcanvasEl = document.getElementById('bdNavbar');
        if (!offcanvasEl) return;
        const navLinks = offcanvasEl.querySelectorAll(
            '.nav-link[href]:not(.dropdown-toggle), .dropdown-item[href]'
        );
        navLinks.forEach((link) => {
            this._on(link, 'click', () => {
                setTimeout(() => {
                    const offcanvas = window.bootstrap?.Offcanvas?.getInstance(offcanvasEl);
                    if (offcanvas) offcanvas.hide();
                }, 100);
            });
        });
    }

    _setupKeyboardAccessibility() {
        const dropdowns = document.querySelectorAll('.nav-hover-dropdown');
        dropdowns.forEach((dropdown) => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            if (!toggle || !menu) return;

            this._on(toggle, 'focus', () => {
                if (!this._isMobile()) {
                    menu.classList.add('show');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            this._on(dropdown, 'focusout', (e) => {
                if (!dropdown.contains(e.relatedTarget)) {
                    menu.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });

            this._on(dropdown, 'keydown', (e) => {
                if (!menu.classList.contains('show')) {
                    if ((e.key === 'Enter' || e.key === ' ') && e.target === toggle) {
                        e.preventDefault();
                        menu.classList.add('show');
                        toggle.setAttribute('aria-expanded', 'true');
                        const firstItem = menu.querySelector('.dropdown-item:not(:disabled)');
                        if (firstItem) firstItem.focus();
                    }
                    return;
                }

                const items = menu.querySelectorAll('.dropdown-item:not(:disabled)');
                const currentIndex = Array.from(items).indexOf(document.activeElement);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    items[(currentIndex + 1) % items.length]?.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    items[(currentIndex - 1 + items.length) % items.length]?.focus();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    items[0]?.focus();
                } else if (e.key === 'End') {
                    e.preventDefault();
                    items[items.length - 1]?.focus();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    menu.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.focus();
                } else if (e.key === 'Tab') {
                    menu.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    _setupMobileDropdowns() {
        const dropdowns = document.querySelectorAll('.nav-hover-dropdown');
        dropdowns.forEach((dropdown) => {
            const toggle = dropdown.querySelector('.dropdown-toggle-split');
            const menu = dropdown.querySelector('.dropdown-menu');
            if (!toggle || !menu) return;

            this._on(toggle, 'click', (e) => {
                if (!this._isMobile()) return;
                e.preventDefault();
                e.stopPropagation();

                const isOpen = menu.classList.contains('show');

                document.querySelectorAll('.nav-hover-dropdown .dropdown-menu.show').forEach((otherMenu) => {
                    if (otherMenu !== menu) {
                        otherMenu.classList.remove('show');
                        const otherToggle = otherMenu.closest('.nav-hover-dropdown')?.querySelector('.dropdown-toggle-split');
                        if (otherToggle) {
                            otherToggle.classList.remove('show');
                            otherToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                if (isOpen) {
                    menu.classList.remove('show');
                    toggle.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                } else {
                    menu.classList.add('show');
                    toggle.classList.add('show');
                    toggle.setAttribute('aria-expanded', 'true');
                    setTimeout(() => {
                        toggle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            });
        });
    }

    _setupOutsideClickClose() {
        this._on(document, 'click', (e) => {
            if (!this._isMobile()) return;
            const target = e.target;
            if (target && typeof target.closest === 'function' && target.closest('.nav-hover-dropdown')) return;
            document.querySelectorAll('.nav-hover-dropdown').forEach((dropdown) => {
                const toggle = dropdown.querySelector('.dropdown-toggle-split');
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu && toggle) {
                    menu.classList.remove('show');
                    toggle.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    _setupOffcanvasReset() {
        const offcanvasEl = document.getElementById('bdNavbar');
        if (!offcanvasEl) return;
        this._on(offcanvasEl, 'hide.bs.offcanvas', () => {
            document.querySelectorAll('.nav-hover-dropdown').forEach((dropdown) => {
                const toggle = dropdown.querySelector('.dropdown-toggle-split');
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu && toggle) {
                    menu.classList.remove('show');
                    toggle.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    _setupNavTooltips() {
        if (typeof window.bootstrap === 'undefined' || !window.bootstrap.Tooltip) return;
        const navLinks = document.querySelectorAll('#bdNavbar .nav-link[title]');
        navLinks.forEach((link) => {
            const tooltip = new window.bootstrap.Tooltip(link, {
                trigger: 'manual',
                placement: 'bottom',
                delay: TOOLTIP_DELAY,
                boundary: 'window',
                fallbackPlacements: ['top', 'bottom'],
                customClass: 'nav-tooltip'
            });
            this._tooltips.push(tooltip);

            this._on(link, 'mouseenter', () => { if (this._isCompactDesktop()) tooltip.show(); });
            this._on(link, 'mouseleave', () => tooltip.hide());
            this._on(link, 'focus',      () => { if (this._isCompactDesktop()) tooltip.show(); });
            this._on(link, 'blur',       () => tooltip.hide());
        });
    }

    _setupDropdownHoverDelay() {
        if (this._isMobile()) return;
        const hoverDelay = 150;
        document.querySelectorAll('.nav-hover-dropdown').forEach((dropdown) => {
            let hoverTimeout;
            this._on(dropdown, 'mouseenter', () => {
                hoverTimeout = setTimeout(() => {
                    const menu = dropdown.querySelector('.dropdown-menu');
                    if (menu && !this._isMobile()) menu.classList.add('show');
                }, hoverDelay);
            });
            this._on(dropdown, 'mouseleave', () => {
                clearTimeout(hoverTimeout);
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu && !this._isMobile()) menu.classList.remove('show');
            });
        });
    }

    _setupFocusTrap() {
        const offcanvasEl = document.getElementById('bdNavbar');
        if (!offcanvasEl) return;
        this._on(offcanvasEl, 'shown.bs.offcanvas', () => {
            const firstFocusable = offcanvasEl.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) firstFocusable.focus();
        });
    }

    _setupResponsiveReset() {
        this._on(window, 'resize', () => {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => {
                const dropdowns = document.querySelectorAll('.nav-hover-dropdown .dropdown-menu');
                dropdowns.forEach((menu) => {
                    if (!this._isMobile()) {
                        menu.classList.remove('show');
                        const dropdown = menu.closest('.dropdown');
                        const toggle = dropdown?.querySelector('[data-bs-toggle="dropdown"], .dropdown-toggle');
                        if (toggle) {
                            toggle.classList.remove('show');
                            toggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
            }, 250);
        });
    }
}
