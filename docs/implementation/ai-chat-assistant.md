---
title: AI Chat Assistant Implementation
layout: default
description: Technical implementation details for proxy-first, grounded AI chat in Zer0-Mistakes.
permalink: /docs/implementation/ai-chat-assistant/
feature_id: ZER0-004
version: "0.21.2"
---

# AI Chat Assistant Implementation

## Summary

This document describes the implementation of a page-aware AI chat assistant with a proxy-first architecture that remains compatible with static GitHub Pages deployments.

## Goals

1. Preserve GitHub Pages compatibility.
2. Avoid client-side key exposure by default.
3. Improve response quality and trustworthiness.
4. Keep frontend rendering safe.

## Key Implementation Changes

### 1. Proxy-First Auth Model

Configuration adds:

- `auth_mode`: `proxy` or `direct`
- `proxy_ready`: deployment guard for proxy mode
- `endpoint`: proxy URL (default `/api/chat`)

Rendering is gated so chat only appears when:

1. Proxy mode is selected and proxy is marked ready, or
2. Direct mode has a key value.

This prevents broken chat UI on static environments without a proxy.

### 2. Grounded Answer Strategy

The system prompt now includes grounding rules when `strict_context: true`:

- Answer only from page context.
- Use a deterministic fallback when context is insufficient.
- Avoid fabricated facts.

Configurable fallback:

- `out_of_scope_message`

### 3. Safe Markdown Rendering

Assistant messages use an escape-first renderer with a limited markdown subset:

- headings to strong text
- bold text
- inline code
- safe http/https links
- line breaks

User messages remain plain text.

## Security Considerations

- Proxy mode avoids embedding provider secrets in static HTML.
- Direct mode remains available for local experimentation but is not recommended for production.
- Rendering path escapes HTML before markdown transforms to reduce XSS risk.

## GitHub Pages Compatibility

GitHub Pages is static-only. The assistant remains compatible by delegating AI requests to an external proxy service.

Recommended production state:

```yaml
ai_chat:
  enabled: true
  auth_mode: 'proxy'
  proxy_ready: true
  endpoint: 'https://your-proxy.example.com/v1/chat/completions'
```

## Validation Performed

- Jekyll builds with default local config.
- Jekyll builds with proxy-enabled overlay config.
- Browser interaction checks:
  - toggle open and close
  - strict out-of-scope fallback
  - markdown rendering
  - proxy endpoint request path

## Future Enhancements

- Optional citation snippets from page context.
- Add retry controls and error-class specific UI actions.
- Add lightweight conversation reset controls.
