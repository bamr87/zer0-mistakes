/**
 * ===================================================================
 * UI-HELPERS — Small generic UI utilities
 * ===================================================================
 *
 * Path: assets/js/ui-helpers.js
 * Loaded with `defer` from _includes/components/js-cdn.html.
 *
 * Provides:
 *   - showToast(message, { variant, duration })  — aria-live notifications
 *   - copyToClipboard(text)                       — Promise-based copy with toast
 *   - data-copy attribute support                 — replaces inline onclick
 *   - landing-hero-img progressive fade-in        — replaces inline onload
 *
 * No third-party deps. Surfaces a single `window.zer0UI` namespace.
 * ===================================================================
 */

(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Toast container — lazily created, aria-live polite, top-end position
    // ---------------------------------------------------------------------
    function ensureToastContainer() {
        let container = document.getElementById('zer0-toast-container');
        if (container) return container;
        container = document.createElement('div');
        container.id = 'zer0-toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = 'var(--zer0-layer-toast, 1090)';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
        return container;
    }

    /**
     * Show a temporary toast notification.
     * @param {string} message
     * @param {{variant?: 'info'|'success'|'warning'|'danger', duration?: number}} [options]
     */
    function showToast(message, options) {
        const opts = Object.assign({ variant: 'info', duration: 3500 }, options || {});
        const container = ensureToastContainer();

        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-bg-' + opts.variant + ' border-0 show';
        toast.setAttribute('role', 'status');
        toast.innerHTML =
            '<div class="d-flex">' +
              '<div class="toast-body"></div>' +
              '<button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button>' +
            '</div>';
        toast.querySelector('.toast-body').textContent = message;
        toast.querySelector('.btn-close').addEventListener('click', () => toast.remove());
        container.appendChild(toast);

        if (opts.duration > 0) {
            setTimeout(() => {
                toast.classList.add('fade');
                setTimeout(() => toast.remove(), 200);
            }, opts.duration);
        }
        return toast;
    }

    // ---------------------------------------------------------------------
    // Clipboard helper — async, with graceful fallback
    // ---------------------------------------------------------------------
    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text)
                .then(() => { showToast('Copied to clipboard', { variant: 'success' }); })
                .catch(() => { showToast('Copy failed — please try again', { variant: 'warning' }); });
        }
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(ok ? 'Copied to clipboard' : 'Copy failed', { variant: ok ? 'success' : 'warning' });
            return Promise.resolve(ok);
        } catch (e) {
            showToast('Copy failed — please try again', { variant: 'warning' });
            return Promise.reject(e);
        }
    }

    // ---------------------------------------------------------------------
    // data-copy attribute: <button data-copy="text to copy">Copy</button>
    // Replaces inline onclick="..." patterns; works for any clickable element.
    // ---------------------------------------------------------------------
    function bindCopyButtons() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;
            const trigger = target.closest('[data-copy]');
            if (!trigger) return;
            const value = trigger.getAttribute('data-copy');
            if (value == null) return;
            e.preventDefault();
            copyToClipboard(value);
        });
    }

    // ---------------------------------------------------------------------
    // Landing hero image fade-in — replaces inline onload="..." attribute.
    // Adds `.is-loaded` once the <img.landing-hero-img> finishes decoding.
    // ---------------------------------------------------------------------
    function bindHeroImages() {
        const imgs = document.querySelectorAll('img.landing-hero-img');
        imgs.forEach((img) => {
            if (img.complete && img.naturalWidth > 0) {
                img.classList.add('is-loaded');
            } else {
                img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
            }
        });
    }

    // ---------------------------------------------------------------------
    // Init on DOM ready
    // ---------------------------------------------------------------------
    function init() {
        bindCopyButtons();
        bindHeroImages();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public namespace
    window.zer0UI = Object.assign(window.zer0UI || {}, {
        showToast: showToast,
        copyToClipboard: copyToClipboard
    });
})();
