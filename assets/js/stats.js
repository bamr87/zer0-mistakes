/**
 * Statistics dashboard interactions (categories/tags expand toggles).
 */
(function () {
  const VISIBLE_LIMIT = 15;

  function toggleExtraItems(button, cardSelector, extraClass, labels) {
    const card = button.closest(cardSelector);
    if (!card) return;

    const extras = card.querySelectorAll(`.${extraClass}`);
    const hiddenCount = button.dataset.hiddenCount || extras.length;
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    extras.forEach((item) => {
      item.classList.toggle('d-none', isExpanded);
    });

    if (isExpanded) {
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = `<i class="bi bi-chevron-down"></i> Show ${hiddenCount} ${labels.more}`;
    } else {
      button.setAttribute('aria-expanded', 'true');
      button.innerHTML = `<i class="bi bi-chevron-up"></i> Show ${labels.fewer}`;
    }
  }

  window.toggleAllCategories = function toggleAllCategories(button) {
    toggleExtraItems(button, '#categories', 'stats-category-extra', {
      more: 'more categories',
      fewer: 'fewer categories',
    });
  };

  window.toggleAllTags = function toggleAllTags(button) {
    toggleExtraItems(button, '#tags', 'stats-tag-extra', {
      more: 'more tags',
      fewer: 'fewer tags',
    });
  };

  window.StatsDashboard = { VISIBLE_LIMIT };
})();
