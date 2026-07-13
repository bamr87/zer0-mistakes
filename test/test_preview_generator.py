#!/usr/bin/env python3
# Feature: ZER0-004
"""Unit tests for scripts/lib/preview_generator.py (the consolidated engine).

Zero network: every provider/API test monkeypatches the module's HTTP layer.
Runs standalone (wired into test_core.sh as "Preview Generator Unit Specs"):

    python3 test/test_preview_generator.py
"""

import argparse
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts" / "lib"))

import preview_generator as pg  # noqa: E402

pg.POST_GENERATION_SLEEP = 0


def parse(argv):
    return pg.parse_args(argv)


def make_settings(**kwargs):
    return pg.Settings(**kwargs)


class TestFlagSurface(unittest.TestCase):
    """Golden test: every invocation used by the Rakefile and VS Code tasks
    must keep parsing. Breaking any of these breaks rake preview:* / tasks."""

    GOLDEN = [
        ["--list-missing"],
        ["--dry-run", "--verbose"],
        ["--verbose"],
        ["--collection", "posts", "--verbose"],
        ["--collection", "docs", "--verbose"],
        ["--force", "--verbose"],
        ["--file", "pages/_posts/example.md", "--verbose"],
        ["--collection", "posts"],
        ["--collection", "all"],
        # Historical bash flag surface
        ["-d"], ["-v"], ["-f", "x.md"], ["-c", "posts"], ["-p", "openai"],
        ["--output-dir", "assets/images/previews"],
        ["-j", "4"], ["-e"],
        ["--enhance-prompt", "fix it"],
        ["--enhance-model", "gpt-image-2"],
        ["--enhance-fidelity", "high"],
        ["--enhance-format", "png"],
        # New additive flags
        ["-p", "local"], ["-p", "gemini"],
        ["--prompt-engine", "claude"], ["--prompt-engine", "template"],
        ["--review", "claude"], ["--review", "none"],
        ["--rasterizer", "none"],
        ["-w", "2"],
        # Back-compat no-op from the previous engine's CLI
        ["--rate-limit", "5"],
    ]

    def test_golden_invocations_parse(self):
        for argv in self.GOLDEN:
            with self.subTest(argv=argv):
                parse(argv)

    def test_enhance_implication_rules(self):
        # --enhance-prompt / -fidelity / -format imply --enhance…
        self.assertTrue(parse(["--enhance-prompt", "x"]).enhance)
        self.assertTrue(parse(["--enhance-fidelity", "low"]).enhance)
        self.assertTrue(parse(["--enhance-format", "webp"]).enhance)
        # …but --enhance-model does NOT (historical behavior).
        self.assertFalse(parse(["--enhance-model", "gpt-image-2"]).enhance)


class TestSettingsPrecedence(unittest.TestCase):
    SITE = {
        "provider": "openai",
        "model": "gpt-image-2",
        "style": "config style",
        "output_dir": "assets/images/previews",
        "enabled": True,
        "collections": ["posts", "docs"],
    }

    def resolve(self, argv, env=None):
        with mock.patch.dict(os.environ, env or {}, clear=False):
            for key in ("AI_PROVIDER", "IMAGE_STYLE", "IMAGE_MODEL", "DRY_RUN",
                        "MAX_PARALLEL", "IMAGE_SIZE", "IMAGE_QUALITY"):
                if key not in (env or {}):
                    os.environ.pop(key, None)
            return pg.resolve_settings(parse(argv), self.SITE)

    def test_config_wins_over_defaults(self):
        settings = self.resolve([])
        self.assertEqual(settings.provider, "openai")
        self.assertEqual(settings.style, "config style")
        self.assertEqual(settings.collections, ["posts", "docs"])

    def test_env_wins_over_config(self):
        settings = self.resolve([], env={"AI_PROVIDER": "xai", "IMAGE_STYLE": "env style"})
        self.assertEqual(settings.provider, "xai")
        self.assertEqual(settings.style, "env style")

    def test_cli_wins_over_env(self):
        settings = self.resolve(
            ["-p", "local", "--style", "cli style"],
            env={"AI_PROVIDER": "xai", "IMAGE_STYLE": "env style"},
        )
        self.assertEqual(settings.provider, "local")
        self.assertEqual(settings.style, "cli style")

    def test_defaults_when_config_empty(self):
        with mock.patch.dict(os.environ, {}, clear=False):
            for key in ("AI_PROVIDER", "IMAGE_MODEL", "IMAGE_STYLE",
                        "PROMPT_ENGINE", "REVIEW_ENGINE"):
                os.environ.pop(key, None)
            settings = pg.resolve_settings(parse([]), {})
        self.assertEqual(settings.provider, "openai")  # default renderer
        # ZER0-004: Claude orchestrates by default (analysis + review)
        self.assertEqual(settings.prompt_engine, "claude")
        self.assertEqual(settings.review_engine, "claude")
        self.assertEqual(settings.collections, ["posts", "quickstart", "docs"])

    def test_review_engine_cli_overrides(self):
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("REVIEW_ENGINE", None)
            settings = pg.resolve_settings(parse(["--review", "none"]), {})
        self.assertEqual(settings.review_engine, "none")

    def test_author_overrides_apply_on_top(self):
        settings = self.resolve([])
        overrides = {"style": "noir", "model": "dall-e-3", "size": "1024x1024"}
        merged = pg.apply_author_overrides(settings, overrides)
        self.assertEqual(merged.style, "noir")
        self.assertEqual(merged.model, "dall-e-3")
        self.assertEqual(merged.size, "1024x1024")
        # untouched fields survive
        self.assertEqual(merged.output_dir, settings.output_dir)


class TestAuthorOverrides(unittest.TestCase):
    def test_real_authors_yaml_folded_scalars(self):
        """The live _data/authors.yml uses >- folded scalars — they must
        survive parsing intact (a mangled style prompt is invisible breakage)."""
        authors = pg.read_authors(REPO_ROOT)
        overrides = pg.author_preview_overrides(authors, "cassandra")
        self.assertIn("noir graphic-novel", overrides.get("style", ""))
        self.assertNotIn("\n", "")  # folded scalar collapses to one line
        overrides_vega = pg.author_preview_overrides(authors, "vega")
        self.assertIn("isometric 3D infographic", overrides_vega.get("style", ""))

    def test_non_string_author_keys(self):
        authors = {"a": {"preview": {"style": "s"}}}
        self.assertEqual(pg.author_preview_overrides(authors, ["a", "b"]), {})
        self.assertEqual(pg.author_preview_overrides(authors, {"name": "x"}), {})
        self.assertEqual(pg.author_preview_overrides(authors, None), {})
        self.assertEqual(pg.author_preview_overrides(authors, "missing"), {})


class TestFrontMatterEditor(unittest.TestCase):
    def edit(self, text, value="/images/previews/new.png"):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "post.md"
            path.write_bytes(text.encode("utf-8"))
            ok = pg.update_front_matter(path, value)
            result = path.read_bytes().decode("utf-8")
            leftovers = list(Path(tmp).glob("*.bak")) + list(Path(tmp).glob("*~"))
            return ok, result, leftovers

    def test_replaces_existing_preview(self):
        ok, out, leftovers = self.edit(
            "---\ntitle: T\npreview: /images/previews/old.png\n---\nBody\n")
        self.assertTrue(ok)
        self.assertIn("preview: /images/previews/new.png\n", out)
        self.assertNotIn("old.png", out)
        self.assertEqual(leftovers, [])

    def test_inserts_after_description(self):
        ok, out, _ = self.edit("---\ntitle: T\ndescription: D\nlayout: default\n---\nBody\n")
        self.assertTrue(ok)
        self.assertIn("description: D\npreview: /images/previews/new.png\nlayout: default\n", out)

    def test_inserts_after_folded_description(self):
        """Regression: folded scalars must not be split (the old sed/regex
        editors corrupted the following line)."""
        text = (
            "---\ntitle: T\n"
            "description: >-\n  line one\n  line two\n"
            "layout: default\n---\nBody\n"
        )
        ok, out, _ = self.edit(text)
        self.assertTrue(ok)
        self.assertIn(
            "description: >-\n  line one\n  line two\npreview: /images/previews/new.png\nlayout: default\n",
            out,
        )

    def test_inserts_after_title_without_description(self):
        ok, out, _ = self.edit("---\ntitle: T\nlayout: default\n---\nBody\n")
        self.assertTrue(ok)
        self.assertIn("title: T\npreview: /images/previews/new.png\nlayout: default\n", out)

    def test_body_preview_line_untouched(self):
        text = (
            "---\ntitle: T\npreview: /images/previews/old.png\n---\n"
            "Body text.\npreview: not-front-matter\nMore body.\n"
        )
        ok, out, _ = self.edit(text)
        self.assertTrue(ok)
        self.assertIn("preview: not-front-matter\n", out)  # body untouched
        self.assertEqual(out.count("new.png"), 1)

    def test_preserves_missing_trailing_newline(self):
        ok, out, _ = self.edit("---\ntitle: T\n---\nBody without newline")
        self.assertTrue(ok)
        self.assertTrue(out.endswith("Body without newline"))

    def test_crlf_preserved(self):
        text = "---\r\ntitle: T\r\ndescription: D\r\n---\r\nBody\r\n"
        ok, out, _ = self.edit(text)
        self.assertTrue(ok)
        self.assertIn("description: D\r\npreview: /images/previews/new.png\r\n", out)
        self.assertNotIn("\n\n", out.replace("\r\n", ""))

    def test_no_front_matter_refused(self):
        ok, out, _ = self.edit("Just a plain file\n")
        self.assertFalse(ok)
        self.assertEqual(out, "Just a plain file\n")

    def test_dry_run_writes_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "post.md"
            path.write_text("---\ntitle: T\n---\n", encoding="utf-8")
            self.assertTrue(pg.update_front_matter(path, "/x.png", dry_run=True))
            self.assertEqual(path.read_text(encoding="utf-8"), "---\ntitle: T\n---\n")


class TestSlugAndPaths(unittest.TestCase):
    def test_slug_parity_vectors(self):
        cases = {
            "Auto-hide Navigation": "auto-hide-navigation",
            "Hello, World! 123": "hello-world-123",
            "  Spaces  Around  ": "spaces-around",
            "Café Déjà Vu": "caf-d-j-vu",
            "UPPER lower": "upper-lower",
        }
        for title, expected in cases.items():
            self.assertEqual(pg.generate_filename(title), expected)

    def test_slug_50_char_cut_after_trim(self):
        title = "x" * 49 + "-" + "y" * 30
        slug = pg.generate_filename(title)
        self.assertEqual(len(slug), 50)
        self.assertTrue(slug.startswith("x" * 49))

    def test_front_matter_path_strips_assets_prefix(self):
        settings = make_settings(output_dir="assets/images/previews")
        self.assertEqual(
            pg.preview_front_matter_path(settings, "slug.png"),
            "/images/previews/slug.png",
        )

    def test_front_matter_path_custom_dir(self):
        settings = make_settings(output_dir="static/previews")
        self.assertEqual(
            pg.preview_front_matter_path(settings, "slug.svg"),
            "/static/previews/slug.svg",
        )

    def test_check_preview_exists(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "assets" / "images").mkdir(parents=True)
            (root / "assets" / "images" / "x.png").write_bytes(b"png")
            settings = make_settings()
            self.assertTrue(pg.check_preview_exists("/images/x.png", settings, root))
            self.assertTrue(pg.check_preview_exists("https://cdn.example/x.png", settings, root))
            self.assertFalse(pg.check_preview_exists("/images/missing.png", settings, root))
            self.assertFalse(pg.check_preview_exists(None, settings, root))


class TestOpenAIAdaptation(unittest.TestCase):
    def test_gpt_image_size_adaptation(self):
        self.assertEqual(
            pg.adapt_openai_size_quality("gpt-image-2", "1792x1024", "auto"),
            ("1536x1024", "auto"),
        )

    def test_dalle_quality_adaptation(self):
        self.assertEqual(
            pg.adapt_openai_size_quality("dall-e-3", "1792x1024", "auto"),
            ("1792x1024", "standard"),
        )

    def test_no_adaptation_needed(self):
        self.assertEqual(
            pg.adapt_openai_size_quality("gpt-image-2", "1536x1024", "auto"),
            ("1536x1024", "auto"),
        )


class TestModelFamily(unittest.TestCase):
    def test_family_detection(self):
        self.assertEqual(pg.model_family("claude-opus-4-8"), "claude")
        self.assertEqual(pg.model_family("gpt-image-2"), "openai")
        self.assertEqual(pg.model_family("dall-e-3"), "openai")
        self.assertEqual(pg.model_family("grok-2-image"), "xai")
        self.assertEqual(pg.model_family("gemini-2.5-flash-image"), "gemini")
        self.assertIsNone(pg.model_family("mystery-model"))

    def test_foreign_family_model_falls_back(self):
        settings = make_settings(model="claude-opus-4-8")
        self.assertEqual(pg.effective_model(settings, pg.PROVIDERS["openai"]), "gpt-image-2")

    def test_matching_family_kept(self):
        settings = make_settings(model="dall-e-3")
        self.assertEqual(pg.effective_model(settings, pg.PROVIDERS["openai"]), "dall-e-3")

    def test_empty_model_uses_provider_default(self):
        settings = make_settings(model="")
        self.assertEqual(
            pg.effective_model(settings, pg.PROVIDERS["xai"]), "grok-2-image"
        )

    def test_claude_model_under_renderer_falls_back(self):
        """A leftover `model: claude-*` (Claude is no longer a renderer) must
        fall back to the renderer's default, not be sent to the vendor API."""
        settings = make_settings(model="claude-opus-4-8")
        self.assertEqual(pg.effective_model(settings, pg.PROVIDERS["openai"]),
                         "gpt-image-2")


class TestSvgToolkit(unittest.TestCase):
    def _sanitize(self, body):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg">{body}</svg>'
        return pg.sanitize_svg(svg)

    def test_strips_script_and_handlers(self):
        clean, notes = self._sanitize(
            '<script>alert(1)</script><rect onclick="evil()" width="5"/>'
        )
        self.assertNotIn("script", clean)
        self.assertNotIn("onclick", clean)
        self.assertTrue(notes)

    def test_strips_foreign_object_iframe_image(self):
        clean, _ = self._sanitize(
            "<foreignObject><div>x</div></foreignObject>"
            '<image href="https://evil/x.png"/><iframe/>'
        )
        for banned in ("foreignObject", "iframe", "<image"):
            self.assertNotIn(banned, clean)

    def test_external_href_removed_local_kept(self):
        clean, _ = self._sanitize(
            '<use href="#local"/><a href="https://evil.example">x</a>'
        )
        self.assertIn('href="#local"', clean)
        self.assertNotIn("evil.example", clean)

    def test_style_url_scrubbed(self):
        clean, _ = self._sanitize(
            '<rect style="fill:url(https://evil/f.svg)"/>'
            "<style>@import url(https://evil/x.css); .a{fill:url(#grad)}</style>"
        )
        self.assertNotIn("evil", clean)
        self.assertIn("url(#grad)", clean)

    def test_presentation_attribute_url_scrubbed(self):
        """fill=/filter=/mask= url() references are an SSRF vector when the
        SVG later renders in Chromium — external url() must not survive."""
        clean, notes = self._sanitize(
            '<rect fill="url(https://evil.example/track)" width="5"/>'
            '<circle filter="url(HTTPS://evil.example/f#x)" r="2"/>'
            '<path mask="url(#localmask)" d="M0 0"/>'
        )
        self.assertNotIn("evil.example", clean)
        self.assertIn('mask="url(#localmask)"', clean)
        self.assertTrue(any("url()" in n for n in notes))

    def test_doctype_and_entities_rejected(self):
        hostile = (
            '<!DOCTYPE svg [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;">]>'
            '<svg xmlns="http://www.w3.org/2000/svg"><text>&b;</text></svg>'
        )
        with self.assertRaises(pg.SvgError):
            pg.sanitize_svg(hostile)

    def test_forces_banner_viewbox(self):
        clean, _ = self._sanitize("<rect/>")
        self.assertIn(f'viewBox="0 0 {pg.SVG_WIDTH} {pg.SVG_HEIGHT}"', clean)

    def test_rejects_non_svg_root(self):
        with self.assertRaises(pg.SvgError):
            pg.sanitize_svg("<html><body>nope</body></html>")

    def test_rejects_unparsable(self):
        with self.assertRaises(pg.SvgError):
            pg.sanitize_svg("<svg><unclosed")

    def test_local_template_is_valid_and_deterministic(self):
        svg_a = pg.render_local_svg("my-post", pg.seed_for("my-post"))
        svg_b = pg.render_local_svg("my-post", pg.seed_for("my-post"))
        self.assertEqual(svg_a, svg_b)
        clean, notes = pg.sanitize_svg(svg_a)
        self.assertEqual(notes, [])  # our own template must need no scrubbing
        self.assertIn("<svg", clean)


class TestAnthropicClient(unittest.TestCase):
    def client(self, env):
        with mock.patch.object(pg.shutil, "which", return_value=None):
            return pg.AnthropicClient(env)

    def test_oauth_token_mode_and_headers(self):
        client = self.client({"CLAUDE_CODE_OAUTH_TOKEN": "sk-ant-oat01-x"})
        self.assertEqual(client.mode, "oauth")
        headers = client.headers()
        self.assertEqual(headers["Authorization"], "Bearer sk-ant-oat01-x")
        self.assertEqual(headers["anthropic-beta"], pg.OAUTH_BETA)
        self.assertEqual(headers["anthropic-version"], pg.ANTHROPIC_VERSION)

    def test_auth_token_mode(self):
        client = self.client({"ANTHROPIC_AUTH_TOKEN": "tok"})
        self.assertEqual(client.mode, "oauth")

    def test_api_key_mode_headers(self):
        client = self.client({"ANTHROPIC_API_KEY": "sk-ant-api"})
        self.assertEqual(client.mode, "api_key")
        headers = client.headers()
        self.assertEqual(headers["x-api-key"], "sk-ant-api")
        self.assertNotIn("Authorization", headers)
        self.assertNotIn("anthropic-beta", headers)

    def test_cli_fallback_mode(self):
        with mock.patch.object(pg.shutil, "which", return_value="/usr/local/bin/claude"):
            client = pg.AnthropicClient({})
        self.assertEqual(client.mode, "cli")

    def test_no_credentials(self):
        client = self.client({})
        self.assertFalse(client.available())

    def test_precedence_oauth_over_api_key(self):
        client = self.client({
            "CLAUDE_CODE_OAUTH_TOKEN": "oat", "ANTHROPIC_API_KEY": "key",
        })
        self.assertEqual(client.mode, "oauth")

    def test_complete_payload_shape(self):
        captured = {}

        def fake_http_json(url, payload, headers, timeout=900):
            captured["url"], captured["payload"], captured["headers"] = url, payload, headers
            return {"stop_reason": "end_turn",
                    "content": [{"type": "thinking", "thinking": ""},
                                {"type": "text", "text": "<svg/>"}]}

        client = self.client({"CLAUDE_CODE_OAUTH_TOKEN": "tok"})
        with mock.patch.object(pg, "http_json", fake_http_json):
            text = client.complete("system-2", "user prompt")
        self.assertEqual(text, "<svg/>")
        payload = captured["payload"]
        # Claude Code identity MUST be the first system block (OAuth gate).
        self.assertEqual(payload["system"][0]["text"], pg.CLAUDE_CODE_SYSTEM_PROMPT)
        self.assertEqual(payload["system"][1]["text"], "system-2")
        self.assertEqual(payload["model"], pg.DEFAULT_CLAUDE_MODEL)
        self.assertEqual(payload["thinking"], {"type": "adaptive"})
        self.assertEqual(payload["max_tokens"], pg.CLAUDE_MAX_TOKENS)

    def test_refusal_raises(self):
        def fake_http_json(url, payload, headers, timeout=900):
            return {"stop_reason": "refusal", "stop_details": {"category": "cyber"},
                    "content": []}

        client = self.client({"ANTHROPIC_API_KEY": "k"})
        with mock.patch.object(pg, "http_json", fake_http_json):
            with self.assertRaises(pg.ClaudeRefusal) as ctx:
                client.complete("s", "u")
        self.assertEqual(ctx.exception.category, "cyber")

    def test_thinking_400_retries_without_thinking(self):
        calls = []

        def fake_http_json(url, payload, headers, timeout=900):
            calls.append(dict(payload))
            if "thinking" in payload:
                raise pg.HttpStatusError(
                    400, b'{"error": {"message": "thinking is not supported"}}', url)
            return {"stop_reason": "end_turn",
                    "content": [{"type": "text", "text": "ok"}]}

        client = self.client({"ANTHROPIC_API_KEY": "k"})
        with mock.patch.object(pg, "http_json", fake_http_json):
            self.assertEqual(client.complete("s", "u"), "ok")
        self.assertEqual(len(calls), 2)
        self.assertNotIn("thinking", calls[1])

    def test_truncation_raises(self):
        def fake_http_json(url, payload, headers, timeout=900):
            return {"stop_reason": "max_tokens",
                    "content": [{"type": "text", "text": "<svg"}]}

        client = self.client({"ANTHROPIC_API_KEY": "k"})
        with mock.patch.object(pg, "http_json", fake_http_json):
            with self.assertRaises(pg.ClaudeTruncated):
                client.complete("s", "u")

    def test_api_key_mode_omits_claude_code_block(self):
        """Parity with worker.js: the Claude Code identity block is an OAuth
        requirement and must NOT be injected for plain API keys."""
        captured = {}

        def fake_http_json(url, payload, headers, timeout=900):
            captured["payload"] = payload
            return {"stop_reason": "end_turn",
                    "content": [{"type": "text", "text": "ok"}]}

        client = self.client({"ANTHROPIC_API_KEY": "k"})
        with mock.patch.object(pg, "http_json", fake_http_json):
            client.complete("system-text", "u")
        system = captured["payload"]["system"]
        self.assertEqual(len(system), 1)
        self.assertEqual(system[0]["text"], "system-text")


class TestProviders(unittest.TestCase):
    def ctx(self, env=None, tmp=None):
        return pg.RunContext(project_root=Path(tmp or "."), env=env or {}, slug="test-post")

    def test_registry_contents(self):
        # Renderers only — Claude orchestrates and is deliberately NOT a provider.
        self.assertEqual(
            sorted(pg.PROVIDERS), ["gemini", "local", "openai", "stability", "xai"]
        )

    def test_edit_unsupported_on_non_edit_providers(self):
        for name in ("xai", "stability", "gemini"):
            with self.assertRaises(pg.EditUnsupported):
                pg.PROVIDERS[name].edit(Path("x.png"), "p", make_settings(), self.ctx())

    def test_local_edit_is_a_credential_free_noop(self):
        result = pg.PROVIDERS["local"].edit(Path("x.png"), "p", make_settings(), self.ctx())
        self.assertTrue(result.ok)
        self.assertEqual(result.path, Path("x.png"))

    def test_openai_edit_fidelity_rules(self):
        """input_fidelity is omitted for gpt-image-2, included otherwise."""
        captured = {}

        def fake_multipart(url, fields, files, headers, timeout=900):
            captured["fields"], captured["files"] = fields, files
            return {"data": [{"b64_json": "aGk="}]}

        with tempfile.TemporaryDirectory() as tmp:
            img = Path(tmp) / "banner.png"
            img.write_bytes(pg.PNG_SIGNATURE + b"rest")
            env = {"OPENAI_API_KEY": "k"}

            with mock.patch.object(pg, "http_multipart", fake_multipart):
                settings = make_settings(enhance_model="gpt-image-2")
                result = pg.PROVIDERS["openai"].edit(img, "p", settings, self.ctx(env, tmp))
                self.assertTrue(result.ok)
                self.assertNotIn("input_fidelity", captured["fields"])
                self.assertEqual(captured["fields"]["size"], "auto")
                self.assertEqual(captured["files"][0][0], "image[]")

                settings = make_settings(enhance_model="gpt-image-1", enhance_fidelity="high")
                pg.PROVIDERS["openai"].edit(img, "p", settings, self.ctx(env, tmp))
                self.assertEqual(captured["fields"]["input_fidelity"], "high")

    def test_openai_generate_payload_and_b64(self):
        captured = {}

        def fake_json(url, payload, headers, timeout=900):
            captured["url"], captured["payload"] = url, payload
            return {"data": [{"b64_json": "aGVsbG8="}]}

        with tempfile.TemporaryDirectory() as tmp:
            out_base = Path(tmp) / "slug"
            settings = make_settings(model="gpt-image-2", size="1792x1024", quality="auto")
            with mock.patch.object(pg, "http_json", fake_json):
                result = pg.PROVIDERS["openai"].generate(
                    "prompt", settings, out_base, self.ctx({"OPENAI_API_KEY": "k"}, tmp))
            self.assertTrue(result.ok)
            self.assertEqual(captured["payload"]["size"], "1536x1024")  # adapted
            self.assertEqual(result.path.read_bytes(), b"hello")

    def test_local_provider_svg_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_base = Path(tmp) / "slug"
            settings = make_settings(rasterizer="none")
            result = pg.PROVIDERS["local"].generate(
                "prompt", settings, out_base, self.ctx({}, tmp))
        self.assertTrue(result.ok)
        self.assertEqual(result.kind, "svg")
        self.assertEqual(result.path.suffix, ".svg")

    def test_gemini_inline_data_decode(self):
        def fake_json(url, payload, headers, timeout=900):
            self.assertIn("x-goog-api-key", headers)
            self.assertNotIn("key=", url)  # never in the query string
            return {"candidates": [{"content": {"parts": [
                {"text": "here"}, {"inlineData": {"data": "aW1n"}}]}}]}

        with tempfile.TemporaryDirectory() as tmp:
            out_base = Path(tmp) / "slug"
            with mock.patch.object(pg, "http_json", fake_json):
                result = pg.PROVIDERS["gemini"].generate(
                    "p", make_settings(), out_base, self.ctx({"GEMINI_API_KEY": "g"}, tmp))
            self.assertTrue(result.ok)
            self.assertEqual(result.path.read_bytes(), b"img")


class _FakeClaude:
    """Duck-typed stand-in for AnthropicClient in orchestration tests."""

    def __init__(self, text_reply=None, vision_reply=None, raise_exc=None):
        self.text_reply = text_reply
        self.vision_reply = vision_reply
        self.raise_exc = raise_exc
        self.complete_calls = []
        self.vision_calls = []

    def available(self):
        return True

    def complete(self, system_text, user_text, model=None, max_tokens=None):
        self.complete_calls.append((system_text, user_text, model))
        if self.raise_exc:
            raise self.raise_exc
        return self.text_reply or ""

    def complete_vision(self, system_text, user_text, image_path, model=None,
                        max_tokens=None):
        self.vision_calls.append((system_text, user_text, image_path, model))
        if self.raise_exc:
            raise self.raise_exc
        return self.vision_reply or ""


def make_content_file(tmp: Path) -> "pg.ContentFile":
    path = tmp / "post.md"
    path.write_text("---\ntitle: T\n---\nBody\n", encoding="utf-8")
    return pg.ContentFile(
        path=path, title="Auto-hide Navigation",
        description="Smart nav bar that hides on scroll",
        categories="docs, features", preview=None, author=None,
        content="The top navigation bar gets out of the way while you read.",
        front_matter={"title": "Auto-hide Navigation"},
    )


class TestClaudeOrchestration(unittest.TestCase):
    def test_article_brief_uses_art_director_and_article_context(self):
        client = _FakeClaude(text_reply="A pixel-art nav bar sliding away.")
        with tempfile.TemporaryDirectory() as tmp:
            cf = make_content_file(Path(tmp))
            brief = pg.claude_article_brief(client, cf, make_settings(), "base")
        self.assertEqual(brief, "A pixel-art nav bar sliding away.")
        system, user, model = client.complete_calls[0]
        self.assertEqual(system, pg.ART_DIRECTOR_SYSTEM)
        self.assertIn("Auto-hide Navigation", user)
        self.assertIn("hides on scroll", user)
        self.assertEqual(model, pg.DEFAULT_CLAUDE_MODEL)

    def test_article_brief_falls_back_on_failure(self):
        client = _FakeClaude(raise_exc=RuntimeError("boom"))
        with tempfile.TemporaryDirectory() as tmp:
            cf = make_content_file(Path(tmp))
            self.assertEqual(
                pg.claude_article_brief(client, cf, make_settings(), "base"), "base")

    def test_claude_model_setting_respected(self):
        client = _FakeClaude(text_reply="brief")
        with tempfile.TemporaryDirectory() as tmp:
            cf = make_content_file(Path(tmp))
            pg.claude_article_brief(
                client, cf, make_settings(claude_model="claude-sonnet-5"), "base")
        self.assertEqual(client.complete_calls[0][2], "claude-sonnet-5")

    def test_review_approve(self):
        client = _FakeClaude(
            vision_reply='{"verdict": "approve", "critique": "good", "revised_prompt": ""}')
        with tempfile.TemporaryDirectory() as tmp:
            cf = make_content_file(Path(tmp))
            img = Path(tmp) / "x.png"
            img.write_bytes(pg.PNG_SIGNATURE)
            approved, critique, revised = pg.claude_review_image(
                client, img, cf, "prompt", make_settings())
        self.assertTrue(approved)
        self.assertEqual(revised, "")
        self.assertEqual(client.vision_calls[0][0], pg.REVIEWER_SYSTEM)

    def test_review_revise(self):
        client = _FakeClaude(
            vision_reply='noise {"verdict": "revise", "critique": "wrong subject", '
                         '"revised_prompt": "better prompt"} trailing')
        with tempfile.TemporaryDirectory() as tmp:
            cf = make_content_file(Path(tmp))
            img = Path(tmp) / "x.png"
            img.write_bytes(pg.PNG_SIGNATURE)
            approved, critique, revised = pg.claude_review_image(
                client, img, cf, "prompt", make_settings())
        self.assertFalse(approved)
        self.assertEqual(revised, "better prompt")
        self.assertEqual(critique, "wrong subject")

    def test_review_garbage_counts_as_approval(self):
        client = _FakeClaude(vision_reply="I like it a lot!")
        with tempfile.TemporaryDirectory() as tmp:
            cf = make_content_file(Path(tmp))
            img = Path(tmp) / "x.png"
            img.write_bytes(pg.PNG_SIGNATURE)
            approved, _, revised = pg.claude_review_image(
                client, img, cf, "prompt", make_settings())
        self.assertTrue(approved)
        self.assertEqual(revised, "")

    def test_review_failure_counts_as_approval(self):
        client = _FakeClaude(raise_exc=RuntimeError("api down"))
        with tempfile.TemporaryDirectory() as tmp:
            cf = make_content_file(Path(tmp))
            img = Path(tmp) / "x.png"
            img.write_bytes(pg.PNG_SIGNATURE)
            approved, _, _ = pg.claude_review_image(
                client, img, cf, "prompt", make_settings())
        self.assertTrue(approved)

    def test_extract_json_object(self):
        self.assertEqual(pg._extract_json_object('x {"a": 1} y'), {"a": 1})
        self.assertIsNone(pg._extract_json_object("no json"))
        self.assertIsNone(pg._extract_json_object("{broken"))

    def test_complete_vision_api_payload(self):
        captured = {}

        def fake_http_json(url, payload, headers, timeout=900):
            captured["payload"] = payload
            return {"stop_reason": "end_turn",
                    "content": [{"type": "text", "text": "{}"}]}

        with mock.patch.object(pg.shutil, "which", return_value=None):
            client = pg.AnthropicClient({"ANTHROPIC_API_KEY": "k"})
        with tempfile.TemporaryDirectory() as tmp:
            img = Path(tmp) / "x.png"
            img.write_bytes(b"PNGBYTES")
            with mock.patch.object(pg, "http_json", fake_http_json):
                client.complete_vision("sys", "user", img)
        content = captured["payload"]["messages"][0]["content"]
        self.assertEqual(content[0]["type"], "image")
        self.assertEqual(content[0]["source"]["media_type"], "image/png")
        self.assertEqual(
            content[0]["source"]["data"],
            __import__("base64").b64encode(b"PNGBYTES").decode("ascii"))
        self.assertEqual(content[1]["text"], "user")
        # api_key mode: no Claude Code identity block
        self.assertEqual(len(captured["payload"]["system"]), 1)


class TestRunnerReviewLoop(unittest.TestCase):
    def _run(self, review_replies, generate_results):
        """Drive Runner.process_file with mocked renderer + reviewer."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "assets" / "images" / "previews").mkdir(parents=True)
            post = root / "post.md"
            post.write_text(
                "---\ntitle: Test Post\ndescription: D\n---\nBody\n",
                encoding="utf-8")

            settings = make_settings(
                provider="openai", prompt_engine="template",
                review_engine="claude", parallel=1)
            runner = pg.Runner(settings, root)

            calls = {"generate": []}

            def fake_generate(prompt, fsettings, out_base, fctx):
                calls["generate"].append(prompt)
                result = generate_results[len(calls["generate"]) - 1]
                if result:
                    png = out_base.with_suffix(".png")
                    png.write_bytes(pg.PNG_SIGNATURE + prompt.encode())
                    return pg.ImageResult(True, "png", png)
                return pg.ImageResult(False, error="render failed")

            reviews = iter(review_replies)

            def fake_review(client, image_path, cf, prompt, fsettings):
                return next(reviews)

            with mock.patch.object(pg.PROVIDERS["openai"], "generate", fake_generate), \
                 mock.patch.object(pg, "claude_review_image", fake_review), \
                 mock.patch.object(pg.RunContext, "claude",
                                   lambda self: _FakeClaude(text_reply="x")):
                runner.process_file(post)

            png = root / "assets" / "images" / "previews" / "test-post.png"
            content = png.read_bytes() if png.exists() else b""
            return calls["generate"], runner.stats, content

    def test_approved_image_generates_once(self):
        prompts, stats, _ = self._run(
            review_replies=[(True, "fine", "")],
            generate_results=[True])
        self.assertEqual(len(prompts), 1)
        self.assertEqual(stats.generated, 1)
        self.assertEqual(stats.errors, 0)

    def test_revision_regenerates_with_claude_prompt(self):
        prompts, stats, content = self._run(
            review_replies=[(False, "wrong subject", "REVISED BRIEF")],
            generate_results=[True, True])
        self.assertEqual(len(prompts), 2)
        self.assertEqual(prompts[1], "REVISED BRIEF")
        self.assertIn(b"REVISED BRIEF", content)  # second render kept
        self.assertEqual(stats.generated, 1)

    def test_failed_revision_keeps_first_image(self):
        prompts, stats, content = self._run(
            review_replies=[(False, "meh", "REVISED BRIEF")],
            generate_results=[True, False])
        self.assertEqual(len(prompts), 2)
        self.assertNotIn(b"REVISED BRIEF", content)  # first render kept
        self.assertEqual(stats.generated, 1)
        self.assertEqual(stats.errors, 0)


class TestMultipartBuilder(unittest.TestCase):
    def test_fields_and_files_encoded(self):
        body, content_type = pg.build_multipart(
            {"prompt": "hello"}, [("image[]", "a.png", b"BYTES", "image/png")]
        )
        self.assertIn("multipart/form-data; boundary=", content_type)
        boundary = content_type.split("boundary=")[1]
        self.assertIn(f"--{boundary}".encode(), body)
        self.assertIn(b'name="prompt"\r\n\r\nhello', body)
        self.assertIn(b'filename="a.png"', body)
        self.assertIn(b"BYTES", body)
        self.assertTrue(body.endswith(f"--{boundary}--\r\n".encode()))


class TestHttpErrorParsing(unittest.TestCase):
    def test_error_message_extraction(self):
        exc = pg.HttpStatusError(
            429, b'{"error": {"message": "slow down"}}', "https://api")
        self.assertEqual(exc.message(), "slow down")
        self.assertEqual(exc.status, 429)

    def test_non_json_body(self):
        exc = pg.HttpStatusError(500, b"<html>oops</html>", "https://api")
        self.assertIn("oops", exc.message())

    def test_retry_after_prefers_http_header(self):
        """Providers send Retry-After as an HTTP header — it must be read."""
        exc = pg.HttpStatusError(429, b"{}", "https://api",
                                 headers={"Retry-After": "31"})
        self.assertEqual(exc.retry_after(), 31.0)

    def test_retry_after_json_fallback_and_default(self):
        exc = pg.HttpStatusError(429, b'{"retry_after": 7}', "https://api")
        self.assertEqual(exc.retry_after(), 7.0)
        self.assertEqual(pg.HttpStatusError(500, b"x", "u").retry_after(), 0.0)

    def test_with_retries_honors_retry_after_header(self):
        calls = {"n": 0}
        sleeps = []

        def flaky():
            calls["n"] += 1
            if calls["n"] == 1:
                raise pg.HttpStatusError(429, b"{}", "u",
                                         headers={"retry-after": "5"})
            return "done"

        with mock.patch.object(pg.time, "sleep", sleeps.append):
            self.assertEqual(pg.with_retries(flaky, "test"), "done")
        self.assertEqual(calls["n"], 2)
        self.assertEqual(sleeps, [5.0])  # header wait wins over the 2s ladder


class TestDotenv(unittest.TestCase):
    def _load(self, content, pre_env):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / ".env").write_text(content, encoding="utf-8")
            with mock.patch.dict(os.environ, pre_env, clear=False):
                for key in ("PG_TEST_A", "PG_TEST_B", "PG_TEST_C"):
                    if key not in pre_env:
                        os.environ.pop(key, None)
                pg._load_dotenv(start=Path(tmp))
                return {k: os.environ.get(k) for k in
                        ("PG_TEST_A", "PG_TEST_B", "PG_TEST_C")}

    def test_empty_env_var_does_not_shadow_dotenv(self):
        """docker/VS Code forward `-e KEY=${env:KEY}` as empty strings; a real
        value in .env must still win over an EMPTY exported variable."""
        result = self._load("PG_TEST_A=real-value\n", {"PG_TEST_A": ""})
        self.assertEqual(result["PG_TEST_A"], "real-value")

    def test_nonempty_env_var_wins(self):
        result = self._load("PG_TEST_A=file-value\n", {"PG_TEST_A": "env-value"})
        self.assertEqual(result["PG_TEST_A"], "env-value")

    def test_inline_comment_and_quotes(self):
        result = self._load(
            'PG_TEST_A=sk-token  # prod key\nPG_TEST_B="quoted # not comment"\n'
            "PG_TEST_C='single'\n", {})
        self.assertEqual(result["PG_TEST_A"], "sk-token")
        self.assertEqual(result["PG_TEST_B"], "quoted # not comment")
        self.assertEqual(result["PG_TEST_C"], "single")


class TestValidateCredentials(unittest.TestCase):
    def test_unknown_provider_errors_even_in_dry_run(self):
        settings = make_settings(provider="bogus", dry_run=True)
        ctx = pg.RunContext(project_root=Path("."), env={})
        with self.assertRaises(SystemExit):
            pg.validate_credentials(settings, ctx)

    def test_known_provider_skips_credential_check_in_dry_run(self):
        settings = make_settings(provider="openai", dry_run=True)
        ctx = pg.RunContext(project_root=Path("."), env={})  # no key set
        pg.validate_credentials(settings, ctx)  # must not raise


if __name__ == "__main__":
    unittest.main(verbosity=2)
