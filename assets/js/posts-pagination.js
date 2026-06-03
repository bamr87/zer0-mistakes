/**
 * ===================================================================
 * POSTS-PAGINATION — Client-side pagination for the posts archive
 * ===================================================================
 *
 * Path: assets/js/posts-pagination.js
 *
 * Externalised from the inline <script> block formerly at the end of
 * `index.html` (lines 160–311). The host page provides per-page and
 * total-post counts via `data-` attributes on the root element so this
 * file remains free of Liquid templating.
 *
 * Required markup (root container has `data-posts-archive` attribute):
 *
 *   <div data-posts-archive
 *        data-per-page="10"
 *        data-total="42">
 *     <div id="posts-grid">…<.post-item>…</div>
 *     <div id="pagination-info"></div>
 *     <div id="posts-info"></div>
 *     <ul id="pagination-controls"></ul>
 *   </div>
 *
 * The active page button now exposes `aria-current="page"` (Track 5).
 * ===================================================================
 */

(function () {
    'use strict';

    function init(root) {
        const POSTS_PER_PAGE = parseInt(root.dataset.perPage, 10) || 10;
        const TOTAL_POSTS = parseInt(root.dataset.total, 10) || 0;
        const TOTAL_PAGES = Math.max(1, Math.ceil(TOTAL_POSTS / POSTS_PER_PAGE));

        const posts = root.querySelectorAll('.post-item');
        const grid = root.querySelector('#posts-grid');
        const paginationInfo = root.querySelector('#pagination-info');
        const paginationControls = root.querySelector('#pagination-controls');
        const postsInfo = root.querySelector('#posts-info');

        function getCurrentPage() {
            const hash = window.location.hash || '';
            const match = hash.match(/page=(\d+)/);
            if (match) {
                const page = parseInt(match[1], 10);
                return Math.max(1, Math.min(page, TOTAL_PAGES));
            }
            return 1;
        }

        function getPaginationRange(current, total) {
            if (total <= 7) {
                return Array.from({ length: total }, (_, i) => i + 1);
            }
            const pages = [];
            if (current <= 3) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('…');
                pages.push(total);
            } else if (current >= total - 2) {
                pages.push(1);
                pages.push('…');
                for (let i = total - 4; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('…');
                for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                pages.push('…');
                pages.push(total);
            }
            return pages;
        }

        function renderPagination(currentPage) {
            if (!paginationControls || TOTAL_PAGES <= 1) return;
            const parts = [];

            // Previous
            parts.push(
                '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '">' +
                '<a class="page-link" href="#" data-page="' + (currentPage - 1) + '" ' +
                'aria-label="Previous page"' + (currentPage === 1 ? ' aria-disabled="true" tabindex="-1"' : '') + '>' +
                '<i class="bi bi-chevron-left" aria-hidden="true"></i></a></li>'
            );

            getPaginationRange(currentPage, TOTAL_PAGES).forEach((page) => {
                if (page === '…') {
                    parts.push('<li class="page-item disabled"><span class="page-link" aria-hidden="true">…</span></li>');
                } else {
                    const isActive = page === currentPage;
                    parts.push(
                        '<li class="page-item ' + (isActive ? 'active' : '') + '">' +
                        '<a class="page-link" href="#" data-page="' + page + '"' +
                        (isActive ? ' aria-current="page"' : '') +
                        ' aria-label="Page ' + page + '">' + page + '</a></li>'
                    );
                }
            });

            // Next
            parts.push(
                '<li class="page-item ' + (currentPage === TOTAL_PAGES ? 'disabled' : '') + '">' +
                '<a class="page-link" href="#" data-page="' + (currentPage + 1) + '" ' +
                'aria-label="Next page"' + (currentPage === TOTAL_PAGES ? ' aria-disabled="true" tabindex="-1"' : '') + '>' +
                '<i class="bi bi-chevron-right" aria-hidden="true"></i></a></li>'
            );

            paginationControls.innerHTML = parts.join('');
            paginationControls.querySelectorAll('a[data-page]').forEach((link) => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(link.dataset.page, 10);
                    if (page >= 1 && page <= TOTAL_PAGES) showPage(page);
                });
            });
        }

        function showPage(pageNum) {
            const startIndex = (pageNum - 1) * POSTS_PER_PAGE;
            const endIndex = startIndex + POSTS_PER_PAGE;

            posts.forEach((post, index) => {
                post.style.display = (index >= startIndex && index < endIndex) ? '' : 'none';
            });

            const showingStart = startIndex + 1;
            const showingEnd = Math.min(endIndex, TOTAL_POSTS);
            if (paginationInfo) {
                paginationInfo.textContent = 'Showing ' + showingStart + '–' + showingEnd + ' of ' + TOTAL_POSTS + ' posts';
            }
            if (postsInfo && TOTAL_PAGES > 1) {
                postsInfo.textContent = 'Page ' + pageNum + ' of ' + TOTAL_PAGES + ' (' + TOTAL_POSTS + ' articles)';
            }

            if (pageNum === 1) {
                history.replaceState(null, '', window.location.pathname);
            } else {
                history.replaceState(null, '', '#page=' + pageNum);
            }

            renderPagination(pageNum);

            if (grid && pageNum !== getCurrentPage()) {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        if (TOTAL_POSTS > 0) {
            showPage(getCurrentPage());
        }
        window.addEventListener('hashchange', () => {
            showPage(getCurrentPage());
        });
    }

    function boot() {
        document.querySelectorAll('[data-posts-archive]').forEach(init);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
