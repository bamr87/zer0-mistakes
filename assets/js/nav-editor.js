/**
 * nav-editor.js
 * Powers the Navigation Editor admin page.
 * - Copy YAML output from nav data rendered in the overview tab
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var copyBtn = document.getElementById('nav-copy-yaml');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = document.getElementById('nav-yaml-output').textContent;
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.innerHTML = '<i class="bi bi-check me-1"></i> Copied';
        setTimeout(function () { copyBtn.innerHTML = '<i class="bi bi-clipboard me-1"></i> Copy'; }, 2000);
      });
    });
  }

  /* Populate YAML preview when nav file selector changes */
  var fileSelect = document.getElementById('nav-file-select');
  if (fileSelect) {
    fileSelect.addEventListener('change', function () {
      var selected = this.value;
      var output = document.getElementById('nav-yaml-output');
      if (output) {
        output.textContent = '# _data/navigation/' + selected + '.yml\n# View the Overview tab for the rendered tree structure.\n# Edit the YAML file directly in your repository.';
      }

      // Expand the matching accordion section
      var accBtn = document.querySelector('#navAcc-' + selected);
      if (accBtn) {
        var bsCollapse = bootstrap.Collapse.getOrCreateInstance(accBtn, { toggle: false });
        bsCollapse.show();
      }
    });
  }
});
