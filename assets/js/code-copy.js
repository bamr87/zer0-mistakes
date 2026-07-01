// Feature: ZER0-030
document.addEventListener('DOMContentLoaded', function () {
  var LANG_LABELS = {
    shell: 'bash',
    plaintext: 'text',
    console: 'console',
    'console-output': 'output'
  };

  function formatLang(lang) {
    return LANG_LABELS[lang] || lang;
  }

  function getLanguageLabel(element) {
    var rouge = element.closest('.highlighter-rouge');
    if (!rouge) return null;
    var match = rouge.className.match(/\blanguage-(\S+)/);
    return match ? formatLang(match[1]) : null;
  }

  function getCodeLineCount(codeElement) {
    var text = codeElement.textContent || '';
    if (text.length === 0) return 1;

    var lines = text.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return Math.max(lines.length, 1);
  }

  function countCodeLines(codeElement) {
    return codeElement.innerText
      .split('\n')
      .filter(function (line) { return line.trim().length > 0; })
      .length;
  }

  function getCopyableCode(codeElement) {
    return codeElement.innerText
      .split('\n')
      .filter(function (line) { return !line.trim().startsWith('#'); })
      .join('\n')
      .trim();
  }

  function getCodeBlockAnchor(wrapper) {
    return wrapper.querySelector('.code-block-body') || wrapper.querySelector('pre');
  }

  function ensureLineNumbers(preElement, codeElement) {
    if (preElement.closest('.code-block-body')) return;

    var lineCount = getCodeLineCount(codeElement);
    var numbers = [];
    for (var i = 1; i <= lineCount; i++) {
      numbers.push(String(i));
    }

    var body = document.createElement('div');
    body.className = 'code-block-body';
    body.classList.toggle('code-block-body--single-line', lineCount <= 1);

    var gutter = document.createElement('div');
    gutter.className = 'code-line-numbers';
    gutter.setAttribute('aria-hidden', 'true');
    gutter.textContent = numbers.join('\n');

    var parent = preElement.parentNode;
    parent.insertBefore(body, preElement);
    body.appendChild(gutter);
    body.appendChild(preElement);

    if (!preElement.closest('.highlighter-rouge')) {
      body.classList.add('code-block-body--standalone');
    }

    preElement.classList.add('has-line-numbers');
  }

  function ensureHeader(wrapper, lang) {
    var header = wrapper.querySelector('.code-block-header');
    if (header) return header;

    header = document.createElement('div');
    header.className = 'code-block-header';

    if (lang) {
      var label = document.createElement('span');
      label.className = 'code-block-lang';
      label.textContent = lang;
      header.appendChild(label);
    }

    wrapper.insertBefore(header, getCodeBlockAnchor(wrapper));
    return header;
  }

  var preElements = new Set();
  document.querySelectorAll('pre.highlight, pre code').forEach(function (el) {
    var preElement = el.tagName === 'PRE' ? el : el.closest('pre');
    if (preElement) preElements.add(preElement);
  });

  preElements.forEach(function (preElement) {
    var codeElement = preElement.querySelector('code');
    if (!codeElement) return;

    ensureLineNumbers(preElement, codeElement);

    // a11y (WCAG 2.1.1 scrollable-region-focusable): a code block that can
    // scroll horizontally must be reachable by keyboard. Make every <pre> a
    // focusable region with a discernible name.
    if (!preElement.hasAttribute('tabindex')) {
      preElement.setAttribute('tabindex', '0');
      if (!preElement.hasAttribute('role')) preElement.setAttribute('role', 'region');
      if (!preElement.hasAttribute('aria-label')) {
        preElement.setAttribute('aria-label', (getLanguageLabel(preElement) || 'Code') + ' code block');
      }
    }

    if (preElement.querySelector('.copy')) return;

    var rougeWrapper = preElement.closest('.highlighter-rouge > .highlight');
    var lang = getLanguageLabel(preElement);
    var isSingleLine = countCodeLines(codeElement) <= 1;

    var button = document.createElement('button');
    var copyText = 'Copy';
    var copiedText = 'Copied!';
    button.className = 'copy';
    button.type = 'button';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.setAttribute('title', 'Copy code to clipboard');
    button.innerHTML = '<i class="bi bi-clipboard me-1"></i>' + copyText;
    button.tabIndex = 0;

    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      navigator.clipboard.writeText(getCopyableCode(codeElement)).then(function () {
        button.innerHTML = '<i class="bi bi-check-circle me-1"></i>' + copiedText;
        button.classList.add('copied');

        setTimeout(function () {
          button.innerHTML = '<i class="bi bi-clipboard me-1"></i>' + copyText;
          button.classList.remove('copied');
        }, 2000);
      }).catch(function (err) {
        console.error('Failed to copy:', err);
        button.innerHTML = '<i class="bi bi-x-circle me-1"></i>Copy failed';
        setTimeout(function () {
          button.innerHTML = '<i class="bi bi-clipboard me-1"></i>' + copyText;
        }, 2000);
      });
    });

    if (rougeWrapper) {
      var header = ensureHeader(rougeWrapper, lang);
      header.appendChild(button);
      rougeWrapper.classList.toggle('code-block--single-line', isSingleLine);
      rougeWrapper.closest('.highlighter-rouge').classList.add('has-code-header');
    } else {
      if (getComputedStyle(preElement).position === 'static') {
        preElement.style.position = 'relative';
      }
      preElement.appendChild(button);
      preElement.classList.toggle('code-block--single-line', isSingleLine);
    }

    preElement.classList.add('has-copy-button');
  });
});
