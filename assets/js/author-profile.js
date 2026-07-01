// Feature: ZER0-061
/*
 * author-profile.js
 * ---------------------------------------------------------------------------
 * Progressive-enhancement controller for the interactive author profile page
 * (_layouts/author.html). Self-activates on any [data-author-profile] container,
 * so it is safe to load globally and is a no-op everywhere else.
 *
 * Powers: type filters (the stat cards), free-text search (title + tags),
 * sort (newest / oldest / A–Z), topic/tag chips, a live result count, a
 * clear-filters control, deep-linkable type filter via the URL hash
 * (#type=posts), and a reduced-motion-aware count-up on the stat numbers.
 *
 * No dependencies. With JS disabled every item stays visible (crawlable).
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  function init(root) {
    var grid = root.querySelector('[data-author-grid]');
    if (!grid) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll('.author-item'));
    var filterBtns = Array.prototype.slice.call(root.querySelectorAll('[data-filter]'));
    var tagBtns = Array.prototype.slice.call(root.querySelectorAll('[data-tag-filter]'));
    var searchInput = root.querySelector('[data-author-search]');
    var sortSelect = root.querySelector('[data-author-sort]');
    var clearBtns = Array.prototype.slice.call(root.querySelectorAll('[data-author-clear]'));
    var countEl = root.querySelector('[data-author-count]');
    var noResults = root.querySelector('[data-author-noresults]');
    var total = items.length;

    var state = {
      filter: 'all',
      query: '',
      sort: sortSelect ? sortSelect.value : 'newest',
      tag: null
    };

    function matches(item) {
      if (state.filter !== 'all' && item.getAttribute('data-collection') !== state.filter) {
        return false;
      }
      if (state.tag) {
        var bag = '|' + (item.getAttribute('data-tags') || '') + '|';
        if (bag.indexOf('|' + state.tag + '|') === -1) return false;
      }
      if (state.query) {
        var hay = (item.getAttribute('data-title') || '') + '|' + (item.getAttribute('data-tags') || '');
        if (hay.indexOf(state.query) === -1) return false;
      }
      return true;
    }

    function sortItems() {
      var ordered = items.slice();
      ordered.sort(function (a, b) {
        if (state.sort === 'az') {
          return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '');
        }
        var da = parseInt(a.getAttribute('data-date') || '0', 10) || 0;
        var db = parseInt(b.getAttribute('data-date') || '0', 10) || 0;
        return state.sort === 'oldest' ? da - db : db - da;
      });
      ordered.forEach(function (el) { grid.appendChild(el); });
    }

    function apply() {
      sortItems();
      var visible = 0;
      items.forEach(function (item) {
        if (matches(item)) { item.classList.remove('d-none'); visible++; }
        else { item.classList.add('d-none'); }
      });
      if (countEl) countEl.textContent = 'Showing ' + visible + ' of ' + total;
      if (noResults) noResults.classList.toggle('d-none', visible !== 0);
      var active = state.filter !== 'all' || state.query !== '' || state.tag !== null;
      clearBtns.forEach(function (b) { b.hidden = !active; });
    }

    function setFilter(type) {
      state.filter = type;
      filterBtns.forEach(function (b) {
        var on = b.getAttribute('data-filter') === type;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      writeHash();
      apply();
    }

    function setTag(tag) {
      state.tag = (state.tag === tag) ? null : tag;
      tagBtns.forEach(function (b) {
        var on = b.getAttribute('data-tag-filter') === state.tag;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      apply();
    }

    function clearAll() {
      state.query = '';
      state.tag = null;
      if (searchInput) searchInput.value = '';
      tagBtns.forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      setFilter('all'); // also re-applies + resets hash
    }

    function writeHash() {
      if (!window.history || !window.history.replaceState) return;
      try {
        if (state.filter && state.filter !== 'all') {
          window.history.replaceState(null, '', '#type=' + state.filter);
        } else {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch (e) { /* no-op */ }
    }

    function readHash() {
      var m = /[#&]type=([a-z0-9_-]+)/i.exec(window.location.hash);
      if (m && filterBtns.some(function (b) { return b.getAttribute('data-filter') === m[1]; })) {
        setFilter(m[1]);
        return true;
      }
      return false;
    }

    // ---- Wire events ----
    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () { setFilter(b.getAttribute('data-filter')); });
    });
    tagBtns.forEach(function (b) {
      b.addEventListener('click', function () { setTag(b.getAttribute('data-tag-filter')); });
    });
    clearBtns.forEach(function (b) { b.addEventListener('click', clearAll); });
    if (sortSelect) {
      sortSelect.addEventListener('change', function () { state.sort = sortSelect.value; apply(); });
    }
    if (searchInput) {
      var t;
      searchInput.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.query = searchInput.value.trim().toLowerCase();
          apply();
        }, 150);
      });
    }

    countUp(root);

    // Deep link (e.g. /authors/bamr87/#type=docs); falls back to a plain apply.
    if (!readHash()) apply();
  }

  // Reduced-motion-aware count-up for the stat numbers.
  function countUp(root) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nums = root.querySelectorAll('.author-stat__num');
    if (reduce || !nums.length || !window.requestAnimationFrame) return;
    Array.prototype.forEach.call(nums, function (el) {
      var target = parseInt(el.textContent, 10);
      if (isNaN(target) || target <= 0) return;
      var duration = 600, start = null;
      el.textContent = '0';
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        el.textContent = String(Math.round(p * target));
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-author-profile]'), init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
