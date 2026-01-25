---
title: Code Copy Button
description: One-click copy functionality for code blocks with visual feedback and clipboard API integration.
layout: default
categories:
    - docs
    - features
tags:
    - code
    - clipboard
    - developer-experience
    - ui
permalink: /docs/features/code-copy/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Code Copy Button

Automatic copy buttons on all code blocks for easy clipboard copying.

## Overview

- **Automatic Injection**: Buttons added to all code blocks
- **Clipboard API**: Modern async clipboard access
- **Visual Feedback**: "Copied!" confirmation
- **Accessible**: ARIA labels and keyboard support

## Implementation

### JavaScript

```javascript
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('pre.highlight, pre code').forEach(function(pre) {
    // Skip if already has button
    if (pre.querySelector('.copy')) return;
    
    var preElement = pre.tagName === 'PRE' ? pre : pre.closest('pre');
    if (!preElement) return;
    
    var button = document.createElement('button');
    button.className = 'copy';
    button.type = 'button';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      var code = preElement.querySelector('code');
      if (!code) return;
      
      navigator.clipboard.writeText(code.textContent).then(function() {
        button.innerHTML = '<i class="bi bi-check me-1"></i>Copied!';
        setTimeout(function() {
          button.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
        }, 2000);
      });
    });
    
    preElement.appendChild(button);
  });
});
```

## Styling

### Button Positioning

```css
pre.highlight {
  position: relative;
}

pre .copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: var(--bs-secondary);
  color: white;
  border: none;
  border-radius: var(--bs-border-radius);
  opacity: 0;
  transition: opacity 0.2s;
}

pre:hover .copy {
  opacity: 1;
}

pre .copy:hover {
  background: var(--bs-primary);
}
```

### Success State

```css
pre .copy.copied {
  background: var(--bs-success);
}
```

## Customization

### Button Text

```javascript
var copyText = 'Copy';
var copiedText = 'Copied!';
```

### Icons

```javascript
// Bootstrap Icons
button.innerHTML = '<i class="bi bi-clipboard"></i>';

// Text only
button.textContent = 'Copy';

// SVG icon
button.innerHTML = '<svg>...</svg>';
```

### Always Visible

```css
pre .copy {
  opacity: 1;
}
```

### Different Position

```css
/* Bottom right */
pre .copy {
  top: auto;
  bottom: 0.5rem;
}

/* Top left */
pre .copy {
  right: auto;
  left: 0.5rem;
}
```

## Clipboard API

### Modern Approach

```javascript
navigator.clipboard.writeText(text)
  .then(() => console.log('Copied!'))
  .catch(err => console.error('Failed to copy:', err));
```

### Fallback for Older Browsers

```javascript
function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}
```

## Accessibility

### ARIA Labels

```html
<button aria-label="Copy code to clipboard"
        title="Copy code to clipboard">
  Copy
</button>
```

### Focus Styles

```css
pre .copy:focus {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}

pre .copy:focus-visible {
  opacity: 1;
}
```

### Screen Reader Feedback

```javascript
// Announce copy success
button.setAttribute('aria-label', 'Copied to clipboard');
setTimeout(() => {
  button.setAttribute('aria-label', 'Copy code to clipboard');
}, 2000);
```

## Language-Specific

### Skip Certain Languages

```javascript
// Don't add to terminal output
if (pre.classList.contains('language-output')) return;
if (pre.classList.contains('language-console')) return;
```

### Custom Label by Language

```javascript
var lang = pre.className.match(/language-(\w+)/);
if (lang) {
  button.setAttribute('aria-label', `Copy ${lang[1]} code`);
}
```

## Troubleshooting

### Button Not Appearing

1. Check code block has `pre.highlight` or `pre code`
2. Verify JavaScript is loaded
3. Check CSS isn't hiding button
4. Inspect for duplicate buttons

### Copy Not Working

1. Check browser clipboard permissions
2. Verify HTTPS (required for Clipboard API)
3. Test fallback method
4. Check for JavaScript errors

### Styling Issues

1. Verify `position: relative` on pre
2. Check z-index conflicts
3. Test hover states
4. Verify button is inside pre

## Related

- [Code Highlighting](/docs/jekyll/code-highlighting/)
- [Mermaid Diagrams](/docs/features/mermaid-diagrams/)
