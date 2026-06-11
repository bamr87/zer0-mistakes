---
title: "Frequently Asked Questions"
description: "Common questions about the zer0-mistakes Jekyll theme — installation, features, compatibility, and customization."
layout: default
permalink: /faq/
date: 2026-03-28T00:00:00.000Z
lastmod: 2026-03-28T00:00:00.000Z
tags:
  - faq
  - help
  - support
categories:
  - documentation
faq_items:
  - question: "What is zer0-mistakes?"
    answer: "zer0-mistakes is a professional Jekyll theme designed for GitHub Pages with Bootstrap 5.3 integration, Docker-first development, and automated installation. It provides 43 documented features including privacy-compliant analytics, Mermaid diagrams, MathJax support, and comprehensive documentation."
  - question: "Is zer0-mistakes free to use?"
    answer: "Yes. zer0-mistakes is released under the MIT License and is completely free for personal and commercial use. The source code is available on GitHub and the gem is published on RubyGems.org."
  - question: "How do I install zer0-mistakes?"
    answer: |
      The fastest method is the one-line Docker install:

      ```bash
      mkdir my-site && cd my-site && curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
      ```

      You can also install via RubyGems (`gem install jekyll-theme-zer0`) or use GitHub Pages with `remote_theme: bamr87/zer0-mistakes` in `_config.yml`.
  - question: "What if I'm on Windows?"
    answer: "zer0-mistakes works on Windows through Docker Desktop with WSL 2 (Windows Subsystem for Linux). Install Docker Desktop, enable WSL 2 integration, then follow the standard Docker installation instructions. The Docker-first approach ensures identical behavior across macOS, Linux, and Windows."
  - question: "How does zer0-mistakes compare to the default Jekyll theme (Minima)?"
    answer: "Minima is a minimal starter theme, while zer0-mistakes is a full-featured production theme. Key differences include: Bootstrap 5.3 responsive framework (vs. custom CSS), Docker-first development (vs. local Ruby), automated installation with error recovery, 43 documented features, privacy-compliant analytics, Mermaid diagram support, and comprehensive documentation with 70+ pages."
  - question: "Is this production-ready for GitHub Pages?"
    answer: "Yes. zer0-mistakes is fully compatible with GitHub Pages. Add remote_theme: bamr87/zer0-mistakes to your _config.yml and push to your repository. The theme uses only GitHub Pages-whitelisted plugins and has been tested with the GitHub Pages build pipeline."
  - question: "How do I add custom CSS or JavaScript?"
    answer: "Add styles in `_sass/` and import them from `assets/css/main.scss`, or create `assets/css/user-overrides.css` and link it from `_includes/core/head.html` after `main.css`. For JavaScript, add files under `assets/js/` and include them via `_includes/components/js-cdn.html`."
  - question: "Does zer0-mistakes support dark mode?"
    answer: "Yes. The theme uses Bootstrap 5.3's native dark mode with the data-bs-theme attribute set on the HTML element. Dark mode is enabled by default and respects user system preferences."
  - question: "How do I enable Mermaid diagrams in a post?"
    answer: "Add mermaid: true to the front matter of any post or page. Then use standard Mermaid syntax inside fenced code blocks with the mermaid language identifier. The Mermaid JavaScript library is loaded conditionally only on pages that need it."
  - question: "What analytics does zer0-mistakes use?"
    answer: "The theme integrates PostHog for privacy-compliant analytics with a full cookie consent system (GDPR/CCPA compliant). Analytics are disabled in development and only load in production with explicit user consent. Google Analytics is also supported as an alternative."
  - question: "How do I contribute to zer0-mistakes?"
    answer: "Fork the repository on GitHub, create a feature branch, make your changes, run the test suite with ./test/test_runner.sh, and open a pull request. See the [contributing guide](/contributing/) for detailed guidelines including code style, testing requirements, and the review process."
  - question: "What version of Bootstrap does zer0-mistakes use?"
    answer: "zer0-mistakes uses Bootstrap 5.3.3, loaded via CDN with Subresource Integrity (SRI) hashes for security. Bootstrap Icons 1.10.3 is also included for consistent iconography across the theme."
---

Find answers to common questions about the **zer0-mistakes** Jekyll theme below. Can't find what you're looking for? [Open a discussion](https://github.com/bamr87/zer0-mistakes/discussions) or [file an issue](https://github.com/bamr87/zer0-mistakes/issues).

---

{% for item in page.faq_items %}
## {{ item.question }}

{{ item.answer }}

{% unless forloop.last %}* * *{% endunless %}

{% endfor %}

---

## Still Have Questions?

| Channel | Link |
|---------|------|
| 📖 Documentation | [zer0-mistakes.com](https://zer0-mistakes.com/) |
| 🐛 Issues | [GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues) |
| 💬 Discussions | [GitHub Discussions](https://github.com/bamr87/zer0-mistakes/discussions) |
| 📧 Email | [amr@zer0-mistakes.com](mailto:amr@zer0-mistakes.com) |
