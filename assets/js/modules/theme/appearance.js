/**
 * ===================================================================
 * APPEARANCE — Runtime theme controls (color mode + primary color)
 * ===================================================================
 *
 * Path: assets/js/modules/theme/appearance.js
 *
 * Renders a small panel inside the existing Settings offcanvas
 * (#info-section) when site.appearance_panel is enabled. The panel
 * exposes:
 *
 *   - Color mode buttons (light / dark / auto) — writes data-bs-theme
 *     to <html> and persists to localStorage["theme"] (compatible with
 *     halfmoon.js so both stay in sync).
 *
 *   - Primary color picker — writes to localStorage["zer0-appearance"]
 *     and updates --zer0-color-primary live so every component that uses
 *     the token (buttons, callouts, FABs, focus rings) reflects the
 *     change without a reload. Cleared by the Reset button.
 *
 * Initial paint is already handled by the script emitted in
 * _includes/core/tokens-inline.html so there is no flash of default
 * color when the page loads.
 *
 * Loaded with `defer` from _includes/components/js-cdn.html — guarded
 * by `{% if site.appearance_panel %}`.
 * ===================================================================
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'zer0-appearance';
    const THEME_KEY = 'theme';
    const PANEL_HOST_SELECTOR = '[data-appearance-panel-host]';
    const FALLBACK_HOST_SELECTOR = '#info-section .offcanvas-body';

    function readPrefs() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writePrefs(prefs) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        } catch (e) { /* private mode / quota — silently ignore */ }
    }

    function applyPrefs(prefs) {
        const root = document.documentElement;
        if (prefs.primary) root.style.setProperty('--zer0-color-primary', prefs.primary);
        else root.style.removeProperty('--zer0-color-primary');
    }

    function resolveColorMode() {
        try {
            return localStorage.getItem(THEME_KEY) || 'auto';
        } catch (e) {
            return 'auto';
        }
    }

    function applyColorMode(mode) {
        const root = document.documentElement;
        if (mode === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-bs-theme', mode);
        }
        try { localStorage.setItem(THEME_KEY, mode); } catch (e) { /* ignore */ }
    }

    function buildPanel(host) {
        const prefs = readPrefs();
        const mode = resolveColorMode();
        const primary = prefs.primary || getInitialPrimary();

        const wrapper = document.createElement('section');
        wrapper.className = 'zer0-appearance-panel border rounded p-3 mt-3';
        wrapper.setAttribute('aria-labelledby', 'zer0-appearance-heading');
        wrapper.innerHTML =
            '<h3 id="zer0-appearance-heading" class="h6 mb-3">' +
              '<i class="bi bi-palette me-2" aria-hidden="true"></i>Appearance' +
            '</h3>' +
            '<div class="mb-3" role="group" aria-label="Color mode">' +
              '<label class="form-label small text-body-secondary mb-2">Color mode</label>' +
              '<div class="btn-group w-100" role="group">' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-mode="light">' +
                  '<i class="bi bi-sun me-1" aria-hidden="true"></i>Light</button>' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-mode="dark">' +
                  '<i class="bi bi-moon-stars me-1" aria-hidden="true"></i>Dark</button>' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-mode="auto">' +
                  '<i class="bi bi-circle-half me-1" aria-hidden="true"></i>Auto</button>' +
              '</div>' +
            '</div>' +
            '<div class="mb-3">' +
              '<label for="zer0-appearance-primary" class="form-label small text-body-secondary">' +
                'Primary color</label>' +
              '<input type="color" id="zer0-appearance-primary" class="form-control form-control-color" ' +
                'aria-describedby="zer0-appearance-primary-help">' +
              '<div id="zer0-appearance-primary-help" class="form-text small">' +
                'Overrides <code>--zer0-color-primary</code> across the theme.</div>' +
            '</div>' +
            '<button type="button" class="btn btn-link btn-sm p-0" data-appearance-reset>' +
              '<i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Reset to defaults' +
            '</button>';

        host.appendChild(wrapper);

        // Set via the DOM property — never interpolate user/localStorage data into innerHTML.
        const picker = wrapper.querySelector('#zer0-appearance-primary');
        picker.value = hexishOrDefault(primary, '#007bff');

        // Wire color-mode buttons
        wrapper.querySelectorAll('[data-mode]').forEach((btn) => {
            const m = btn.dataset.mode;
            btn.setAttribute('aria-pressed', String(m === mode));
            if (m === mode) btn.classList.add('active');
            btn.addEventListener('click', () => {
                applyColorMode(m);
                wrapper.querySelectorAll('[data-mode]').forEach((b) => {
                    const isActive = b.dataset.mode === m;
                    b.classList.toggle('active', isActive);
                    b.setAttribute('aria-pressed', String(isActive));
                });
            });
        });

        // Wire color picker (debounced)
        let pickTimer;
        picker.addEventListener('input', (e) => {
            const value = e.target.value;
            clearTimeout(pickTimer);
            pickTimer = setTimeout(() => {
                const next = Object.assign(readPrefs(), { primary: value });
                writePrefs(next);
                applyPrefs(next);
            }, 80);
        });

        // Reset
        wrapper.querySelector('[data-appearance-reset]').addEventListener('click', () => {
            writePrefs({});
            applyPrefs({});
            // Restore the swatch to whatever the stylesheet now resolves to
            picker.value = getInitialPrimary();
        });
    }

    function getInitialPrimary() {
        // Read computed --zer0-color-primary, falling back to a sane default.
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--zer0-color-primary').trim();
        return hexishOrDefault(raw, '#007bff');
    }

    /** Coerce arbitrary CSS color values into a hex string acceptable by <input type=color>. */
    function hexishOrDefault(value, fallback) {
        if (!value) return fallback;
        if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
        if (/^#[0-9a-fA-F]{3}$/.test(value)) {
            // expand short hex
            return '#' + value.slice(1).split('').map((c) => c + c).join('');
        }
        // Convert rgb()/rgba() via a hidden element so the browser does the math
        try {
            const probe = document.createElement('div');
            probe.style.color = value;
            document.body.appendChild(probe);
            const computed = getComputedStyle(probe).color;
            document.body.removeChild(probe);
            const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (m) {
                const toHex = (n) => parseInt(n, 10).toString(16).padStart(2, '0');
                return '#' + toHex(m[1]) + toHex(m[2]) + toHex(m[3]);
            }
        } catch (e) { /* noop */ }
        return fallback;
    }

    function mount() {
        const host = document.querySelector(PANEL_HOST_SELECTOR) || document.querySelector(FALLBACK_HOST_SELECTOR);
        if (!host) return; // info-section not present on this page
        if (host.querySelector('.zer0-appearance-panel')) return; // already mounted
        buildPanel(host);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
