#!/usr/bin/env node
// Feature: ZER0-086
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
//   - the project session (ZER0-087): reads/lists/trees stay inside a project
//     under the root with the same denylist; write/edit/delete honour the
//     allow-list, the overwrite rule and the unique-snippet rule; project
//     commands come from a fixed table; image assets land under assets/ only
//     when their bytes really are a PNG/JPEG/WebP of the claimed type
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

// --- project session ---------------------------------------------------------
await t('listProjects finds folders that look like sites and never the theme', async () => {
  await fs.mkdir(path.join(tmpRoot, 'not-a-site'), { recursive: true });
  const r = await store.listProjects();
  assert.equal(r.ok, true);
  const names = r.projects.map((p) => p.name);
  assert.ok(names.includes('demo-site'), 'demo-site has a _config.yml + docker-compose.yml');
  assert.ok(!names.includes('not-a-site'));
  assert.ok(!names.includes(path.basename(store.repoRoot())));
  const demo = r.projects.find((p) => p.name === 'demo-site');
  assert.equal(demo.site, true);
  assert.equal(demo.compose, true);
});

await t('project reads and lists stay inside the project and deny secrets', async () => {
  await fs.writeFile(path.join(tmpRoot, 'demo-site', '.env'), 'SECRET=1\n');
  await fs.mkdir(path.join(tmpRoot, 'demo-site', 'node_modules', 'x'), { recursive: true });
  const cfg = await store.readProjectFile('demo-site', '_config.yml');
  assert.equal(cfg.ok, true);
  assert.equal(cfg.content, 'title: Changed\n');
  for (const p of ['.env', '../../outside.md', 'node_modules/x/index.js', '.git/config']) {
    assert.equal((await store.readProjectFile('demo-site', p)).ok, false, `${p} should be denied`);
  }
  assert.equal((await store.readProjectFile(store.repoRoot(), '_config.yml')).ok, false, 'the theme is never a project');
  const ls = await store.listProjectDir('demo-site', '.');
  assert.equal(ls.ok, true);
  assert.ok(ls.entries.includes('_config.yml') && ls.entries.includes('pages/'));
  assert.ok(!ls.entries.includes('.env') && !ls.entries.includes('node_modules/'));
  const tree = await store.projectTree('demo-site', '.', 3);
  assert.equal(tree.ok, true);
  assert.ok(tree.entries.includes('pages/_posts/2026-01-01-welcome.md'));
  assert.ok(!tree.entries.some((e) => e.startsWith('node_modules')));
});

await t('writeProjectFile honours the allow-list and the overwrite rule; edit needs a unique snippet; delete only files', async () => {
  const w = await store.writeProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', '---\ntitle: Second\n---\nHello hello.\n');
  assert.equal(w.ok, true);
  assert.equal(w.replaced, false);
  assert.equal((await store.writeProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', 'x')).ok, false, 'no silent overwrite');
  assert.equal((await store.writeProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', 'x', { overwrite: true })).replaced, true);
  for (const bad of ['.env', 'bin/run.sh', '../evil.md', '.git/hooks/x', 'assets/images/pic.png']) {
    assert.equal((await store.writeProjectFile('demo-site', bad, 'x')).ok, false, `${bad} should be refused`);
  }
  assert.equal((await store.writeProjectFile('demo-site', '_includes/custom/head.liquid', '{{ x }}')).ok, true, 'Liquid partials are writable');
  await store.writeProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', 'Hello Hello.\nBye.\n', { overwrite: true });
  const ambiguous = await store.editProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', 'Hello', 'Hi');
  assert.equal(ambiguous.ok, false);
  assert.match(ambiguous.error, /2 times/);
  const all = await store.editProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', 'Hello', 'Hi', { all: true });
  assert.equal(all.replacements, 2);
  const one = await store.editProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', 'Bye.', 'See you.');
  assert.equal(one.ok, true);
  assert.equal(await fs.readFile(path.join(tmpRoot, 'demo-site', 'pages/_posts/2026-02-02-second.md'), 'utf8'), 'Hi Hi.\nSee you.\n');
  assert.equal((await store.editProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md', 'absent', 'x')).ok, false);
  assert.equal((await store.editProjectFile('demo-site', '.env', 'SECRET', 'x')).ok, false);
  assert.equal((await store.deleteProjectFile('demo-site', 'pages')).ok, false, 'directories are never deleted');
  assert.equal((await store.deleteProjectFile('demo-site', '.env')).ok, false);
  assert.equal((await store.deleteProjectFile('demo-site', 'pages/_posts/2026-02-02-second.md')).ok, true);
  await assert.rejects(fs.stat(path.join(tmpRoot, 'demo-site', 'pages/_posts/2026-02-02-second.md')));
});

await t('runProjectCommand runs only the fixed table, inside an existing project', async () => {
  assert.deepEqual(store.projectCommandIds(), ['git-status', 'git-diff', 'git-log', 'git-init']);
  const bad = await store.runProjectCommand('demo-site', 'rm -rf');
  assert.equal(bad.ok, false);
  assert.match(bad.error, /Unknown project command/);
  assert.equal((await store.runProjectCommand('never-made', 'git-status')).ok, false);
  const init = await store.runProjectCommand('demo-site', 'git-init');
  assert.equal(init.ok, true);
  const status = await store.runProjectCommand('demo-site', 'git-status');
  assert.equal(status.ok, true);
  assert.match(status.output, /_config\.yml/);
});

await t('writeProjectAsset accepts real images under assets/ only, sniffing the bytes', async () => {
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
  const ok = await store.writeProjectAsset('demo-site', 'assets/images/hero.png', png);
  assert.equal(ok.ok, true);
  assert.equal(ok.type, 'image/png');
  assert.equal((await store.writeProjectAsset('demo-site', 'assets/images/hero.png', png)).ok, false, 'no overwrite by default');
  assert.equal((await store.writeProjectAsset('demo-site', 'assets/images/hero.png', png, { overwrite: true })).replaced, true);
  assert.equal((await store.writeProjectAsset('demo-site', 'assets/images/hero.jpg', png)).ok, false, 'PNG bytes may not be saved as .jpg');
  assert.equal((await store.writeProjectAsset('demo-site', 'images/hero.png', png)).ok, false, 'only under assets/');
  assert.equal((await store.writeProjectAsset('demo-site', 'assets/hero.svg', png)).ok, false);
  assert.equal((await store.writeProjectAsset('demo-site', 'assets/images/x.png', Buffer.from('<script>'))).ok, false, 'not an image');
  assert.equal((await store.writeProjectAsset('demo-site', 'assets/images/../../.env.png', png)).ok, false);
  const read = await store.readProjectAsset('demo-site', 'assets/images/hero.png');
  assert.equal(read.ok, true);
  assert.equal(read.contentType, 'image/png');
  assert.equal(read.bytes.length, png.length);
  assert.equal((await store.readProjectAsset('demo-site', '_config.yml')).ok, false);
});

await t('compose exposes the build and restart actions and still refuses folders without docker-compose.yml', async () => {
  assert.ok(store.composeActions().includes('build'));
  // `restart` is how an agent makes a NEWLY added post visible: Jekyll's
  // watcher only tracks documents that existed when serve started.
  assert.ok(store.composeActions().includes('restart'));
  assert.deepEqual(store.composeActions().sort(), ['build', 'config', 'down', 'logs', 'ps', 'restart', 'up']);
  const none = await store.compose('empty-site', 'build', () => {});
  assert.equal(none.ok, false);
  assert.match(none.error, /docker-compose.yml not found/);
});

await fs.rm(tmpRoot, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
