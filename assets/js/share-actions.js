(function () {
  'use strict';

  function normalizeWhitespace(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function dedupeSections(sections) {
    return sections.filter((section, index) => {
      if (!section) return false;
      const normalized = section.toLowerCase();
      return !sections.slice(0, index).some((previous) => previous && previous.toLowerCase() === normalized);
    });
  }

  function truncateToSentence(text, maxLength) {
    if (text.length <= maxLength) return text;

    const trimmed = text.slice(0, maxLength);
    const sentenceBreak = Math.max(
      trimmed.lastIndexOf('. '),
      trimmed.lastIndexOf('! '),
      trimmed.lastIndexOf('? ')
    );

    if (sentenceBreak > Math.floor(maxLength * 0.6)) {
      return trimmed.slice(0, sentenceBreak + 1).trim();
    }

    const lastSpace = trimmed.lastIndexOf(' ');
    const endIndex = lastSpace > 0 ? lastSpace : maxLength;
    return `${trimmed.slice(0, endIndex).trim()}…`;
  }

  function getShareContentRoot() {
    return document.querySelector('[itemprop="articleBody"]')
      || document.querySelector('.bd-content')
      || document.querySelector('main')
      || document.body;
  }

  function extractCleanExcerpt(description) {
    const contentRoot = getShareContentRoot();
    const normalizedDescription = normalizeWhitespace(description).toLowerCase();
    const paragraphTexts = Array.from(contentRoot.querySelectorAll('p'))
      .map((paragraph) => normalizeWhitespace(paragraph.textContent))
      .filter((paragraph) => paragraph.length > 40)
      .filter((paragraph) => {
        const normalizedParagraph = paragraph.toLowerCase();
        return !normalizedDescription
          || (normalizedParagraph !== normalizedDescription && !normalizedParagraph.includes(normalizedDescription));
      });

    const combinedParagraphs = paragraphTexts.slice(0, 4).join(' ');
    const fallbackText = normalizeWhitespace(contentRoot.textContent);
    const candidateText = combinedParagraphs || fallbackText;

    return truncateToSentence(candidateText, 420);
  }

  function buildLinkedInShareText(anchor) {
    const title = normalizeWhitespace(anchor.dataset.shareTitle || document.title);
    const description = normalizeWhitespace(
      anchor.dataset.shareDescription
      || document.querySelector('meta[name="description"]')?.getAttribute('content')
      || ''
    );
    const excerpt = extractCleanExcerpt(description);
    const url = normalizeWhitespace(anchor.dataset.shareUrl || window.location.href);

    return dedupeSections([title, description, excerpt, url]).join('\n\n');
  }

  async function copyShareText(text) {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('LinkedIn share copy failed:', error);
      return false;
    }
  }

  function openShareWindow(href) {
    return window.open(href || 'about:blank', '_blank', 'noopener,noreferrer');
  }

  function notify(message, type) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type || 'info'} shadow position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '1085';
    notification.setAttribute('role', 'status');
    notification.textContent = message;
    document.body.appendChild(notification);

    window.setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  function bindLinkedInShare(anchor) {
    if (anchor.dataset.linkedinShareBound === 'true') return;

    anchor.dataset.linkedinShareBound = 'true';
    anchor.addEventListener('click', async function (event) {
      event.preventDefault();

      const shareWindow = openShareWindow('', '_blank');

      const shareText = buildLinkedInShareText(anchor);
      const copied = await copyShareText(shareText);

      if (shareWindow) {
        shareWindow.location = anchor.href;
      } else {
        window.location.assign(anchor.href);
      }

      if (copied) {
        notify('A cleaned LinkedIn-ready summary was copied to your clipboard. Paste it on LinkedIn after the share page opens.', 'info');
      } else {
        notify('LinkedIn opened, but clipboard access was unavailable. Copy the summary manually if needed.', 'warning');
      }
    });
  }

  function bindCopyButton(button) {
    if (button.dataset.copyBound === 'true') return;

    button.dataset.copyBound = 'true';
    button.addEventListener('click', async function () {
      const copied = await copyShareText(button.dataset.copyText || '');

      if (copied) {
        notify(button.dataset.copySuccess || 'Copied to clipboard.', 'success');
      } else {
        notify('Clipboard access was unavailable.', 'warning');
      }
    });
  }

  function initLinkedInShareButtons() {
    document.querySelectorAll('.js-linkedin-share').forEach(bindLinkedInShare);
    document.querySelectorAll('.js-copy-share-link').forEach(bindCopyButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLinkedInShareButtons);
  } else {
    initLinkedInShareButtons();
  }
})();
