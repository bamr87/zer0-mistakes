/**
 * ===================================================================
 * AI Chat Widget — Claude Messages API client with GitHub tool use
 * ===================================================================
 *
 * File: ai-chat.js
 * Path: assets/js/ai-chat.js
 * Purpose: Drives the floating chat assistant rendered by
 *          _includes/components/ai-chat.html. Talks to the Claude
 *          Messages API (streaming, Server-Sent Events) either through
 *          a same-origin proxy (production) or directly from the
 *          browser (local development only), and exposes GitHub
 *          actions — create an issue, propose a page-improvement pull
 *          request — to the model via Claude tool use.
 *
 * Configuration is injected by the include as JSON/text blocks:
 *   #aiChatConfig       — widget + API + GitHub settings
 *   #aiChatPageContext  — page metadata (title, url, source path, …)
 *   #aiChatPageContent  — truncated plain-text page content
 *
 * Request shape (Messages API): POST {model, max_tokens, system,
 * messages, tools?, stream: true}. The response stream is parsed from
 * SSE events (content_block_start / content_block_delta /
 * content_block_stop / message_delta). When the model stops with
 * stop_reason "tool_use" the widget executes the requested tool —
 * creation tools only after an inline user confirmation card — sends
 * the tool_result back, and continues the loop.
 *
 * Security:
 * - Proxy mode (recommended) keeps the Anthropic key and GitHub token
 *   server-side; the browser only ever talks to the same-origin proxy.
 * - Direct mode sends x-api-key from the page and requires the
 *   anthropic-dangerous-direct-browser-access header — local dev only.
 * - GitHub "url" mode never touches a token: it opens pre-filled
 *   github.com forms that the user reviews and submits themselves.
 * - Issue/PR creation always requires an explicit in-chat confirmation.
 * ===================================================================
 */

(function () {
  'use strict';

  var configEl = document.getElementById('aiChatConfig');
  var toggle = document.getElementById('aiChatToggle');
  var panel = document.getElementById('aiChatPanel');
  if (!configEl || !toggle || !panel) return;

  var CONFIG;
  try {
    CONFIG = JSON.parse(configEl.textContent);
  } catch (e) {
    console.warn('AI Chat: invalid configuration JSON', e);
    return;
  }
  CONFIG.github = CONFIG.github || {};

  // --- Constants ---------------------------------------------------
  var ANTHROPIC_DIRECT_URL = 'https://api.anthropic.com/v1/messages';
  var SEND_COOLDOWN_MS = 1000; // Minimum time between sends
  var MAX_MESSAGES = 40;       // Conversation history cap (see trimHistory)
  var MAX_TOOL_ROUNDS = 5;     // Upper bound on tool_use round-trips per send
  var MAX_SOURCE_CHARS = 48000; // Cap on fetched page source fed back to the model

  var STATUS_MESSAGES = {
    401: 'Authentication failed. The API key may be invalid or missing.',
    403: 'Access denied. Check the API key permissions.',
    429: 'Rate limit exceeded. Please wait a moment and try again.',
    500: 'The AI service is temporarily unavailable. Please try again later.',
    503: 'The AI service is temporarily unavailable. Please try again later.',
    529: 'The AI service is overloaded right now. Please try again shortly.'
  };

  // --- State -------------------------------------------------------
  var isOpen = false;
  var isLoading = false;
  var lastSendTime = 0;
  var history = []; // Messages API turns: {role, content: string | block[]}

  // --- DOM ---------------------------------------------------------
  var messagesContainer = document.getElementById('aiChatMessages');
  var form = document.getElementById('aiChatForm');
  var input = document.getElementById('aiChatInput');
  var closeBtn = document.getElementById('aiChatClose');
  var iconOpen = toggle.querySelector('.ai-chat-icon-open');
  var iconClose = toggle.querySelector('.ai-chat-icon-close');

  // --- Page context ------------------------------------------------
  function pageMeta() {
    try {
      return JSON.parse(document.getElementById('aiChatPageContext').textContent);
    } catch (e) {
      console.warn('AI Chat: could not parse page context', e);
      return {};
    }
  }

  function getPageContext(meta) {
    var contentEl = document.getElementById('aiChatPageContent');
    var pageContent = contentEl ? contentEl.textContent.trim() : '';
    var context = 'Current page context:\n';
    if (meta.page_title) context += '- Title: ' + meta.page_title + '\n';
    if (meta.page_description) context += '- Description: ' + meta.page_description + '\n';
    if (meta.page_url) context += '- URL: ' + meta.page_url + '\n';
    if (meta.page_path) context += '- Source file in repository: ' + meta.page_path + '\n';
    if (meta.page_categories && meta.page_categories.length) {
      context += '- Categories: ' + [].concat(meta.page_categories).join(', ') + '\n';
    }
    if (meta.page_tags && meta.page_tags.length) {
      context += '- Tags: ' + [].concat(meta.page_tags).join(', ') + '\n';
    }
    if (meta.page_date) context += '- Date: ' + meta.page_date + '\n';
    if (meta.site_title) context += '- Site: ' + meta.site_title + '\n';
    if (meta.repository) context += '- GitHub repository: ' + meta.repository + '\n';
    if (pageContent) context += '\nPage content:\n' + pageContent + '\n';
    return context;
  }

  // --- System prompt -----------------------------------------------
  function todayISO() {
    try { return new Date().toISOString().slice(0, 10); } catch (e) { return ''; }
  }

  function buildSystemPrompt(meta) {
    var system = CONFIG.systemPrompt || 'You are a helpful assistant.';
    var today = todayISO();
    if (CONFIG.strictContext) {
      system += '\n\nGrounding rules:\n'
        + '- Answer questions ONLY using the provided page context.\n'
        + '- If the answer is not in the page context, reply exactly with: "' + CONFIG.outOfScopeMessage + '"\n'
        + '- Do not invent facts, links, or features.\n'
        + '- These rules restrict how you ANSWER questions; the GitHub tools below may still be used when the user wants to report or improve something.\n';
    }
    if (githubEnabled()) {
      system += '\n\nGitHub actions:\n'
        + '- This site lives in the GitHub repository ' + CONFIG.github.repository + '.\n'
        + '- Use create_github_issue when the user reports a bug, typo, broken link, confusing content, or requests an enhancement. Gather the essentials first (what, where, expected vs actual), then call the tool with a clear title and a well-structured Markdown body.\n';
      if (prToolEnabled()) {
        system += '- Use create_pull_request to propose a concrete improvement to this page\'s content or UI/UX. ALWAYS call get_page_source first and base updated_content on the real source file. updated_content replaces the ENTIRE file: keep the change minimal, preserve the YAML front matter (but set `lastmod` to today, ' + today + '), and do not reformat unrelated lines. The repo runs an automated content review on PRs — follow the page\'s front-matter, SEO, and structure conventions so the change passes.\n';
      } else {
        system += '- Pull requests are not available in this deployment. For content-improvement proposals, file an issue instead and include the suggested replacement text in the body.\n';
      }
      system += '- The site shows the user a confirmation card before anything is created — you do not need to ask "shall I create it?" once the details are clear.\n'
        + '- After a tool succeeds, give the user a one-sentence summary with the link if one was returned.\n';
    }
    if (CONFIG.localEdit) {
      system += '\n\nEditing this page (local development):\n'
        + '- Use update_page_content to apply content or UI-copy improvements directly to the CURRENT page\'s source file. The change takes effect immediately on the local dev server.\n'
        + '- ALWAYS call get_page_source first and base updated_content on the real file. updated_content replaces the ENTIRE file: change only what the user asked, preserve the YAML front matter (but set `lastmod` to today, ' + today + '), and do not reformat unrelated lines.\n'
        + '- Prefer this over opening a pull request when the user just wants to change this page locally. The site shows a confirmation card before writing.\n';
    }
    var context = getPageContext(meta);
    if (context) system += '\n\n' + context;
    return system;
  }

  // --- Tools -------------------------------------------------------
  function githubEnabled() {
    return Boolean(CONFIG.github.enabled && CONFIG.github.repository);
  }

  function prToolEnabled() {
    return githubEnabled() && CONFIG.github.mode === 'proxy';
  }

  function buildTools() {
    if (!githubEnabled() && !CONFIG.localEdit) return [];
    var tools = [
      {
        name: 'get_page_source',
        description: 'Fetch the raw source (Markdown/HTML/SCSS/…) of a file in the site\'s GitHub repository. '
          + 'Call this before proposing any content change so edits are based on the actual source file rather than the rendered page text. '
          + 'Defaults to the current page\'s source file.',
        input_schema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'Repository-relative path, e.g. "pages/_posts/2026-01-01-example.md". Omit to use the current page\'s source path.'
            }
          },
          required: []
        }
      },
      {
        name: 'create_github_issue',
        description: 'Open a GitHub issue on the site\'s repository. '
          + 'Call this when the user reports a bug, typo, broken link, or confusing content, or requests an enhancement to the page or site UI/UX. '
          + 'Summarize the conversation into a specific title and a Markdown body with context (page URL, what is wrong, expected behavior). '
          + 'The user confirms in the chat before the issue is created.',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Concise, specific issue title.' },
            body: { type: 'string', description: 'Markdown issue body. Include the page URL, a description of the problem or request, and any reproduction steps or suggested fix.' },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional labels, e.g. ["bug"] or ["enhancement"].'
            }
          },
          required: ['title', 'body']
        }
      }
    ];
    if (prToolEnabled()) {
      tools.push({
        name: 'create_pull_request',
        description: 'Create a GitHub pull request that updates ONE source file with improved content — page copy, front matter, or UI/UX tweaks. '
          + 'You MUST call get_page_source first and derive updated_content from it: updated_content replaces the entire file. '
          + 'Keep the diff minimal and preserve the YAML front matter. The user confirms in the chat before the pull request is created.',
        input_schema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Repository-relative path of the file to update.' },
            title: { type: 'string', description: 'Pull request title (imperative, e.g. "Clarify installation steps").' },
            body: { type: 'string', description: 'Markdown PR description: what changed, why, and a link to the page.' },
            updated_content: { type: 'string', description: 'The COMPLETE new file content, based on get_page_source output with the improvement applied.' },
            branch_name: { type: 'string', description: 'Optional branch name (lowercase, hyphenated). One is generated when omitted.' }
          },
          required: ['file_path', 'title', 'body', 'updated_content']
        }
      });
    }
    if (CONFIG.localEdit) {
      tools.push({
        name: 'update_page_content',
        description: 'Apply improved content to the CURRENT page\'s source file in the local working tree (local development only). '
          + 'Call get_page_source first and base updated_content on it — updated_content replaces the ENTIRE file. '
          + 'Preserve the YAML front matter and change only what the user asked. The user confirms in the chat before the file is written, and the dev server reloads it.',
        input_schema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Repository-relative path; omit to use the current page\'s source file.' },
            updated_content: { type: 'string', description: 'The COMPLETE new file content, based on get_page_source with the change applied.' },
            summary: { type: 'string', description: 'One-line summary of what changed.' }
          },
          required: ['updated_content']
        }
      });
    }
    return tools;
  }

  // --- Rendering helpers ---------------------------------------------
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderAssistantMarkdown(raw) {
    // Escape first, then allow a small markdown subset safely.
    var safe = escapeHtml(raw || '');
    safe = safe
      .replace(/^###\s+(.+)$/gm, '<strong>$1</strong>')
      .replace(/^##\s+(.+)$/gm, '<strong>$1</strong>')
      .replace(/^#\s+(.+)$/gm, '<strong>$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^\s*[-*]\s+(.+)$/gm, '• $1')
      .replace(/\n/g, '<br>');
    return safe;
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendMessage(role, content) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ai-chat-message ai-chat-message--' + role + ' mb-2';
    var bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble p-2 rounded-3 small';
    if (role === 'assistant') {
      bubble.innerHTML = renderAssistantMarkdown(content);
    } else {
      bubble.textContent = content;
    }
    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
    return bubble;
  }

  function showTyping() {
    removeTyping();
    var wrapper = document.createElement('div');
    wrapper.className = 'ai-chat-message ai-chat-message--assistant mb-2';
    wrapper.id = 'aiChatLoading';
    var bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble p-2 rounded-3 small';
    bubble.innerHTML = '<span class="ai-chat-typing"><span>.</span><span>.</span><span>.</span></span>';
    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
  }

  function removeTyping() {
    var loading = document.getElementById('aiChatLoading');
    if (loading) loading.remove();
  }

  // Inline confirmation card for creation tools. Resolves true/false.
  function requestConfirmation(opts) {
    return new Promise(function (resolve) {
      var card = document.createElement('div');
      card.className = 'ai-chat-action-card rounded-3 p-2 mb-2 small';

      var heading = document.createElement('div');
      heading.className = 'fw-semibold mb-1';
      heading.textContent = opts.heading;
      card.appendChild(heading);

      (opts.fields || []).forEach(function (field) {
        if (!field.value) return;
        var row = document.createElement('div');
        row.className = 'ai-chat-action-meta';
        var label = document.createElement('span');
        label.className = 'text-muted';
        label.textContent = field.label + ': ';
        var value = document.createElement('span');
        value.textContent = field.value;
        row.appendChild(label);
        row.appendChild(value);
        card.appendChild(row);
      });

      var buttons = document.createElement('div');
      buttons.className = 'd-flex gap-2 mt-2';
      var confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'btn btn-primary btn-sm';
      confirmBtn.textContent = opts.confirmLabel || 'Confirm';
      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-outline-secondary btn-sm';
      cancelBtn.textContent = 'Cancel';
      buttons.appendChild(confirmBtn);
      buttons.appendChild(cancelBtn);
      card.appendChild(buttons);

      function finish(result) {
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        card.classList.add('ai-chat-action-card--resolved');
        resolve(result);
      }
      confirmBtn.addEventListener('click', function () { finish(true); });
      cancelBtn.addEventListener('click', function () { finish(false); });

      messagesContainer.appendChild(card);
      scrollToBottom();
    });
  }

  // Result card with a link to the created issue / pull request.
  function appendLinkCard(label, url) {
    if (!/^https:\/\/github\.com\//.test(url)) return;
    var card = document.createElement('div');
    card.className = 'ai-chat-action-card rounded-3 p-2 mb-2 small';
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label + ' ↗';
    card.appendChild(link);
    messagesContainer.appendChild(card);
    scrollToBottom();
  }

  // --- Claude Messages API (streaming) -------------------------------
  function apiUrl() {
    if (CONFIG.authMode === 'direct') {
      // Direct mode talks straight to Anthropic unless an explicit
      // non-proxy endpoint was configured (e.g. a mock for testing).
      if (!CONFIG.endpoint || CONFIG.endpoint === '/api/chat') return ANTHROPIC_DIRECT_URL;
    }
    return CONFIG.endpoint;
  }

  async function streamClaude(payload, onTextDelta) {
    var headers = { 'content-type': 'application/json' };
    if (CONFIG.authMode === 'direct') {
      headers['x-api-key'] = CONFIG.apiKey;
      headers['anthropic-version'] = CONFIG.anthropicVersion || '2023-06-01';
      // Required for browser (CORS) access to the Anthropic API.
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    var response = await fetch(apiUrl(), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      var errorData = await response.json().catch(function () { return {}; });
      var apiMessage = errorData.error && errorData.error.message;
      throw new Error(apiMessage || STATUS_MESSAGES[response.status] || 'API request failed (' + response.status + ')');
    }

    // Proxies may answer non-streaming JSON; accept both.
    var contentType = response.headers.get('content-type') || '';
    if (contentType.indexOf('text/event-stream') === -1) {
      var data = await response.json();
      return { content: data.content || [], stopReason: data.stop_reason || null };
    }

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var blocks = [];
    var partialJson = {};
    var stopReason = null;

    function handleEvent(evt) {
      switch (evt.type) {
        case 'content_block_start':
          blocks[evt.index] = Object.assign({}, evt.content_block);
          if (evt.content_block.type === 'tool_use') partialJson[evt.index] = '';
          break;
        case 'content_block_delta':
          if (evt.delta.type === 'text_delta') {
            blocks[evt.index].text = (blocks[evt.index].text || '') + evt.delta.text;
            if (onTextDelta) onTextDelta(evt.delta.text);
          } else if (evt.delta.type === 'input_json_delta') {
            partialJson[evt.index] += evt.delta.partial_json;
          }
          break;
        case 'content_block_stop':
          if (blocks[evt.index] && blocks[evt.index].type === 'tool_use') {
            try {
              blocks[evt.index].input = partialJson[evt.index] ? JSON.parse(partialJson[evt.index]) : {};
            } catch (e) {
              blocks[evt.index].input = {};
            }
          }
          break;
        case 'message_delta':
          if (evt.delta && evt.delta.stop_reason) stopReason = evt.delta.stop_reason;
          break;
        case 'error':
          throw new Error((evt.error && evt.error.message) || 'Stream error');
      }
    }

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      var newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        var line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (line.indexOf('data:') !== 0) continue;
        var dataStr = line.slice(5).trim();
        if (!dataStr) continue;
        var evt;
        try { evt = JSON.parse(dataStr); } catch (e) { continue; }
        handleEvent(evt);
      }
    }

    // Keep only the block types we replay into history (no thinking blocks
    // are requested, but stay defensive against future stream additions).
    var content = blocks.filter(Boolean).map(function (block) {
      if (block.type === 'text') return { type: 'text', text: block.text || '' };
      if (block.type === 'tool_use') return { type: 'tool_use', id: block.id, name: block.name, input: block.input || {} };
      return null;
    }).filter(Boolean);

    return { content: content, stopReason: stopReason };
  }

  // --- Tool execution -------------------------------------------------
  function toolResult(toolUseId, content, isError) {
    var result = { type: 'tool_result', tool_use_id: toolUseId, content: content };
    if (isError) result.is_error = true;
    return result;
  }

  function sanitizeRepoPath(path) {
    var clean = String(path || '').replace(/^\/+/, '').trim();
    if (!clean || clean.indexOf('..') !== -1 || clean.indexOf('\\') !== -1) return null;
    return clean;
  }

  async function execGetPageSource(block, meta) {
    var path = sanitizeRepoPath((block.input && block.input.file_path) || meta.page_path);
    if (!path) return toolResult(block.id, 'No valid source path is available for this page.', true);

    // Local dev: read the working-tree file via the dev proxy so edits are
    // based on the real local source (which may differ from GitHub).
    if (CONFIG.localEdit) {
      try {
        var localResp = await fetch(CONFIG.localEditEndpoint + '/source?path=' + encodeURIComponent(path));
        var localData = await localResp.json().catch(function () { return {}; });
        if (!localResp.ok) {
          return toolResult(block.id, 'Could not read local source for ' + path + ': ' + ((localData.error && localData.error.message) || localResp.status), true);
        }
        var localText = localData.content || '';
        if (localText.length > MAX_SOURCE_CHARS) {
          localText = localText.slice(0, MAX_SOURCE_CHARS) + '\n\n[... truncated: file exceeds ' + MAX_SOURCE_CHARS + ' characters ...]';
        }
        return toolResult(block.id, 'Source of ' + path + ' (local working tree):\n\n' + localText);
      } catch (e) {
        return toolResult(block.id, 'Network error reading local source: ' + e.message, true);
      }
    }

    var url = 'https://raw.githubusercontent.com/' + CONFIG.github.repository + '/'
      + (CONFIG.github.baseBranch || 'main').split('/').map(encodeURIComponent).join('/') + '/'
      + path.split('/').map(encodeURIComponent).join('/');
    var response;
    try {
      response = await fetch(url);
    } catch (e) {
      return toolResult(block.id, 'Network error fetching ' + path + ': ' + e.message, true);
    }
    if (!response.ok) {
      return toolResult(block.id, 'Could not fetch source for ' + path + ' (HTTP ' + response.status + '). The file may not exist on branch ' + (CONFIG.github.baseBranch || 'main') + '.', true);
    }
    var text = await response.text();
    if (text.length > MAX_SOURCE_CHARS) {
      text = text.slice(0, MAX_SOURCE_CHARS) + '\n\n[... truncated: file exceeds ' + MAX_SOURCE_CHARS + ' characters ...]';
    }
    return toolResult(block.id, 'Source of ' + path + ':\n\n' + text);
  }

  function mergedLabels(labels) {
    var merged = [].concat(labels || [], CONFIG.github.defaultLabels || []);
    return merged.filter(function (label, i) { return label && merged.indexOf(label) === i; });
  }

  async function githubProxyPost(path, body) {
    var response = await fetch(CONFIG.github.endpoint + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      throw new Error((data.error && data.error.message) || 'GitHub proxy request failed (' + response.status + ')');
    }
    return data;
  }

  async function execCreateIssue(block, meta) {
    var inputData = block.input || {};
    if (!inputData.title || !inputData.body) {
      return toolResult(block.id, 'Missing required fields: title and body.', true);
    }
    var issueBody = String(inputData.body || '');
    var confirmed = await requestConfirmation({
      heading: 'Create a GitHub issue?',
      fields: [
        { label: 'Repository', value: CONFIG.github.repository },
        { label: 'Title', value: inputData.title },
        { label: 'Labels', value: mergedLabels(inputData.labels).join(', ') },
        { label: 'Body', value: issueBody.slice(0, 280) + (issueBody.length > 280 ? '…' : '') }
      ],
      confirmLabel: CONFIG.github.mode === 'proxy' ? 'Create issue' : 'Open issue form'
    });
    if (!confirmed) {
      return toolResult(block.id, 'The user declined this action in the confirmation dialog. Do not retry unless they ask again.');
    }

    if (CONFIG.github.mode === 'proxy') {
      try {
        var created = await githubProxyPost('/issue', {
          title: inputData.title,
          body: inputData.body,
          labels: mergedLabels(inputData.labels)
        });
        appendLinkCard('Issue #' + created.number + ' created', created.url);
        return toolResult(block.id, 'Issue created: ' + created.url);
      } catch (e) {
        return toolResult(block.id, 'Failed to create issue: ' + e.message, true);
      }
    }

    // URL mode: open a pre-filled github.com form — the user submits it
    // with their own account, so no token is ever needed in the browser.
    var params = new URLSearchParams();
    params.set('title', String(inputData.title).slice(0, 256));
    var body = String(inputData.body);
    if (meta.page_url && body.indexOf(meta.page_url) === -1) {
      body += '\n\n---\nPage: ' + meta.page_url;
    }
    params.set('body', body.slice(0, 6000));
    var labels = mergedLabels(inputData.labels);
    if (labels.length) params.set('labels', labels.join(','));
    window.open('https://github.com/' + CONFIG.github.repository + '/issues/new?' + params.toString(), '_blank', 'noopener');
    return toolResult(block.id, 'A pre-filled GitHub issue form was opened in a new browser tab. The user reviews and submits it there (a GitHub account is required).');
  }

  async function execCreatePullRequest(block) {
    var inputData = block.input || {};
    if (!inputData.file_path || !inputData.title || !inputData.body || !inputData.updated_content) {
      return toolResult(block.id, 'Missing required fields: file_path, title, body, updated_content.', true);
    }
    var path = sanitizeRepoPath(inputData.file_path);
    if (!path) return toolResult(block.id, 'Invalid file path: ' + inputData.file_path, true);

    var prBody = String(inputData.body || '');
    var confirmed = await requestConfirmation({
      heading: 'Open a pull request?',
      fields: [
        { label: 'Repository', value: CONFIG.github.repository },
        { label: 'File', value: path },
        { label: 'Title', value: inputData.title },
        { label: 'Summary', value: prBody.slice(0, 280) + (prBody.length > 280 ? '…' : '') }
      ],
      confirmLabel: 'Create pull request'
    });
    if (!confirmed) {
      return toolResult(block.id, 'The user declined this action in the confirmation dialog. Do not retry unless they ask again.');
    }

    try {
      var created = await githubProxyPost('/pull-request', {
        title: inputData.title,
        body: inputData.body,
        file_path: path,
        updated_content: inputData.updated_content,
        branch_name: inputData.branch_name || ''
      });
      appendLinkCard('Pull request #' + created.number + ' opened', created.url);
      return toolResult(block.id, 'Pull request created: ' + created.url);
    } catch (e) {
      return toolResult(block.id, 'Failed to create pull request: ' + e.message, true);
    }
  }

  // Result card with a button to reload the page after a local edit.
  function appendReloadCard(path) {
    var card = document.createElement('div');
    card.className = 'ai-chat-action-card rounded-3 p-2 mb-2 small';
    var label = document.createElement('div');
    label.className = 'mb-1';
    label.textContent = 'Updated ' + path + ' — the dev server will rebuild it.';
    card.appendChild(label);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary btn-sm';
    btn.textContent = 'Reload page';
    btn.addEventListener('click', function () { window.location.reload(); });
    card.appendChild(btn);
    messagesContainer.appendChild(card);
    scrollToBottom();
  }

  async function execUpdatePageContent(block, meta) {
    var inputData = block.input || {};
    var path = sanitizeRepoPath(inputData.file_path || meta.page_path);
    if (!path) return toolResult(block.id, 'No valid source path is available for this page.', true);
    if (!inputData.updated_content) return toolResult(block.id, 'Missing updated_content.', true);

    var confirmed = await requestConfirmation({
      heading: 'Apply this edit to the current page?',
      fields: [
        { label: 'File', value: path },
        { label: 'Change', value: inputData.summary || '(no summary provided)' },
        { label: 'New length', value: inputData.updated_content.length + ' characters' }
      ],
      confirmLabel: 'Apply edit'
    });
    if (!confirmed) {
      return toolResult(block.id, 'The user declined the edit in the confirmation dialog. Do not retry unless they ask again.');
    }

    try {
      var response = await fetch(CONFIG.localEditEndpoint + '/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file_path: path, updated_content: inputData.updated_content })
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        return toolResult(block.id, 'Failed to update the page: ' + ((data.error && data.error.message) || response.status), true);
      }
      appendReloadCard(data.path || path);
      return toolResult(block.id, 'Updated ' + (data.path || path) + ' (' + (data.bytes || 0) + ' bytes) in the local working tree. The dev server rebuilds and reloads it.');
    } catch (e) {
      return toolResult(block.id, 'Failed to update the page: ' + e.message, true);
    }
  }

  async function executeToolUse(block, meta) {
    switch (block.name) {
      case 'get_page_source': return execGetPageSource(block, meta);
      case 'create_github_issue': return execCreateIssue(block, meta);
      case 'create_pull_request': return execCreatePullRequest(block);
      case 'update_page_content': return execUpdatePageContent(block, meta);
      default: return toolResult(block.id, 'Unknown tool: ' + block.name, true);
    }
  }

  // --- History management ----------------------------------------------
  // Trim from the front, then keep trimming until the history starts with a
  // plain user text turn — never orphan a tool_result from its tool_use.
  function trimHistory() {
    while (history.length > MAX_MESSAGES) history.shift();
    while (history.length && !(history[0].role === 'user' && typeof history[0].content === 'string')) {
      history.shift();
    }
  }

  // --- Send / agentic loop ----------------------------------------------
  async function sendMessage(userMessage) {
    if (isLoading || !userMessage.trim()) return;
    var now = Date.now();
    if (now - lastSendTime < SEND_COOLDOWN_MS) return;
    lastSendTime = now;

    appendMessage('user', userMessage);
    history.push({ role: 'user', content: userMessage });

    isLoading = true;
    input.disabled = true;
    showTyping();

    var meta = pageMeta();
    var tools = buildTools();
    var sawText = false;

    try {
      for (var round = 0; round < MAX_TOOL_ROUNDS; round++) {
        var bubble = null;
        var accumulated = '';
        var payload = {
          model: CONFIG.model,
          max_tokens: CONFIG.maxTokens,
          system: buildSystemPrompt(meta),
          messages: history.slice(),
          stream: true
        };
        if (tools.length) payload.tools = tools;

        var result = await streamClaude(payload, function (delta) {
          if (!bubble) {
            removeTyping();
            bubble = appendMessage('assistant', '');
          }
          accumulated += delta;
          bubble.textContent = accumulated; // plain text while streaming
          scrollToBottom();
        });

        removeTyping();
        if (bubble && accumulated) {
          bubble.innerHTML = renderAssistantMarkdown(accumulated); // final markdown pass
          sawText = true;
        } else if (!bubble) {
          // Non-streaming response (proxy returned JSON, not SSE): no text deltas
          // arrived, so render any text blocks from the final content.
          var textOut = result.content
            .filter(function (b) { return b.type === 'text'; })
            .map(function (b) { return b.text || ''; })
            .join('')
            .trim();
          if (textOut) {
            appendMessage('assistant', textOut);
            sawText = true;
          }
        }
        if (result.content.length) {
          history.push({ role: 'assistant', content: result.content });
        }

        var toolUses = result.content.filter(function (b) { return b.type === 'tool_use'; });
        if (result.stopReason !== 'tool_use' || !toolUses.length) break;

        var results = [];
        for (var i = 0; i < toolUses.length; i++) {
          results.push(await executeToolUse(toolUses[i], meta));
        }
        history.push({ role: 'user', content: results });
        showTyping();
      }

      if (!sawText) {
        appendMessage('assistant', CONFIG.outOfScopeMessage || 'Sorry, I could not generate a response.');
      }
    } catch (error) {
      removeTyping();
      appendMessage('assistant', 'Sorry, something went wrong: ' + error.message);
      console.error('AI Chat error:', error);
    } finally {
      isLoading = false;
      input.disabled = false;
      input.focus();
      trimHistory();
    }
  }

  // --- UI wiring ---------------------------------------------------------
  function toggleChat() {
    isOpen = !isOpen;
    panel.classList.toggle('ai-chat-panel--open', isOpen);
    panel.setAttribute('aria-hidden', String(!isOpen));
    toggle.setAttribute('aria-expanded', String(isOpen));
    iconOpen.classList.toggle('d-none', isOpen);
    iconClose.classList.toggle('d-none', !isOpen);
    if (isOpen) {
      setTimeout(function () { input.focus(); }, 50);
    }
  }

  function init() {
    appendMessage('assistant', CONFIG.welcomeMessage);

    toggle.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = input.value.trim();
      if (msg) {
        input.value = '';
        sendMessage(msg);
      }
    });

    // Quick-action chips (rendered only when GitHub actions are enabled)
    panel.querySelectorAll('.ai-chat-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var prompt = chip.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) toggleChat();
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !panel.contains(e.target) && !toggle.contains(e.target)) {
        toggleChat();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
