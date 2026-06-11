/**
 * ==============================================================================
 * NAVIGATION SCRIPTS — DEPRECATED
 * ==============================================================================
 *
 * Status: DEPRECATED as of v1.8. Slated for removal in v2.0.
 *
 * The behaviour formerly implemented as a 362-line IIFE in this file has been
 * ported to an ES module at assets/js/modules/navigation/navbar.js and is now
 * orchestrated by assets/js/modules/navigation/index.js. The orchestrator is
 * loaded once from _includes/components/js-cdn.html.
 *
 * If a fork still references this file directly (e.g. a custom <script> tag),
 * the no-op below keeps the page from 404-ing while a console warning prompts
 * migration. There is no functional code path here anymore.
 * ==============================================================================
 */

(function () {
    'use strict';
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(
            '[zer0-mistakes] /assets/js/navigation.js is deprecated. ' +
            'The navbar behaviour now lives in /assets/js/modules/navigation/navbar.js ' +
            'and is loaded automatically by the navigation module orchestrator. ' +
            'Remove any direct <script> reference to this file in your fork.'
        );
    }
})();
