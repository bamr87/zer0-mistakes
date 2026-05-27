#!/bin/bash
# =============================================================================
# scripts/install/tasks/scrape.sh — Generate Jekyll content from a scraped site
# =============================================================================
# Reads SPEC_SCRAPE_SOURCE_URL (+ depth/max_pages) from the spec, runs the
# crawler, then materialises the rendered Jekyll content under the target:
#
#   - Home page  → ${target}/index.md (permalink: /)
#   - Events     → ${target}/pages/events/<slug>.md
#   - Posts      → ${target}/pages/news/<slug>.md
#   - Everything → ${target}/pages/<slug>.md
#   - Site nav   → ${target}/_data/navigation/main.yml (top-level YAML array)
#   - Site data  → ${target}/_data/scraped_site.json
#   - Assets     → ${target}/assets/scraped/ (images downloaded locally)
#   - Config     → ${target}/_config.yml seeded with title/desc/lang/logo
#
# Behaviour:
#   - Skipped when SPEC_SCRAPE_SOURCE_URL is empty.
#   - Existing files are preserved unless --force is in effect.
#   - Existing _data/navigation/main.yml is backed up to main.yml.bak on first
#     overwrite (so theme defaults are recoverable).
#   - Honors _FS_DRY_RUN.
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_SCRAPE:-}" ]] && return 0
_HAS_TASK_SCRAPE=1

# Source the crawler module (idempotent).
_TASK_SCRAPE_DIR="${_TASK_SCRAPE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." 2>/dev/null && pwd)}"
# shellcheck source=/dev/null
[[ -f "${_TASK_SCRAPE_DIR}/scrape.sh" ]] && source "${_TASK_SCRAPE_DIR}/scrape.sh"

task_scrape_run() {
    local target="$1"
    local src_url="${SPEC_SCRAPE_SOURCE_URL:-}"

    if [[ -z "$src_url" ]]; then
        log_debug "scrape task: no scrape.source_url in spec — skipping"
        return 0
    fi

    local depth="${SPEC_SCRAPE_DEPTH:-2}"
    local max_pages="${SPEC_SCRAPE_MAX_PAGES:-25}"
    local include_nav="${SPEC_SCRAPE_INCLUDE_NAV:-true}"
    local scrape_dir="${SPEC_SCRAPE_OUT_DIR:-${target}/.zer0/scrape}"

    log_info "scrape: $src_url (depth=$depth, max=$max_pages)"

    if [[ "${_FS_DRY_RUN:-0}" == "1" ]]; then
        log_warning "DRY RUN — scrape would fetch $src_url → $scrape_dir"
        return 0
    fi

    mkdir -p "$scrape_dir"
    if ! scrape_run "$src_url" "$scrape_dir" "$depth" "$max_pages"; then
        log_error "scrape: crawl failed for $src_url"
        return 1
    fi

    local site_json="$scrape_dir/site.json"
    local pages_dir="$scrape_dir/pages"
    local jekyll_dir="$scrape_dir/jekyll"

    if [[ ! -d "$jekyll_dir" ]]; then
        log_warning "scrape: no jekyll output produced (skipping content copy)"
        return 0
    fi

    # --- Distribute pages by kind ----------------------------------------
    _task_scrape_distribute_pages "$target" "$scrape_dir" || return 1

    # --- Copy downloaded assets ------------------------------------------
    _task_scrape_copy_assets "$target" "$scrape_dir"

    # --- Publish site metadata as a Jekyll data file ---------------------
    if [[ -f "$site_json" ]]; then
        mkdir -p "${target}/_data"
        cp "$site_json" "${target}/_data/scraped_site.json"
        log_debug "  wrote _data/scraped_site.json"
    fi

    # --- Wire navigation to the file the theme actually reads ------------
    if [[ "$include_nav" == "true" && -f "$site_json" ]]; then
        _task_scrape_write_nav "$target" "$site_json" "$src_url"
    fi

    # --- Seed _config.yml from scraped site metadata ---------------------
    _task_scrape_seed_config "$target" "$site_json"

    log_success "scrape: content imported from $src_url"
    return 0
}

# ---------------------------------------------------------------------------
# Distribute rendered Jekyll markdown into kind-based directories.
# Routes each scrape_dir/jekyll/<slug>.md based on the matching
# scrape_dir/pages/<slug>.json `kind` field.
# ---------------------------------------------------------------------------
_task_scrape_distribute_pages() {
    local target="$1" scrape_dir="$2"
    local jekyll_dir="$scrape_dir/jekyll"
    local pages_dir="$scrape_dir/pages"
    local copied=0 skipped=0
    local f base slug kind dest

    for f in "$jekyll_dir"/*.md; do
        [[ -f "$f" ]] || continue
        base=$(basename "$f")
        slug="${base%.md}"

        # Look up kind from the per-page JSON; default to "page".
        kind="page"
        if [[ -f "$pages_dir/$slug.json" ]]; then
            kind=$(python3 -c '
import json, sys
try:
    d = json.load(open(sys.argv[1], encoding="utf-8"))
    print((d.get("kind") or "page").strip() or "page")
except Exception:
    print("page")
' "$pages_dir/$slug.json" 2>/dev/null)
            [[ -z "$kind" ]] && kind="page"
        fi

        case "$kind" in
            home)
                dest="${target}/index.md"
                ;;
            event)
                dest="${target}/pages/events/${slug}.md"
                ;;
            post)
                dest="${target}/pages/news/${slug}.md"
                ;;
            *)
                dest="${target}/pages/${slug}.md"
                ;;
        esac

        # Home always wins — overwrite the installer's placeholder index.
        if [[ "$kind" != "home" && -f "$dest" && "${_FS_FORCE:-0}" != "1" ]]; then
            log_debug "  skip (exists): ${dest#${target}/}"
            skipped=$((skipped + 1))
            continue
        fi

        mkdir -p "$(dirname "$dest")"
        if [[ "$(type -t fs_copy)" == "function" && "$kind" != "home" ]]; then
            fs_copy "$f" "$dest"
        else
            cp "$f" "$dest"
        fi
        copied=$((copied + 1))
        log_debug "  $kind → ${dest#${target}/}"
    done

    log_info "scrape: distributed ${copied} page(s)  (skipped ${skipped})"
}

# ---------------------------------------------------------------------------
# Copy any downloaded images from scrape_dir/assets/ → target/assets/scraped/.
# Markdown already references /assets/scraped/<file> (set during scrape).
# ---------------------------------------------------------------------------
_task_scrape_copy_assets() {
    local target="$1" scrape_dir="$2"
    local src="$scrape_dir/assets"
    local dst="${target}/assets/scraped"
    [[ -d "$src" ]] || return 0
    mkdir -p "$dst"
    local count=0 f
    for f in "$src"/*; do
        [[ -f "$f" ]] || continue
        cp "$f" "$dst/" 2>/dev/null && count=$((count + 1))
    done
    [[ $count -gt 0 ]] && log_info "scrape: copied $count asset(s) → assets/scraped/"
}

# ---------------------------------------------------------------------------
# Write the scraped navigation into the file the theme actually reads:
# _data/navigation/main.yml — top-level YAML array (NOT under a `main:` key).
# Backs up any existing file once to main.yml.bak.
# ---------------------------------------------------------------------------
_task_scrape_write_nav() {
    local target="$1" site_json="$2" src_url="$3"
    local nav_yml="${target}/_data/navigation/main.yml"
    mkdir -p "$(dirname "$nav_yml")"

    # Back up the theme default the first time we overwrite it.
    if [[ -f "$nav_yml" && ! -f "${nav_yml}.bak" ]]; then
        cp "$nav_yml" "${nav_yml}.bak"
        log_debug "  backed up existing main.yml → main.yml.bak"
    fi

    SITE_JSON="$site_json" OUT="$nav_yml" SRC="$src_url" python3 <<'PY'
import json, os
from urllib.parse import urlparse

src_url = os.environ["SRC"]
with open(os.environ["SITE_JSON"], "r", encoding="utf-8") as f:
    d = json.load(f)

nav = d.get("nav") or []
base_host = urlparse(src_url).netloc

# Map scraped pages by URL path so we can pick reasonable icons by kind.
pages = d.get("pages") or []
kind_by_path = {}
for p in pages:
    u = (p.get("url") or "").strip()
    if not u: continue
    path = (urlparse(u).path or "/").rstrip("/") or "/"
    kind_by_path[path] = p.get("kind") or "page"

ICONS = {
    "home":    "bi-house-door",
    "event":   "bi-calendar-event",
    "post":    "bi-newspaper",
    "about":   "bi-info-circle",
    "contact": "bi-envelope",
    "service": "bi-gear",
    "faq":     "bi-question-circle",
    "page":    "bi-file-earmark-text",
}

out = []
seen_paths = set()

# Always lead with Home.
out.append({"title": "Home", "icon": "bi-house-door", "url": "/"})
seen_paths.add("/")

for item in nav:
    label = (item.get("label") or "").strip()
    url   = (item.get("url") or "").strip()
    if not label or not url: continue
    p = urlparse(url)
    if p.netloc and p.netloc != base_host: continue
    path = (p.path or "/").rstrip("/") or "/"
    if path in seen_paths: continue
    seen_paths.add(path)
    kind = kind_by_path.get(path, "page")
    out.append({
        "title": label,
        "icon":  ICONS.get(kind, "bi-file-earmark-text"),
        "url":   path if path == "/" else (path + "/"),
    })

# If the source nav was empty/blocked, fall back to top scraped pages.
if len(out) <= 1:
    for p in pages[:6]:
        url = (p.get("url") or "").strip()
        if not url: continue
        path = (urlparse(url).path or "/").rstrip("/") or "/"
        if path in seen_paths: continue
        seen_paths.add(path)
        out.append({
            "title": (p.get("title") or path.strip("/") or "Page")[:60],
            "icon":  ICONS.get(p.get("kind") or "page", "bi-file-earmark-text"),
            "url":   path if path == "/" else (path + "/"),
        })

def yq(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'

lines = ["# Auto-generated from scrape: " + src_url, ""]
for item in out:
    lines.append(f'- title: {yq(item["title"])}')
    lines.append(f'  icon: {item["icon"]}')
    lines.append(f'  url: {yq(item["url"])}')
    lines.append("")

with open(os.environ["OUT"], "w", encoding="utf-8") as f:
    f.write("\n".join(lines).rstrip() + "\n")
PY
    log_info "scrape: wrote $(basename "$nav_yml") with $(grep -c '^- title:' "$nav_yml" 2>/dev/null || echo 0) entries"
}

# ---------------------------------------------------------------------------
# Seed _config.yml from scraped metadata. Non-destructive: only fills empty
# or installer-placeholder values.
# ---------------------------------------------------------------------------
_task_scrape_seed_config() {
    local target="$1" site_json="$2"
    [[ -f "$site_json" ]] || return 0
    local cfg="${target}/_config.yml"
    [[ -f "$cfg" ]] || return 0

    SITE_JSON="$site_json" CFG="$cfg" python3 <<'PY'
import json, os, re

with open(os.environ["SITE_JSON"], encoding="utf-8") as f:
    s = json.load(f)
title = (s.get("title") or "").strip()
desc  = (s.get("description") or "").strip()
lang  = (s.get("lang") or "").strip() or "en"
image = (s.get("image") or "").strip()

cfg_path = os.environ["CFG"]
with open(cfg_path, encoding="utf-8") as f:
    txt = f.read()

PLACEHOLDERS = {
    "title": {"", "My Jekyll Site", "Your Site Title", "Jekyll Theme zer0"},
    "description": {"", "A Jekyll site built with zer0-mistakes",
                    "A description of your site"},
    "lang": {"", "en-US"},
    "logo": {"", "/assets/images/logo.png", "/assets/logo.png"},
}

def repl_scalar(s, key, val, placeholders):
    if not val:
        return s
    pat = re.compile(r'^(' + re.escape(key) + r'\s*:\s*)(.*)$', re.M)
    def fn(m):
        cur = m.group(2).strip().strip('"').strip("'")
        if cur and cur not in placeholders:
            return m.group(0)
        safe = val.replace('"', "")
        return f'{m.group(1)}"{safe}"'
    return pat.sub(fn, s, count=1)

txt = repl_scalar(txt, "title",       title, PLACEHOLDERS["title"])
txt = repl_scalar(txt, "description", desc,  PLACEHOLDERS["description"])
txt = repl_scalar(txt, "lang",        lang,  PLACEHOLDERS["lang"])
if image:
    txt = repl_scalar(txt, "logo", image, PLACEHOLDERS["logo"])

# Ensure lang/logo exist; if not, append a small block.
appended = []
if title and not re.search(r'^title\s*:', txt, re.M):
    appended.append(f'title: "{title}"')
if desc and not re.search(r'^description\s*:', txt, re.M):
    appended.append(f'description: "{desc}"')
if lang and not re.search(r'^lang\s*:', txt, re.M):
    appended.append(f'lang: "{lang}"')
if image and not re.search(r'^logo\s*:', txt, re.M):
    appended.append(f'logo: "{image}"')
if appended:
    if not txt.endswith("\n"): txt += "\n"
    txt += "\n# Seeded from scrape\n" + "\n".join(appended) + "\n"

with open(cfg_path, "w", encoding="utf-8") as f:
    f.write(txt)
PY
    log_debug "  seeded _config.yml from scrape metadata"
}

