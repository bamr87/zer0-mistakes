// Feature: ZER0-068
/**
 * Content table CSV copy — injects a toolbar button on markdown/HTML tables
 * in main reading areas. Scoped to content wrappers; skips admin and sitemap.
 */
document.addEventListener('DOMContentLoaded', function () {
  var CONTENT_SCOPES = [
    '.bd-content',
    '.landing-content-body',
    '.post-content',
    '.note-content',
    '.notebook-content',
    '.page-content'
  ];

  var COPY_LABEL = 'Copy CSV';
  var COPIED_LABEL = 'Copied!';
  var FAILED_LABEL = 'Copy failed';

  function isExcludedTable(table) {
    if (!table || table.id === 'sitemapTable') return true;
    if (table.closest('#admin-content')) return true;
    if (table.closest('.content-table-wrapper')) return true;
    return false;
  }

  function findWrapTarget(table) {
    var parent = table.parentElement;
    if (
      parent &&
      parent.classList.contains('table-responsive') &&
      parent.querySelector('table') === table
    ) {
      return parent;
    }
    return table;
  }

  function getCellText(cell) {
    return (cell.innerText || cell.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeCsvCell(value) {
    var text = String(value);
    if (/[",\n\r]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function getTableMatrix(table) {
    var rows = [];
    var sectionTags = ['thead', 'tbody', 'tfoot'];
    var hasSections = sectionTags.some(function (tag) {
      return table.querySelector(tag);
    });

    function pushRow(tr) {
      var cells = [];
      tr.querySelectorAll('th, td').forEach(function (cell) {
        cells.push(getCellText(cell));
      });
      if (cells.length) rows.push(cells);
    }

    if (hasSections) {
      sectionTags.forEach(function (tag) {
        var section = table.querySelector(tag);
        if (!section) return;
        section.querySelectorAll('tr').forEach(pushRow);
      });
    } else {
      table.querySelectorAll('tr').forEach(pushRow);
    }

    return rows;
  }

  function matrixToCsv(matrix) {
    return matrix
      .map(function (row) {
        return row.map(escapeCsvCell).join(',');
      })
      .join('\n');
  }

  function tableToCsv(table) {
    return matrixToCsv(getTableMatrix(table));
  }

  function showToast(message, variant) {
    if (window.zer0UI && typeof window.zer0UI.showToast === 'function') {
      window.zer0UI.showToast(message, { variant: variant || 'success', duration: 3000 });
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) resolve();
        else reject(new Error('Copy command failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  function setButtonState(button, label, state) {
    var icon = 'bi-clipboard';
    if (state === 'copied') icon = 'bi-check-circle';
    if (state === 'failed') icon = 'bi-x-circle';

    button.innerHTML =
      '<i class="bi ' + icon + ' me-1" aria-hidden="true"></i>' + label;
    button.classList.toggle('copied', state === 'copied');
  }

  function createCopyButton(table) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'table-copy-csv';
    button.setAttribute('aria-label', 'Copy table as CSV to clipboard');
    button.setAttribute('title', 'Copy table as CSV');
    setButtonState(button, COPY_LABEL, 'idle');

    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var csv = tableToCsv(table);
      if (!csv) {
        setButtonState(button, FAILED_LABEL, 'failed');
        showToast('Nothing to copy from this table', 'warning');
        setTimeout(function () {
          setButtonState(button, COPY_LABEL, 'idle');
        }, 2000);
        return;
      }

      copyText(csv)
        .then(function () {
          setButtonState(button, COPIED_LABEL, 'copied');
          showToast('Table copied as CSV', 'success');
          setTimeout(function () {
            setButtonState(button, COPY_LABEL, 'idle');
          }, 2000);
        })
        .catch(function (err) {
          console.error('Failed to copy table:', err);
          setButtonState(button, FAILED_LABEL, 'failed');
          showToast('Copy failed — please try again', 'warning');
          setTimeout(function () {
            setButtonState(button, COPY_LABEL, 'idle');
          }, 2000);
        });
    });

    return button;
  }

  function wrapTable(table) {
    var wrapTarget = findWrapTarget(table);
    if (wrapTarget.closest('.content-table-wrapper')) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'content-table-wrapper';

    var toolbar = document.createElement('div');
    toolbar.className = 'content-table-toolbar';
    toolbar.appendChild(createCopyButton(table));

    wrapTarget.parentNode.insertBefore(wrapper, wrapTarget);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(wrapTarget);
  }

  var selector = CONTENT_SCOPES.map(function (scope) {
    return scope + ' table:not(#sitemapTable)';
  }).join(', ');

  document.querySelectorAll(selector).forEach(function (table) {
    if (isExcludedTable(table)) return;
    wrapTable(table);
  });
});
