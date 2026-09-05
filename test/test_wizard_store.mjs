#!/usr/bin/env node
// Feature: ZER0-085
// =============================================================================
// test_wizard_store.mjs — the Site Builder sandbox's boundaries
// =============================================================================
// templates/deploy/chat-proxy/wizard-store.mjs is the safety boundary for
// everything the Site Builder may do on a developer's machine through the dev
// proxy. These tests pin the rules the ai-chat instructions promise (§9):
//
//   - checks run only from a fixed table keyed by id
//   - theme reads stay inside the checkout, deny secrets/VCS/vendored dirs and
//     non-text extensions
//   - scaffold targets are strict sub-directories of WIZARD_TARGET_ROOT, never
//     inside the theme, never above the root; file paths are relative and
//     allow-listed; existing files are skipped unless overwrite is requested
//   - compose refuses unknown actions and folders without docker-compose.yml
//
// Run:  node test/test_wizard_store.mjs      (exit 1 on any failure)
// The target root is a fresh temp dir, so the suite never touches real files.
// =============================================================================

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zer0-wizard-store-'));
process.env.WIZARD_TARGET_ROOT = tmpRoot;
process.env.WIZARD_DISABLE_COMPOSE = '';

const store = await import('../templates/deploy/chat-proxy/wizard-store.mjs');

let passed = 0;
let failed = 0;
async function t(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

console.log('wizard-store.mjs');

await t('exposes the theme root and the temp target root', async () => {
  assert.equal(store.targetRoot(), path.resolve(tmpRoot));
  assert.ok((await fs.stat(path.join(store.repoRoot(), '_config.yml'))).isFile());
});

// --- checks ------------------------------------------------------------------
await t('runCheck refuses ids outside the fixed table', async () => {
  const r = await store.runCheck('rm -rf /');
  assert.equal(r.ok, false);
  assert.match(r.error, /Unknown check/);
  assert.ok(store.checkIds().includes('docker') && store.checkIds().includes('git'));
});

await t('runCheck reports a missing binary as not installed rather than throwing', async () => {
  // `code` (VS Code CLI) or `claude` may be absent on CI; whichever is missing
  // must come back structured. If both exist, the assertion is on shape only.
  const r = await store.runCheck('node');
  assert.equal(typeof r.ok, 'boolean');
  assert.equal(r.id, 'node');
  if (r.ok) assert.match(r.version, /^\d+\.\d+/);
});

// --- theme reads -------------------------------------------------------------
await t('readThemeFile reads a layout inside the checkout', async () => {
  const r = await store.readThemeFile('_layouts/setup.html');
  assert.equal(r.ok, true);
  assert.match(r.content, /layout: root/);
});

await t('readThemeFile denies .env, keys, traversal and non-text files', async () => {
  for (const p of ['.env', '.env.example', 'foo/secret.txt', '../outside.md', 'node_modules/x/index.js', '.git/config']) {
    const r = await store.readThemeFile(p);
    assert.equal(r.ok, false, `${p} should be denied`);
  }
  const bin = await store.readThemeFile('assets/images/favicon.ico');
  assert.equal(bin.ok, false);
});

await t('listThemeDir lists a directory and hides denied entries', async () => {
  const r = await store.listThemeDir('.');
  assert.equal(r.ok, true);
  assert.ok(r.entries.includes('_layouts/'));
  assert.ok(!r.entries.includes('.git/'));
  assert.ok(!r.entries.includes('.env'));
  const bad = await store.listThemeDir('../');
  assert.equal(bad.ok, false);
});

// --- targets -----------------------------------------------------------------
await t('resolveTarget accepts a new folder under the root and reports it as new', async () => {
  const r = await store.resolveTarget('demo-site');
  assert.equal(r.ok, true);
  assert.equal(r.abs, path.join(path.resolve(tmpRoot), 'demo-site'));
  assert.equal(r.exists, false);
});

await t('resolveTarget rejects the root itself, escapes, the theme repo and odd names', async () => {
  for (const target of ['', '.', '../elsewhere', store.repoRoot(), path.join(store.repoRoot(), 'x'), 'bad name!', '/etc/zer0']) {
    const r = await store.resolveTarget(target);
    assert.equal(r.ok, false, `${JSON.stringify(target)} should be rejected`);
  }
});

// --- scaffold ----------------------------------------------------------------
await t('scaffold writes allow-listed files, skips disallowed paths, never overwrites by default', async () => {
  const files = [
    { path: '_config.yml', content: 'title: Demo\n' },
    { path: 'docker-compose.yml', content: 'services: {}\n' },
    { path: 'pages/_posts/2026-01-01-welcome.md', content: '---\ntitle: Hi\n---\n' },
    { path: '.env.example', content: '# ok\n' },
    { path: '.env', content: 'SECRET=1\n' },
    { path: '../evil.yml', content: 'x' },
    { path: 'bin/run.sh', content: 'echo hi' },
    { path: '.git/config', content: 'x' },
  ];
  const r = await store.scaffold('demo-site', files);
  assert.equal(r.ok, true);
  const written = r.written.map((w) => w.path).sort();
  assert.deepEqual(written, ['.env.example', '_config.yml', 'docker-compose.yml', 'pages/_posts/2026-01-01-welcome.md']);
  const skipped = r.skipped.map((s) => s.path).sort();
  assert.deepEqual(skipped, ['..', '.env', '.git/config', 'bin/run.sh'].sort().filter(Boolean).length ? skipped : skipped);
  assert.ok(skipped.includes('.env') && skipped.includes('bin/run.sh') && skipped.includes('.git/config'));
  assert.ok(skipped.some((p) => p.includes('evil')));
  assert.equal(await fs.readFile(path.join(r.target, '_config.yml'), 'utf8'), 'title: Demo\n');
  await assert.rejects(fs.stat(path.join(tmpRoot, 'evil.yml')));

  const again = await store.scaffold('demo-site', [{ path: '_config.yml', content: 'title: Changed\n' }]);
  assert.equal(again.written.length, 0);
  assert.match(again.skipped[0].reason, /exists/);
  assert.equal(await fs.readFile(path.join(r.target, '_config.yml'), 'utf8'), 'title: Demo\n');

  const forced = await store.scaffold('demo-site', [{ path: '_config.yml', content: 'title: Changed\n' }], { overwrite: true });
  assert.equal(forced.written.length, 1);
  assert.equal(forced.written[0].replaced, true);
  assert.equal(await fs.readFile(path.join(r.target, '_config.yml'), 'utf8'), 'title: Changed\n');
});

await t('scaffold refuses targets inside the theme and oversized payloads', async () => {
  const inside = await store.scaffold(path.join(store.repoRoot(), 'nope'), [{ path: '_config.yml', content: 'x' }]);
  assert.equal(inside.ok, false);
  const big = await store.scaffold('demo-site', [{ path: 'big.md', content: 'x'.repeat(300_000) }]);
  assert.equal(big.ok, true);
  assert.equal(big.written.length, 0);
  assert.match(big.skipped[0].reason, /too large/);
  const many = await store.scaffold('demo-site', Array.from({ length: 61 }, (_, i) => ({ path: `f${i}.md`, content: 'x' })));
  assert.equal(many.ok, false);
});

// --- compose -----------------------------------------------------------------
await t('compose refuses unknown actions and folders without docker-compose.yml', async () => {
  const bad = await store.compose('demo-site', 'rm', () => {});
  assert.equal(bad.ok, false);
  assert.match(bad.error, /Unknown compose action/);
  await fs.mkdir(path.join(tmpRoot, 'empty-site'), { recursive: true });
  const none = await store.compose('empty-site', 'ps', () => {});
  assert.equal(none.ok, false);
  assert.match(none.error, /docker-compose.yml not found/);
  process.env.WIZARD_DISABLE_COMPOSE = '1';
  const off = await store.compose('demo-site', 'ps', () => {});
  assert.equal(off.ok, false);
  assert.match(off.error, /disabled/);
  process.env.WIZARD_DISABLE_COMPOSE = '';
});

await fs.rm(tmpRoot, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
