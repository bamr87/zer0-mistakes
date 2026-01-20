/**
 * Search Modal Controller
 * - Opens modal on navigation:searchRequest event ("/" shortcut)
 * - Focuses search input on open
 */
(function() {
    'use strict';

    function initSearchModal() {
        const modalEl = document.getElementById('siteSearchModal');
        if (!modalEl) return;

        const searchInput = modalEl.querySelector('[data-search-input]');
        const searchForm = modalEl.querySelector('[data-search-form]');
        const resultsContainer = modalEl.querySelector('[data-search-results]');
        const emptyState = modalEl.querySelector('[data-search-empty]');
        const searchIndexUrl = new URL('/search.json', window.location.origin);
        let searchIndex = null;
        let searchIndexPromise = null;
        let searchTimeout = null;

        const openModal = () => {
            const modalInstance = typeof bootstrap !== 'undefined'
                ? bootstrap.Modal.getOrCreateInstance(modalEl)
                : null;

            if (modalInstance) {
                modalInstance.show();
            }
        };

        // Open modal when keyboard shortcut requests search
        document.addEventListener('navigation:searchRequest', openModal);

        // Open modal when clicking a search toggle button
        document.querySelectorAll('[data-search-toggle]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                openModal();
            });
        });

        // Fallback keyboard shortcut ("/" or Cmd/Ctrl+K) in case other modules are unavailable
        document.addEventListener('keydown', (event) => {
            if (event.target.matches('input, textarea, select, [contenteditable="true"]')) {
                return;
            }
            const isSearchSlash = event.key === '/' || event.code === 'Slash';
            const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
            if (isSearchSlash || isSearchShortcut) {
                event.preventDefault();
                openModal();
            }
        });

        // Ensure focus on input once modal is shown
        modalEl.addEventListener('shown.bs.modal', () => {
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            if (searchInput && searchInput.value.trim()) {
                triggerSearch();
            }
        });

        // Clear input when modal closes
        modalEl.addEventListener('hidden.bs.modal', () => {
            if (searchInput) {
                searchInput.value = '';
            }
            clearResults();
        });

        // Prevent empty submissions
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (event) => {
                if (!searchInput.value.trim()) {
                    event.preventDefault();
                    searchInput.focus();
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => triggerSearch(), 200);
            });
        }

        function clearResults() {
            if (!resultsContainer) return;
            resultsContainer.innerHTML = '';
            if (emptyState) {
                emptyState.textContent = 'Start typing to see results.';
                emptyState.classList.remove('d-none');
                resultsContainer.appendChild(emptyState);
            }
        }

        function renderResults(items, query) {
            if (!resultsContainer) return;
            resultsContainer.innerHTML = '';

            if (!query) {
                clearResults();
                return;
            }

            if (!items.length) {
                const empty = document.createElement('div');
                empty.className = 'text-muted small';
                empty.textContent = 'No results found.';
                resultsContainer.appendChild(empty);
                return;
            }

            const list = document.createElement('div');
            list.className = 'list-group';

            items.slice(0, 8).forEach((item) => {
                const link = document.createElement('a');
                link.className = 'list-group-item list-group-item-action';
                link.href = item.url;

                const title = document.createElement('div');
                title.className = 'fw-semibold';
                title.innerHTML = highlightText(item.title || 'Untitled', query);
                link.appendChild(title);

                const snippet = buildSnippet(item, query);
                if (snippet) {
                    const desc = document.createElement('div');
                    desc.className = 'small text-muted';
                    desc.innerHTML = highlightText(snippet, query);
                    link.appendChild(desc);
                }

                list.appendChild(link);
            });

            resultsContainer.appendChild(list);

            const viewAll = document.createElement('a');
            viewAll.className = 'd-block mt-2 small';
            viewAll.href = `/sitemap/?q=${encodeURIComponent(query)}`;
            viewAll.textContent = 'View all results';
            resultsContainer.appendChild(viewAll);
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function highlightText(text, query) {
            if (!query) return escapeHtml(text);
            const escaped = escapeHtml(text);
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'ig');
            return escaped.replace(regex, '<mark>$1</mark>');
        }

        function buildSnippet(item, query) {
            const description = item.description || '';
            const content = item.content || '';
            if (!description && !content) return '';

            const lowerQuery = query.toLowerCase();
            const lowerContent = content.toLowerCase();
            const lowerDescription = description.toLowerCase();

            let sourceText = content;
            let index = lowerContent.indexOf(lowerQuery);

            if (index === -1 && description) {
                sourceText = description;
                index = lowerDescription.indexOf(lowerQuery);
            }

            if (index === -1) {
                const fallback = content || description;
                return fallback.length > 140 ? `${fallback.slice(0, 140)}...` : fallback;
            }

            const start = Math.max(0, index - 60);
            const end = Math.min(sourceText.length, index + 80);
            const prefix = start > 0 ? '... ' : '';
            const suffix = end < sourceText.length ? ' ...' : '';
            return `${prefix}${sourceText.slice(start, end)}${suffix}`;
        }

        function loadSearchIndex() {
            if (searchIndex) return Promise.resolve(searchIndex);
            if (!searchIndexPromise) {
                searchIndexPromise = fetch(searchIndexUrl.toString())
                    .then((response) => (response.ok ? response.json() : []))
                    .then((data) => {
                        searchIndex = Array.isArray(data) ? data : [];
                        return searchIndex;
                    })
                    .catch(() => []);
            }
            return searchIndexPromise;
        }

        function triggerSearch() {
            if (!searchInput) return;
            const query = searchInput.value.trim().toLowerCase();

            if (!query) {
                renderResults([], '');
                return;
            }

            loadSearchIndex().then((index) => {
                const matches = index.filter((item) => {
                    const title = (item.title || '').toLowerCase();
                    const description = (item.description || '').toLowerCase();
                    const content = (item.content || '').toLowerCase();
                    return title.includes(query) || description.includes(query) || content.includes(query);
                });

                renderResults(matches, query);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearchModal);
    } else {
        initSearchModal();
    }
})();
