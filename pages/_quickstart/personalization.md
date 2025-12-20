---
title: "Site Personalization & Configuration"
author: "Zer0-Mistakes Development Team"
layout: default
description: "Customize your Jekyll site with interactive forms. Configure site identity, branding, analytics, social links, and generate your complete _config.yml."
permalink: /quickstart/personalization/
preview: /images/previews/site-personalization-configuration.png
categories: [Documentation, Quick Start]
tags: [jekyll, configuration, personalization, customization, yaml]
keywords:
  primary: ["jekyll configuration", "site personalization"]
  secondary: ["yaml config", "site branding", "analytics setup", "social links"]
lastmod: 2025-12-19T00:00:00.000Z
draft: false
sidebar:
  nav: quickstart
quickstart:
  step: 4
  next: null
  prev: /quickstart/github-setup/
---

# 🎨 Site Personalization & Configuration

After completing the [Quick Start installation](/quickstart/), use this guide to personalize your Jekyll site. Fill out the interactive forms below to generate your custom `_config.yml` settings.

<div class="alert alert-info mb-4" role="alert">
  <i class="bi bi-info-circle-fill"></i> <strong>How This Works</strong>
  <p class="mb-0 mt-2">Fill out the forms in each section. Your settings will be automatically saved and combined into a complete <code>_config.yml</code> at the bottom of the page. Copy and paste to customize your site!</p>
</div>

## 📋 Configuration Sections

<div class="row g-3 mb-4">
  <div class="col-md-4">
    <a href="#site-identity" class="text-decoration-none">
      <div class="card h-100 border-primary">
        <div class="card-body text-center">
          <i class="bi bi-globe fs-1 text-primary"></i>
          <h5 class="card-title mt-2">Site Identity</h5>
          <p class="card-text text-muted small">Title, description, URL</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#owner-info" class="text-decoration-none">
      <div class="card h-100 border-success">
        <div class="card-body text-center">
          <i class="bi bi-person-circle fs-1 text-success"></i>
          <h5 class="card-title mt-2">Owner Info</h5>
          <p class="card-text text-muted small">Name, bio, contact</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#social-links" class="text-decoration-none">
      <div class="card h-100 border-info">
        <div class="card-body text-center">
          <i class="bi bi-share fs-1 text-info"></i>
          <h5 class="card-title mt-2">Social Links</h5>
          <p class="card-text text-muted small">GitHub, Twitter, more</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#appearance" class="text-decoration-none">
      <div class="card h-100 border-warning">
        <div class="card-body text-center">
          <i class="bi bi-palette fs-1 text-warning"></i>
          <h5 class="card-title mt-2">Appearance</h5>
          <p class="card-text text-muted small">Theme, colors, logo</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#analytics" class="text-decoration-none">
      <div class="card h-100 border-danger">
        <div class="card-body text-center">
          <i class="bi bi-graph-up fs-1 text-danger"></i>
          <h5 class="card-title mt-2">Analytics</h5>
          <p class="card-text text-muted small">Google, PostHog tracking</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#advanced" class="text-decoration-none">
      <div class="card h-100 border-secondary">
        <div class="card-body text-center">
          <i class="bi bi-gear fs-1 text-secondary"></i>
          <h5 class="card-title mt-2">Advanced</h5>
          <p class="card-text text-muted small">Plugins, collections</p>
        </div>
      </div>
    </a>
  </div>
</div>

---

<h2 id="site-identity"><i class="bi bi-globe text-primary"></i> Site Identity</h2>

Configure the basic information that identifies your site across the web.

<div class="card mb-4">
  <div class="card-header bg-primary text-white">
    <i class="bi bi-info-circle"></i> <strong>Basic Site Information</strong>
  </div>
  <div class="card-body">
    <form id="site-identity-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-title" class="form-label"><i class="bi bi-type-h1"></i> Site Title <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="cfg-title" placeholder="My Awesome Site" required>
          <div class="form-text">The main title shown in browser tabs and headers</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-subtitle" class="form-label"><i class="bi bi-type-h3"></i> Subtitle/Tagline</label>
          <input type="text" class="form-control" id="cfg-subtitle" placeholder="A developer's blog">
          <div class="form-text">Short tagline displayed below the title</div>
        </div>
        <div class="col-12">
          <label for="cfg-description" class="form-label"><i class="bi bi-text-paragraph"></i> Site Description <span class="text-danger">*</span></label>
          <textarea class="form-control" id="cfg-description" rows="3" placeholder="A Jekyll site powered by the zer0-mistakes theme. Step-by-step guides and tutorials for developers." required></textarea>
          <div class="form-text">SEO description (150-160 characters recommended)</div>
          <small class="text-muted"><span id="desc-char-count">0</span>/160 characters</small>
        </div>
        <div class="col-md-6">
          <label for="cfg-domain" class="form-label"><i class="bi bi-link-45deg"></i> Domain Name</label>
          <div class="input-group">
            <span class="input-group-text">https://</span>
            <input type="text" class="form-control" id="cfg-domain" placeholder="mysite.com">
          </div>
          <div class="form-text">Your custom domain (leave blank for GitHub Pages default)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-baseurl" class="form-label"><i class="bi bi-folder"></i> Base URL</label>
          <div class="input-group">
            <span class="input-group-text">/</span>
            <input type="text" class="form-control" id="cfg-baseurl" placeholder="">
          </div>
          <div class="form-text">Subpath for project sites (e.g., "blog" for /blog/)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-locale" class="form-label"><i class="bi bi-translate"></i> Language/Locale</label>
          <select class="form-select" id="cfg-locale">
            <option value="en-US" selected>English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Español</option>
            <option value="fr-FR">Français</option>
            <option value="de-DE">Deutsch</option>
            <option value="ja-JP">日本語</option>
            <option value="zh-CN">中文 (简体)</option>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
          <div class="form-text">Primary language for your site</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-title-separator" class="form-label"><i class="bi bi-dash-lg"></i> Title Separator</label>
          <select class="form-select" id="cfg-title-separator">
            <option value="|" selected>| (Pipe)</option>
            <option value="-">- (Dash)</option>
            <option value="·">· (Middle Dot)</option>
            <option value="—">— (Em Dash)</option>
            <option value="»">» (Guillemet)</option>
          </select>
          <div class="form-text">Separator shown in browser tab (Page Title | Site Name)</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="owner-info"><i class="bi bi-person-circle text-success"></i> Owner Information</h2>

Configure your personal or organization identity.

<div class="card mb-4">
  <div class="card-header bg-success text-white">
    <i class="bi bi-person-badge"></i> <strong>Author & Owner Details</strong>
  </div>
  <div class="card-body">
    <form id="owner-info-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-author-name" class="form-label"><i class="bi bi-person"></i> Your Name <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="cfg-author-name" placeholder="John Doe" required>
          <div class="form-text">Display name for author credits</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-email" class="form-label"><i class="bi bi-envelope"></i> Email Address</label>
          <input type="email" class="form-control" id="cfg-email" placeholder="hello@example.com">
          <div class="form-text">Contact email (optional, shown in footer)</div>
        </div>
        <div class="col-12">
          <label for="cfg-bio" class="form-label"><i class="bi bi-chat-quote"></i> Bio</label>
          <textarea class="form-control" id="cfg-bio" rows="2" placeholder="Developer, blogger, and tech enthusiast"></textarea>
          <div class="form-text">Short biography displayed on author profile</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-location" class="form-label"><i class="bi bi-geo-alt"></i> Location</label>
          <input type="text" class="form-control" id="cfg-location" placeholder="San Francisco, CA">
          <div class="form-text">City, State/Country (displayed on profile)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-avatar" class="form-label"><i class="bi bi-image"></i> Avatar URL</label>
          <input type="url" class="form-control" id="cfg-avatar" placeholder="/assets/images/avatar.png">
          <div class="form-text">Path to profile image (local or URL)</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="social-links"><i class="bi bi-share text-info"></i> Social Links</h2>

Connect your social profiles and external accounts.

<div class="card mb-4">
  <div class="card-header bg-info text-white">
    <i class="bi bi-people"></i> <strong>Social Media & Profiles</strong>
  </div>
  <div class="card-body">
    <form id="social-links-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-github" class="form-label"><i class="bi bi-github"></i> GitHub Username</label>
          <div class="input-group">
            <span class="input-group-text">github.com/</span>
            <input type="text" class="form-control" id="cfg-github" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-twitter" class="form-label"><i class="bi bi-twitter-x"></i> Twitter/X Username</label>
          <div class="input-group">
            <span class="input-group-text">@</span>
            <input type="text" class="form-control" id="cfg-twitter" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-linkedin" class="form-label"><i class="bi bi-linkedin"></i> LinkedIn Profile</label>
          <div class="input-group">
            <span class="input-group-text">linkedin.com/in/</span>
            <input type="text" class="form-control" id="cfg-linkedin" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-instagram" class="form-label"><i class="bi bi-instagram"></i> Instagram Username</label>
          <div class="input-group">
            <span class="input-group-text">@</span>
            <input type="text" class="form-control" id="cfg-instagram" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-youtube" class="form-label"><i class="bi bi-youtube"></i> YouTube Channel</label>
          <input type="url" class="form-control" id="cfg-youtube" placeholder="https://youtube.com/@channel">
          <div class="form-text">Full URL to your channel</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-mastodon" class="form-label"><i class="bi bi-mastodon"></i> Mastodon Profile</label>
          <input type="url" class="form-control" id="cfg-mastodon" placeholder="https://mastodon.social/@username">
          <div class="form-text">Full URL including instance</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-bluesky" class="form-label"><i class="bi bi-cloud"></i> Bluesky Handle</label>
          <div class="input-group">
            <span class="input-group-text">@</span>
            <input type="text" class="form-control" id="cfg-bluesky" placeholder="username.bsky.social">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-discord" class="form-label"><i class="bi bi-discord"></i> Discord Server</label>
          <input type="url" class="form-control" id="cfg-discord" placeholder="https://discord.gg/invite-code">
          <div class="form-text">Invite link to your server</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="appearance"><i class="bi bi-palette text-warning"></i> Appearance & Branding</h2>

Customize the look and feel of your site.

<div class="card mb-4">
  <div class="card-header bg-warning text-dark">
    <i class="bi bi-brush"></i> <strong>Theme & Visual Settings</strong>
  </div>
  <div class="card-body">
    <form id="appearance-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-theme-skin" class="form-label"><i class="bi bi-moon-stars"></i> Theme Skin</label>
          <select class="form-select" id="cfg-theme-skin">
            <option value="dark" selected>Dark</option>
            <option value="air">Air (Light)</option>
            <option value="aqua">Aqua</option>
            <option value="contrast">High Contrast</option>
            <option value="dirt">Dirt</option>
            <option value="neon">Neon</option>
            <option value="mint">Mint</option>
            <option value="plum">Plum</option>
            <option value="sunrise">Sunrise</option>
          </select>
          <div class="form-text">Color scheme for your site</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-primary-color" class="form-label"><i class="bi bi-droplet-fill"></i> Primary Color</label>
          <div class="input-group">
            <input type="color" class="form-control form-control-color" id="cfg-primary-color-picker" value="#007bff">
            <input type="text" class="form-control" id="cfg-primary-color" value="#007bff" pattern="^#[0-9A-Fa-f]{6}$">
          </div>
          <div class="form-text">Main accent color for buttons and links</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-logo" class="form-label"><i class="bi bi-image"></i> Logo Path</label>
          <input type="text" class="form-control" id="cfg-logo" placeholder="/assets/images/logo.png">
          <div class="form-text">Path to logo image (88x88px recommended)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-og-image" class="form-label"><i class="bi bi-card-image"></i> Default Social Image</label>
          <input type="text" class="form-control" id="cfg-og-image" placeholder="/assets/images/og-image.png">
          <div class="form-text">Default image for social sharing (1200x630px)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-teaser" class="form-label"><i class="bi bi-image"></i> Teaser Image</label>
          <input type="text" class="form-control" id="cfg-teaser" placeholder="/assets/images/teaser.png">
          <div class="form-text">Fallback image for posts without previews</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-wpm" class="form-label"><i class="bi bi-speedometer2"></i> Words Per Minute</label>
          <input type="number" class="form-control" id="cfg-wpm" value="200" min="100" max="400">
          <div class="form-text">Reading speed for "X min read" estimates</div>
        </div>
        <div class="col-12">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-breadcrumbs" checked>
            <label class="form-check-label" for="cfg-breadcrumbs">
              <i class="bi bi-signpost-split"></i> Show Breadcrumbs Navigation
            </label>
          </div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="analytics"><i class="bi bi-graph-up text-danger"></i> Analytics & Tracking</h2>

Set up privacy-friendly analytics to understand your audience.

<div class="card mb-4">
  <div class="card-header bg-danger text-white">
    <i class="bi bi-bar-chart-line"></i> <strong>Analytics Configuration</strong>
  </div>
  <div class="card-body">
    <form id="analytics-form">
      <div class="row g-3">
        <!-- Google Analytics -->
        <div class="col-12">
          <h6 class="border-bottom pb-2"><i class="bi bi-google"></i> Google Analytics</h6>
        </div>
        <div class="col-md-6">
          <label for="cfg-ga-id" class="form-label">Measurement ID</label>
          <input type="text" class="form-control" id="cfg-ga-id" placeholder="G-XXXXXXXXXX">
          <div class="form-text">Google Analytics 4 measurement ID</div>
        </div>
        
        <!-- PostHog Analytics -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-speedometer"></i> PostHog Analytics (Privacy-Friendly)</h6>
        </div>
        <div class="col-12">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-posthog-enabled">
            <label class="form-check-label" for="cfg-posthog-enabled">
              Enable PostHog Analytics
            </label>
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-posthog-key" class="form-label">PostHog API Key</label>
          <input type="text" class="form-control" id="cfg-posthog-key" placeholder="phc_xxxxxxxxxxxxx">
          <div class="form-text">Your PostHog project API key</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-posthog-host" class="form-label">PostHog API Host</label>
          <input type="url" class="form-control" id="cfg-posthog-host" placeholder="https://us.i.posthog.com" value="https://us.i.posthog.com">
          <div class="form-text">PostHog instance URL</div>
        </div>
        <div class="col-12">
          <p class="text-muted small mb-2">PostHog Privacy Options:</p>
          <div class="row g-2">
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="cfg-posthog-dnt" checked>
                <label class="form-check-label" for="cfg-posthog-dnt">Respect Do Not Track</label>
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="cfg-posthog-autocapture" checked>
                <label class="form-check-label" for="cfg-posthog-autocapture">Auto-capture Events</label>
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="cfg-posthog-session">
                <label class="form-check-label" for="cfg-posthog-session">Session Recording</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Site Verification -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-shield-check"></i> Site Verification</h6>
        </div>
        <div class="col-md-6">
          <label for="cfg-google-verify" class="form-label">Google Verification</label>
          <input type="text" class="form-control" id="cfg-google-verify" placeholder="verification_token">
          <div class="form-text">Google Search Console verification</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-bing-verify" class="form-label">Bing Verification</label>
          <input type="text" class="form-control" id="cfg-bing-verify" placeholder="verification_token">
          <div class="form-text">Bing Webmaster Tools verification</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="advanced"><i class="bi bi-gear text-secondary"></i> Advanced Settings</h2>

Configure advanced features like comments, plugins, and build settings.

<div class="card mb-4">
  <div class="card-header bg-secondary text-white">
    <i class="bi bi-sliders"></i> <strong>Advanced Configuration</strong>
  </div>
  <div class="card-body">
    <form id="advanced-form">
      <div class="row g-3">
        <!-- Comments -->
        <div class="col-12">
          <h6 class="border-bottom pb-2"><i class="bi bi-chat-dots"></i> Comments (Giscus)</h6>
        </div>
        <div class="col-12">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-giscus-enabled">
            <label class="form-check-label" for="cfg-giscus-enabled">
              Enable Giscus Comments (GitHub Discussions)
            </label>
          </div>
          <div class="form-text">Requires <a href="https://giscus.app" target="_blank">Giscus setup</a> on your repository</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-giscus-repo-id" class="form-label">Repository ID</label>
          <input type="text" class="form-control" id="cfg-giscus-repo-id" placeholder="R_xxxxxxxxxxxx">
        </div>
        <div class="col-md-6">
          <label for="cfg-giscus-category-id" class="form-label">Category ID</label>
          <input type="text" class="form-control" id="cfg-giscus-category-id" placeholder="DIC_xxxxxxxxxxxx">
        </div>

        <!-- Jekyll Settings -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-file-earmark-code"></i> Jekyll Build Settings</h6>
        </div>
        <div class="col-md-4">
          <label for="cfg-paginate" class="form-label">Posts Per Page</label>
          <input type="number" class="form-control" id="cfg-paginate" value="10" min="1" max="50">
          <div class="form-text">Pagination for post listings</div>
        </div>
        <div class="col-md-4">
          <label for="cfg-port" class="form-label">Dev Server Port</label>
          <input type="number" class="form-control" id="cfg-port" value="4000" min="1024" max="65535">
          <div class="form-text">Local development port</div>
        </div>
        <div class="col-md-4">
          <label for="cfg-markdown" class="form-label">Markdown Engine</label>
          <select class="form-select" id="cfg-markdown">
            <option value="kramdown" selected>Kramdown (Recommended)</option>
            <option value="commonmark">CommonMark</option>
          </select>
        </div>

        <!-- Features Toggle -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-toggles"></i> Feature Toggles</h6>
        </div>
        <div class="col-md-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-mermaid" checked>
            <label class="form-check-label" for="cfg-mermaid">Mermaid Diagrams</label>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-mathjax" checked>
            <label class="form-check-label" for="cfg-mathjax">MathJax Equations</label>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-search" checked>
            <label class="form-check-label" for="cfg-search">Site Search</label>
          </div>
        </div>

        <!-- Copyright -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-c-circle"></i> Copyright</h6>
        </div>
        <div class="col-md-4">
          <label for="cfg-cr-year" class="form-label">Start Year</label>
          <input type="number" class="form-control" id="cfg-cr-year" value="2024" min="2000" max="2100">
        </div>
        <div class="col-md-4">
          <label for="cfg-cr-entity" class="form-label">Copyright Holder</label>
          <input type="text" class="form-control" id="cfg-cr-entity" placeholder="Your Name">
        </div>
        <div class="col-md-4">
          <label for="cfg-cr-license" class="form-label">License</label>
          <select class="form-select" id="cfg-cr-license">
            <option value="MIT" selected>MIT</option>
            <option value="Apache-2.0">Apache 2.0</option>
            <option value="GPL-3.0">GPL 3.0</option>
            <option value="CC-BY-4.0">CC BY 4.0</option>
            <option value="CC-BY-SA-4.0">CC BY-SA 4.0</option>
            <option value="All Rights Reserved">All Rights Reserved</option>
          </select>
        </div>
      </div>
    </form>
  </div>
</div>

---

## 📝 Generated Configuration

<div class="card mb-4 border-dark">
  <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
    <span><i class="bi bi-file-earmark-code"></i> <strong>Your _config.yml</strong></span>
    <div>
      <button class="btn btn-sm btn-outline-light me-2" id="reset-all-btn">
        <i class="bi bi-arrow-counterclockwise"></i> Reset All
      </button>
      <button class="btn btn-sm btn-success" id="copy-config-btn">
        <i class="bi bi-clipboard"></i> Copy Config
      </button>
    </div>
  </div>
  <div class="card-body p-0">
    <pre class="bg-dark text-light p-3 m-0 rounded-bottom" style="max-height: 500px; overflow-y: auto;"><code id="generated-config" class="language-yaml"># Loading configuration...</code></pre>
  </div>
</div>

<div class="alert alert-success" role="alert">
  <i class="bi bi-check-circle-fill"></i> <strong>Next Steps</strong>
  <ol class="mb-0 mt-2">
    <li>Copy the generated configuration above</li>
    <li>Paste it into your <code>_config.yml</code> file</li>
    <li>Restart your Jekyll server: <code>docker-compose restart</code></li>
    <li>View your personalized site at <code>http://localhost:4000</code></li>
  </ol>
</div>

---

## 🎉 You're All Set!

Congratulations on completing the Quick Start guide! Your site is now:

- ✅ Running locally with Docker
- ✅ Connected to GitHub for version control
- ✅ Personalized with your branding
- ✅ Ready for deployment to GitHub Pages

### What's Next?

- **Create content** - Add blog posts in `pages/_posts/`
- **Customize layouts** - Modify templates in `_layouts/` and `_includes/`
- **Deploy to production** - Push to GitHub and enable GitHub Pages
- **Explore the docs** - Check out the [full documentation](/docs/)

---

## 📚 Quick Start Guide Summary

| Step | Guide | Description |
|------|-------|-------------|
| 1 | **[Machine Setup](/quickstart/machine-setup/)** | Install Docker, Git, and development tools |
| 2 | **[Jekyll Setup](/quickstart/jekyll-setup/)** | Start development server and create content |
| 3 | **[GitHub Setup](/quickstart/github-setup/)** | Version control and GitHub Pages deployment |
| 4 | **[Personalization](/quickstart/personalization/)** | Customize site identity and configuration |

---

<div class="d-flex justify-content-between mt-5">
  <a href="/quickstart/github-setup/" class="btn btn-outline-primary">
    <i class="bi bi-arrow-left"></i> Previous: GitHub Setup
  </a>
  <a href="/quickstart/" class="btn btn-success">
    <i class="bi bi-check-circle"></i> Back to Quick Start
  </a>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Configuration state object
  const config = {
    site: {},
    owner: {},
    social: {},
    appearance: {},
    analytics: {},
    advanced: {}
  };

  // Helper function to get input value safely
  function getValue(id, defaultValue = '') {
    const el = document.getElementById(id);
    if (!el) return defaultValue;
    if (el.type === 'checkbox') return el.checked;
    return el.value || defaultValue;
  }

  // Update character count for description
  const descInput = document.getElementById('cfg-description');
  const charCount = document.getElementById('desc-char-count');
  if (descInput && charCount) {
    descInput.addEventListener('input', function() {
      charCount.textContent = this.value.length;
      charCount.className = this.value.length > 160 ? 'text-danger' : 'text-muted';
    });
  }

  // Sync color picker with text input
  const colorPicker = document.getElementById('cfg-primary-color-picker');
  const colorInput = document.getElementById('cfg-primary-color');
  if (colorPicker && colorInput) {
    colorPicker.addEventListener('input', function() {
      colorInput.value = this.value;
      generateConfig();
    });
    colorInput.addEventListener('input', function() {
      if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
        colorPicker.value = this.value;
      }
      generateConfig();
    });
  }

  // Generate YAML configuration
  function generateConfig() {
    const title = getValue('cfg-title', 'My Site');
    const subtitle = getValue('cfg-subtitle');
    const description = getValue('cfg-description', 'A Jekyll site powered by zer0-mistakes theme.');
    const domain = getValue('cfg-domain');
    const baseurl = getValue('cfg-baseurl');
    const locale = getValue('cfg-locale', 'en-US');
    const titleSeparator = getValue('cfg-title-separator', '|');
    
    const authorName = getValue('cfg-author-name', 'Site Owner');
    const email = getValue('cfg-email');
    const bio = getValue('cfg-bio');
    const location = getValue('cfg-location');
    const avatar = getValue('cfg-avatar');
    
    const github = getValue('cfg-github');
    const twitter = getValue('cfg-twitter');
    const linkedin = getValue('cfg-linkedin');
    const instagram = getValue('cfg-instagram');
    const youtube = getValue('cfg-youtube');
    const mastodon = getValue('cfg-mastodon');
    const bluesky = getValue('cfg-bluesky');
    const discord = getValue('cfg-discord');
    
    const themeSkin = getValue('cfg-theme-skin', 'dark');
    const primaryColor = getValue('cfg-primary-color', '#007bff');
    const logo = getValue('cfg-logo');
    const ogImage = getValue('cfg-og-image');
    const teaser = getValue('cfg-teaser');
    const wpm = getValue('cfg-wpm', '200');
    const breadcrumbs = getValue('cfg-breadcrumbs', true);
    
    const gaId = getValue('cfg-ga-id');
    const posthogEnabled = getValue('cfg-posthog-enabled', false);
    const posthogKey = getValue('cfg-posthog-key');
    const posthogHost = getValue('cfg-posthog-host', 'https://us.i.posthog.com');
    const posthogDnt = getValue('cfg-posthog-dnt', true);
    const posthogAutocapture = getValue('cfg-posthog-autocapture', true);
    const posthogSession = getValue('cfg-posthog-session', false);
    const googleVerify = getValue('cfg-google-verify');
    const bingVerify = getValue('cfg-bing-verify');
    
    const giscusEnabled = getValue('cfg-giscus-enabled', false);
    const giscusRepoId = getValue('cfg-giscus-repo-id');
    const giscusCategoryId = getValue('cfg-giscus-category-id');
    const paginate = getValue('cfg-paginate', '10');
    const port = getValue('cfg-port', '4000');
    const markdown = getValue('cfg-markdown', 'kramdown');
    const mermaid = getValue('cfg-mermaid', true);
    const mathjax = getValue('cfg-mathjax', true);
    const search = getValue('cfg-search', true);
    const crYear = getValue('cfg-cr-year', new Date().getFullYear().toString());
    const crEntity = getValue('cfg-cr-entity', authorName);
    const crLicense = getValue('cfg-cr-license', 'MIT');

    let yaml = `# =========================================================================
# Zer0-Mistakes Jekyll Theme - Site Configuration
# Generated: ${new Date().toISOString().split('T')[0]}
# Docs: https://bamr87.github.io/zer0-mistakes/
# =========================================================================

# Site Settings
# -------------------------------------------------------------------------
remote_theme: "bamr87/zer0-mistakes"

title: "${escapeYaml(title)}"`;

    if (subtitle) yaml += `\nsubtitle: "${escapeYaml(subtitle)}"`;
    
    yaml += `
title_separator: "${titleSeparator}"
description: >-
  ${escapeYaml(description)}
locale: "${locale}"`;

    if (domain) yaml += `\nurl: "https://${escapeYaml(domain)}"`;
    if (baseurl) yaml += `\nbaseurl: "/${escapeYaml(baseurl)}"`;
    yaml += `\nport: ${port}`;

    // Owner/Author Information
    yaml += `

# Owner Information
# -------------------------------------------------------------------------
name: "${escapeYaml(authorName)}"`;
    if (email) yaml += `\nemail: "${escapeYaml(email)}"`;

    yaml += `

author:
  name: "${escapeYaml(authorName)}"`;
    if (avatar) yaml += `\n  avatar: "${escapeYaml(avatar)}"`;
    if (bio) yaml += `\n  bio: "${escapeYaml(bio)}"`;
    if (location) yaml += `\n  location: "${escapeYaml(location)}"`;
    if (github) yaml += `\n  github_username: "${escapeYaml(github)}"`;
    if (twitter) yaml += `\n  twitter_username: "${escapeYaml(twitter)}"`;

    // Social Links
    const hasSocialLinks = github || twitter || linkedin || instagram || youtube || mastodon || bluesky || discord;
    if (hasSocialLinks) {
      yaml += `

# Social Links
# -------------------------------------------------------------------------
links:`;
      if (github) yaml += `\n  - label: "GitHub"\n    icon: "bi-github"\n    url: "https://github.com/${escapeYaml(github)}"`;
      if (twitter) yaml += `\n  - label: "Twitter"\n    icon: "bi-twitter-x"\n    url: "https://twitter.com/${escapeYaml(twitter)}"`;
      if (linkedin) yaml += `\n  - label: "LinkedIn"\n    icon: "bi-linkedin"\n    url: "https://linkedin.com/in/${escapeYaml(linkedin)}"`;
      if (instagram) yaml += `\n  - label: "Instagram"\n    icon: "bi-instagram"\n    url: "https://instagram.com/${escapeYaml(instagram)}"`;
      if (youtube) yaml += `\n  - label: "YouTube"\n    icon: "bi-youtube"\n    url: "${escapeYaml(youtube)}"`;
      if (mastodon) yaml += `\n  - label: "Mastodon"\n    icon: "bi-mastodon"\n    url: "${escapeYaml(mastodon)}"`;
      if (bluesky) yaml += `\n  - label: "Bluesky"\n    icon: "bi-cloud"\n    url: "https://bsky.app/profile/${escapeYaml(bluesky)}"`;
      if (discord) yaml += `\n  - label: "Discord"\n    icon: "bi-discord"\n    url: "${escapeYaml(discord)}"`;
    }

    // Appearance
    yaml += `

# Appearance & Branding
# -------------------------------------------------------------------------
theme_skin: "${themeSkin}"
theme_color:
  main: "${primaryColor}"`;
    if (logo) yaml += `\nlogo: "${escapeYaml(logo)}"`;
    if (ogImage) yaml += `\nog_image: "${escapeYaml(ogImage)}"`;
    if (teaser) yaml += `\nteaser: "${escapeYaml(teaser)}"`;
    yaml += `\nbreadcrumbs: ${breadcrumbs}
words_per_minute: ${wpm}`;

    // Analytics
    if (gaId || posthogEnabled) {
      yaml += `

# Analytics
# -------------------------------------------------------------------------`;
      if (gaId) yaml += `\ngoogle_analytics: "${escapeYaml(gaId)}"`;
      
      if (posthogEnabled && posthogKey) {
        yaml += `

posthog:
  enabled: true
  api_key: "${escapeYaml(posthogKey)}"
  api_host: "${escapeYaml(posthogHost)}"
  autocapture: ${posthogAutocapture}
  session_recording: ${posthogSession}
  respect_dnt: ${posthogDnt}`;
      }
    }

    // Site Verification
    if (googleVerify || bingVerify) {
      yaml += `

# Site Verification
# -------------------------------------------------------------------------`;
      if (googleVerify) yaml += `\ngoogle_site_verification: "${escapeYaml(googleVerify)}"`;
      if (bingVerify) yaml += `\nbing_site_verification: "${escapeYaml(bingVerify)}"`;
    }

    // Comments
    if (giscusEnabled && giscusRepoId) {
      yaml += `

# Comments (Giscus)
# -------------------------------------------------------------------------
gisgus:
  enabled: true
  data-repo-id: "${escapeYaml(giscusRepoId)}"
  data-category-id: "${escapeYaml(giscusCategoryId)}"`;
    }

    // Build Settings
    yaml += `

# Build Settings
# -------------------------------------------------------------------------
markdown: ${markdown}
paginate: ${paginate}`;

    // Features
    yaml += `

# Features
# -------------------------------------------------------------------------`;
    if (mermaid) {
      yaml += `
mermaid:
  src: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'`;
    }

    // Copyright
    yaml += `

# Copyright
# -------------------------------------------------------------------------
cr_year: ${crYear}
cr_entity: "${escapeYaml(crEntity)}"
cr_license: "${crLicense}"`;

    // Plugins
    yaml += `

# Plugins (GitHub Pages compatible)
# -------------------------------------------------------------------------
plugins:
  - github-pages
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-relative-links`;

    // Update the display
    const configOutput = document.getElementById('generated-config');
    if (configOutput) {
      configOutput.textContent = yaml;
    }

    // Save to localStorage
    saveConfig();

    return yaml;
  }

  // Escape YAML special characters
  function escapeYaml(str) {
    if (!str) return '';
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  // Save configuration to localStorage
  function saveConfig() {
    const formData = {};
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.id && el.id.startsWith('cfg-')) {
        formData[el.id] = el.type === 'checkbox' ? el.checked : el.value;
      }
    });
    localStorage.setItem('zer0-personalization-config', JSON.stringify(formData));
  }

  // Load configuration from localStorage
  function loadConfig() {
    const saved = localStorage.getItem('zer0-personalization-config');
    if (saved) {
      try {
        const formData = JSON.parse(saved);
        Object.keys(formData).forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            if (el.type === 'checkbox') {
              el.checked = formData[id];
            } else {
              el.value = formData[id];
            }
          }
        });
        // Update character count after loading
        if (descInput && charCount) {
          charCount.textContent = descInput.value.length;
        }
      } catch (e) {
        console.warn('Could not load saved configuration:', e);
      }
    }
    generateConfig();
  }

  // Reset all fields
  function resetAll() {
    if (confirm('Reset all fields to defaults? This cannot be undone.')) {
      document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id && el.id.startsWith('cfg-')) {
          if (el.type === 'checkbox') {
            // Reset checkboxes based on their data-default or standard defaults
            el.checked = ['cfg-breadcrumbs', 'cfg-posthog-dnt', 'cfg-posthog-autocapture', 
                         'cfg-mermaid', 'cfg-mathjax', 'cfg-search'].includes(el.id);
          } else if (el.tagName === 'SELECT') {
            el.selectedIndex = 0;
          } else {
            el.value = '';
          }
        }
      });
      // Set specific defaults
      document.getElementById('cfg-locale').value = 'en-US';
      document.getElementById('cfg-title-separator').value = '|';
      document.getElementById('cfg-theme-skin').value = 'dark';
      document.getElementById('cfg-primary-color').value = '#007bff';
      document.getElementById('cfg-primary-color-picker').value = '#007bff';
      document.getElementById('cfg-wpm').value = '200';
      document.getElementById('cfg-paginate').value = '10';
      document.getElementById('cfg-port').value = '4000';
      document.getElementById('cfg-posthog-host').value = 'https://us.i.posthog.com';
      document.getElementById('cfg-cr-year').value = new Date().getFullYear();
      document.getElementById('cfg-markdown').value = 'kramdown';
      document.getElementById('cfg-cr-license').value = 'MIT';
      
      if (charCount) charCount.textContent = '0';
      
      localStorage.removeItem('zer0-personalization-config');
      generateConfig();
    }
  }

  // Copy config to clipboard
  function copyConfig() {
    const config = document.getElementById('generated-config').textContent;
    const btn = document.getElementById('copy-config-btn');
    
    navigator.clipboard.writeText(config).then(() => {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-primary');
      
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please select and copy manually.');
    });
  }

  // Event listeners for all form inputs
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.id && el.id.startsWith('cfg-')) {
      el.addEventListener('input', generateConfig);
      el.addEventListener('change', generateConfig);
    }
  });

  // Button event listeners
  const resetBtn = document.getElementById('reset-all-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetAll);
  
  const copyBtn = document.getElementById('copy-config-btn');
  if (copyBtn) copyBtn.addEventListener('click', copyConfig);

  // Initialize
  loadConfig();
});
</script>

<style>
/* Form styling */
.form-label {
  font-weight: 500;
}

.form-label i {
  margin-right: 0.25rem;
}

.form-control:focus,
.form-select:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
}

.form-control-color {
  width: 50px;
  padding: 0.25rem;
}

/* Card hover effects */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Code block styling */
#generated-config {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Section anchors */
h2[id] {
  scroll-margin-top: 80px;
}

/* Input group styling */
.input-group-text {
  font-size: 0.875rem;
  background-color: var(--bs-gray-100);
}

/* Switch styling */
.form-check-input:checked {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
}

/* Character counter */
#desc-char-count {
  transition: color 0.2s ease;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }
  
  #generated-config {
    font-size: 0.75rem;
  }
}
</style>
