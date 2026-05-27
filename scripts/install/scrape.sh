#!/bin/bash
# =============================================================================
# scripts/install/scrape.sh — BFS site scraper for the installer
# =============================================================================
# Crawls a public website with curl, runs each page through scrape_html.py,
# and writes a structured corpus under ${OUT_DIR}:
#
#   ${OUT_DIR}/
#     site.json              — site-level summary (title, nav, page index)
#     raw/<slug>.html        — raw HTML as fetched
#     pages/<slug>.json      — per-page extraction result
#     jekyll/<slug>.md       — Jekyll-ready Markdown with frontmatter
#
# The Jekyll markdown is the artifact consumed by tasks/scrape.sh.
#
# Public API:
#
#   scrape_run URL OUT_DIR [DEPTH] [MAX_PAGES]
#       Crawl starting at URL. Default DEPTH=2, MAX_PAGES=25.
#
#   scrape_url_to_slug URL
#       Stable filesystem-safe identifier for a URL.
#
# Honors:
#   SCRAPE_USER_AGENT     (default: zer0-mistakes-scraper/1.0 …)
#   SCRAPE_TIMEOUT        per-request curl timeout in seconds (default: 15)
#   SCRAPE_RATE_DELAY     seconds to sleep between requests (default: 0)
#   SCRAPE_ALLOW_SUBDOMAINS  1 to allow same-suffix subdomains (default: 0)
#   _FS_DRY_RUN           inherited from fs.sh — when 1, do not curl
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_SCRAPE_LIB:-}" ]] && return 0
_HAS_SCRAPE_LIB=1

_SCRAPE_DIR="${_SCRAPE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)}"
_SCRAPE_HTML_PY="${_SCRAPE_DIR}/scrape_html.py"

# ---------------------------------------------------------------------------
# scrape_check_deps — verify python3 + curl
# ---------------------------------------------------------------------------
scrape_check_deps() {
    if ! command -v python3 >/dev/null 2>&1; then
        log_error "scrape: python3 is required (not found in PATH)"
        return 1
    fi
    if ! command -v curl >/dev/null 2>&1; then
        log_error "scrape: curl is required (not found in PATH)"
        return 1
    fi
    if [[ ! -f "$_SCRAPE_HTML_PY" ]]; then
        log_error "scrape: helper not found: $_SCRAPE_HTML_PY"
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# scrape_url_to_slug URL — print a deterministic slug for the given URL
# ---------------------------------------------------------------------------
scrape_url_to_slug() {
    local url="$1"
    local path
    path=$(printf '%s' "$url" | python3 -c '
import sys, re
from urllib.parse import urlparse
u = urlparse(sys.stdin.read().strip())
p = (u.path or "/").strip("/")
# Strip extensions that round-trip badly as Jekyll page slugs.
p = re.sub(r"\.(html?|php|aspx?|jsp)$", "", p, flags=re.I)
if u.query:
    p = (p + "/" + u.query) if p else u.query
if not p:
    p = "index"
p = re.sub(r"[^A-Za-z0-9._/-]+", "-", p).strip("-/")
p = re.sub(r"/+", "--", p)
p = re.sub(r"-+", "-", p)
print(p[:100] or "index")
')
    printf '%s' "$path"
}

# ---------------------------------------------------------------------------
# scrape_normalize_url URL [BASE_URL]
# ---------------------------------------------------------------------------
scrape_normalize_url() {
    local url="$1"
    local base="${2:-$1}"
    URL="$url" BASE="$base" python3 -c '
import os
from urllib.parse import urljoin, urldefrag, urlparse
u, _ = urldefrag(urljoin(os.environ["BASE"], os.environ["URL"]))
p = urlparse(u)
if p.scheme not in ("http", "https"):
    raise SystemExit(0)
netloc = p.netloc
if netloc.endswith(":80") and p.scheme == "http": netloc = netloc[:-3]
if netloc.endswith(":443") and p.scheme == "https": netloc = netloc[:-4]
path = p.path or "/"
print(f"{p.scheme}://{netloc}{path}" + (("?" + p.query) if p.query else ""))
'
}

# ---------------------------------------------------------------------------
# scrape_same_host URL BASE_URL
# ---------------------------------------------------------------------------
scrape_same_host() {
    local url="$1" base="$2"
    local allow_sub="${SCRAPE_ALLOW_SUBDOMAINS:-0}"
    URL="$url" BASE="$base" ALLOW="$allow_sub" python3 -c '
import os, sys
from urllib.parse import urlparse
def host(u):
    h = urlparse(u).netloc.lower()
    if h.startswith("www."): h = h[4:]
    return h
a, b = host(os.environ["URL"]), host(os.environ["BASE"])
if not a or not b:
    sys.exit(1)
if a == b:
    sys.exit(0)
if os.environ.get("ALLOW") == "1" and (a.endswith("." + b) or b.endswith("." + a)):
    sys.exit(0)
sys.exit(1)
'
}

# ---------------------------------------------------------------------------
# scrape_fetch URL OUT_FILE — fetch URL to file; print HTTP status to stdout
# ---------------------------------------------------------------------------
scrape_fetch() {
    local url="$1" out="$2"
    local ua="${SCRAPE_USER_AGENT:-zer0-mistakes-scraper/1.0 (+https://github.com/bamr87/zer0-mistakes)}"
    local timeout="${SCRAPE_TIMEOUT:-15}"
    local code
    code=$(curl -fsSL \
        --max-time "$timeout" \
        --retry 1 --retry-delay 1 \
        -A "$ua" \
        -H "Accept: text/html,application/xhtml+xml" \
        -H "Accept-Language: en-US,en;q=0.9" \
        -o "$out" \
        -w "%{http_code}" \
        "$url" 2>/dev/null) || true
    printf '%s' "$code"
}

# ---------------------------------------------------------------------------
# scrape_run URL OUT_DIR [DEPTH] [MAX_PAGES]
# ---------------------------------------------------------------------------
scrape_run() {
    local start_url="$1"
    local out_dir="$2"
    local max_depth="${3:-2}"
    local max_pages="${4:-25}"

    scrape_check_deps || return 1

    if [[ -z "$start_url" || -z "$out_dir" ]]; then
        log_error "scrape_run: URL and OUT_DIR required"
        return 2
    fi

    # Normalize the seed URL.
    local base
    base=$(scrape_normalize_url "$start_url") || base="$start_url"
    [[ -n "$base" ]] || { log_error "scrape: invalid URL: $start_url"; return 2; }

    mkdir -p "$out_dir/raw" "$out_dir/pages" "$out_dir/jekyll"

    log_info "Scraping site: $base"
    log_info "  → output:    $out_dir"
    log_info "  → depth:     $max_depth   max-pages: $max_pages"

    if [[ "${_FS_DRY_RUN:-0}" == "1" ]]; then
        log_warning "DRY RUN — no network requests will be issued"
        return 0
    fi

    # Queue parallel arrays (URL + depth). Visited set kept in a file for
    # bash 3.2 portability.
    local visited_file
    visited_file="$out_dir/.visited"
    : > "$visited_file"

    local -a queue_url queue_depth
    queue_url=("$base")
    queue_depth=(0)

    local fetched=0
    local site_pages_json="$out_dir/.site_pages.tmp"
    : > "$site_pages_json"
    local site_nav_json="$out_dir/.site_nav.tmp"
    : > "$site_nav_json"
    local site_title="" site_description="" site_lang="" site_image=""

    while [[ ${#queue_url[@]} -gt 0 && $fetched -lt $max_pages ]]; do
        local url="${queue_url[0]}"
        local depth="${queue_depth[0]}"
        queue_url=("${queue_url[@]:1}")
        queue_depth=("${queue_depth[@]:1}")

        # Visited check.
        if grep -Fxq "$url" "$visited_file" 2>/dev/null; then
            continue
        fi
        echo "$url" >> "$visited_file"

        local slug
        slug=$(scrape_url_to_slug "$url")
        local raw="$out_dir/raw/${slug}.html"
        local page_json="$out_dir/pages/${slug}.json"

        log_info "  [${fetched}/$max_pages] depth=$depth GET $url"

        local code
        code=$(scrape_fetch "$url" "$raw")
        if [[ "$code" != "200" && "$code" != "203" ]]; then
            log_warning "    HTTP $code — skipping"
            rm -f "$raw"
            continue
        fi
        fetched=$((fetched + 1))

        # Extract metadata + markdown.
        if ! python3 "$_SCRAPE_HTML_PY" extract \
                --url "$url" --base-url "$base" "$raw" > "$page_json" 2>/dev/null; then
            log_warning "    extraction failed — skipping"
            continue
        fi

        # First page seeds site-level metadata.
        if [[ -z "$site_title" ]]; then
            site_title=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("site_name") or d.get("title") or "")' "$page_json")
            site_description=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("description") or "")' "$page_json")
            site_lang=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("lang") or "en")' "$page_json")
            site_image=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("image") or "")' "$page_json")
            # Capture nav from the first page only.
            python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(json.dumps(d.get("nav") or []))' "$page_json" > "$site_nav_json"
        fi

        # Render Jekyll markdown.
        scrape_emit_jekyll_page "$page_json" "$out_dir/jekyll/${slug}.md" "$slug"

        # Record in the site index.
        printf '%s\t%s\n' "$slug" "$url" >> "$site_pages_json"

        # Enqueue same-host links if we have depth budget.
        if [[ $depth -lt $max_depth ]]; then
            local next_url
            while IFS= read -r next_url; do
                [[ -z "$next_url" ]] && continue
                if scrape_same_host "$next_url" "$base"; then
                    if ! grep -Fxq "$next_url" "$visited_file" 2>/dev/null; then
                        queue_url+=("$next_url")
                        queue_depth+=($((depth + 1)))
                    fi
                fi
            done < <(python3 "$_SCRAPE_HTML_PY" crawl-links \
                --base-url "$base" --url "$url" "$raw" 2>/dev/null)
        fi

        # Optional rate limiting.
        if [[ -n "${SCRAPE_RATE_DELAY:-}" && "${SCRAPE_RATE_DELAY}" != "0" ]]; then
            sleep "$SCRAPE_RATE_DELAY" 2>/dev/null || true
        fi
    done

    # Build site.json
    scrape_emit_site_json \
        "$base" "$site_title" "$site_description" "$site_lang" "$site_image" \
        "$site_nav_json" "$site_pages_json" "$out_dir/site.json"

    rm -f "$site_pages_json" "$site_nav_json" "$visited_file"
    log_success "Scrape complete: $fetched page(s) → $out_dir"
    return 0
}

# ---------------------------------------------------------------------------
# scrape_emit_jekyll_page PAGE_JSON OUT_MD SLUG
# Writes Jekyll-friendly markdown with frontmatter.
# ---------------------------------------------------------------------------
scrape_emit_jekyll_page() {
    local page_json="$1" out_md="$2" slug="$3"
    SLUG="$slug" python3 - "$page_json" "$out_md" <<'PY'
import json, os, sys, re
slug = os.environ["SLUG"]
src, dst = sys.argv[1], sys.argv[2]
with open(src, "r", encoding="utf-8") as f:
    d = json.load(f)

def y(v):
    if v is None: return '""'
    s = str(v).replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'

title = d.get("title") or slug.replace("-", " ").replace("/", " ").title()
description = d.get("description") or ""
canonical = d.get("canonical") or d.get("url") or ""
image = d.get("image") or ""

# Permalink: turn slug back into a URL-ish path.
permalink = "/" + slug.replace("--", "/")
if not permalink.endswith("/"):
    permalink = permalink + "/"
if permalink == "/index/":
    permalink = "/"

frontmatter = [
    "---",
    f"title: {y(title)}",
    f"description: {y(description)}",
    f"permalink: {y(permalink)}",
    f"layout: \"default\"",
    f"source_url: {y(canonical)}",
]
if image:
    frontmatter.append(f"preview: {y(image)}")
frontmatter.append("scraped: true")
frontmatter.append("---")
frontmatter.append("")

body = d.get("markdown") or ""
# Strip the leading H1 if it duplicates the title.
m = re.match(r"\s*#\s+(.+?)\s*\n", body)
if m and m.group(1).strip().lower() == title.strip().lower():
    body = body[m.end():]

os.makedirs(os.path.dirname(dst), exist_ok=True)
with open(dst, "w", encoding="utf-8") as f:
    f.write("\n".join(frontmatter))
    f.write(body.lstrip("\n"))
PY
}

# ---------------------------------------------------------------------------
# scrape_emit_site_json …
# Combines site metadata + nav + page index into a single JSON file.
# ---------------------------------------------------------------------------
scrape_emit_site_json() {
    local base="$1" title="$2" desc="$3" lang="$4" image="$5"
    local nav_file="$6" pages_tsv="$7" out_file="$8"

    BASE="$base" TITLE="$title" DESC="$desc" LANG="$lang" IMAGE="$image" \
        NAV="$nav_file" PAGES="$pages_tsv" OUT="$out_file" \
        python3 <<'PY'
import json, os
nav = []
try:
    with open(os.environ["NAV"], "r", encoding="utf-8") as f:
        nav = json.load(f) or []
except Exception:
    nav = []

pages = []
try:
    with open(os.environ["PAGES"], "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line: continue
            parts = line.split("\t", 1)
            if len(parts) == 2:
                pages.append({"slug": parts[0], "url": parts[1]})
except Exception:
    pass

out = {
    "base_url": os.environ["BASE"],
    "title": os.environ["TITLE"],
    "description": os.environ["DESC"],
    "lang": os.environ["LANG"] or "en",
    "image": os.environ["IMAGE"],
    "nav": nav,
    "pages": pages,
    "page_count": len(pages),
}
with open(os.environ["OUT"], "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
PY
}
