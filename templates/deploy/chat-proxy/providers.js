// Feature: ZER0-087
/**
 * ===================================================================
 * Chat proxy — provider layer (Claude + Grok)
 * ===================================================================
 *
 * File: providers.js
 * Path: templates/deploy/chat-proxy/providers.js
 * Purpose: Everything provider-specific that BOTH the Cloudflare Worker
 *          (worker.js) and the Node dev proxy (dev-proxy.mjs) need, in one
 *          dependency-free ES module: the provider catalog, credential
 *          detection, server-side provider/model selection, and — the part
 *          that keeps every client unchanged — a two-way translation between
 *          the Anthropic Messages API dialect the widgets speak and the
 *          OpenAI-compatible chat API that xAI's Grok exposes.
 *
 * Why translate instead of teaching the clients two dialects?
 *   assets/js/ai-chat.js, assets/js/site-builder.js and the feedback
 *   triage (handleFeedback) all parse Anthropic SSE events and content
 *   blocks (text / tool_use / tool_result). Converting xAI's stream into
 *   those same events on the server means one client code path, one
 *   tool-use loop, one confirmation-card contract — and a provider switch
 *   is a server-side decision the page cannot tamper with.
 *
 * Runtime constraints: plain ESM, no Node built-ins, only web platform
 * globals (TextEncoder/Decoder, TransformStream, crypto.randomUUID) so it
 * runs unchanged on Workers and on Node >= 20.
 * ===================================================================
 */

export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const XAI_BASE_URL = 'https://api.x.ai/v1';
export const OPENAI_BASE_URL = 'https://api.openai.com/v1';

/**
 * Chat providers the proxy can route a conversation to. `envKeys` are the
 * secrets that configure the provider (first configured wins); `modelVar`
 * is the server-side model pin; `models` is the catalog the Site Builder
 * offers (the pin still wins).
 */
export const PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    label: 'Claude',
    vendor: 'Anthropic',
    envKeys: ['ANTHROPIC_OAUTH_REFRESH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_API_KEY'],
    modelVar: 'CHAT_MODEL',
    baseUrlVar: 'ANTHROPIC_BASE_URL',
    modelPattern: /^claude-/,
    defaultModel: 'claude-opus-4-8',
    models: ['claude-opus-4-8', 'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
    tokenHint: 'sk-ant-oat01-... from `claude setup-token`, or an sk-ant-api... key',
    console: 'https://console.anthropic.com/',
  },
  xai: {
    id: 'xai',
    label: 'Grok',
    vendor: 'xAI',
    envKeys: ['XAI_API_KEY'],
    modelVar: 'XAI_CHAT_MODEL',
    baseUrlVar: 'XAI_BASE_URL',
    modelPattern: /^grok-/,
    defaultModel: 'grok-4.6',
    models: ['grok-4.6', 'grok-4.5', 'grok-4.3'],
    tokenHint: 'xai-... API key from console.x.ai',
    console: 'https://console.x.ai/',
  },
};

/** Image renderers. xAI's Imagine API and OpenAI's Images API share one request shape. */
export const IMAGE_PROVIDERS = {
  xai: {
    id: 'xai',
    label: 'Grok Imagine',
    vendor: 'xAI',
    envKeys: ['XAI_API_KEY'],
    modelVar: 'XAI_IMAGE_MODEL',
    baseUrlVar: 'XAI_BASE_URL',
    defaultModel: 'grok-imagine-image-2.0',
    models: ['grok-imagine-image-2.0', 'grok-imagine-image'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '5:2'],
  },
  openai: {
    id: 'openai',
    label: 'OpenAI Images',
    vendor: 'OpenAI',
    envKeys: ['OPENAI_API_KEY'],
    modelVar: 'OPENAI_IMAGE_MODEL',
    baseUrlVar: 'OPENAI_BASE_URL',
    defaultModel: 'gpt-image-2',
    models: ['gpt-image-2', 'gpt-image-1'],
    sizes: ['1024x1024', '1536x1024', '1024x1536'],
  },
};

export function providerIds() { return Object.keys(PROVIDERS); }
export function imageProviderIds() { return Object.keys(IMAGE_PROVIDERS); }

// --- Credentials ---------------------------------------------------------

// Auth precedence for Anthropic, highest first (do not reorder — see
// .github/instructions/ai-chat.instructions.md §2):
//   'oauth_refresh' — ANTHROPIC_OAUTH_REFRESH_TOKEN (rotating, KV-cached)
//   'oauth_static'  — CLAUDE_CODE_OAUTH_TOKEN (long-lived Bearer, no refresh)
//   'api_key'       — ANTHROPIC_API_KEY (x-api-key)
export function anthropicAuthMode(env) {
  if (env.ANTHROPIC_OAUTH_REFRESH_TOKEN) return 'oauth_refresh';
  if (env.CLAUDE_CODE_OAUTH_TOKEN) return 'oauth_static';
  if (env.ANTHROPIC_API_KEY) return 'api_key';
  return null;
}

/** Which chat providers the environment configures: { anthropic: mode|null, xai: 'api_key'|null }. */
export function configuredProviders(env) {
  return {
    anthropic: anthropicAuthMode(env),
    xai: env.XAI_API_KEY ? 'api_key' : null,
  };
}

/** Which image renderers the environment configures. */
export function configuredImageProviders(env) {
  return {
    xai: env.XAI_API_KEY ? 'api_key' : null,
    openai: env.OPENAI_API_KEY ? 'api_key' : null,
  };
}

/**
 * Classify a user-supplied token for a provider by shape. Returns the env key
 * the token belongs under and the auth kind, or an error. Never logs the value.
 */
export function detectCredential(provider, token) {
  const value = typeof token === 'string' ? token.trim() : '';
  if (!value) return { ok: false, error: 'token is required' };
  if (value.length < 16 || value.length > 4096 || /\s/.test(value)) {
    return { ok: false, error: 'that does not look like an API token' };
  }
  switch (provider) {
    case 'anthropic':
      if (/^sk-ant-oat\d{2}-/.test(value)) return { ok: true, provider, kind: 'oauth_static', envKey: 'CLAUDE_CODE_OAUTH_TOKEN' };
      if (/^sk-ant-/.test(value)) return { ok: true, provider, kind: 'api_key', envKey: 'ANTHROPIC_API_KEY' };
      return { ok: false, error: 'Claude tokens start with sk-ant-oat01- (claude setup-token) or sk-ant-api...' };
    case 'xai':
      if (/^xai-/.test(value)) return { ok: true, provider, kind: 'api_key', envKey: 'XAI_API_KEY' };
      return { ok: false, error: 'xAI keys start with xai-' };
    case 'openai':
      if (/^sk-/.test(value) && !/^sk-ant-/.test(value)) return { ok: true, provider, kind: 'api_key', envKey: 'OPENAI_API_KEY' };
      return { ok: false, error: 'OpenAI keys start with sk-' };
    default:
      return { ok: false, error: `unknown provider: ${provider}` };
  }
}

/** "....c3f9" — enough to recognise a token, never enough to use it. */
export function maskToken(token) {
  const value = typeof token === 'string' ? token.trim() : '';
  if (!value) return '';
  return '••••' + value.slice(-4);
}

// --- Provider + model selection (server-side, authoritative) ---------------

/**
 * Pick the chat provider for a request. CHAT_PROVIDER pins it server-side;
 * 'auto' (default) honours a configured client preference, else the first
 * configured provider in catalog order. Returns null when nothing is usable.
 */
export function selectProvider(env, requested) {
  const conf = configuredProviders(env);
  const pin = String(env.CHAT_PROVIDER || 'auto').toLowerCase();
  if (pin !== 'auto') return PROVIDERS[pin] && conf[pin] ? pin : null;
  const want = String(requested || '').toLowerCase();
  if (want && PROVIDERS[want] && conf[want]) return want;
  return providerIds().filter((id) => conf[id])[0] || null;
}

/**
 * The model to send. A server pin (CHAT_MODEL / XAI_CHAT_MODEL) always wins;
 * otherwise a client model is accepted only when it belongs to the provider's
 * family (a `grok-` model can't be sent to Anthropic and vice versa), else the
 * provider default.
 */
export function resolveModel(env, provider, requested) {
  const p = PROVIDERS[provider];
  if (!p) return null;
  const pinned = env[p.modelVar];
  if (pinned) return String(pinned);
  const want = String(requested || '').trim();
  if (want && p.modelPattern.test(want) && /^[a-z0-9][a-z0-9.:_-]{1,63}$/i.test(want)) return want;
  return p.defaultModel;
}

/** Pick the image renderer: IMAGE_PROVIDER pins; else the request; else xai, then openai. */
export function selectImageProvider(env, requested) {
  const conf = configuredImageProviders(env);
  const pin = String(env.IMAGE_PROVIDER || 'auto').toLowerCase();
  if (pin !== 'auto') return IMAGE_PROVIDERS[pin] && conf[pin] ? pin : null;
  const want = String(requested || '').toLowerCase();
  if (want && IMAGE_PROVIDERS[want] && conf[want]) return want;
  return imageProviderIds().filter((id) => conf[id])[0] || null;
}

export function resolveImageModel(env, provider, requested) {
  const p = IMAGE_PROVIDERS[provider];
  if (!p) return null;
  const pinned = env[p.modelVar];
  if (pinned) return String(pinned);
  const want = String(requested || '').trim();
  if (want && p.models.indexOf(want) !== -1) return want;
  return p.defaultModel;
}

export function anthropicUrl(env) {
  const base = env && env.ANTHROPIC_BASE_URL ? String(env.ANTHROPIC_BASE_URL).replace(/\/+$/, '') : '';
  return base ? `${base}/v1/messages` : ANTHROPIC_URL;
}

export function openAIBase(provider, env) {
  const spec = PROVIDERS[provider] || IMAGE_PROVIDERS[provider];
  const override = spec && env && env[spec.baseUrlVar];
  if (override) return String(override).replace(/\/+$/, '');
  return provider === 'openai' ? OPENAI_BASE_URL : XAI_BASE_URL;
}

export function bearerHeaders(provider, env) {
  const key = provider === 'openai' ? env.OPENAI_API_KEY : env.XAI_API_KEY;
  if (!key) throw new Error(`No ${provider === 'openai' ? 'OPENAI_API_KEY' : 'XAI_API_KEY'} configured`);
  return { authorization: `Bearer ${key}`, 'content-type': 'application/json' };
}

// --- Anthropic -> OpenAI-compatible request -------------------------------

function systemText(system) {
  if (!system) return '';
  if (typeof system === 'string') return system;
  if (Array.isArray(system)) return system.map((b) => (b && b.type === 'text' ? b.text : '')).filter(Boolean).join('\n\n');
  return '';
}

function blockText(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((b) => (b && b.type === 'text' ? b.text : '')).filter(Boolean).join('\n');
  return String(content);
}

/**
 * Convert an Anthropic Messages request ({system, messages, tools}) into an
 * OpenAI-compatible chat.completions body. tool_use <-> tool_calls,
 * tool_result <-> role:"tool" messages, input_schema <-> parameters.
 */
export function anthropicToOpenAIChat(payload, { model, maxTokens, stream = true } = {}) {
  const messages = [];
  const sys = systemText(payload.system);
  if (sys) messages.push({ role: 'system', content: sys });

  for (const m of Array.isArray(payload.messages) ? payload.messages : []) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    if (typeof m.content === 'string') {
      messages.push({ role: m.role, content: m.content });
      continue;
    }
    const blocks = Array.isArray(m.content) ? m.content : [];
    if (m.role === 'user') {
      const texts = [];
      for (const b of blocks) {
        if (!b) continue;
        if (b.type === 'tool_result') {
          // A tool message must follow the assistant turn that requested it —
          // Anthropic puts tool_results first in the next user turn, so order
          // is preserved by emitting them before any free text.
          messages.push({ role: 'tool', tool_call_id: String(b.tool_use_id || ''), content: blockText(b.content) || (b.is_error ? 'error' : '(empty)') });
        } else if (b.type === 'text') {
          texts.push(b.text || '');
        }
      }
      if (texts.length) messages.push({ role: 'user', content: texts.join('\n') });
    } else {
      const texts = [];
      const calls = [];
      for (const b of blocks) {
        if (!b) continue;
        if (b.type === 'text') texts.push(b.text || '');
        else if (b.type === 'tool_use') calls.push({ id: String(b.id || ''), type: 'function', function: { name: String(b.name || ''), arguments: JSON.stringify(b.input || {}) } });
      }
      const msg = { role: 'assistant', content: texts.join('\n') };
      if (calls.length) msg.tool_calls = calls;
      if (msg.content || calls.length) messages.push(msg);
    }
  }

  const out = { model, messages, max_tokens: maxTokens, stream: !!stream };
  if (Array.isArray(payload.tools) && payload.tools.length) {
    out.tools = payload.tools.map((t) => ({
      type: 'function',
      function: {
        name: String(t.name || ''),
        description: String(t.description || ''),
        parameters: t.input_schema || { type: 'object', properties: {} },
      },
    }));
  }
  return out;
}

// --- OpenAI-compatible -> Anthropic responses ------------------------------

function mapFinishReason(reason, sawToolCalls) {
  if (reason === 'tool_calls' || reason === 'function_call' || sawToolCalls) return 'tool_use';
  if (reason === 'length') return 'max_tokens';
  return 'end_turn';
}

function safeParse(text) {
  if (!text) return {};
  try { return JSON.parse(text); } catch (err) { return {}; }
}

function randomId(prefix) {
  const rnd = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    : Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
  return `${prefix}_${rnd}`;
}

function usageOf(u) {
  return {
    input_tokens: Number((u && u.prompt_tokens) || 0),
    output_tokens: Number((u && u.completion_tokens) || 0),
  };
}

/** Non-streaming chat.completions JSON -> an Anthropic Message object. */
export function openAIResponseToAnthropic(json, { model } = {}) {
  const choice = (json && Array.isArray(json.choices) && json.choices[0]) || {};
  const msg = choice.message || {};
  const content = [];
  if (msg.content) content.push({ type: 'text', text: String(msg.content) });
  const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
  for (const c of calls) {
    if (!c || !c.function) continue;
    content.push({ type: 'tool_use', id: String(c.id || randomId('call')), name: String(c.function.name || ''), input: safeParse(c.function.arguments) });
  }
  return {
    id: (json && json.id) || randomId('msg'),
    type: 'message',
    role: 'assistant',
    model: (json && json.model) || model || '',
    content,
    stop_reason: mapFinishReason(choice.finish_reason, calls.length > 0),
    stop_sequence: null,
    usage: usageOf(json && json.usage),
  };
}

/** An upstream error body (any shape) -> Anthropic's {error:{type,message}}. */
export function normalizeUpstreamError(status, body) {
  let message = '';
  let type = 'api_error';
  if (body && typeof body === 'object') {
    const e = body.error;
    if (typeof e === 'string') message = e;
    else if (e && typeof e === 'object') { message = e.message || e.msg || ''; type = e.type || e.code || type; }
    else if (body.message) message = String(body.message);
    else if (body.detail) message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
  } else if (typeof body === 'string') {
    message = body.slice(0, 400);
  }
  if (status === 401 || status === 403) type = 'authentication_error';
  if (status === 429) type = 'rate_limit_error';
  return { error: { type: String(type), message: message || `upstream request failed (${status})` } };
}

/**
 * Convert an OpenAI-compatible SSE stream (chat.completion.chunk events,
 * terminated by `data: [DONE]`) into Anthropic Messages SSE events:
 * message_start -> content_block_start/delta/stop (text_delta,
 * input_json_delta) -> message_delta {stop_reason} -> message_stop.
 * Returns a ReadableStream of UTF-8 bytes.
 */
export function openAIStreamToAnthropic(upstreamBody, { model } = {}) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let nextIndex = 0;
  let textIndex = -1;          // open text block, or -1
  const tools = new Map();     // openai tool index -> { index, id, name, args }
  let openTool = null;         // openai tool index currently streaming
  let finish = null;
  let usage = { input_tokens: 0, output_tokens: 0 };
  let sawToolCalls = false;
  let done = false;
  let started = false;
  let messageId = randomId('msg');
  let modelName = model || '';

  const emit = (controller, type, data) => {
    controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(Object.assign({ type }, data))}\n\n`));
  };
  const ensureStart = (controller) => {
    if (started) return;
    started = true;
    emit(controller, 'message_start', { message: { id: messageId, type: 'message', role: 'assistant', model: modelName, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 } } });
  };
  const closeText = (controller) => {
    if (textIndex === -1) return;
    emit(controller, 'content_block_stop', { index: textIndex });
    textIndex = -1;
  };
  const closeTool = (controller) => {
    if (openTool === null) return;
    const t = tools.get(openTool);
    if (t) emit(controller, 'content_block_stop', { index: t.index });
    openTool = null;
  };
  const finalize = (controller) => {
    if (done) return;
    done = true;
    ensureStart(controller);
    closeText(controller);
    closeTool(controller);
    emit(controller, 'message_delta', { delta: { stop_reason: mapFinishReason(finish, sawToolCalls), stop_sequence: null }, usage: { output_tokens: usage.output_tokens } });
    emit(controller, 'message_stop', {});
  };

  const handleChunk = (controller, chunk) => {
    if (!chunk || typeof chunk !== 'object') return;
    if (chunk.error) {
      ensureStart(controller);
      const norm = normalizeUpstreamError(500, chunk);
      emit(controller, 'error', { error: norm.error });
      return;
    }
    if (chunk.id && !started) messageId = `msg_${String(chunk.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40)}`;
    if (chunk.model) modelName = chunk.model;
    ensureStart(controller);
    if (chunk.usage) usage = usageOf(chunk.usage);
    const choice = Array.isArray(chunk.choices) ? chunk.choices[0] : null;
    if (!choice) return;
    const delta = choice.delta || {};
    if (typeof delta.content === 'string' && delta.content.length) {
      closeTool(controller);
      if (textIndex === -1) {
        textIndex = nextIndex++;
        emit(controller, 'content_block_start', { index: textIndex, content_block: { type: 'text', text: '' } });
      }
      emit(controller, 'content_block_delta', { index: textIndex, delta: { type: 'text_delta', text: delta.content } });
    }
    if (Array.isArray(delta.tool_calls)) {
      for (const call of delta.tool_calls) {
        if (!call) continue;
        const key = typeof call.index === 'number' ? call.index : tools.size;
        let t = tools.get(key);
        if (!t) {
          closeText(controller);
          closeTool(controller);
          sawToolCalls = true;
          t = { index: nextIndex++, id: String(call.id || randomId('call')), name: String((call.function && call.function.name) || ''), args: '' };
          tools.set(key, t);
          openTool = key;
          emit(controller, 'content_block_start', { index: t.index, content_block: { type: 'tool_use', id: t.id, name: t.name, input: {} } });
        } else if (openTool !== key) {
          closeText(controller);
          closeTool(controller);
          openTool = key;
        }
        if (call.function && call.function.name && !t.name) t.name = String(call.function.name);
        const args = call.function && typeof call.function.arguments === 'string' ? call.function.arguments : '';
        if (args) {
          t.args += args;
          emit(controller, 'content_block_delta', { index: t.index, delta: { type: 'input_json_delta', partial_json: args } });
        }
      }
    }
    if (choice.finish_reason) finish = choice.finish_reason;
  };

  const handleLine = (controller, line) => {
    const trimmed = line.replace(/\r$/, '');
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data) return;
    if (data === '[DONE]') { finalize(controller); return; }
    let parsed;
    try { parsed = JSON.parse(data); } catch (err) { return; }
    handleChunk(controller, parsed);
  };

  const transform = new TransformStream({
    // message_start waits for the first upstream chunk so the completion id
    // and model can be carried through; finalize() emits it regardless.
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        handleLine(controller, line);
      }
    },
    flush(controller) {
      buffer += decoder.decode();
      if (buffer.trim()) handleLine(controller, buffer);
      buffer = '';
      finalize(controller);
    },
  });
  return upstreamBody.pipeThrough(transform);
}

// --- Image generation ------------------------------------------------------

/** Build the JSON body for POST {base}/images/generations. */
export function imageRequest(provider, { prompt, model, n = 1, aspectRatio, quality, size } = {}) {
  const count = Math.max(1, Math.min(Number(n) || 1, 4));
  const body = { model, prompt: String(prompt || '').slice(0, 4000), n: count };
  const spec = IMAGE_PROVIDERS[provider];
  if (provider === 'xai') {
    body.response_format = 'b64_json';
    if (aspectRatio && spec.aspectRatios.indexOf(aspectRatio) !== -1) body.aspect_ratio = aspectRatio;
    if (quality && ['auto', 'low', 'medium', 'high'].indexOf(quality) !== -1) body.quality = quality;
  } else if (provider === 'openai') {
    if (size && spec.sizes.indexOf(size) !== -1) body.size = size;
    if (/^dall-e/.test(String(model))) body.response_format = 'b64_json';
  }
  return body;
}

export function imageEndpoint(provider, env) {
  return `${openAIBase(provider, env)}/images/generations`;
}

/** First image of an images/generations response: { b64, url, revisedPrompt }. */
export function extractImage(json) {
  const entry = json && Array.isArray(json.data) ? json.data[0] : null;
  if (!entry) return null;
  return {
    b64: typeof entry.b64_json === 'string' ? entry.b64_json : null,
    url: typeof entry.url === 'string' ? entry.url : null,
    revisedPrompt: typeof entry.revised_prompt === 'string' ? entry.revised_prompt : '',
  };
}

// --- .env helpers (pure string ops; the dev proxy does the file I/O) ------

/** Insert or replace `KEY=value` in dotenv text; commented lines are left alone. */
export function upsertEnvLine(text, key, value) {
  const safeKey = String(key || '').trim();
  if (!/^[A-Z][A-Z0-9_]*$/.test(safeKey)) throw new Error(`invalid env key: ${key}`);
  const line = `${safeKey}=${String(value)}`;
  const lines = String(text || '').split(/\r?\n/);
  let replaced = false;
  const pattern = new RegExp(`^\\s*(export\\s+)?${safeKey}\\s*=`);
  const out = lines.map((l) => {
    if (!replaced && pattern.test(l)) { replaced = true; return line; }
    return l;
  });
  if (replaced) return out.join('\n');
  const body = String(text || '');
  const sep = body.length && !body.endsWith('\n') ? '\n' : '';
  return `${body}${sep}${line}\n`;
}
