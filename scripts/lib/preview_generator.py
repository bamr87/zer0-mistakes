#!/usr/bin/env python3
# Feature: ZER0-004
"""Preview Image Generator — the consolidated AI preview-image engine.

This single file is the ONE engine behind every preview-image entry point
(`scripts/generate-preview-images.sh` → `scripts/features/generate-preview-images`
→ this file; `rake preview:*`; the VS Code tasks). It replaces the former
1,400-line Bash implementation and this file's previous OpenAI-only draft.

Architecture — Claude ORCHESTRATES, an image model RENDERS:

    stage      role                                     engine / credential
    --------   --------------------------------------   ----------------------------------
    analyze    Claude reads the article and writes a    CLAUDE_CODE_OAUTH_TOKEN →
               vivid art-direction brief for the        ANTHROPIC_AUTH_TOKEN →
               renderer (prompt_engine: claude)         ANTHROPIC_API_KEY → `claude` CLI
    produce    a raster image model renders the brief   the selected provider (below)
    review     Claude looks at the produced image       same Claude credential chain
               (vision) and, if it misrepresents the
               article, requests ONE refined
               regeneration (review_engine: claude)

    provider   renderer                                 credential
    --------   --------------------------------------   ----------------------------------
    openai     gpt-image-2 / dall-e-3 (+ --enhance      OPENAI_API_KEY
    (default)  via /v1/images/edits)
    xai        grok-2-image                             XAI_API_KEY
    stability  Stable Diffusion XL (v1 API)             STABILITY_API_KEY
    gemini     gemini-2.5-flash-image                   GEMINI_API_KEY
    local      deterministic template SVG → PNG         none (CI-safe; skips
                                                        analyze/review)

Claude never renders pixels itself (the Anthropic API has no image-generation
endpoint); with no Claude credential the analyze/review stages degrade
gracefully to the built-in template prompt with a warning — the renderer still
runs. The SVG toolkit (sanitizer + rsvg/inkscape/magick/Playwright rasterizer
chain) serves the zero-credential `local` provider.

Configuration priority (per file):
    author preview overrides (_data/authors.yml) > CLI args > environment
    variables > _config.yml `preview_images:` > built-in defaults

Usage:
    python3 scripts/lib/preview_generator.py --list-missing
    python3 scripts/lib/preview_generator.py --dry-run --verbose
    python3 scripts/lib/preview_generator.py --collection posts
    python3 scripts/lib/preview_generator.py -f pages/_posts/my-post.md --force
    python3 scripts/lib/preview_generator.py --provider local -f <file>
    python3 scripts/lib/preview_generator.py --prompt-engine template --review none ...

Dependencies: Python 3.9+ stdlib + PyYAML (`pip3 install pyyaml`). No other
packages — HTTP goes through urllib, multipart bodies are hand-rolled.

Exit codes: 0 = success; 1 = validation failure or any per-file errors.
"""

import argparse
import base64
import functools
import io
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import threading
import time
import uuid
import urllib.error
import urllib.request
import zlib
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import yaml
except ImportError:  # checked in ensure_yaml() after --help handling
    yaml = None


# =============================================================================
# Constants
# =============================================================================

# Built-in fallbacks — used only when a key is absent from _config.yml, env,
# and CLI. Mirrors the former Bash defaults; Claude orchestration (analysis +
# review, ZER0-004) is on by default and degrades gracefully without a
# Claude credential.
DEFAULTS: Dict[str, Any] = {
    "enabled": True,
    "provider": "openai",
    "model": "",  # empty → the active provider's default_model()
    "size": "1536x1024",
    "quality": "auto",
    "style": (
        "retro pixel art, 8-bit video game aesthetic, vibrant colors, "
        "nostalgic, clean pixel graphics"
    ),
    "style_modifiers": (
        "pixelated, retro gaming style, CRT screen glow effect, "
        "limited color palette"
    ),
    "output_dir": "assets/images/previews",
    "assets_prefix": "/assets",
    "auto_prefix": True,
    "collections": ["posts", "quickstart", "docs"],
    "prompt_engine": "claude",   # claude analyzes the article; falls back to template
    "review_engine": "claude",   # claude vision-reviews the render; `none` disables
    "claude_model": "",          # empty → DEFAULT_CLAUDE_MODEL
}

# Enhance mode (OpenAI /v1/images/edits — see OpenAIProvider.edit)
ENHANCE_DEFAULTS: Dict[str, str] = {
    "model": "gpt-image-2",
    "quality": "auto",
    "fidelity": "high",
    "format": "png",
}
DEFAULT_ENHANCE_PROMPT = (
    "Improve this preview banner image: fix any misspelled, garbled, or "
    "incorrect text so it reads clearly and accurately. Sharpen visual details "
    "and improve composition while preserving the original art style, color "
    "palette, and theme. Ensure the image is clean and professional."
)

# Anthropic wire constants — keep in sync with templates/deploy/chat-proxy/worker.js.
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
OAUTH_BETA = "oauth-2025-04-20"
# Claude Code OAuth tokens require the FIRST system block to identify as Claude
# Code, otherwise the API rejects the call with a misleading `rate_limit_error`.
CLAUDE_CODE_SYSTEM_PROMPT = "You are Claude Code, Anthropic's official CLI for Claude."
DEFAULT_CLAUDE_MODEL = "claude-opus-4-8"
CLAUDE_MAX_TOKENS = 16000  # non-streaming ceiling; SVG banners fit comfortably

# Model-name prefix → provider family. Used to ignore a configured/author model
# that belongs to a different vendor than the active provider (never send a
# request that is guaranteed to 400).
MODEL_FAMILIES: Dict[str, str] = {
    "claude-": "claude",
    "gpt-image-": "openai",
    "dall-e-": "openai",
    "grok-": "xai",
    "stable-": "stability",
    "sd3": "stability",
    "gemini-": "gemini",
    "imagen-": "gemini",
}

# Banner geometry for SVG-producing providers (claude, local).
SVG_WIDTH, SVG_HEIGHT = 1536, 1024

# Curated retro palettes: (sky/background, far, mid, near, accent, glow).
# Selected deterministically per slug so re-runs stay visually stable.
RETRO_PALETTES: List[List[str]] = [
    ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560", "#f9ed69"],
    ["#0d1b2a", "#1b263b", "#415a77", "#778da9", "#e0e1dd", "#ffb703"],
    ["#2d132c", "#801336", "#c72c41", "#ee4540", "#f9d276", "#f4f4f4"],
    ["#10002b", "#3c096c", "#7b2cbf", "#c77dff", "#e0aaff", "#72efdd"],
    ["#001219", "#005f73", "#0a9396", "#94d2bd", "#e9d8a6", "#ee9b00"],
    ["#03071e", "#370617", "#9d0208", "#dc2f02", "#f48c06", "#ffba08"],
    ["#0b132b", "#1c2541", "#3a506b", "#5bc0be", "#6fffe9", "#ff6b6b"],
    ["#232931", "#393e46", "#4ecca3", "#a5ecd7", "#eeeeee", "#f95959"],
    ["#1f0a24", "#571089", "#ab51e3", "#f7aef8", "#b388eb", "#8093f1"],
    ["#141e30", "#243b55", "#3c6382", "#82ccdd", "#f8c291", "#e55039"],
]

COMPOSITION_VARIANTS: List[str] = [
    "a low horizon with a huge rising sun disk banded by scanlines",
    "layered diagonal mountain silhouettes receding into haze",
    "a vaporwave perspective grid floor vanishing toward the horizon",
    "floating terraced islands with cascading pixel waterfalls",
    "a night starfield with a large ringed planet arcing across the frame",
    "a stepped city skyline of blocky towers with lit windows",
    "rolling desert dunes with a lone monolith and long shadows",
    "an ocean of chunky pixel waves under drifting square clouds",
]

# System prompt for Claude's ART-DIRECTOR role (prompt_engine: claude): read
# the article, then write the brief a raster image model will render. NOTE:
# "no text" matches the long-standing prompt rule of this feature — image
# models garble lettering.
ART_DIRECTOR_SYSTEM = """You are an art director for a technical blog. You will be given an article
(title, description, tags, an excerpt) plus mandatory style directions. Your
job is to design ONE preview banner image and describe it to an AI image
model.

Respond with ONLY the image-generation prompt — no preamble, no quotes, no
markdown. One vivid paragraph of at most 130 words that:
- captures the article's actual SUBJECT as a concrete visual metaphor or
  scene (specific objects, actions and spatial arrangement — never a generic
  'technology background');
- specifies composition for a wide banner (what sits left/center/right,
  foreground/background, focal point);
- weaves in the given art style and palette directions verbatim in spirit;
- states that the image must contain NO text, letters, words, numbers, logos
  or UI copy of any kind."""

# System prompt for Claude's REVIEWER role (review_engine: claude): look at
# the rendered image and decide whether it represents the article.
REVIEWER_SYSTEM = """You are reviewing an AI-generated blog preview banner against the article it
illustrates. Judge three things: (1) does the image clearly evoke the
article's actual subject, (2) does it follow the requested art style, and
(3) is it free of text/lettering artifacts and visual glitches.

Respond with ONLY a JSON object, no markdown fences:
{"verdict": "approve" | "revise",
 "critique": "<one or two sentences on what is wrong or right>",
 "revised_prompt": "<empty when approving; otherwise a complete replacement
image-generation prompt (max 130 words) that fixes the problems while keeping
the required style and the no-text rule>"}

Approve unless the image genuinely misrepresents the subject, breaks the
style, or contains text/glitches — minor taste differences are not grounds
for revision."""

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

# Pause after each successful non-dry generation (Bash parity: polite pacing
# between paid API calls). Tests set this to 0.
POST_GENERATION_SLEEP = 2.0


# =============================================================================
# Terminal output
# =============================================================================

class Colors:
    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    CYAN = "\033[0;36m"
    PURPLE = "\033[0;35m"
    BOLD = "\033[1m"
    NC = "\033[0m"


VERBOSE = False
_log_file = None  # type: Optional[Any]

_LEVEL_COLORS = {
    "info": Colors.BLUE,
    "step": Colors.CYAN,
    "success": Colors.GREEN,
    "warning": Colors.YELLOW,
    "error": Colors.RED,
    "debug": Colors.PURPLE,
}


def log(msg: str, level: str = "info") -> None:
    color = _LEVEL_COLORS.get(level, Colors.NC)
    stream = sys.stderr if level in ("warning", "error", "debug") else sys.stdout
    print(f"{color}[{level.upper()}]{Colors.NC} {msg}", file=stream)
    if _log_file:
        stamp = time.strftime("%Y-%m-%d %H:%M:%S")
        _log_file.write(f"{stamp} [{level.upper()}] {msg}\n")
        _log_file.flush()


def info(msg: str) -> None:
    log(msg, "info")


def step(msg: str) -> None:
    log(msg, "step")


def success(msg: str) -> None:
    log(msg, "success")


def warn(msg: str) -> None:
    log(msg, "warning")


def debug(msg: str) -> None:
    if VERBOSE:
        log(msg, "debug")


def error_exit(msg: str) -> "NoReturn":  # noqa: F821 - typing.NoReturn (3.9 compat)
    log(msg, "error")
    sys.exit(1)


def print_header(title: str) -> None:
    line = "=" * 64
    print(f"\n{Colors.CYAN}{line}{Colors.NC}")
    print(f"  {Colors.GREEN}{title}{Colors.NC}")
    print(f"{Colors.CYAN}{line}{Colors.NC}\n")


# =============================================================================
# Environment / interrupts
# =============================================================================

_interrupted = False


def _signal_handler(signum, frame):  # noqa: ARG001
    global _interrupted
    _interrupted = True
    print(f"\n{Colors.YELLOW}⚠️  Interrupt received. Finishing current tasks...{Colors.NC}")


def _load_dotenv(start: Optional[Path] = None) -> None:
    """Load .env from cwd (or `start`) up to 4 parents.

    Non-empty exported env vars win over .env; an EMPTY env var is treated as
    unset (docker/VS Code tasks forward `-e KEY=${env:KEY}` which materializes
    empty strings that must not shadow a real value in .env).
    """
    search_dir = start or Path.cwd()
    for _ in range(5):
        env_file = search_dir / ".env"
        if env_file.is_file():
            try:
                for line in env_file.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip()
                    if value[:1] in ("'", '"') and value[-1:] == value[:1]:
                        value = value[1:-1]  # matched surrounding quotes
                    else:
                        value = value.split(" #", 1)[0].rstrip()  # inline comment
                    if key and not os.environ.get(key):
                        os.environ[key] = value
            except OSError:
                pass
            return
        if search_dir.parent == search_dir:
            break
        search_dir = search_dir.parent


def ensure_yaml() -> None:
    if yaml is None:
        error_exit(
            "PyYAML is required (front matter, _config.yml and _data/authors.yml "
            "parsing). Install it with ONE of:\n"
            "    pip3 install pyyaml\n"
            "    python3 -m pip install --user pyyaml\n"
            "    docker-compose exec jekyll pip3 install --break-system-packages pyyaml"
        )


# =============================================================================
# HTTP layer (urllib only — no third-party HTTP deps)
# =============================================================================

class HttpStatusError(Exception):
    """Non-2xx HTTP response, with parsed body + headers when possible."""

    def __init__(self, status: int, body: bytes, url: str,
                 headers: Optional[Dict[str, str]] = None):
        self.status = status
        self.body = body
        self.url = url
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}
        super().__init__(f"HTTP {status} from {url}: {self.message()[:300]}")

    def retry_after(self) -> float:
        """Server-requested backoff: the Retry-After header (what Anthropic/
        OpenAI/xAI actually send on 429), falling back to a JSON body field."""
        try:
            header = self.headers.get("retry-after")
            if header:
                return float(header)
        except (TypeError, ValueError):
            pass
        data = self.json()
        if isinstance(data, dict):
            try:
                return float(data.get("retry_after", 0) or 0)
            except (TypeError, ValueError):
                pass
        return 0.0

    def json(self) -> Optional[dict]:
        try:
            return json.loads(self.body.decode("utf-8", "replace"))
        except (ValueError, UnicodeDecodeError):
            return None

    def message(self) -> str:
        data = self.json()
        if isinstance(data, dict):
            err = data.get("error")
            if isinstance(err, dict) and err.get("message"):
                return str(err["message"])
            if isinstance(err, str):
                return err
            if data.get("detail"):
                return str(data["detail"])
        return self.body.decode("utf-8", "replace")[:500]


def http_request(
    url: str,
    method: str = "GET",
    headers: Optional[Dict[str, str]] = None,
    data: Optional[bytes] = None,
    timeout: int = 120,
) -> Tuple[int, Dict[str, str], bytes]:
    req = urllib.request.Request(url, data=data, method=method)
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers.items()), resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read() if exc.fp else b""
        raise HttpStatusError(exc.code, body, url,
                              dict(exc.headers.items()) if exc.headers else None) from None


def http_json(
    url: str, payload: dict, headers: Dict[str, str], timeout: int = 900
) -> dict:
    body = json.dumps(payload).encode("utf-8")
    hdrs = {"Content-Type": "application/json", **headers}
    _, _, raw = http_request(url, "POST", hdrs, body, timeout)
    return json.loads(raw.decode("utf-8"))


def build_multipart(
    fields: Dict[str, str], files: List[Tuple[str, str, bytes, str]]
) -> Tuple[bytes, str]:
    """Encode multipart/form-data. files: (field, filename, content, mime)."""
    boundary = f"----zer0-{uuid.uuid4().hex}"
    buf = io.BytesIO()
    for name, value in fields.items():
        buf.write(f"--{boundary}\r\n".encode())
        buf.write(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        buf.write(str(value).encode("utf-8"))
        buf.write(b"\r\n")
    for name, filename, content, mime in files:
        buf.write(f"--{boundary}\r\n".encode())
        buf.write(
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode()
        )
        buf.write(f"Content-Type: {mime}\r\n\r\n".encode())
        buf.write(content)
        buf.write(b"\r\n")
    buf.write(f"--{boundary}--\r\n".encode())
    return buf.getvalue(), f"multipart/form-data; boundary={boundary}"


def http_multipart(
    url: str,
    fields: Dict[str, str],
    files: List[Tuple[str, str, bytes, str]],
    headers: Dict[str, str],
    timeout: int = 900,
) -> dict:
    body, content_type = build_multipart(fields, files)
    hdrs = {"Content-Type": content_type, **headers}
    _, _, raw = http_request(url, "POST", hdrs, body, timeout)
    return json.loads(raw.decode("utf-8"))


def download_to(url: str, dest: Path, timeout: int = 120) -> None:
    _, _, raw = http_request(url, "GET", {}, None, timeout)
    dest.write_bytes(raw)


RETRYABLE_STATUSES = {429, 500, 502, 503, 529}


def with_retries(fn, what: str, attempts: int = 4):
    """Run fn(); retry transport errors and retryable HTTP statuses.

    Backoff 2s/4s/8s (or the server's Retry-After when larger, capped 60s).
    """
    delay = 2.0
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except HttpStatusError as exc:
            if exc.status not in RETRYABLE_STATUSES or attempt == attempts:
                raise
            wait = min(max(delay, exc.retry_after()), 60.0)
            warn(f"{what}: HTTP {exc.status}, retrying in {wait:.0f}s "
                 f"(attempt {attempt}/{attempts})")
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as exc:
            if attempt == attempts:
                raise
            wait = delay
            warn(f"{what}: {exc.__class__.__name__}: {exc}; retrying in {wait:.0f}s "
                 f"(attempt {attempt}/{attempts})")
        time.sleep(wait)
        delay *= 2


# =============================================================================
# Config layer
# =============================================================================

def find_project_root() -> Path:
    """Repo root: scripts/lib/<this file> → two parents up; else walk from cwd."""
    script_root = Path(__file__).resolve().parent.parent.parent
    if (script_root / "_config.yml").is_file():
        return script_root
    probe = Path.cwd()
    for _ in range(6):
        if (probe / "_config.yml").is_file():
            return probe
        if probe.parent == probe:
            break
        probe = probe.parent
    return script_root


def load_yaml_file(path: Path) -> Dict[str, Any]:
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}
    except Exception as exc:  # malformed YAML must not kill the whole run
        warn(f"Could not parse {path.name}: {exc}")
        return {}


def read_site_config(project_root: Path) -> Dict[str, Any]:
    cfg = load_yaml_file(project_root / "_config.yml").get("preview_images")
    return cfg if isinstance(cfg, dict) else {}


def read_authors(project_root: Path) -> Dict[str, Any]:
    return load_yaml_file(project_root / "_data" / "authors.yml")


def author_preview_overrides(authors: Dict[str, Any], author_key: Any) -> Dict[str, str]:
    """`preview:` override block for an author key (style/style_modifiers/size/
    quality/model). `author:` may be a list or mapping in some posts — only a
    plain string key can index authors.yml; anything else has no override."""
    if not isinstance(author_key, str) or not author_key:
        return {}
    author = authors.get(author_key)
    if not isinstance(author, dict):
        return {}
    preview = author.get("preview")
    if not isinstance(preview, dict):
        return {}
    return {
        key: str(value).strip()
        for key, value in preview.items()
        if key in ("style", "style_modifiers", "size", "quality", "model")
        and value is not None and str(value).strip()
    }


def _env_flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() == "true"


@dataclass
class Settings:
    """Fully-resolved run settings (before per-file author overrides)."""

    provider: str = DEFAULTS["provider"]
    model: str = DEFAULTS["model"]
    size: str = DEFAULTS["size"]
    quality: str = DEFAULTS["quality"]
    style: str = DEFAULTS["style"]
    style_modifiers: str = DEFAULTS["style_modifiers"]
    output_dir: str = DEFAULTS["output_dir"]
    assets_prefix: str = DEFAULTS["assets_prefix"]
    auto_prefix: bool = DEFAULTS["auto_prefix"]
    enabled: bool = True
    collections: List[str] = field(default_factory=lambda: list(DEFAULTS["collections"]))
    prompt_engine: str = DEFAULTS["prompt_engine"]
    review_engine: str = DEFAULTS["review_engine"]
    claude_model: str = DEFAULTS["claude_model"]

    dry_run: bool = False
    verbose: bool = False
    force: bool = False
    list_only: bool = False
    parallel: int = 4
    batch: int = 0

    file: str = ""
    collection: str = ""

    enhance: bool = False
    enhance_prompt: str = ""
    enhance_model: str = ENHANCE_DEFAULTS["model"]
    enhance_quality: str = ENHANCE_DEFAULTS["quality"]
    enhance_fidelity: str = ENHANCE_DEFAULTS["fidelity"]
    enhance_format: str = ENHANCE_DEFAULTS["format"]

    rasterizer: str = "auto"
    provider_explicit: bool = False


def resolve_settings(args: argparse.Namespace, site: Dict[str, Any]) -> Settings:
    """Merge CLI > env > _config.yml > DEFAULTS into a Settings object."""

    def cfg(key: str, default: Any) -> Any:
        value = site.get(key)
        return default if value is None else value

    def pick(cli_value: Optional[str], env_name: str, cfg_key: str) -> str:
        if cli_value is not None:
            return cli_value
        env_value = os.environ.get(env_name)
        if env_value:
            return env_value
        return str(cfg(cfg_key, DEFAULTS[cfg_key]))

    collections = cfg("collections", DEFAULTS["collections"])
    if not isinstance(collections, list) or not collections:
        collections = list(DEFAULTS["collections"])

    parallel_env = os.environ.get("MAX_PARALLEL", "")
    parallel = args.parallel if args.parallel is not None else (
        int(parallel_env) if parallel_env.isdigit() else 4
    )

    settings = Settings(
        provider=pick(args.provider, "AI_PROVIDER", "provider"),
        model=pick(args.model, "IMAGE_MODEL", "model"),
        size=pick(None, "IMAGE_SIZE", "size"),
        quality=pick(None, "IMAGE_QUALITY", "quality"),
        style=pick(args.style, "IMAGE_STYLE", "style"),
        style_modifiers=pick(None, "IMAGE_STYLE_MODIFIERS", "style_modifiers"),
        output_dir=pick(args.output_dir, "OUTPUT_DIR", "output_dir"),
        assets_prefix=(
            args.assets_prefix if args.assets_prefix is not None
            else str(cfg("assets_prefix", DEFAULTS["assets_prefix"]))
        ),
        auto_prefix=(
            False if args.no_auto_prefix
            else bool(cfg("auto_prefix", DEFAULTS["auto_prefix"]))
        ),
        enabled=bool(cfg("enabled", True)),
        collections=[str(c) for c in collections],
        prompt_engine=pick(args.prompt_engine, "PROMPT_ENGINE", "prompt_engine"),
        review_engine=pick(args.review, "REVIEW_ENGINE", "review_engine"),
        claude_model=str(cfg("claude_model", "") or ""),
        dry_run=args.dry_run or _env_flag("DRY_RUN"),
        verbose=args.verbose or _env_flag("VERBOSE"),
        force=args.force or _env_flag("FORCE"),
        list_only=args.list_missing or _env_flag("LIST_ONLY"),
        parallel=parallel,
        batch=args.batch or 0,
        file=args.file or "",
        collection=args.collection or "",
        enhance=args.enhance or _env_flag("ENHANCE"),
        enhance_prompt=args.enhance_prompt or "",
        enhance_model=(
            args.enhance_model or os.environ.get("ENHANCE_MODEL")
            or ENHANCE_DEFAULTS["model"]
        ),
        enhance_quality=(
            args.enhance_quality or os.environ.get("ENHANCE_QUALITY")
            or ENHANCE_DEFAULTS["quality"]
        ),
        enhance_fidelity=(
            args.enhance_fidelity or os.environ.get("ENHANCE_FIDELITY")
            or ENHANCE_DEFAULTS["fidelity"]
        ),
        enhance_format=(
            args.enhance_format or os.environ.get("ENHANCE_FORMAT")
            or ENHANCE_DEFAULTS["format"]
        ),
        rasterizer=args.rasterizer or "auto",
        provider_explicit=args.provider is not None or bool(os.environ.get("AI_PROVIDER")),
    )
    return settings


def apply_author_overrides(settings: Settings, overrides: Dict[str, str]) -> Settings:
    """Per-file settings copy with the author's preview block applied on top."""
    if not overrides:
        return settings
    return replace(
        settings,
        style=overrides.get("style", settings.style),
        style_modifiers=overrides.get("style_modifiers", settings.style_modifiers),
        size=overrides.get("size", settings.size),
        quality=overrides.get("quality", settings.quality),
        model=overrides.get("model", settings.model),
    )


def model_family(model: str) -> Optional[str]:
    m = (model or "").strip().lower()
    for prefix, family in MODEL_FAMILIES.items():
        if m.startswith(prefix):
            return family
    return None


def effective_model(settings: Settings, provider: "Provider") -> str:
    """Configured model when it belongs to the provider's family, else the
    provider default (with a warning) — never emit a guaranteed-400 request."""
    model = (settings.model or "").strip()
    if not model:
        return provider.default_model()
    family = model_family(model)
    if family is not None and family != provider.name:
        warn(
            f"Model '{model}' belongs to the '{family}' family; using "
            f"{provider.name} default '{provider.default_model()}' instead"
        )
        return provider.default_model()
    return model


# =============================================================================
# Front-matter layer
# =============================================================================

@dataclass
class ContentFile:
    path: Path
    title: str
    description: str
    categories: str
    preview: Optional[str]
    author: Any
    content: str
    front_matter: Dict[str, Any]


_FM_OPEN = re.compile(r"\A---[ \t]*\r?\n")


def split_front_matter(text: str) -> Optional[Tuple[int, int, str]]:
    """Return (fm_start, fm_end, fm_text) — offsets of the raw front-matter
    body between the opening and closing `---` fences — or None."""
    open_match = _FM_OPEN.match(text)
    if not open_match:
        return None
    fm_start = open_match.end()
    close = re.compile(r"^---[ \t]*\r?$", re.M).search(text, fm_start)
    if not close:
        return None
    return fm_start, close.start(), text[fm_start:close.start()]


def parse_front_matter(path: Path) -> Optional[ContentFile]:
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        warn(f"Failed to read {path}: {exc}")
        return None

    parts = split_front_matter(text)
    if not parts:
        debug(f"No front matter found in: {path}")
        return None
    fm_start, fm_end = parts[0], parts[1]

    try:
        data = yaml.safe_load(parts[2])
    except yaml.YAMLError as exc:
        warn(f"Failed to parse YAML in {path}: {exc}")
        return None
    if not isinstance(data, dict):
        return None

    categories = data.get("categories", [])
    if isinstance(categories, str):
        categories = [categories]
    if not isinstance(categories, list):
        categories = []

    body_start = text.find("\n", fm_end)
    body = text[body_start + 1:] if body_start != -1 else ""

    return ContentFile(
        path=path,
        title=str(data.get("title") or ""),
        description=str(data.get("description") or ""),
        categories=", ".join(str(c) for c in categories),
        preview=data.get("preview") if isinstance(data.get("preview"), str) else None,
        author=data.get("author"),
        content=body,
        front_matter=data,
    )


def update_front_matter(path: Path, preview_path: str, dry_run: bool = False) -> bool:
    """Set `preview:` inside the front-matter block ONLY (first match).

    Replaces an existing `preview:` line, else inserts after the first
    `description:` line, else after the first `title:` line. Everything outside
    the front-matter block is preserved byte-for-byte (the former sed/regex
    implementations operated file-wide and could corrupt body lines that start
    with `preview:`). Writes a transient `.bak`, replaces atomically, removes
    the `.bak` on success.
    """
    if dry_run:
        info(f"[DRY RUN] Would update preview in {path} to: {preview_path}")
        return True

    try:
        # Bytes round-trip: Path.read_text() would translate CRLF → LF.
        text = path.read_bytes().decode("utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        warn(f"Failed to read {path}: {exc}")
        return False

    parts = split_front_matter(text)
    if not parts:
        warn(f"No front matter block in {path}; not updating")
        return False
    fm_start, fm_end, fm_text = parts

    eol = "\r\n" if "\r\n" in fm_text else "\n"
    lines = fm_text.splitlines(keepends=True)

    def find_key(prefix: str) -> int:
        for idx, line in enumerate(lines):
            if line.startswith(prefix):
                return idx
        return -1

    def end_of_block(idx: int) -> int:
        """Index just past a key line and any indented continuation lines
        (folded/literal scalars, nested maps)."""
        j = idx + 1
        while j < len(lines) and (lines[j].startswith((" ", "\t"))
                                  or lines[j].strip() == ""):
            # A blank line only continues the block if an indented line follows.
            if lines[j].strip() == "" and not (
                j + 1 < len(lines) and lines[j + 1].startswith((" ", "\t"))
            ):
                break
            j += 1
        return j

    preview_idx = find_key("preview:")
    if preview_idx != -1:
        line_eol = "\r\n" if lines[preview_idx].endswith("\r\n") else (
            "\n" if lines[preview_idx].endswith("\n") else ""
        )
        lines[preview_idx] = f"preview: {preview_path}{line_eol}"
    else:
        anchor = find_key("description:")
        if anchor == -1:
            anchor = find_key("title:")
        if anchor == -1:
            warn(f"No preview:/description:/title: anchor in {path} front matter")
            return False
        insert_at = end_of_block(anchor)
        if not lines[anchor].endswith("\n") and insert_at == anchor + 1:
            lines[anchor] += eol  # anchor was the final unterminated line
        lines.insert(insert_at, f"preview: {preview_path}{eol}")

    new_text = text[:fm_start] + "".join(lines) + text[fm_end:]

    backup = path.with_name(path.name + ".bak")
    tmp = path.with_name(path.name + ".tmp~")
    try:
        shutil.copy2(path, backup)
        tmp.write_bytes(new_text.encode("utf-8"))
        os.replace(tmp, path)
        backup.unlink(missing_ok=True)
    except OSError as exc:
        warn(f"Failed to update front matter in {path}: {exc}")
        tmp.unlink(missing_ok=True)
        return False

    success(f"Updated front matter with preview: {preview_path}")
    return True


def generate_filename(title: str) -> str:
    """Slug identical to the historical Bash chain (trim before the 50-cut)."""
    slug = re.sub(r"[^a-z0-9]", "-", title.lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:50]


def normalize_preview_path(preview: Optional[str], settings: Settings) -> Optional[str]:
    """Front-matter path → site-absolute path (/assets/... form) for existence
    checks. External URLs pass through unchanged."""
    if not preview:
        return preview
    if preview.startswith(("http://", "https://")):
        return preview
    # Substring (not prefix) check is deliberate: it mirrors the Liquid
    # `contains` logic in components/preview-image.html and content/seo.html —
    # the engine's idea of "already prefixed" must match what the site renders.
    if settings.auto_prefix and settings.assets_prefix not in preview:
        return f"{settings.assets_prefix}{preview}"
    return preview


def check_preview_exists(preview: Optional[str], settings: Settings, root: Path) -> bool:
    if not preview:
        return False
    # External URLs count as present (matches the Liquid component + SEO tags;
    # the old Bash engine would silently regenerate over them).
    if preview.startswith(("http://", "https://")):
        return True
    normalized = normalize_preview_path(preview, settings) or ""
    clean = normalized.lstrip("/")
    candidates = [root / clean, root / "assets" / clean]
    return any(p.is_file() for p in candidates)


def preview_front_matter_path(settings: Settings, filename: str) -> str:
    """The value written to front matter — WITHOUT the assets prefix (Liquid
    adds it): assets/images/previews → /images/previews/<filename>."""
    out = settings.output_dir.strip("/")
    prefix = settings.assets_prefix.strip("/")
    if prefix and (out == prefix or out.startswith(prefix + "/")):
        out = out[len(prefix):].strip("/")
    return f"/{out}/{filename}" if out else f"/{filename}"


def find_preview_image(preview: Optional[str], settings: Settings, root: Path) -> Optional[Path]:
    """Locate an existing preview image on disk (for --enhance)."""
    if not preview or preview.startswith(("http://", "https://")):
        return None
    clean = preview.lstrip("/")
    candidates = [
        root / clean,
        root / "assets" / clean,
        root / settings.output_dir / Path(clean).name,
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


# =============================================================================
# Prompt layer
# =============================================================================

def build_prompt(cf: ContentFile, settings: Settings) -> str:
    """Template prompt — wording carried over from the original engine."""
    parts = [f"Create a blog preview banner image for an article titled '{cf.title}'."]
    if cf.description:
        parts.append(f"The article is about: {cf.description}.")
    if cf.categories:
        parts.append(f"Categories: {cf.categories}.")
    excerpt = re.sub(r"\s+", " ", cf.content[:500]).strip()
    if excerpt:
        parts.append(f"Key themes from content: {excerpt}")
    parts.append(f"Art style: {settings.style}.")
    if settings.style_modifiers:
        parts.append(f"Additional style: {settings.style_modifiers}.")
    parts.append(
        "The image should be suitable as a wide blog header/banner image with "
        "clean composition. No text or words in the image."
    )
    return " ".join(parts)


def build_enhance_prompt(cf: ContentFile, settings: Settings) -> str:
    prompt = settings.enhance_prompt or DEFAULT_ENHANCE_PROMPT
    if cf.title:
        prompt += f" Context: This is a preview banner for an article titled '{cf.title}'."
    if cf.description:
        prompt += f" Article topic: {cf.description}."
    prompt += f" Maintain the {settings.style} artistic style."
    return prompt


def claude_model_for(settings: Settings) -> str:
    return settings.claude_model or DEFAULT_CLAUDE_MODEL


def claude_article_brief(client: "AnthropicClient", cf: ContentFile,
                         settings: Settings, base_prompt: str) -> str:
    """Analyze stage (prompt_engine: claude): Claude reads the article and
    writes the art-direction brief the renderer will receive. Falls back to
    the template prompt on any failure — analysis is an enhancement layer,
    never a hard dependency."""
    excerpt = re.sub(r"\s+", " ", cf.content[:1500]).strip()
    article = (
        f"ARTICLE\nTitle: {cf.title}\n"
        f"Description: {cf.description or '(none)'}\n"
        f"Categories/tags: {cf.categories or '(none)'}\n"
        f"Excerpt: {excerpt or '(none)'}\n\n"
        f"MANDATORY STYLE DIRECTIONS\nArt style: {settings.style}\n"
        f"Style modifiers: {settings.style_modifiers or '(none)'}\n\n"
        "Write the image-generation prompt now."
    )
    try:
        text = client.complete(
            ART_DIRECTOR_SYSTEM, article,
            model=claude_model_for(settings), max_tokens=2048,
        ).strip()
        if text:
            debug(f"Claude art-direction brief: {text[:300]}...")
            return text
        warn("Claude analysis returned empty text; using template prompt")
    except Exception as exc:
        warn(f"Claude analysis failed ({exc}); using template prompt")
    return base_prompt


def _extract_json_object(text: str) -> Optional[dict]:
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        data = json.loads(text[start:end + 1])
        return data if isinstance(data, dict) else None
    except ValueError:
        return None


def claude_review_image(client: "AnthropicClient", image_path: Path,
                        cf: ContentFile, prompt: str,
                        settings: Settings) -> Tuple[bool, str, str]:
    """Review stage (review_engine: claude): Claude inspects the rendered
    banner. Returns (approved, critique, revised_prompt). Any failure counts
    as approval — review must never block generation."""
    context = (
        f"ARTICLE\nTitle: {cf.title}\nDescription: {cf.description or '(none)'}\n"
        f"Categories/tags: {cf.categories or '(none)'}\n\n"
        f"REQUIRED STYLE\n{settings.style}"
        + (f"; {settings.style_modifiers}" if settings.style_modifiers else "")
        + f"\n\nPROMPT THE IMAGE WAS GENERATED FROM\n{prompt}\n\n"
        "Review the image above against the article and style. JSON only."
    )
    try:
        text = client.complete_vision(
            REVIEWER_SYSTEM, context, image_path,
            model=claude_model_for(settings),
        )
        data = _extract_json_object(text)
        if not data:
            warn("Claude review returned no parseable verdict; keeping image")
            return True, "", ""
        verdict = str(data.get("verdict", "approve")).lower()
        critique = str(data.get("critique", "")).strip()
        revised = str(data.get("revised_prompt", "")).strip()
        if verdict == "revise" and revised:
            return False, critique, revised
        return True, critique, ""
    except Exception as exc:
        warn(f"Claude review failed ({exc}); keeping image")
        return True, "", ""


# =============================================================================
# SVG toolkit
# =============================================================================

SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"

_BANNED_SVG_ELEMENTS = {"script", "foreignObject", "iframe", "audio", "video", "image"}


class SvgError(Exception):
    pass


def seed_for(slug: str) -> int:
    return zlib.crc32(slug.encode("utf-8"))


def palette_for(seed: int) -> List[str]:
    return RETRO_PALETTES[seed % len(RETRO_PALETTES)]


def composition_for(seed: int) -> str:
    return COMPOSITION_VARIANTS[(seed >> 8) % len(COMPOSITION_VARIANTS)]


def _localname(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


_URL_REF = re.compile(r"url\(\s*(?!#|'#|\"#)[^)]*\)", re.I)


def _scrub_style_text(value: str) -> str:
    value = re.sub(r"@import[^;]*;?", "", value, flags=re.I)
    return _URL_REF.sub("none", value)


def sanitize_svg(svg_text: str) -> Tuple[str, List[str]]:
    """Parse + sanitize model-produced SVG. Raises SvgError when unusable.

    Strips scripts/foreignObject/external references/event handlers; forces the
    banner viewBox/width/height. Returns (clean_svg, warnings).
    """
    warnings: List[str] = []
    # Reject DTDs outright: entity declarations enable expansion attacks
    # (billion-laughs) and external references; legit banner SVG needs neither.
    if re.search(r"<!\s*(DOCTYPE|ENTITY)", svg_text, re.I):
        raise SvgError("SVG contains a DOCTYPE/ENTITY declaration (rejected)")
    try:
        root = ET.fromstring(svg_text)
    except ET.ParseError as exc:
        raise SvgError(f"SVG does not parse: {exc}") from None
    if _localname(root.tag) != "svg":
        raise SvgError(f"Root element is <{_localname(root.tag)}>, not <svg>")

    def scrub(element: ET.Element) -> None:
        for child in list(element):
            name = _localname(child.tag)
            if name in _BANNED_SVG_ELEMENTS:
                element.remove(child)
                warnings.append(f"removed <{name}>")
                continue
            scrub(child)

        for attr in list(element.attrib):
            local = _localname(attr)
            value = element.attrib[attr]
            if local.lower().startswith("on"):
                del element.attrib[attr]
                warnings.append(f"removed {local} handler")
            elif local == "href" and not value.startswith("#"):
                del element.attrib[attr]
                warnings.append("removed external href")
            elif "url(" in value.lower() or "@import" in value.lower():
                # Covers style= AND presentation attributes (fill, stroke,
                # filter, mask, clip-path, …) — url() must stay #-local.
                cleaned = _scrub_style_text(value)
                if cleaned != value:
                    element.attrib[attr] = cleaned
                    warnings.append(f"scrubbed url() in {local}")

        if _localname(element.tag) == "style" and element.text:
            cleaned = _scrub_style_text(element.text)
            if cleaned != element.text:
                element.text = cleaned
                warnings.append("scrubbed <style> url()/@import")

    scrub(root)

    root.set("viewBox", f"0 0 {SVG_WIDTH} {SVG_HEIGHT}")
    root.set("width", str(SVG_WIDTH))
    root.set("height", str(SVG_HEIGHT))

    ET.register_namespace("", SVG_NS)
    ET.register_namespace("xlink", XLINK_NS)
    return ET.tostring(root, encoding="unicode"), warnings


def render_local_svg(title: str, seed: int) -> str:
    """Deterministic retro-landscape SVG for the `local` provider (no network).

    Shares the claude provider's seed → palette/composition scheme so the two
    stay visually kin per slug."""
    pal = palette_for(seed)
    variant = (seed >> 8) % len(COMPOSITION_VARIANTS)
    rng = seed or 1

    def nxt(bound: int) -> int:
        nonlocal rng
        rng = (rng * 1103515245 + 12345) & 0x7FFFFFFF
        return rng % max(bound, 1)

    w, h = SVG_WIDTH, SVG_HEIGHT
    parts = [
        f'<svg xmlns="{SVG_NS}" viewBox="0 0 {w} {h}" width="{w}" height="{h}">',
        f'<rect width="{w}" height="{h}" fill="{pal[0]}"/>',
    ]
    # Sky bands
    band_h = h // 8
    for i in range(3):
        parts.append(
            f'<rect y="{i * band_h}" width="{w}" height="{band_h}" '
            f'fill="{pal[1]}" opacity="0.{25 + i * 12}"/>'
        )
    # Celestial body with stepped "pixel" rings
    cx, cy, radius = w - 320 - nxt(400), 240 + nxt(160), 130 + nxt(80)
    for i, ring_color in enumerate([pal[5], pal[4]]):
        parts.append(
            f'<circle cx="{cx}" cy="{cy}" r="{radius - i * 26}" fill="{ring_color}"/>'
        )
    # Scanline stripes across the disk (clipped to the circle's chord width)
    for i in range(3):
        y = cy + 12 + i * 26
        dy = abs(y + 5 - cy)
        if dy >= radius:
            continue
        half = int((radius * radius - dy * dy) ** 0.5)
        parts.append(f'<rect x="{cx - half}" y="{y}" width="{half * 2}" height="10" fill="{pal[0]}"/>')
    # Layered terrain: three silhouette ranges of blocky steps
    for layer, color in enumerate([pal[2], pal[3], pal[1]]):
        base = h - 120 - layer * 170
        x = -40
        points = [f"-40,{h}"]
        while x < w + 80:
            peak = base - nxt(300) - (2 - layer) * 70
            width_step = 90 + nxt(150)
            points.append(f"{x},{peak}")
            points.append(f"{x + width_step},{peak}")
            x += width_step
        points.append(f"{w + 80},{h}")
        parts.append(f'<polygon points="{" ".join(points)}" fill="{color}"/>')
    # Variant flourish: grid floor for even variants, stars for odd
    if variant % 2 == 0:
        for i in range(1, 7):
            y = h - i * (i * 8)
            parts.append(f'<rect y="{y}" width="{w}" height="3" fill="{pal[4]}" opacity="0.35"/>')
    else:
        for _ in range(40):
            sx, sy = nxt(w), nxt(h // 2)
            size = 3 + nxt(5)
            parts.append(f'<rect x="{sx}" y="{sy}" width="{size}" height="{size}" fill="{pal[4]}"/>')
    # CRT scanline veil + vignette bars
    for y in range(0, h, 8):
        parts.append(f'<rect y="{y}" width="{w}" height="1" fill="#000" opacity="0.10"/>')
    parts.append(f'<rect width="{w}" height="26" fill="#000" opacity="0.35"/>')
    parts.append(f'<rect y="{h - 26}" width="{w}" height="26" fill="#000" opacity="0.35"/>')
    parts.append("</svg>")
    return "".join(parts)


# =============================================================================
# Rasterizer chain
# =============================================================================

# Tool discovery is per-run stable; memoize the PATH walks so a batch of N
# files doesn't pay N x 4 which() scans.
@functools.lru_cache(maxsize=None)
def _which(tool: str) -> Optional[str]:
    return shutil.which(tool)


def _run_quiet(cmd: List[str], cwd: Optional[Path] = None, timeout: int = 120) -> bool:
    try:
        proc = subprocess.run(
            cmd, cwd=str(cwd) if cwd else None, capture_output=True, timeout=timeout
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        debug(f"rasterizer {cmd[0]} failed: {exc}")
        return False
    if proc.returncode != 0:
        debug(f"rasterizer {cmd[0]} exit {proc.returncode}: "
              f"{proc.stderr.decode('utf-8', 'replace')[:200]}")
        return False
    return True


def _playwright_helper(project_root: Path) -> Optional[Path]:
    candidates = [
        Path(__file__).resolve().parent.parent / "dev" / "rasterize-svg.js",
        project_root / "scripts" / "dev" / "rasterize-svg.js",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def rasterize_svg(
    svg_path: Path, png_path: Path, project_root: Path, preference: str = "auto"
) -> Optional[str]:
    """SVG → PNG through the first available tool. Returns the tool name used,
    or None when nothing worked (caller keeps the .svg)."""
    w, h = SVG_WIDTH, SVG_HEIGHT
    helper = _playwright_helper(project_root)
    chain: List[Tuple[str, Any]] = [
        ("rsvg", lambda: _which("rsvg-convert") and _run_quiet(
            ["rsvg-convert", "-w", str(w), "-h", str(h), "-o", str(png_path), str(svg_path)])),
        ("inkscape", lambda: _which("inkscape") and _run_quiet(
            ["inkscape", str(svg_path), "--export-type=png",
             f"--export-filename={png_path}", "-w", str(w), "-h", str(h)])),
        ("magick", lambda: (
            (_which("magick") and _run_quiet(
                ["magick", str(svg_path), "-resize", f"{w}x{h}", str(png_path)]))
            or (_which("convert") and _run_quiet(
                ["convert", str(svg_path), "-resize", f"{w}x{h}", str(png_path)]))
        )),
        ("playwright", lambda: helper is not None and _which("node") and _run_quiet(
            ["node", str(helper), str(svg_path), str(png_path), str(w), str(h)],
            cwd=project_root, timeout=180)),
    ]
    if preference == "none":
        return None
    if preference != "auto":
        chain = [entry for entry in chain if entry[0] == preference]
        if not chain:
            warn(f"Unknown rasterizer '{preference}'")
            return None
    for name, attempt in chain:
        if attempt():
            try:
                if png_path.is_file() and png_path.read_bytes()[:8] == PNG_SIGNATURE:
                    debug(f"Rasterized with {name}: {png_path.name}")
                    return name
            except OSError:
                pass
            png_path.unlink(missing_ok=True)
    return None


# =============================================================================
# Anthropic client (Claude Code OAuth → API key → claude CLI)
# =============================================================================

class ClaudeRefusal(Exception):
    def __init__(self, category: Optional[str]):
        self.category = category
        super().__init__(f"request declined (category: {category or 'unspecified'})")


class ClaudeTruncated(Exception):
    pass


class AnthropicClient:
    """Minimal Messages-API client honoring the repo's credential conventions.

    Modes (first match wins — mirrors templates/deploy/chat-proxy/worker.js):
      oauth    CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_AUTH_TOKEN → Bearer +
               `anthropic-beta: oauth-2025-04-20` + Claude Code first system block
      api_key  ANTHROPIC_API_KEY → x-api-key header
      cli      `claude -p` headless (rides the local Claude Code login)
    """

    def __init__(self, env: Optional[Dict[str, str]] = None):
        self.env = dict(env if env is not None else os.environ)
        self.mode: Optional[str] = None
        self.token: Optional[str] = None
        if self.env.get("CLAUDE_CODE_OAUTH_TOKEN"):
            self.mode, self.token = "oauth", self.env["CLAUDE_CODE_OAUTH_TOKEN"]
        elif self.env.get("ANTHROPIC_AUTH_TOKEN"):
            self.mode, self.token = "oauth", self.env["ANTHROPIC_AUTH_TOKEN"]
        elif self.env.get("ANTHROPIC_API_KEY"):
            self.mode, self.token = "api_key", self.env["ANTHROPIC_API_KEY"]
        elif shutil.which("claude"):
            self.mode = "cli"

    def available(self) -> bool:
        return self.mode is not None

    def describe(self) -> str:
        return {
            "oauth": "Claude Code OAuth token (Bearer)",
            "api_key": "Anthropic API key",
            "cli": "claude CLI (local Claude Code login)",
            None: "none",
        }[self.mode]

    def headers(self) -> Dict[str, str]:
        if self.mode == "oauth":
            return {
                "Authorization": f"Bearer {self.token}",
                "anthropic-version": ANTHROPIC_VERSION,
                "anthropic-beta": OAUTH_BETA,
            }
        if self.mode == "api_key":
            return {
                "x-api-key": self.token or "",
                "anthropic-version": ANTHROPIC_VERSION,
            }
        raise RuntimeError(f"no API headers for mode {self.mode}")

    def complete(
        self,
        system_text: str,
        user_text: str,
        model: str = DEFAULT_CLAUDE_MODEL,
        max_tokens: int = CLAUDE_MAX_TOKENS,
    ) -> str:
        """One Messages-API turn (or CLI run); returns concatenated text blocks.

        Raises ClaudeRefusal / ClaudeTruncated / HttpStatusError / RuntimeError.
        """
        if self.mode == "cli":
            return self._complete_cli(system_text, user_text, model)
        if self.mode is None:
            raise RuntimeError("no Anthropic credential configured")

        # The Claude Code identity block is REQUIRED as the first system block
        # for OAuth tokens (worker.js recipe) and intentionally omitted for
        # plain API keys, matching the chat proxy's per-mode behavior.
        system_blocks = [{"type": "text", "text": system_text}]
        if self.mode == "oauth":
            system_blocks.insert(0, {"type": "text", "text": CLAUDE_CODE_SYSTEM_PROMPT})

        payload: Dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "thinking": {"type": "adaptive"},
            "system": system_blocks,
            "messages": [{"role": "user", "content": user_text}],
        }

        def call(body: Dict[str, Any]) -> dict:
            return with_retries(
                lambda: http_json(ANTHROPIC_API_URL, body, self.headers(), timeout=900),
                "Anthropic API",
            )

        try:
            data = call(payload)
        except HttpStatusError as exc:
            if exc.status == 400 and "thinking" in exc.message().lower():
                debug("Retrying without thinking parameter")
                payload.pop("thinking", None)
                data = call(payload)
            elif exc.status == 401 and self.mode == "oauth":
                raise RuntimeError(
                    "Anthropic rejected the OAuth token (401). It may be expired "
                    "— mint a fresh one with `claude setup-token`, or use "
                    "ANTHROPIC_API_KEY instead."
                ) from None
            else:
                raise

        stop_reason = data.get("stop_reason")
        if stop_reason == "refusal":
            details = data.get("stop_details") or {}
            raise ClaudeRefusal(details.get("category") if isinstance(details, dict) else None)

        text = "".join(
            block.get("text", "")
            for block in data.get("content", [])
            if isinstance(block, dict) and block.get("type") == "text"
        )
        if stop_reason == "max_tokens":
            raise ClaudeTruncated(text)
        return text

    def complete_vision(
        self,
        system_text: str,
        user_text: str,
        image_path: Path,
        model: str = DEFAULT_CLAUDE_MODEL,
        max_tokens: int = 2048,
    ) -> str:
        """One vision turn over a local PNG (review stage). CLI mode passes the
        file path and lets `claude -p` read it; API modes embed base64."""
        if self.mode == "cli":
            prompt = (
                f"{system_text}\n\n---\n\nFirst use the Read tool to view the "
                f"image file at {image_path.resolve()} — then respond.\n\n{user_text}"
            )
            return self._run_cli(prompt, model, allowed_tools="Read")
        if self.mode is None:
            raise RuntimeError("no Anthropic credential configured")

        system_blocks = [{"type": "text", "text": system_text}]
        if self.mode == "oauth":
            system_blocks.insert(0, {"type": "text", "text": CLAUDE_CODE_SYSTEM_PROMPT})
        payload: Dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "thinking": {"type": "adaptive"},
            "system": system_blocks,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "image", "source": {
                        "type": "base64", "media_type": "image/png",
                        "data": base64.b64encode(image_path.read_bytes()).decode("ascii"),
                    }},
                    {"type": "text", "text": user_text},
                ],
            }],
        }
        data = with_retries(
            lambda: http_json(ANTHROPIC_API_URL, payload, self.headers(), timeout=900),
            "Anthropic API (review)",
        )
        if data.get("stop_reason") == "refusal":
            details = data.get("stop_details") or {}
            raise ClaudeRefusal(details.get("category") if isinstance(details, dict) else None)
        return "".join(
            block.get("text", "")
            for block in data.get("content", [])
            if isinstance(block, dict) and block.get("type") == "text"
        )

    def _complete_cli(self, system_text: str, user_text: str, model: str) -> str:
        return self._run_cli(f"{system_text}\n\n---\n\n{user_text}", model)

    def _run_cli(self, prompt: str, model: str,
                 allowed_tools: Optional[str] = None) -> str:
        cmd = ["claude", "-p", "--model", model, "--output-format", "text"]
        if allowed_tools:
            cmd += ["--allowedTools", allowed_tools]
        try:
            proc = subprocess.run(
                cmd,
                input=prompt,
                capture_output=True,
                text=True,
                timeout=300,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise RuntimeError(f"claude CLI failed: {exc}") from None
        if proc.returncode != 0 or not proc.stdout.strip():
            tail = (proc.stderr or "").strip()[-300:]
            raise RuntimeError(
                f"claude CLI exited {proc.returncode}: {tail or 'no output'}"
            )
        return proc.stdout


CLAUDE_CREDENTIAL_HINT = (
    "Claude orchestration (article analysis + image review) needs any ONE of:\n"
    "  1. CLAUDE_CODE_OAUTH_TOKEN   — run `claude setup-token` (Claude Pro/Max)\n"
    "  2. ANTHROPIC_AUTH_TOKEN      — short-lived Bearer (e.g. `ant auth print-credentials`)\n"
    "  3. ANTHROPIC_API_KEY         — key from console.anthropic.com\n"
    "  4. the `claude` CLI installed and logged in (used automatically)\n"
    "Falling back to the template prompt and skipping review (or pass "
    "--prompt-engine template --review none to silence this)."
)


# =============================================================================
# Providers
# =============================================================================

@dataclass
class ImageResult:
    ok: bool
    kind: str = "png"                 # png | svg
    path: Optional[Path] = None
    error: Optional[str] = None


class EditUnsupported(Exception):
    def __init__(self, provider: str):
        super().__init__(f"provider '{provider}' has no image-edit capability")
        self.provider = provider


class Provider:
    name = "base"

    def is_configured(self, env: Dict[str, str]) -> bool:
        raise NotImplementedError

    def missing_hint(self, env: Dict[str, str]) -> str:
        raise NotImplementedError

    def default_model(self) -> str:
        raise NotImplementedError

    def generate(self, prompt: str, settings: Settings, out_base: Path,
                 ctx: "RunContext") -> ImageResult:
        raise NotImplementedError

    def edit(self, image_path: Path, prompt: str, settings: Settings,
             ctx: "RunContext", out_path: Optional[Path] = None) -> ImageResult:
        """Enhance an existing image. Providers without an edit capability
        raise EditUnsupported; the runner then falls back to OpenAI (the
        historical behavior of --enhance)."""
        raise EditUnsupported(self.name)


@dataclass
class RunContext:
    """Run-scoped services handed to providers."""
    project_root: Path
    env: Dict[str, str]
    anthropic: Optional[AnthropicClient] = None
    slug: str = ""

    def claude(self) -> AnthropicClient:
        if self.anthropic is None:
            self.anthropic = AnthropicClient(self.env)
        return self.anthropic


def adapt_openai_size_quality(model: str, size: str, quality: str) -> Tuple[str, str]:
    """Historical engine behavior: adapt shared settings per model family."""
    if model.startswith("gpt-image-") and size == "1792x1024":
        size = "1536x1024"
    elif model.startswith("dall-e-") and quality == "auto":
        quality = "standard"
    return size, quality


def _write_image_payload(entry: Dict[str, Any], out_path: Path) -> bool:
    """Persist one OpenAI-style data[0] entry (b64_json preferred, else url)."""
    b64 = entry.get("b64_json")
    if b64:
        out_path.write_bytes(base64.b64decode(b64))
        return True
    url = entry.get("url")
    if url:
        download_to(url, out_path)
        return True
    return False


class OpenAIProvider(Provider):
    name = "openai"

    def is_configured(self, env: Dict[str, str]) -> bool:
        return bool(env.get("OPENAI_API_KEY"))

    def missing_hint(self, env: Dict[str, str]) -> str:
        return "OPENAI_API_KEY environment variable is required for the OpenAI provider"

    def default_model(self) -> str:
        return "gpt-image-2"

    def _headers(self, env: Dict[str, str]) -> Dict[str, str]:
        return {"Authorization": f"Bearer {env['OPENAI_API_KEY']}"}

    def generate(self, prompt, settings, out_base, ctx) -> ImageResult:
        model = effective_model(settings, self)
        size, quality = adapt_openai_size_quality(model, settings.size, settings.quality)
        out_path = out_base.with_suffix(".png")
        payload = {"model": model, "prompt": prompt, "n": 1, "size": size, "quality": quality}
        debug(f"OpenAI generate: model={model} size={size} quality={quality}")
        try:
            data = with_retries(
                lambda: http_json(
                    "https://api.openai.com/v1/images/generations",
                    payload, self._headers(ctx.env), timeout=900,
                ),
                "OpenAI API",
            )
            entries = data.get("data") or []
            if not entries or not _write_image_payload(entries[0], out_path):
                return ImageResult(False, error="No image data in OpenAI response")
            return ImageResult(True, "png", out_path)
        except HttpStatusError as exc:
            return ImageResult(False, error=f"OpenAI API error: {exc.message()}")
        except Exception as exc:
            return ImageResult(False, error=str(exc))

    def edit(self, image_path, prompt, settings, ctx, out_path=None) -> ImageResult:
        model = settings.enhance_model
        fields = {
            "prompt": prompt,
            "model": model,
            "n": "1",
            "size": "auto",
            "quality": settings.enhance_quality,
            "output_format": settings.enhance_format,
        }
        # gpt-image-2 does not accept input_fidelity (historical behavior).
        if model != "gpt-image-2":
            fields["input_fidelity"] = settings.enhance_fidelity
        files = [("image[]", image_path.name, image_path.read_bytes(), "image/png")]
        out_path = out_path or image_path
        debug(f"OpenAI edit: model={model} fidelity="
              f"{fields.get('input_fidelity', '(omitted)')} format={settings.enhance_format}")
        try:
            data = with_retries(
                lambda: http_multipart(
                    "https://api.openai.com/v1/images/edits",
                    fields, files, self._headers(ctx.env), timeout=900,
                ),
                "OpenAI edits API",
            )
            usage = data.get("usage") or {}
            if usage.get("total_tokens"):
                debug(f"Token usage: {usage.get('total_tokens')} total")
            entries = data.get("data") or []
            if not entries or not _write_image_payload(entries[0], out_path):
                return ImageResult(False, error="No image data in enhance response")
            revised = entries[0].get("revised_prompt")
            if revised:
                debug(f"Revised prompt: {revised[:200]}...")
            return ImageResult(True, "png", out_path)
        except HttpStatusError as exc:
            return ImageResult(False, error=f"OpenAI enhance API error: {exc.message()}")
        except Exception as exc:
            return ImageResult(False, error=str(exc))


class XAIProvider(Provider):
    name = "xai"

    def is_configured(self, env: Dict[str, str]) -> bool:
        return bool(env.get("XAI_API_KEY"))

    def missing_hint(self, env: Dict[str, str]) -> str:
        return "XAI_API_KEY environment variable is required for the xAI provider"

    def default_model(self) -> str:
        return "grok-2-image"

    def generate(self, prompt, settings, out_base, ctx) -> ImageResult:
        model = effective_model(settings, self)
        out_path = out_base.with_suffix(".png")
        payload = {"model": model, "prompt": prompt[:1000], "n": 1}  # 1024-char cap
        try:
            data = with_retries(
                lambda: http_json(
                    "https://api.x.ai/v1/images/generations",
                    payload,
                    {"Authorization": f"Bearer {ctx.env['XAI_API_KEY']}"},
                    timeout=900,
                ),
                "xAI API",
            )
            entries = data.get("data") or []
            if not entries or not _write_image_payload(entries[0], out_path):
                return ImageResult(False, error="No image data in xAI response")
            return ImageResult(True, "png", out_path)
        except HttpStatusError as exc:
            return ImageResult(False, error=f"xAI API error: {exc.message()}")
        except Exception as exc:
            return ImageResult(False, error=str(exc))


class StabilityProvider(Provider):
    name = "stability"

    def is_configured(self, env: Dict[str, str]) -> bool:
        return bool(env.get("STABILITY_API_KEY"))

    def missing_hint(self, env: Dict[str, str]) -> str:
        return "STABILITY_API_KEY environment variable is required for the Stability AI provider"

    def default_model(self) -> str:
        return "stable-diffusion-xl-1024-v1-0"

    def generate(self, prompt, settings, out_base, ctx) -> ImageResult:
        out_path = out_base.with_suffix(".png")
        payload = {
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            # SDXL v1 endpoint accepts fixed dimension sets; 1024x1024 preserved
            # from the original engine.
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }
        try:
            data = with_retries(
                lambda: http_json(
                    "https://api.stability.ai/v1/generation/"
                    "stable-diffusion-xl-1024-v1-0/text-to-image",
                    payload,
                    {"Authorization": f"Bearer {ctx.env['STABILITY_API_KEY']}"},
                    timeout=900,
                ),
                "Stability API",
            )
            artifacts = data.get("artifacts") or []
            if not artifacts or not artifacts[0].get("base64"):
                return ImageResult(False, error="No image data in Stability response")
            out_path.write_bytes(base64.b64decode(artifacts[0]["base64"]))
            return ImageResult(True, "png", out_path)
        except HttpStatusError as exc:
            return ImageResult(False, error=f"Stability API error: {exc.message()}")
        except Exception as exc:
            return ImageResult(False, error=str(exc))


class GeminiProvider(Provider):
    name = "gemini"

    def is_configured(self, env: Dict[str, str]) -> bool:
        return bool(env.get("GEMINI_API_KEY"))

    def missing_hint(self, env: Dict[str, str]) -> str:
        return "GEMINI_API_KEY environment variable is required for the Gemini provider"

    def default_model(self) -> str:
        return "gemini-2.5-flash-image"

    def generate(self, prompt, settings, out_base, ctx) -> ImageResult:
        model = effective_model(settings, self)
        out_path = out_base.with_suffix(".png")
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        try:
            data = with_retries(
                lambda: http_json(
                    url, payload,
                    {"x-goog-api-key": ctx.env["GEMINI_API_KEY"]},
                    timeout=900,
                ),
                "Gemini API",
            )
            for candidate in data.get("candidates") or []:
                for part in ((candidate.get("content") or {}).get("parts")) or []:
                    inline = part.get("inlineData") or part.get("inline_data")
                    if inline and inline.get("data"):
                        out_path.write_bytes(base64.b64decode(inline["data"]))
                        return ImageResult(True, "png", out_path)
            return ImageResult(False, error="No inline image data in Gemini response")
        except HttpStatusError as exc:
            return ImageResult(False, error=f"Gemini API error: {exc.message()}")
        except Exception as exc:
            return ImageResult(False, error=str(exc))


class SvgProviderMixin:
    """Shared sanitize → write → rasterize tail for SVG-producing providers."""

    def finish_svg(self, svg_text: str, out_base: Path, settings: Settings,
                   ctx: RunContext) -> ImageResult:
        try:
            clean, notes = sanitize_svg(svg_text)
        except SvgError as exc:
            return ImageResult(False, error=str(exc))
        for note in notes:
            warn(f"SVG sanitizer: {note}")
        svg_path = out_base.with_suffix(".svg")
        png_path = out_base.with_suffix(".png")
        svg_path.write_text(clean, encoding="utf-8")
        tool = rasterize_svg(svg_path, png_path, ctx.project_root, settings.rasterizer)
        if tool:
            svg_path.unlink(missing_ok=True)
            return ImageResult(True, "png", png_path)
        warn(
            "No SVG rasterizer available — keeping the .svg preview. Social "
            "og:image works best as PNG: install librsvg (`brew install librsvg`) "
            "or Playwright (`npx playwright install chromium`)."
        )
        return ImageResult(True, "svg", svg_path)


class LocalProvider(Provider, SvgProviderMixin):
    name = "local"

    def is_configured(self, env: Dict[str, str]) -> bool:
        return True

    def missing_hint(self, env: Dict[str, str]) -> str:
        return ""

    def default_model(self) -> str:
        return "template-svg"

    def generate(self, prompt, settings, out_base, ctx) -> ImageResult:
        seed = seed_for(ctx.slug or out_base.stem)
        svg_text = render_local_svg(ctx.slug, seed)
        return self.finish_svg(svg_text, out_base, settings, ctx)

    def edit(self, image_path, prompt, settings, ctx, out_path=None) -> ImageResult:
        # Historical behavior: the local provider "enhances" by doing nothing
        # (no API), so dry testing of --enhance needs no credentials.
        warn("Local provider: No actual enhancement. Logging prompt...")
        debug(f"Enhancement prompt: {prompt[:400]}...")
        info(f"Placeholder: would enhance {image_path}")
        return ImageResult(True, "png", image_path)


# Renderers only — Claude is the orchestration layer (claude_article_brief /
# claude_review_image) that sits in front of ANY of these, not a provider.
PROVIDERS: Dict[str, Provider] = {
    provider.name: provider
    for provider in (
        OpenAIProvider(),
        XAIProvider(),
        StabilityProvider(),
        GeminiProvider(),
        LocalProvider(),
    )
}


# =============================================================================
# Orchestrator
# =============================================================================

@dataclass
class Stats:
    processed: int = 0
    generated: int = 0
    enhanced: int = 0
    skipped: int = 0
    errors: int = 0
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def inc(self, name: str) -> None:
        with self._lock:
            setattr(self, name, getattr(self, name) + 1)


class Runner:
    def __init__(self, settings: Settings, project_root: Path,
                 ctx: Optional[RunContext] = None):
        self.settings = settings
        self.root = project_root
        self.stats = Stats()
        self.authors = read_authors(project_root)
        self.ctx = ctx or RunContext(project_root=project_root, env=dict(os.environ))

    # -- discovery ------------------------------------------------------------

    def collection_path(self, name: str) -> Path:
        return self.root / "pages" / f"_{name}"

    def discover(self, collection_path: Path) -> List[Path]:
        if not collection_path.is_dir():
            warn(f"Collection directory not found: {collection_path}")
            return []
        return sorted(collection_path.rglob("*.md"))

    # -- per-file processing --------------------------------------------------

    def process_file(self, path: Path) -> None:
        if _interrupted:
            return
        settings = self.settings
        self.stats.inc("processed")
        debug(f"Processing file: {path}")

        cf = parse_front_matter(path)
        if cf is None:
            self.stats.inc("skipped")
            return

        if settings.enhance:
            self._enhance_file(cf)
            return

        # Generate mode -------------------------------------------------------
        if cf.preview and check_preview_exists(cf.preview, settings, self.root):
            if not settings.force:
                debug(f"Preview already exists and is valid: {cf.preview}")
                self.stats.inc("skipped")
                return
            info(f"Force mode: regenerating preview for {cf.title}")

        if settings.list_only:
            print(f"{Colors.YELLOW}Missing preview:{Colors.NC} {path}")
            print(f"  Title: {cf.title}")
            if cf.preview:
                print(f"  Current preview (not found): {cf.preview}")
            print()
            return

        info(f"Generating preview for: {cf.title}")

        slug = generate_filename(cf.title)
        if not slug:
            warn(f"Cannot derive filename from title in {path}")
            self.stats.inc("errors")
            return
        out_base = self.root / settings.output_dir / slug

        # Author overrides apply only once an image/prompt is actually built.
        file_settings = apply_author_overrides(
            settings, author_preview_overrides(self.authors, cf.author)
        )
        if file_settings is not settings:
            info(f"  ↳ Author '{cf.author}' preview overrides applied (_data/authors.yml)")

        # ---- Analyze: Claude reads the article and writes the art brief ----
        base_prompt = build_prompt(cf, file_settings)
        prompt = base_prompt
        orchestrated = settings.provider != "local"  # local is deterministic
        if (orchestrated and file_settings.prompt_engine == "claude"
                and not settings.dry_run):
            prompt = claude_article_brief(
                self.ctx.claude(), cf, file_settings, base_prompt)
        debug(f"Generated prompt: {prompt[:500]}...")

        if settings.dry_run:
            info("[DRY RUN] Would generate image:")
            print(f"  Provider: {settings.provider}")
            if orchestrated and file_settings.prompt_engine == "claude":
                print("  Prompt engine: claude (article analysis runs at generation time)")
            if orchestrated and file_settings.review_engine == "claude":
                print("  Review: claude (image review runs at generation time)")
            print(f"  Output: {out_base.with_suffix('.png')}")
            print(f"  Preview path: {preview_front_matter_path(file_settings, slug + '.png')}")
            print(f"  Prompt: {prompt[:400]}...")
            print()
            self.stats.inc("generated")
            return

        provider = PROVIDERS[settings.provider]
        # Per-file context copy: workers must not share a mutable slug (the
        # local provider derives its deterministic seed from it). The copy
        # carries the shared AnthropicClient reference, which is stateless
        # after init and therefore thread-safe.
        file_ctx = replace(self.ctx, slug=slug)
        # ---- Produce: the selected raster model renders the brief ----
        result = provider.generate(prompt, file_settings, out_base, file_ctx)

        # ---- Review: Claude inspects the render; at most ONE regeneration ----
        if (orchestrated and file_settings.review_engine == "claude"
                and result.ok and result.path and result.kind == "png"):
            approved, critique, revised = claude_review_image(
                self.ctx.claude(), result.path, cf, prompt, file_settings)
            if approved:
                if critique:
                    debug(f"Claude review: {critique}")
            else:
                info(f"  ↳ Claude review requested a revision: {critique}")
                debug(f"Revised prompt: {revised[:300]}...")
                retry = provider.generate(revised, file_settings, out_base, file_ctx)
                if retry.ok and retry.path:
                    result = retry
                    success("  ↳ Regenerated with Claude's revised brief")
                else:
                    warn(f"  ↳ Revision render failed "
                         f"({retry.error or 'unknown'}); keeping the first image")

        if result.ok and result.path:
            fm_value = preview_front_matter_path(file_settings, result.path.name)
            if update_front_matter(path, fm_value, dry_run=False):
                self.stats.inc("generated")
                # Serial-mode pacing between paid API calls (historical
                # behavior). In parallel mode a per-worker sleep throttles
                # nothing — it only burns worker capacity — so skip it.
                if POST_GENERATION_SLEEP and settings.parallel <= 1:
                    time.sleep(POST_GENERATION_SLEEP)
            else:
                self.stats.inc("errors")
        else:
            warn(f"Failed to generate image for: {cf.title}")
            if result.error:
                warn(f"  {result.error}")
            self.stats.inc("errors")

    def _enhance_file(self, cf: ContentFile) -> None:
        settings = self.settings
        existing = find_preview_image(cf.preview, settings, self.root)
        if existing is None:
            warn(f"No existing preview image found for: {cf.title}")
            warn(f"  Expected at: {cf.preview}")
            warn("  Use without --enhance to generate a new image first.")
            self.stats.inc("skipped")
            return

        info(f"Enhancing preview for: {cf.title}")
        file_settings = apply_author_overrides(
            settings, author_preview_overrides(self.authors, cf.author)
        )
        prompt = build_enhance_prompt(cf, file_settings)
        debug(f"Enhancement prompt: {prompt[:400]}...")

        if settings.dry_run:
            info("[DRY RUN] Would enhance image:")
            print(f"  Source: {existing}")
            print(f"  Model: {settings.enhance_model}")
            print(f"  Prompt: {prompt[:400]}...")
            print()
            self.stats.inc("enhanced")
            return

        # --enhance-format other than the current extension writes a NEW file
        # (content and extension must agree) and repoints the front matter;
        # the default png-onto-png flow enhances in place with a backup.
        out_path = existing.with_suffix("." + settings.enhance_format)
        in_place = out_path == existing

        if in_place:
            backup = existing.with_name(existing.stem + "_pre-enhance" + existing.suffix)
            if not backup.exists():
                shutil.copy2(existing, backup)
                info(f"Original backed up to: {backup.name}")
            else:
                debug(f"Backup already exists: {backup}")
        else:
            backup = existing  # original file is untouched and acts as the fallback

        # Capability-driven routing: the active provider's edit() runs when it
        # has one; EditUnsupported falls back to OpenAI (historical behavior).
        provider = PROVIDERS[settings.provider]
        try:
            result = provider.edit(existing, prompt, file_settings, self.ctx, out_path)
        except EditUnsupported:
            warn(f"Enhancement not supported for provider: {settings.provider} "
                 "(falling back to OpenAI)")
            openai_provider = PROVIDERS["openai"]
            if not openai_provider.is_configured(self.ctx.env):
                warn("Enhance requires OPENAI_API_KEY (the images/edits API is OpenAI-only).")
                self.stats.inc("errors")
                return
            result = openai_provider.edit(existing, prompt, file_settings, self.ctx, out_path)

        if result.ok:
            if not in_place and result.path and result.path != existing:
                old_value = cf.preview or ""
                new_value = (
                    old_value.rsplit("/", 1)[0] + "/" + result.path.name
                    if "/" in old_value else result.path.name
                )
                update_front_matter(cf.path, new_value, dry_run=False)
                info(f"Preview extension changed: {existing.name} → {result.path.name}")
            success(f"Enhanced image saved to: {result.path or existing}")
            self.stats.inc("enhanced")
        else:
            warn(f"Failed to enhance image for: {cf.title}")
            if result.error:
                warn(f"  {result.error}")
            info(f"Original preserved at: {backup}")
            self.stats.inc("errors")

    # -- collection / run loop ------------------------------------------------

    def process_collection(self, collection_path: Path) -> None:
        files = self.discover(collection_path)
        if self.settings.batch > 0:
            files = files[: self.settings.batch]
        if not files:
            return
        serial = (
            self.settings.list_only
            or self.settings.dry_run
            or self.settings.parallel <= 1
        )
        if serial:
            for file_path in files:
                if _interrupted:
                    warn("Interrupted! Stopping...")
                    break
                self.process_file(file_path)
            return
        with ThreadPoolExecutor(max_workers=self.settings.parallel) as pool:
            futures = {pool.submit(self.process_file, f): f for f in files}
            for future in as_completed(futures):
                if _interrupted:
                    for pending in futures:
                        pending.cancel()
                    warn("Interrupted! Cancelling remaining tasks...")
                    break
                exc = future.exception()
                if exc:
                    warn(f"Worker failed on {futures[future]}: {exc}")
                    self.stats.inc("errors")

    def run(self) -> int:
        settings = self.settings
        if settings.file:
            target = Path(settings.file)
            if not target.is_absolute():
                target = self.root / settings.file
            if not target.is_file():
                error_exit(f"File not found: {settings.file}")
            self.process_file(target)
        elif settings.collection and settings.collection != "all":
            path = self.collection_path(settings.collection)
            if not path.is_dir():
                available = ", ".join(settings.collections)
                error_exit(
                    f"Unknown collection: {settings.collection}. "
                    f"Available: {available}, all"
                )
            step(f"Processing {settings.collection} collection...")
            self.process_collection(path)
        else:
            step("Processing all configured collections...")
            for name in settings.collections:
                path = self.collection_path(name)
                if path.is_dir():
                    step(f"Processing {name} collection...")
                    self.process_collection(path)
                else:
                    warn(f"Collection directory not found: {path}")

        print()
        print_header("📊 Summary")
        print(f"  Files processed: {self.stats.processed}")
        print(f"  Images generated: {self.stats.generated}")
        print(f"  Images enhanced: {self.stats.enhanced}")
        print(f"  Files skipped: {self.stats.skipped}")
        print(f"  Errors: {self.stats.errors}")
        print()

        if settings.dry_run:
            info("This was a dry run. No actual changes were made.")
        if self.stats.errors > 0:
            warn("Some files had errors. Check the output above.")
            return 1
        success("Preview image generation complete!")
        return 0


# =============================================================================
# CLI
# =============================================================================

def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="generate-preview-images",
        description="AI-powered preview image generator for Jekyll content "
                    "(providers: claude [default], openai, xai, stability, gemini, local)",
    )
    parser.add_argument("-d", "--dry-run", action="store_true",
                        help="Preview what would be generated (no changes)")
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="Enable verbose output")
    parser.add_argument("-f", "--file", help="Process a specific file only")
    parser.add_argument("-c", "--collection",
                        help="Process specific collection (posts, quickstart, docs, all)")
    parser.add_argument("-p", "--provider",
                        choices=sorted(PROVIDERS.keys()),
                        help="AI provider (default: claude, via _config.yml)")
    parser.add_argument("--model", help="Override the image/SVG model for the provider")
    parser.add_argument("--output-dir",
                        help="Output directory for images (default: assets/images/previews)")
    parser.add_argument("--force", action="store_true",
                        help="Regenerate images even if preview exists")
    parser.add_argument("--list-missing", action="store_true",
                        help="Only list files with missing previews")
    parser.add_argument("-j", "--parallel", "-w", "--workers", type=int, default=None,
                        dest="parallel", metavar="N",
                        help="Concurrent workers (default 4; serial for dry-run/list)")
    parser.add_argument("-e", "--enhance", action="store_true",
                        help="Enhance existing preview images (OpenAI images/edits)")
    parser.add_argument("--enhance-prompt", help="Custom enhancement prompt (implies --enhance)")
    parser.add_argument("--enhance-model", help="Model for enhancement (default: gpt-image-2)")
    parser.add_argument("--enhance-quality", choices=["low", "medium", "high", "auto"],
                        help="Enhancement quality (default: auto)")
    parser.add_argument("--enhance-fidelity", choices=["high", "low"],
                        help="Input fidelity (implies --enhance)")
    parser.add_argument("--enhance-format", choices=["png", "jpeg", "webp"],
                        help="Enhanced output format (implies --enhance)")
    parser.add_argument("--prompt-engine", choices=["template", "claude"],
                        help="Art-direction brief: claude analyzes the article "
                             "(default) or template uses the built-in prompt")
    parser.add_argument("--review", choices=["claude", "none"],
                        help="Post-render review: claude inspects the image and "
                             "may request one refined regeneration (default: claude)")
    parser.add_argument("--rasterizer",
                        choices=["auto", "rsvg", "inkscape", "magick", "playwright", "none"],
                        help="SVG→PNG tool for claude/local providers (default: auto)")
    parser.add_argument("--style", help="Override image style prompt")
    parser.add_argument("--assets-prefix", help="Assets prefix for path normalization")
    parser.add_argument("--no-auto-prefix", action="store_true",
                        help="Disable automatic assets prefix prepending")
    parser.add_argument("--batch", type=int, default=0,
                        help="Limit number of files processed (0 = no limit)")
    parser.add_argument("--log-file", help="Also write log output to a file")
    # Accepted for backward compatibility with the previous engine's CLI;
    # pacing is now handled by with_retries (Retry-After aware) + -j workers.
    parser.add_argument("--rate-limit", type=int, dest="rate_limit",
                        help=argparse.SUPPRESS)
    return parser


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    args = build_arg_parser().parse_args(argv)
    # Historical flag semantics: these imply --enhance (--enhance-model does not).
    if args.enhance_prompt or args.enhance_fidelity or args.enhance_format:
        args.enhance = True
    return args


def validate_credentials(settings: Settings, ctx: RunContext) -> None:
    """Credential checks are skipped for --list-missing/--dry-run (historical
    behavior), but an unknown provider name (from AI_PROVIDER / _config.yml —
    argparse already constrains -p) errors in every mode."""
    provider = PROVIDERS.get(settings.provider)
    if provider is None:
        error_exit(f"Unknown AI provider: {settings.provider}. "
                   f"Available: {', '.join(sorted(PROVIDERS))}")
    if settings.list_only or settings.dry_run:
        return
    if provider.name == "local":
        info("Using local provider - no API key required")
        return
    if not provider.is_configured(ctx.env):
        error_exit(provider.missing_hint(ctx.env))


def main(argv: Optional[List[str]] = None) -> int:
    global VERBOSE, _log_file

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    args = parse_args(argv)
    ensure_yaml()
    _load_dotenv()

    project_root = find_project_root()
    site_config = read_site_config(project_root)
    settings = resolve_settings(args, site_config)
    VERBOSE = settings.verbose

    if args.log_file:
        try:
            _log_file = open(args.log_file, "w", encoding="utf-8")
            info(f"Logging to: {args.log_file}")
        except OSError as exc:
            warn(f"Cannot open log file: {exc}")

    explicitly_targeted = (
        settings.file or settings.collection or settings.enhance
        or settings.provider_explicit
    )
    if not settings.enabled and not explicitly_targeted:
        info("preview_images.enabled is false in _config.yml — nothing to do "
             "(pass --provider, --file or --collection to override).")
        return 0

    print_header("🎨 Preview Image Generator")
    ctx = RunContext(project_root=project_root, env=dict(os.environ))
    validate_credentials(settings, ctx)

    # Claude orchestration (analyze/review) degrades gracefully: without a
    # Claude credential the run continues on template prompts, unreviewed.
    wants_claude = (
        settings.provider != "local"
        and "claude" in (settings.prompt_engine, settings.review_engine)
        and not (settings.dry_run or settings.list_only)
    )
    if wants_claude:
        if ctx.claude().available():
            info(f"Claude orchestration: {ctx.claude().describe()}")
        else:
            warn(CLAUDE_CREDENTIAL_HINT)
            settings = replace(settings, prompt_engine="template", review_engine="none")

    output_dir = project_root / settings.output_dir
    if not settings.dry_run and not settings.list_only:
        output_dir.mkdir(parents=True, exist_ok=True)

    info("Configuration:")
    print(f"  AI Provider: {settings.provider}")
    print(f"  Image Model: {settings.model or PROVIDERS[settings.provider].default_model()}")
    print(f"  Output Dir: {settings.output_dir}")
    print(f"  Image Size: {settings.size}")
    print(f"  Parallel Workers: {settings.parallel}")
    print(f"  Dry Run: {str(settings.dry_run).lower()}")
    print(f"  Force: {str(settings.force).lower()}")
    print(f"  List Only: {str(settings.list_only).lower()}")
    print(f"  Prompt Engine: {settings.prompt_engine}")
    print(f"  Review: {settings.review_engine}")
    if settings.enhance:
        print("  Mode: ENHANCE (improve existing images)")
        print(f"  Enhance Model: {settings.enhance_model}")
        print(f"  Enhance Quality: {settings.enhance_quality}")
        print(f"  Input Fidelity: {settings.enhance_fidelity}")
        print(f"  Output Format: {settings.enhance_format}")
        if settings.enhance_prompt:
            print(f"  Custom Prompt: {settings.enhance_prompt[:80]}...")
        else:
            print("  Prompt: (default improvement prompt)")
    print()

    runner = Runner(settings, project_root, ctx=ctx)
    exit_code = runner.run()

    if _log_file:
        _log_file.close()
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
