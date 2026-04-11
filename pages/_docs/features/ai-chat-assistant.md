---
title: AI Chat Assistant
description: Configure the AI chat assistant safely for GitHub Pages using a proxy endpoint.
layout: default
categories:
    - docs
    - features
tags:
    - ai
    - chatbot
    - openai
    - github-pages
    - proxy
permalink: /docs/features/ai-chat-assistant/
difficulty: intermediate
estimated_reading_time: 20 minutes
prerequisites:
    - A deployed proxy endpoint for chat completions
    - OpenAI API key stored outside the static site
    - GitHub Pages site using zer0-mistakes
sidebar:
    nav: docs
---

# AI Chat Assistant

Use the AI chat assistant with page-aware responses while keeping your GitHub Pages site static and secure.

## Why Proxy Mode

GitHub Pages cannot run server-side code. If you call the OpenAI API directly from browser JavaScript, your key is exposed and CORS can fail.

The recommended approach is:

1. Keep the site static on GitHub Pages.
2. Send chat requests to your own proxy endpoint.
3. Let the proxy hold the OpenAI key server-side.

## Configuration

Add this to your production config:

```yaml
ai_chat:
  enabled: true
  auth_mode: 'proxy'
  proxy_ready: true
  endpoint: 'https://your-proxy.example.com/v1/chat/completions'
  strict_context: true
  out_of_scope_message: "I can only answer from the content on this page."
```

### Important Defaults

- `auth_mode: 'proxy'` is the recommended mode.
- `proxy_ready: false` keeps the widget hidden unless your proxy is deployed.
- `strict_context: true` reduces hallucinations by grounding answers to the current page.

## GitHub Pages Compatible Deployment Flow

1. Deploy your proxy endpoint first.
2. Set `proxy_ready: true` and `endpoint` to that proxy URL.
3. Build and publish your Jekyll site as usual.

Example build command:

```bash
jekyll build --config _config.yml
```

No client-side OpenAI key is required in proxy mode.

## Optional Direct Mode (Not Recommended)

Direct mode sends requests from the browser to the provider API and may expose secrets in static output.

```yaml
ai_chat:
  auth_mode: 'direct'
  api_key: 'sk-...'
  endpoint: 'https://api.openai.com/v1/chat/completions'
```

Use direct mode only for temporary local experiments.

## Response Quality Improvements Included

The assistant now includes:

- **Strict grounding**: answers are constrained to page metadata and excerpt context.
- **Out-of-scope fallback**: returns a configured fallback message when context is missing.
- **Safe markdown rendering**: assistant output supports basic markdown formatting without unsafe HTML execution.

## Troubleshooting

### Widget does not appear

Check:

1. `ai_chat.enabled` is `true`.
2. If using proxy mode, `proxy_ready` is `true`.
3. Your `endpoint` is reachable from the browser.

### Requests fail in browser

Check:

1. Proxy endpoint URL is correct.
2. Proxy returns CORS headers for your site origin.
3. Proxy can reach OpenAI and has a valid server-side API key.

### Replies are too generic

Check:

1. `strict_context` is `true`.
2. `context_max_length` is high enough for your page content.
3. `system_prompt` still emphasizes page-only grounding.

## Next Steps

- [PostHog Analytics](posthog-analytics/)
- [Site Search](site-search/)
- [Features Index](/docs/features/)
