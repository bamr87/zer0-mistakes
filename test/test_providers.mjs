#!/usr/bin/env node
// Feature: ZER0-087
// =============================================================================
// test_providers.mjs — the chat proxy's provider layer (Claude + Grok)
// =============================================================================
// templates/deploy/chat-proxy/providers.js lets the proxy answer with Claude
// (Anthropic) or Grok (xAI) while every client keeps speaking the Anthropic
// Messages dialect. These tests pin what the ai-chat instructions promise:
//
//   - credential detection by shape (never by trying the token), masking
//   - provider selection: CHAT_PROVIDER pins, `auto` honours a configured
//     client preference, nothing configured → null
//   - model resolution: a server pin always wins; a client model is accepted
//     only from the right family; else the provider default
//   - Anthropic → OpenAI request translation (system blocks, tool_use ⇄
//     tool_calls, tool_result ⇄ role:"tool", input_schema ⇄ parameters)
//   - OpenAI-compatible SSE → Anthropic SSE events that the browser clients'
//     parser (re-implemented here from site-builder.js) turns back into the
//     same content blocks and stop_reason
//   - the Worker end to end against a mock xAI server: /api/chat streams,
//     /api/feedback returns triage JSON, probeProvider validates a key, and
//     the Anthropic path is byte-for-byte what it was (OAuth identity block)
//   - credential-store.mjs: session tokens replace env ones, status masks,
//     persist() upserts .env with mode 600
//
// Run:  node test/test_providers.mjs      (exit 1 on any failure)
// No network: every upstream is a local mock.
// =============================================================================

import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'zer0-providers-'));
process.env.CHAT_DEV_ENV_FILE = path.join(tmp, '.env');

const P = await import('../templates/deploy/chat-proxy/providers.js');
const worker = (await import('../templates/deploy/chat-proxy/worker.js'));
const creds = await import('../templates/deploy/chat-proxy/credential-store.mjs');

let passed = 0;
let failed = 0;
async function t(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}\n      ${err.stack || err.message}`);
  }
}

// --- helpers -----------------------------------------------------------------

/** Parse Anthropic SSE text into event objects. */
function parseSse(text) {
  return text.split('\n').filter((l) => l.startsWith('data:')).map((l) => JSON.parse(l.slice(5).trim()));
}

/** The browser clients' stream reducer (site-builder.js streamClaude), verbatim in spirit. */
function reduceEvents(events) {
  const blocks = [];
  const partial = {};
  let stopReason = null;
  for (const evt of events) {
    switch (evt.type) {
      case 'content_block_start':
        blocks[evt.index] = Object.assign({}, evt.content_block);
        if (evt.content_block.type === 'tool_use') partial[evt.index] = '';
        break;
      case 'content_block_delta':
        if (evt.delta.type === 'text_delta') blocks[evt.index].text = (blocks[evt.index].text || '') + evt.delta.text;
        else if (evt.delta.type === 'input_json_delta') partial[evt.index] += evt.delta.partial_json;
        break;
      case 'content_block_stop':
        if (blocks[evt.index] && blocks[evt.index].type === 'tool_use') blocks[evt.index].input = partial[evt.index] ? JSON.parse(partial[evt.index]) : {};
        break;
      case 'message_delta':
        if (evt.delta && evt.delta.stop_reason) stopReason = evt.delta.stop_reason;
        break;
      case 'error':
        throw new Error(evt.error.message);
      default:
    }
  }
  return { content: blocks.filter(Boolean), stopReason };
}

function sse(chunks) {
  return chunks.map((c) => (c === '[DONE]' ? 'data: [DONE]\n\n' : `data: ${JSON.stringify(c)}\n\n`)).join('');
}

async function streamToText(stream) {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += dec.decode(value, { stream: true });
  }
  return out;
}

function bytesStream(text, pieces = 1) {
  const enc = new TextEncoder();
  const size = Math.ceil(text.length / pieces);
  const parts = [];
  for (let i = 0; i < text.length; i += size) parts.push(enc.encode(text.slice(i, i + size)));
  return new ReadableStream({
    start(controller) { parts.forEach((p) => controller.enqueue(p)); controller.close(); },
  });
}

// --- mock upstreams ------------------------------------------------------------

const seen = { requests: [] };
const mock = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  let body = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
  seen.requests.push({ method: req.method, url: req.url, headers: req.headers, body });
  const auth = req.headers.authorization || '';

  if (req.url === '/xai/v1/models') {
    if (auth !== 'Bearer xai-good-key-1234567890') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Incorrect API key provided' })); }
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ data: [{ id: 'grok-4.6' }] }));
  }
  if (req.url === '/xai/v1/chat/completions') {
    if (auth !== 'Bearer xai-good-key-1234567890') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'bad key', code: 'invalid_api_key' } })); }
    if (body && body.stream) {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const wantsTool = Array.isArray(body.tools) && body.tools.length && !body.messages.some((m) => m.role === 'tool');
      res.write(sse([{ id: 'chatcmpl-1', model: 'grok-4.6', choices: [{ index: 0, delta: { role: 'assistant', content: 'Sure — ' } }] }]));
      res.write(sse([{ id: 'chatcmpl-1', choices: [{ index: 0, delta: { content: 'let me check.' } }] }]));
      if (wantsTool) {
        res.write(sse([{ id: 'chatcmpl-1', choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: 'call_abc', type: 'function', function: { name: 'get_wizard_state', arguments: '{"verbose":true}' } }] }, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 12, completion_tokens: 7 } }]));
      } else {
        res.write(sse([{ id: 'chatcmpl-1', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 12, completion_tokens: 5 } }]));
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    const isPing = body && body.messages.some((m) => m.content === 'ping');
    const text = isPing ? 'pong' : JSON.stringify({ title: 'fix: broken link on the docs page', summary: 'A link 404s.', severity: 'low', priority: 'P3', labels: ['bug', 'nope'], questions: [], recommendation: 'Fix the href.' });
    return res.end(JSON.stringify({ id: 'chatcmpl-2', model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 3, completion_tokens: 2 } }));
  }
  if (req.url === '/anthropic/v1/messages') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'text', text: 'hello from claude' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }));
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: { message: 'not found' } }));
});
await new Promise((r) => mock.listen(0, '127.0.0.1', r));
const MOCK = `http://127.0.0.1:${mock.address().port}`;

const XAI_ENV = { XAI_API_KEY: 'xai-good-key-1234567890', XAI_BASE_URL: `${MOCK}/xai/v1`, ALLOWED_ORIGINS: 'http://localhost:4000', MAX_TOKENS_CAP: '4096' };
function post(pathname, body, env) {
  return worker.default.fetch(new Request(`http://localhost${pathname}`, {
    method: 'POST',
    headers: { origin: 'http://localhost:4000', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }), env);
}

console.log('providers.js');

// --- credentials ---------------------------------------------------------------
await t('detectCredential classifies tokens by shape and rejects junk', () => {
  assert.deepEqual(P.detectCredential('anthropic', 'sk-ant-oat01-abcdefghijklmnop'), { ok: true, provider: 'anthropic', kind: 'oauth_static', envKey: 'CLAUDE_CODE_OAUTH_TOKEN' });
  assert.deepEqual(P.detectCredential('anthropic', 'sk-ant-api03-abcdefghijklmnop'), { ok: true, provider: 'anthropic', kind: 'api_key', envKey: 'ANTHROPIC_API_KEY' });
  assert.deepEqual(P.detectCredential('xai', 'xai-abcdefghijklmnopqrstu'), { ok: true, provider: 'xai', kind: 'api_key', envKey: 'XAI_API_KEY' });
  assert.equal(P.detectCredential('openai', 'sk-proj-abcdefghijklmnop').envKey, 'OPENAI_API_KEY');
  assert.equal(P.detectCredential('openai', 'sk-ant-api03-abcdefghijklmnop').ok, false);
  assert.equal(P.detectCredential('xai', 'sk-ant-oat01-abcdefghijklmnop').ok, false);
  assert.equal(P.detectCredential('anthropic', 'xai-abcdefghijklmnopqrstu').ok, false);
  assert.equal(P.detectCredential('anthropic', '').ok, false);
  assert.equal(P.detectCredential('anthropic', 'sk-ant-oat01-has a space').ok, false);
  assert.equal(P.detectCredential('mystery', 'xai-abcdefghijklmnopqrstu').ok, false);
  assert.equal(P.maskToken('xai-abcdefghijklmnopqrstu'), '••••rstu');
  assert.equal(P.maskToken(''), '');
});

await t('configuredProviders / anthropicAuthMode keep the OAuth precedence', () => {
  assert.equal(P.anthropicAuthMode({ ANTHROPIC_OAUTH_REFRESH_TOKEN: 'r', CLAUDE_CODE_OAUTH_TOKEN: 'o', ANTHROPIC_API_KEY: 'k' }), 'oauth_refresh');
  assert.equal(P.anthropicAuthMode({ CLAUDE_CODE_OAUTH_TOKEN: 'o', ANTHROPIC_API_KEY: 'k' }), 'oauth_static');
  assert.equal(P.anthropicAuthMode({ ANTHROPIC_API_KEY: 'k' }), 'api_key');
  assert.deepEqual(P.configuredProviders({ XAI_API_KEY: 'x' }), { anthropic: null, xai: 'api_key' });
  assert.deepEqual(P.configuredImageProviders({ OPENAI_API_KEY: 'o' }), { xai: null, openai: 'api_key' });
});

// --- selection -----------------------------------------------------------------
await t('selectProvider: pin wins, auto honours a configured request, else first configured, else null', () => {
  assert.equal(P.selectProvider({ CLAUDE_CODE_OAUTH_TOKEN: 'o', XAI_API_KEY: 'x' }, 'xai'), 'xai');
  assert.equal(P.selectProvider({ CLAUDE_CODE_OAUTH_TOKEN: 'o', XAI_API_KEY: 'x' }), 'anthropic');
  assert.equal(P.selectProvider({ XAI_API_KEY: 'x' }, 'anthropic'), 'xai', 'an unconfigured request falls back');
  assert.equal(P.selectProvider({ CLAUDE_CODE_OAUTH_TOKEN: 'o', XAI_API_KEY: 'x', CHAT_PROVIDER: 'anthropic' }, 'xai'), 'anthropic', 'the server pin wins');
  assert.equal(P.selectProvider({ CLAUDE_CODE_OAUTH_TOKEN: 'o', CHAT_PROVIDER: 'xai' }), null, 'a pin without a credential is unusable');
  assert.equal(P.selectProvider({}), null);
  assert.equal(P.selectProvider({ XAI_API_KEY: 'x' }, 'evil'), 'xai');
});

await t('resolveModel: pin > same-family client model > default', () => {
  assert.equal(P.resolveModel({ CHAT_MODEL: 'claude-opus-4-8' }, 'anthropic', 'claude-haiku-4-5'), 'claude-opus-4-8');
  assert.equal(P.resolveModel({}, 'anthropic', 'claude-sonnet-5'), 'claude-sonnet-5');
  assert.equal(P.resolveModel({}, 'anthropic', 'grok-4.6'), 'claude-opus-4-8', 'a Grok model never reaches Anthropic');
  assert.equal(P.resolveModel({}, 'xai', 'claude-opus-5'), 'grok-4.6');
  assert.equal(P.resolveModel({}, 'xai', 'grok-4.5'), 'grok-4.5');
  assert.equal(P.resolveModel({ XAI_CHAT_MODEL: 'grok-4.3' }, 'xai', 'grok-4.6'), 'grok-4.3');
  assert.equal(P.resolveModel({}, 'xai', 'grok-4.6; DROP'), 'grok-4.6');
  assert.equal(P.resolveModel({}, 'nope'), null);
});

await t('image provider selection and request shapes', () => {
  assert.equal(P.selectImageProvider({ XAI_API_KEY: 'x', OPENAI_API_KEY: 'o' }), 'xai');
  assert.equal(P.selectImageProvider({ XAI_API_KEY: 'x', OPENAI_API_KEY: 'o' }, 'openai'), 'openai');
  assert.equal(P.selectImageProvider({ OPENAI_API_KEY: 'o', IMAGE_PROVIDER: 'xai' }), null);
  assert.equal(P.selectImageProvider({}), null);
  assert.equal(P.resolveImageModel({}, 'xai'), 'grok-imagine-image-2.0');
  assert.equal(P.resolveImageModel({ XAI_IMAGE_MODEL: 'grok-imagine-image' }, 'xai', 'grok-imagine-image-2.0'), 'grok-imagine-image');
  const x = P.imageRequest('xai', { prompt: 'a lighthouse', model: 'grok-imagine-image-2.0', aspectRatio: '16:9', quality: 'high', n: 9 });
  assert.deepEqual(x, { model: 'grok-imagine-image-2.0', prompt: 'a lighthouse', n: 4, response_format: 'b64_json', aspect_ratio: '16:9', quality: 'high' });
  const bad = P.imageRequest('xai', { prompt: 'p', model: 'm', aspectRatio: '7:1', quality: 'ultra' });
  assert.equal(bad.aspect_ratio, undefined);
  assert.equal(bad.quality, undefined);
  const o = P.imageRequest('openai', { prompt: 'p', model: 'gpt-image-2', size: '1536x1024' });
  assert.deepEqual(o, { model: 'gpt-image-2', prompt: 'p', n: 1, size: '1536x1024' });
  assert.equal(P.imageEndpoint('xai', { XAI_BASE_URL: 'http://gw/v1/' }), 'http://gw/v1/images/generations');
  assert.equal(P.imageEndpoint('openai', {}), 'https://api.openai.com/v1/images/generations');
  assert.deepEqual(P.extractImage({ data: [{ b64_json: 'AAA', revised_prompt: 'x' }] }), { b64: 'AAA', url: null, revisedPrompt: 'x' });
  assert.equal(P.extractImage({ data: [] }), null);
});

await t('upsertEnvLine replaces an active line, appends when missing, leaves comments alone', () => {
  const text = '# XAI_API_KEY=xai-old-comment\nOPENAI_API_KEY=sk-1\nexport CLAUDE_CODE_OAUTH_TOKEN=old\n';
  const a = P.upsertEnvLine(text, 'XAI_API_KEY', 'xai-new');
  assert.equal(a, text + 'XAI_API_KEY=xai-new\n');
  const b = P.upsertEnvLine(text, 'CLAUDE_CODE_OAUTH_TOKEN', 'new');
  assert.equal(b, '# XAI_API_KEY=xai-old-comment\nOPENAI_API_KEY=sk-1\nCLAUDE_CODE_OAUTH_TOKEN=new\n');
  assert.equal(P.upsertEnvLine('', 'A_B', '1'), 'A_B=1\n');
  assert.equal(P.upsertEnvLine('X=1', 'Y', '2'), 'X=1\nY=2\n');
  assert.throws(() => P.upsertEnvLine('', 'bad key', '1'));
});

await t('normalizeUpstreamError copes with every error shape', () => {
  assert.deepEqual(P.normalizeUpstreamError(401, { error: 'Incorrect API key' }), { error: { type: 'authentication_error', message: 'Incorrect API key' } });
  assert.deepEqual(P.normalizeUpstreamError(429, { error: { message: 'slow down', code: 'rate' } }), { error: { type: 'rate_limit_error', message: 'slow down' } });
  assert.equal(P.normalizeUpstreamError(500, 'boom').error.message, 'boom');
  assert.equal(P.normalizeUpstreamError(502, null).error.message, 'upstream request failed (502)');
});

// --- request translation --------------------------------------------------------
await t('anthropicToOpenAIChat maps system, tool_use, tool_result and tools', () => {
  const out = P.anthropicToOpenAIChat({
    system: [{ type: 'text', text: 'You are Claude Code.' }, { type: 'text', text: 'Be brief.' }],
    messages: [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: [{ type: 'text', text: 'checking' }, { type: 'tool_use', id: 'call_1', name: 'get_state', input: { a: 1 } }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'call_1', content: [{ type: 'text', text: 'state ok' }] }, { type: 'text', text: 'thanks' }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'call_2', content: '', is_error: true }] },
    ],
    tools: [{ name: 'get_state', description: 'd', input_schema: { type: 'object', properties: { a: { type: 'integer' } } } }],
  }, { model: 'grok-4.6', maxTokens: 500, stream: true });
  assert.deepEqual(out.messages, [
    { role: 'system', content: 'You are Claude Code.\n\nBe brief.' },
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'checking', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'get_state', arguments: '{"a":1}' } }] },
    { role: 'tool', tool_call_id: 'call_1', content: 'state ok' },
    { role: 'user', content: 'thanks' },
    { role: 'tool', tool_call_id: 'call_2', content: 'error' },
  ]);
  assert.deepEqual(out.tools, [{ type: 'function', function: { name: 'get_state', description: 'd', parameters: { type: 'object', properties: { a: { type: 'integer' } } } } }]);
  assert.equal(out.model, 'grok-4.6');
  assert.equal(out.max_tokens, 500);
  assert.equal(out.stream, true);
  const plain = P.anthropicToOpenAIChat({ system: 'sys', messages: [{ role: 'user', content: 'q' }] }, { model: 'm', maxTokens: 1, stream: false });
  assert.deepEqual(plain.messages, [{ role: 'system', content: 'sys' }, { role: 'user', content: 'q' }]);
  assert.equal(plain.tools, undefined);
});

await t('openAIResponseToAnthropic maps a non-streaming reply and tool calls', () => {
  const m = P.openAIResponseToAnthropic({ id: 'chatcmpl-9', model: 'grok-4.6', choices: [{ message: { content: 'hey', tool_calls: [{ id: 'c1', function: { name: 'f', arguments: '{"x":2}' } }, { id: 'c2', function: { name: 'g', arguments: 'not json' } }] }, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 4, completion_tokens: 6 } });
  assert.equal(m.type, 'message');
  assert.deepEqual(m.content, [{ type: 'text', text: 'hey' }, { type: 'tool_use', id: 'c1', name: 'f', input: { x: 2 } }, { type: 'tool_use', id: 'c2', name: 'g', input: {} }]);
  assert.equal(m.stop_reason, 'tool_use');
  assert.deepEqual(m.usage, { input_tokens: 4, output_tokens: 6 });
  assert.equal(P.openAIResponseToAnthropic({ choices: [{ message: { content: 'x' }, finish_reason: 'length' }] }).stop_reason, 'max_tokens');
  assert.equal(P.openAIResponseToAnthropic({ choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] }).stop_reason, 'end_turn');
});

// --- stream translation ------------------------------------------------------
await t('openAIStreamToAnthropic: text + whole tool call → the client parser sees text, tool_use, stop_reason tool_use', async () => {
  const upstream = sse([
    { id: 'chatcmpl-1', model: 'grok-4.6', choices: [{ index: 0, delta: { role: 'assistant', content: 'Let me ' } }] },
    { id: 'chatcmpl-1', choices: [{ index: 0, delta: { content: 'look.' } }] },
    { id: 'chatcmpl-1', choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: 'call_x', type: 'function', function: { name: 'read_file', arguments: '{"path":"_config.yml"}' } }] }, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 10, completion_tokens: 8 } },
    '[DONE]',
  ]);
  const text = await streamToText(P.openAIStreamToAnthropic(bytesStream(upstream, 7), { model: 'grok-4.6' }));
  assert.match(text, /^event: message_start\n/);
  const events = parseSse(text);
  assert.deepEqual(events.map((e) => e.type), ['message_start', 'content_block_start', 'content_block_delta', 'content_block_delta', 'content_block_stop', 'content_block_start', 'content_block_delta', 'content_block_stop', 'message_delta', 'message_stop']);
  assert.equal(events[0].message.model, 'grok-4.6');
  assert.equal(events[0].message.id, 'msg_chatcmpl-1');
  const r = reduceEvents(events);
  assert.deepEqual(r.content, [{ type: 'text', text: 'Let me look.' }, { type: 'tool_use', id: 'call_x', name: 'read_file', input: { path: '_config.yml' } }]);
  assert.equal(r.stopReason, 'tool_use');
  assert.equal(events[8].usage.output_tokens, 8);
});

await t('openAIStreamToAnthropic: arguments split across chunks, two parallel calls, no [DONE]', async () => {
  const upstream = sse([
    { choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: 'a', function: { name: 'f', arguments: '{"n":' } }] } }] },
    { choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '1}' } }] } }] },
    { choices: [{ index: 0, delta: { tool_calls: [{ index: 1, id: 'b', function: { name: 'g', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] },
  ]);
  const events = parseSse(await streamToText(P.openAIStreamToAnthropic(bytesStream(upstream, 3), {})));
  const r = reduceEvents(events);
  assert.deepEqual(r.content, [{ type: 'tool_use', id: 'a', name: 'f', input: { n: 1 } }, { type: 'tool_use', id: 'b', name: 'g', input: {} }]);
  assert.equal(r.stopReason, 'tool_use');
  assert.equal(events[events.length - 1].type, 'message_stop', 'flush finalizes without [DONE]');
});

await t('openAIStreamToAnthropic: plain text ends with end_turn; length → max_tokens; error chunk → error event', async () => {
  const plain = parseSse(await streamToText(P.openAIStreamToAnthropic(bytesStream(sse([{ choices: [{ index: 0, delta: { content: 'hi' }, finish_reason: 'stop' }] }, '[DONE]'])), {})));
  assert.equal(reduceEvents(plain).stopReason, 'end_turn');
  assert.deepEqual(reduceEvents(plain).content, [{ type: 'text', text: 'hi' }]);
  const long = parseSse(await streamToText(P.openAIStreamToAnthropic(bytesStream(sse([{ choices: [{ index: 0, delta: { content: 'x' }, finish_reason: 'length' }] }, '[DONE]'])), {})));
  assert.equal(reduceEvents(long).stopReason, 'max_tokens');
  const errored = parseSse(await streamToText(P.openAIStreamToAnthropic(bytesStream(sse([{ error: { message: 'model overloaded', code: 'overloaded' } }, '[DONE]'])), {})));
  assert.ok(errored.some((e) => e.type === 'error' && e.error.message === 'model overloaded'));
  assert.throws(() => reduceEvents(errored), /model overloaded/);
});

// --- Worker end to end against the mock ------------------------------------------
console.log('worker.js (mock upstreams)');

await t('/api/chat via xai streams Anthropic events and forwards tools as functions', async () => {
  seen.requests.length = 0;
  const resp = await post('/api/chat', {
    model: 'grok-4.6', max_tokens: 99999, system: 'Site Builder brief',
    messages: [{ role: 'user', content: 'what is the state?' }],
    tools: [{ name: 'get_wizard_state', description: 'state', input_schema: { type: 'object', properties: {} } }],
  }, XAI_ENV);
  assert.equal(resp.status, 200);
  assert.equal(resp.headers.get('content-type'), 'text/event-stream');
  assert.equal(resp.headers.get('x-chat-provider'), 'xai');
  const r = reduceEvents(parseSse(await streamToText(resp.body)));
  assert.deepEqual(r.content, [{ type: 'text', text: 'Sure — let me check.' }, { type: 'tool_use', id: 'call_abc', name: 'get_wizard_state', input: { verbose: true } }]);
  assert.equal(r.stopReason, 'tool_use');
  const up = seen.requests[0];
  assert.equal(up.url, '/xai/v1/chat/completions');
  assert.equal(up.headers.authorization, 'Bearer xai-good-key-1234567890');
  assert.equal(up.body.model, 'grok-4.6');
  assert.equal(up.body.max_tokens, 4096, 'MAX_TOKENS_CAP is enforced server-side');
  assert.equal(up.body.messages[0].role, 'system');
  assert.equal(up.body.tools[0].function.name, 'get_wizard_state');
});

await t('/api/chat second round with a tool_result reaches xai as a tool message and ends the turn', async () => {
  seen.requests.length = 0;
  const resp = await post('/api/chat', {
    model: 'grok-4.6', max_tokens: 100,
    messages: [
      { role: 'user', content: 'state?' },
      { role: 'assistant', content: [{ type: 'text', text: 'Sure — let me check.' }, { type: 'tool_use', id: 'call_abc', name: 'get_wizard_state', input: { verbose: true } }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'call_abc', content: '{"title":"X"}' }] },
    ],
    tools: [{ name: 'get_wizard_state', description: 'state', input_schema: { type: 'object', properties: {} } }],
  }, XAI_ENV);
  const r = reduceEvents(parseSse(await streamToText(resp.body)));
  assert.equal(r.stopReason, 'end_turn');
  assert.deepEqual(seen.requests[0].body.messages[2], { role: 'tool', tool_call_id: 'call_abc', content: '{"title":"X"}' });
});

await t('/api/chat pins the provider with CHAT_PROVIDER and refuses without any credential', async () => {
  const resp = await post('/api/chat', { messages: [{ role: 'user', content: 'x' }], provider: 'anthropic' }, XAI_ENV);
  assert.equal(resp.headers.get('x-chat-provider'), 'xai', 'a client cannot pick an unconfigured provider');
  await streamToText(resp.body);
  const none = await post('/api/chat', { messages: [{ role: 'user', content: 'x' }] }, { ALLOWED_ORIGINS: 'http://localhost:4000' });
  assert.equal(none.status, 501);
  const pinned = await post('/api/chat', { messages: [{ role: 'user', content: 'x' }] }, Object.assign({}, XAI_ENV, { CHAT_PROVIDER: 'anthropic' }));
  assert.equal(pinned.status, 501, 'a pin without its credential is an error, not a silent fallback');
});

await t('/api/chat via xai surfaces an upstream auth error in Anthropic error shape', async () => {
  const resp = await post('/api/chat', { messages: [{ role: 'user', content: 'x' }] }, Object.assign({}, XAI_ENV, { XAI_API_KEY: 'xai-wrong-key-000000000' }));
  assert.equal(resp.status, 401);
  const body = await resp.json();
  assert.equal(body.error.type, 'authentication_error');
  assert.match(body.error.message, /bad key/);
});

await t('/api/feedback via xai returns the triage JSON with labels constrained to the offered set', async () => {
  const resp = await post('/api/feedback', { description: 'The link on the docs page is broken', availableLabels: ['bug', 'docs'] }, XAI_ENV);
  assert.equal(resp.status, 200);
  const body = await resp.json();
  assert.equal(body.title, 'fix: broken link on the docs page');
  assert.deepEqual(body.labels, ['bug']);
  assert.equal(body.priority, 'P3');
});

await t('probeProvider validates an xai key against /models and reports a rejected one', async () => {
  const ok = await worker.probeProvider(XAI_ENV, 'xai');
  assert.equal(ok.ok, true);
  assert.equal(ok.model, 'grok-4.6');
  const bad = await worker.probeProvider(Object.assign({}, XAI_ENV, { XAI_API_KEY: 'xai-wrong-key-000000000' }), 'xai');
  assert.equal(bad.ok, false);
  assert.equal(bad.status, 401);
  assert.match(bad.message, /Incorrect API key/);
  const none = await worker.probeProvider({}, 'anthropic');
  assert.equal(none.ok, false);
});

await t('the Anthropic path is unchanged: api key → x-api-key and no identity block; OAuth → Claude Code identity first', async () => {
  const base = { ANTHROPIC_BASE_URL: `${MOCK}/anthropic`, ALLOWED_ORIGINS: 'http://localhost:4000' };
  seen.requests.length = 0;
  const key = await post('/api/chat', { model: 'claude-sonnet-5', max_tokens: 10, system: 'brief', messages: [{ role: 'user', content: 'x' }] }, Object.assign({ ANTHROPIC_API_KEY: 'sk-ant-api03-test' }, base));
  assert.equal(key.status, 200);
  assert.equal(key.headers.get('x-chat-provider'), 'anthropic');
  await key.text();
  let up = seen.requests[0];
  assert.equal(up.url, '/anthropic/v1/messages');
  assert.equal(up.headers['x-api-key'], 'sk-ant-api03-test');
  assert.equal(up.body.system, 'brief');
  assert.equal(up.body.model, 'claude-sonnet-5', 'without a pin the client may choose a Claude model');
  assert.equal(up.body.stream, true);

  seen.requests.length = 0;
  const oauth = await post('/api/chat', { model: 'grok-4.6', system: 'brief', messages: [{ role: 'user', content: 'x' }] }, Object.assign({ CLAUDE_CODE_OAUTH_TOKEN: 'sk-ant-oat01-test', CHAT_MODEL: 'claude-opus-4-8' }, base));
  await oauth.text();
  up = seen.requests[0];
  assert.equal(up.headers.authorization, 'Bearer sk-ant-oat01-test');
  assert.equal(up.headers['anthropic-beta'], 'oauth-2025-04-20');
  assert.equal(up.body.system[0].text, "You are Claude Code, Anthropic's official CLI for Claude.");
  assert.equal(up.body.system[1].text, 'brief');
  assert.equal(up.body.model, 'claude-opus-4-8', 'the server pin wins and a Grok model never leaks through');

  const probe = await worker.probeProvider(Object.assign({ CLAUDE_CODE_OAUTH_TOKEN: 'sk-ant-oat01-test' }, base), 'anthropic');
  assert.equal(probe.ok, true);
});

// --- credential store ------------------------------------------------------------
console.log('credential-store.mjs');

await t('session credentials replace env ones, status masks, clear restores', () => {
  creds._reset();
  const env = { CLAUDE_CODE_OAUTH_TOKEN: 'sk-ant-oat01-fromenv-abcdefgh' };
  assert.equal(creds.applyTo(env).CLAUDE_CODE_OAUTH_TOKEN, env.CLAUDE_CODE_OAUTH_TOKEN);
  const set = creds.set('anthropic', 'sk-ant-api03-session-abcdefgh');
  assert.equal(set.ok, true);
  assert.equal(set.kind, 'api_key');
  assert.equal(set.masked, '••••efgh');
  assert.equal(JSON.stringify(set).includes('session-abcdefgh'), false, 'the receipt never carries the token');
  const eff = creds.applyTo(env);
  assert.equal(eff.CLAUDE_CODE_OAUTH_TOKEN, undefined, 'the stale env OAuth token no longer shadows the fresh key');
  assert.equal(eff.ANTHROPIC_API_KEY, 'sk-ant-api03-session-abcdefgh');
  assert.equal(env.ANTHROPIC_API_KEY, undefined, 'the base env object is untouched');
  const sum = creds.summary(env);
  assert.deepEqual(sum.anthropic, { configured: true, source: 'session', kind: 'api_key', envKey: 'ANTHROPIC_API_KEY', masked: '••••efgh' });
  assert.deepEqual(sum.xai, { configured: false, source: null, kind: null, envKey: null, masked: '' });
  assert.equal(creds.set('xai', 'sk-ant-oat01-wrong-family').ok, false);
  assert.equal(creds.set('nope', 'xai-abcdefghijklmnopqrstu').ok, false);
  creds.clear('anthropic');
  assert.equal(creds.applyTo(env).CLAUDE_CODE_OAUTH_TOKEN, env.CLAUDE_CODE_OAUTH_TOKEN);
  assert.equal(creds.summary(env).anthropic.source, 'env');
  assert.equal(creds.summary(env).anthropic.kind, 'oauth_static');
});

await t('persist() upserts the session token into .env with mode 600', async () => {
  creds._reset();
  const file = creds.envFile();
  await fs.writeFile(file, 'OPENAI_API_KEY=sk-old\n# XAI_API_KEY=xai-commented\n', 'utf8');
  assert.equal((await creds.persist('xai')).ok, false, 'nothing to persist yet');
  creds.set('xai', 'xai-persist-me-1234567890');
  const r = await creds.persist('xai');
  assert.equal(r.ok, true);
  assert.equal(r.key, 'XAI_API_KEY');
  assert.equal(r.masked, '••••7890');
  const text = await fs.readFile(file, 'utf8');
  assert.equal(text, 'OPENAI_API_KEY=sk-old\n# XAI_API_KEY=xai-commented\nXAI_API_KEY=xai-persist-me-1234567890\n');
  if (process.platform !== 'win32') assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  creds.set('xai', 'xai-persist-again-0987654321');
  await creds.persist('xai');
  const again = await fs.readFile(file, 'utf8');
  assert.equal(again.split('\n').filter((l) => l.startsWith('XAI_API_KEY=')).length, 1, 'the active line is replaced, not duplicated');
  assert.match(again, /XAI_API_KEY=xai-persist-again-0987654321/);
  creds._reset();
});

mock.close();
await fs.rm(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
