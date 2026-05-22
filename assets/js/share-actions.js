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
    const shareWindow = window.open(href, '_blank', 'noopener,noreferrer');

    if (shareWindow) {
      shareWindow.opener = null;
      return;
    }

    window.location.assign(href);
  }

  function bindLinkedInShare(anchor) {
    if (anchor.dataset.linkedinShareBound === 'true') return;

    anchor.dataset.linkedinShareBound = 'true';
    anchor.addEventListener('click', async function (event) {
      event.preventDefault();

      openShareWindow(anchor.href);

      const shareText = buildLinkedInShareText(anchor);
      const copied = await copyShareText(shareText);

      if (copied) {
        window.setTimeout(() => {
          window.alert('A cleaned LinkedIn-ready summary was copied to your clipboard. Paste it into LinkedIn after the share page opens.');
        }, 150);
      }
    });
  }

  function initLinkedInShareButtons() {
    document.querySelectorAll('.js-linkedin-share').forEach(bindLinkedInShare);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLinkedInShareButtons);
  } else {
    initLinkedInShareButtons();
  }
})();
