#!/bin/bash
# =============================================================================
# scripts/install/tasks/scrape.sh — Generate Jekyll content from a scraped site
# =============================================================================
# Reads SPEC_SCRAPE_SOURCE_URL (+ depth/max_pages) from the spec, runs the
# crawler, then materialises the rendered Jekyll markdown under:
#
#   ${target}/pages/_scraped/<slug>.md      (one Jekyll page per crawled URL)
#   ${target}/_data/scraped_site.json       (site-level metadata + page index)
#   ${target}/_data/navigation/scraped.yml  (best-effort nav from the source)
#
# Behaviour:
#   - Skipped when SPEC_SCRAPE_SOURCE_URL is empty.
#   - Existing files are preserved unless --force is in effect (uses
#     fs_copy when available, falls back to cp -n).
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

    local jekyll_dir="$scrape_dir/jekyll"
    local site_json="$scrape_dir/site.json"

    if [[ ! -d "$jekyll_dir" ]]; then
        log_warning "scrape: no jekyll output produced (skipping content copy)"
        return 0
    fi

    # Copy each rendered page into pages/_scraped/.
    local dest_pages="${target}/pages/_scraped"
    mkdir -p "$dest_pages"
    local copied=0 skipped=0
    local f
    for f in "$jekyll_dir"/*.md; do
        [[ -f "$f" ]] || continue
        local base
        base=$(basename "$f")
        local dst="${dest_pages}/${base}"
        if [[ -f "$dst" && "${_FS_FORCE:-0}" != "1" ]]; then
            log_debug "  skip (exists): pages/_scraped/${base}"
            skipped=$((skipped + 1))
            continue
        fi
        if [[ "$(type -t fs_copy)" == "function" ]]; then
            fs_copy "$f" "$dst"
        else
            cp "$f" "$dst"
        fi
        copied=$((copied + 1))
    done
    log_info "scrape: copied ${copied} page(s) → pages/_scraped/  (skipped ${skipped})"

    # Publish site.json as a Jekyll data file so layouts can iterate it.
    if [[ -f "$site_json" ]]; then
        mkdir -p "${target}/_data"
        if [[ ! -f "${target}/_data/scraped_site.json" || "${_FS_FORCE:-0}" == "1" ]]; then
            cp "$site_json" "${target}/_data/scraped_site.json"
            log_debug "  wrote _data/scraped_site.json"
        fi
    fi

    # Emit a navigation YAML if requested + nav was extracted.
    if [[ "$include_nav" == "true" && -f "$site_json" ]]; then
        local nav_yml="${target}/_data/navigation/scraped.yml"
        if [[ ! -f "$nav_yml" || "${_FS_FORCE:-0}" == "1" ]]; then
            mkdir -p "$(dirname "$nav_yml")"
            SITE_JSON="$site_json" OUT="$nav_yml" SRC="$src_url" python3 - <<'PY'
import json, os, re
from urllib.parse import urlparse
src_url = os.environ["SRC"]
with open(os.environ["SITE_JSON"], "r", encoding="utf-8") as f:
    d = json.load(f)
nav = d.get("nav") or []
base_host = urlparse(src_url).netloc
lines = [
    "# Auto-generated from scrape: " + src_url,
    "main:",
]
seen = set()
for item in nav:
    label = (item.get("label") or "").strip()
    url = (item.get("url") or "").strip()
    if not label or not url:
        continue
    p = urlparse(url)
    if p.netloc and p.netloc != base_host:
        continue
    path = p.path or "/"
    if path in seen:
        continue
    seen.add(path)
    safe = label.replace('"', '\\"')
    lines.append(f'  - title: "{safe}"')
    lines.append(f'    url: "{path}"')
if len(lines) == 2:
    lines.append('  - title: "Home"')
    lines.append('    url: "/"')
with open(os.environ["OUT"], "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
PY
            log_debug "  wrote _data/navigation/scraped.yml"
        fi
    fi

    # Bump _config.yml site title/description from the scraped site if the
    # spec hasn't been given explicit values — only when those config keys
    # weren't already overridden by tasks/config.sh.
    _task_scrape_seed_config "$target" "$site_json"

    log_success "scrape: content imported from $src_url"
    return 0
}

# Apply scraped site title/description to _config.yml on a best-effort basis.
# Non-destructive: only fills empty/placeholder values.
_task_scrape_seed_config() {
    local target="$1" site_json="$2"
    [[ -f "$site_json" ]] || return 0
    local cfg="${target}/_config.yml"
    [[ -f "$cfg" ]] || return 0

    local s_title s_desc
    s_title=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("title","").strip())' "$site_json")
    s_desc=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("description","").strip())' "$site_json")
    [[ -z "$s_title$s_desc" ]] && return 0

    SITE_TITLE="$s_title" SITE_DESC="$s_desc" CFG="$cfg" python3 <<'PY'
import os, re
cfg = os.environ["CFG"]
title = os.environ.get("SITE_TITLE", "")
desc  = os.environ.get("SITE_DESC", "")
with open(cfg, "r", encoding="utf-8") as f:
    txt = f.read()
def repl_scalar(s, key, val):
    if not val:
        return s
    pat = re.compile(r'^(' + re.escape(key) + r'\s*:\s*)(.*)$', re.M)
    def fn(m):
        cur = m.group(2).strip().strip('"').strip("'")
        # Only overwrite obvious placeholders / empty strings.
        if cur and cur not in ("", "My Jekyll Site",
                                "A Jekyll site built with zer0-mistakes"):
            return m.group(0)
        return f"{m.group(1)}\"{val.replace(chr(34), '')}\""
    return pat.sub(fn, s, count=1)
txt = repl_scalar(txt, "title",       title)
txt = repl_scalar(txt, "description", desc)
with open(cfg, "w", encoding="utf-8") as f:
    f.write(txt)
PY
}
