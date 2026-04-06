document.addEventListener('DOMContentLoaded', function () {
  // Enhanced code copy functionality with better UX
  document
    .querySelectorAll('pre.highlight, pre code')
    .forEach(function (pre) {
      // Skip if already has copy button
      if (pre.querySelector('.copy')) return;
      
      // Find the actual pre element (might be parent)
      var preElement = pre.tagName === 'PRE' ? pre : pre.closest('pre');
      if (!preElement) return;
      
      var button = document.createElement('button');
      var copyText = 'Copy';
      var copiedText = 'Copied!';
      button.className = 'copy';
      button.type = 'button';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.setAttribute('title', 'Copy code to clipboard');
      button.innerHTML = '<i class="bi bi-clipboard me-1"></i>' + copyText;
      button.tabIndex = 0;
      
      // Click handler using modern Clipboard API
      button.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        var codeElement = preElement.querySelector('code');
        if (!codeElement) return;
        
        var code = codeElement.innerText
          .split('\n')
          .filter(line => !line.trim().startsWith('#'))
          .join('\n')
          .trim();
        
        // Modern Clipboard API (supported in all current browsers)
        navigator.clipboard.writeText(code).then(function() {
          // Success feedback
          button.innerHTML = '<i class="bi bi-check-circle me-1"></i>' + copiedText;
          button.classList.add('copied');
          
          setTimeout(function () {
            button.innerHTML = '<i class="bi bi-clipboard me-1"></i>' + copyText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(function(err) {
          console.error('Failed to copy:', err);
          button.innerHTML = '<i class="bi bi-x-circle me-1"></i>Failed';
          setTimeout(function () {
            button.innerHTML = '<i class="bi bi-clipboard me-1"></i>' + copyText;
          }, 2000);
        });
      });
      
      // Ensure pre has position relative for absolute positioning
      if (getComputedStyle(preElement).position === 'static') {
        preElement.style.position = 'relative';
      }
      
      preElement.appendChild(button);
      preElement.classList.add('has-copy-button');
    });
});