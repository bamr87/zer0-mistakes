/**
 * ===================================================================
 * SIDEBAR FOLDERS — Click + keyboard toggle for auto-folder trees
 * ===================================================================
 *
 * Path: assets/js/side-bar-folders.js
 *
 * Adds disclosure behaviour to .folder elements emitted by
 * _includes/navigation/sidebar-folders.html. Previously click-only and
 * lacked any ARIA hooks; now also responds to Enter/Space (keyboard),
 * exposes role="button", tabindex="0", and aria-expanded for assistive
 * technologies. Each .folder must be followed in the DOM by an element
 * with class "nested-list-group" representing its children.
 * ===================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    const folders = document.querySelectorAll('.folder');

    folders.forEach((folder) => {
        const nextElement = folder.nextElementSibling;
        const target = (nextElement && nextElement.classList.contains('nested-list-group'))
            ? nextElement
            : null;

        // Set up accessible disclosure semantics
        if (!folder.hasAttribute('role')) folder.setAttribute('role', 'button');
        if (!folder.hasAttribute('tabindex')) folder.setAttribute('tabindex', '0');
        if (target) {
            const isOpen = target.classList.contains('show');
            folder.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (!target.id) {
                target.id = 'zer0-folder-' + Math.random().toString(36).slice(2, 9);
            }
            folder.setAttribute('aria-controls', target.id);
        }

        function toggle() {
            if (!target) return;
            const opened = target.classList.toggle('show');
            folder.setAttribute('aria-expanded', opened ? 'true' : 'false');
        }

        folder.addEventListener('click', toggle);
        folder.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                toggle();
            }
        });
    });
});
