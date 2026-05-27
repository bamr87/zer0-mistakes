#!/bin/bash
# =============================================================================
# test_install_scrape.sh — Validate site-scraping pipeline end-to-end.
# =============================================================================
# Spins up a Python http.server against a small HTML fixture, runs both
#   1) `install scrape <URL> <OUT>`   (standalone scrape)
#   2) `install init --scrape <URL>`  (scrape integrated into init)
# and asserts the expected Jekyll markdown / data files appear.
# Requires python3 + curl on PATH (always true in our CI matrix).
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_BIN="$PROJECT_ROOT/scripts/bin/install"

# shellcheck source=lib/install_test_utils.sh
source "$SCRIPT_DIR/lib/install_test_utils.sh"
setup_cleanup_trap

# ---- pick a free localhost port (low collision risk) ----------------------
_pick_port() {
    python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
}

# ---- build a tiny static site under a temp dir ----------------------------
_build_fixture() {
    local dir="$1"
    mkdir -p "$dir"
    cat > "$dir/index.html" <<'HTML'
<!DOCTYPE html><html lang="en"><head>
<title>Cosmo Co — Cosmic Goods</title>
<meta name="description" content="Cosmo Co ships cosmic goods worldwide.">
<meta property="og:site_name" content="Cosmo Co">
</head><body>
<header><nav>
  <a href="/">Home</a>
  <a href="/about.html">About</a>
  <a href="/services.html">Services</a>
</nav></header>
<main>
  <h1>Welcome to Cosmo</h1>
  <p>We are a <strong>distributor</strong> of cosmic goods since 1999.</p>
  <h2>What we do</h2>
  <ul><li>Stellar shipping</li><li>Galactic warranty</li><li>Quantum support</li></ul>
</main></body></html>
HTML
    cat > "$dir/about.html" <<'HTML'
<!DOCTYPE html><html lang="en"><head><title>About — Cosmo Co</title>
<meta name="description" content="About Cosmo Co."></head><body>
<main><h1>About Cosmo</h1>
<p>Founded by Ada Lunar.</p></main></body></html>
HTML
    cat > "$dir/services.html" <<'HTML'
<!DOCTYPE html><html lang="en"><head><title>Services — Cosmo Co</title></head><body>
<main><h1>Services</h1>
<h2>Lunar Logistics</h2><p>From Earth to Moon.</p>
<h2>Asteroid Insurance</h2><p>Sleep easy.</p></main></body></html>
HTML
}

_start_server() {
    local dir="$1" port="$2"
    # Detach fd0/1/2 fully so the backgrounded server doesn't keep the
    # caller's stdout pipe (e.g. `| tail`) open forever.
    ( cd "$dir" && exec python3 -m http.server "$port" </dev/null >/dev/null 2>&1 ) &
    local pid=$!
    disown "$pid" 2>/dev/null || true
    # Wait up to 3s for the port to accept connections.
    local i=0
    while [[ $i -lt 30 ]]; do
        if curl -fsS --max-time 1 "http://127.0.0.1:${port}/" >/dev/null 2>&1; then
            echo "$pid"
            return 0
        fi
        i=$((i + 1))
        sleep 0.1 2>/dev/null || sleep 1
    done
    kill "$pid" 2>/dev/null
    return 1
}

# ---------------------------------------------------------------------------
# Test 1 — standalone `install scrape <URL>`
# ---------------------------------------------------------------------------
test_scrape_standalone() {
    local fixture out port pid
    fixture="$(create_test_workspace scrape-fixture-src)"
    out="$(create_test_workspace scrape-fixture-out)"
    _build_fixture "$fixture"
    port=$(_pick_port)
    pid=$(_start_server "$fixture" "$port") || {
        test_log_error "could not start http.server on port $port"
        return 1
    }

    "$INSTALL_BIN" scrape "http://127.0.0.1:${port}/" "$out" \
        --scrape-depth 1 --scrape-max-pages 10 </dev/null >/tmp/scrape-out-$$ 2>&1
    local rc=$?
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    if [[ $rc -ne 0 ]]; then
        test_log_error "scrape rc=$rc"
        tail -20 /tmp/scrape-out-$$
        rm -f /tmp/scrape-out-$$
        return 1
    fi
    rm -f /tmp/scrape-out-$$

    local missing=""
    [[ -f "$out/site.json" ]]            || missing="$missing site.json"
    [[ -f "$out/jekyll/index.md" ]]      || missing="$missing jekyll/index.md"
    [[ -f "$out/jekyll/about.md" ]]      || missing="$missing jekyll/about.md"
    [[ -f "$out/jekyll/services.md" ]]   || missing="$missing jekyll/services.md"

    if [[ -n "$missing" ]]; then
        test_log_error "scrape: missing artifacts:$missing"
        find "$out" -maxdepth 3 -type f | head -30
        return 1
    fi

    # Content checks — frontmatter + body fidelity.
    grep -q '^title: "Cosmo Co — Cosmic Goods"' "$out/jekyll/index.md" \
        || { test_log_error "index.md: title not extracted"; return 1; }
    grep -q '^scraped: true' "$out/jekyll/index.md" \
        || { test_log_error "index.md: scraped flag missing"; return 1; }
    grep -q 'distributor' "$out/jekyll/index.md" \
        || { test_log_error "index.md: body not rendered"; return 1; }
    grep -q '"page_count": [1-9]' "$out/site.json" \
        || { test_log_error "site.json: page_count missing"; return 1; }

    return 0
}

# ---------------------------------------------------------------------------
# Test 2 — `install init --scrape <URL>` (full pipeline integration)
# ---------------------------------------------------------------------------
test_scrape_init_integration() {
    local fixture ws port pid
    fixture="$(create_test_workspace scrape-init-src)"
    ws="$(create_test_workspace scrape-init-ws)"
    _build_fixture "$fixture"
    port=$(_pick_port)
    pid=$(_start_server "$fixture" "$port") || {
        test_log_error "could not start http.server on port $port"
        return 1
    }

    "$INSTALL_BIN" init --profile minimal --skip-doctor \
        --scrape "http://127.0.0.1:${port}/" \
        --scrape-depth 1 --scrape-max-pages 10 \
        "$ws" </dev/null >/tmp/init-scrape-$$ 2>&1
    local rc=$?
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    if [[ $rc -ne 0 ]]; then
        test_log_error "init --scrape rc=$rc"
        tail -25 /tmp/init-scrape-$$
        rm -f /tmp/init-scrape-$$
        return 1
    fi
    rm -f /tmp/init-scrape-$$

    local missing=""
    # New layout: home → root index.md, generic pages → pages/<slug>.md
    [[ -f "$ws/index.md" ]]                  || missing="$missing index.md"
    [[ -f "$ws/pages/about.md" ]]            || missing="$missing pages/about.md"
    [[ -f "$ws/_data/scraped_site.json" ]]   || missing="$missing _data/scraped_site.json"
    [[ -f "$ws/_data/navigation/main.yml" ]] || missing="$missing _data/navigation/main.yml"
    [[ -f "$ws/_config.yml" ]]               || missing="$missing _config.yml"

    if [[ -n "$missing" ]]; then
        test_log_error "init+scrape: missing artifacts:$missing"
        find "$ws" -maxdepth 3 -type f | head -40
        return 1
    fi

    # Confirm the spec persisted the scrape config.
    if [[ -f "$ws/.zer0/install.spec.json" ]]; then
        grep -q '"source_url"' "$ws/.zer0/install.spec.json" \
            || { test_log_error "spec: scrape.source_url not persisted"; return 1; }
    fi

    # nav YAML should contain at least one entry from the fixture (About).
    grep -q 'About' "$ws/_data/navigation/main.yml" \
        || { test_log_error "scraped nav YAML missing About entry"; return 1; }

    # Nav YAML must NOT contain any blocked labels.
    if grep -Eqi '^- title: "?(Folder:|Cart|Back)' "$ws/_data/navigation/main.yml"; then
        test_log_error "scraped nav YAML contains blocked label"
        return 1
    fi

    # Home index.md must have permalink: /
    grep -q '^permalink: "/"' "$ws/index.md" \
        || { test_log_error "home index.md missing permalink: /"; return 1; }

    # _config.yml should have been seeded with lang.
    grep -Eq '^lang\s*:\s*"?en"?' "$ws/_config.yml" \
        || { test_log_error "_config.yml lang not seeded"; return 1; }

    return 0
}

main() {
    test_log_info "===== Install Scrape Test Suite ====="

    if [[ ! -x "$INSTALL_BIN" ]]; then
        test_log_error "Installer not found: $INSTALL_BIN"
        exit 127
    fi

    if ! command -v python3 >/dev/null 2>&1; then
        skip_test "test_scrape_standalone" "python3 not available"
        skip_test "test_scrape_init_integration" "python3 not available"
        print_test_summary
        return 0
    fi
    if ! command -v curl >/dev/null 2>&1; then
        skip_test "test_scrape_standalone" "curl not available"
        skip_test "test_scrape_init_integration" "curl not available"
        print_test_summary
        return 0
    fi

    set +e
    run_test "scrape_standalone"       test_scrape_standalone       scrape
    run_test "scrape_init_integration" test_scrape_init_integration scrape
    set -e

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
