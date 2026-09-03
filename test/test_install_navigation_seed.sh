#!/usr/bin/env bash
# =============================================================================
# Installer e2e — seeded navigation data must belong to the CONSUMER
# =============================================================================
#
# Regression: #332.
#
# install.sh used to copy the theme's entire _data/ into every consumer, so the
# consumer's "own" _data/navigation/*.yml was a byte-for-byte copy of the
# theme's -- carrying the theme's page taxonomy. The sidebar renderer then
# faithfully rendered links to /docs/liquid/, /docs/docker/, /docs/features/...,
# none of which exist on a consumer site. htmlproofer on lifehacker.dev reported
# ~47 broken internal links per doc page, ~1,598 across ~34 docs, and no
# content author could remove a single one.
#
# Measured on a real install before the fix: 106 of 129 seeded navigation URLs
# pointed at pages the installer does not create. After: 0 of 26.
#
# The renderer was never at fault -- `nav: tree` already resolves through
# `auto` -> page.collection -> site.data.navigation[collection], and _data is
# not part of Jekyll's theme payload, so site.data is always the consumer's.
# The defect was one level up, at seed time. This test therefore asserts on the
# INSTALLED FILES, not on rendered HTML.
#
# Run: ./test/test_install_navigation_seed.sh
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_SH="$PROJECT_ROOT/install.sh"

# shellcheck source=lib/install_test_utils.sh
source "$SCRIPT_DIR/lib/install_test_utils.sh"
setup_cleanup_trap

NAV_FILES="main docs about admin home posts quickstart"

# Paths that only exist in the THEME's own site. If one of these is seeded into
# a consumer it is a dead link there, by construction.
THEME_ONLY_PATHS="/docs/liquid/ /docs/docker/ /docs/ruby/ /docs/jekyll/ /docs/features/ /docs/customization/ /docs/deployment/ /news/ /authors/ /about/stats/"

install_fresh() {
    local ws="$1"
    bash "$INSTALL_SH" "$ws" </dev/null >/dev/null 2>&1
}

# --- the regression itself -------------------------------------------------
test_no_theme_taxonomy_in_seeded_nav() {
    local ws; ws=$(create_test_workspace "nav-seed")
    install_fresh "$ws" || { test_log_error "install failed"; return 1; }

    local rc=0 nav path hits
    for nav in $NAV_FILES; do
        local f="$ws/_data/navigation/${nav}.yml"
        [[ -f "$f" ]] || continue
        for path in $THEME_ONLY_PATHS; do
            # Match a url: value only -- prose in a comment is not a link.
            hits=$(grep -c "^[[:space:]]*url:[[:space:]]*${path}" "$f" 2>/dev/null || true)
            [[ -z "$hits" ]] && hits=0
            if [[ "$hits" -gt 0 ]]; then
                test_log_error "${nav}.yml seeds ${hits} link(s) to ${path}, which does not exist on a consumer site"
                rc=1
            fi
        done
    done
    return $rc
}

# The literal check named in the issue's acceptance criteria.
test_acceptance_no_docs_features_links() {
    local ws; ws=$(create_test_workspace "nav-acceptance")
    install_fresh "$ws" || { test_log_error "install failed"; return 1; }

    local f="$ws/_data/navigation/docs.yml"
    assert_file_exists "$f" "docs.yml should be seeded" || return 1
    assert_file_not_contains "$f" "/docs/features/" \
        "a freshly installed consumer must not inherit the theme's docs taxonomy" || return 1
    return 0
}

# --- the positive half: the seed must still be USEFUL -----------------------
test_seeded_nav_is_present_and_nonempty() {
    local ws; ws=$(create_test_workspace "nav-present")
    install_fresh "$ws" || { test_log_error "install failed"; return 1; }

    local rc=0 nav
    for nav in $NAV_FILES; do
        local f="$ws/_data/navigation/${nav}.yml"
        assert_file_exists "$f" "${nav}.yml should be seeded" || { rc=1; continue; }
        if ! grep -q "^[[:space:]]*url:" "$f"; then
            test_log_error "${nav}.yml seeds no links at all -- an empty sidebar is not a fix"
            rc=1
        fi
    done
    return $rc
}

# A consumer who edited their navigation must keep it. create_from_template
# skips an existing file, and holding navigation/ back from the _data copy is
# what lets that protection actually apply.
test_reinstall_preserves_consumer_navigation() {
    local ws; ws=$(create_test_workspace "nav-preserve")
    install_fresh "$ws" || { test_log_error "first install failed"; return 1; }

    local f="$ws/_data/navigation/docs.yml"
    printf '# consumer-owned\n- title: My Handbook\n  url: /handbook/\n' > "$f"

    install_fresh "$ws" || { test_log_error "second install failed"; return 1; }

    assert_file_contains "$f" "My Handbook" \
        "a re-run must not overwrite navigation the consumer edited" || return 1
    return 0
}

main() {
    test_log_info "Installer navigation seeding (issue #332)"

    run_test "no_theme_taxonomy_in_seeded_nav"    test_no_theme_taxonomy_in_seeded_nav    nav
    run_test "acceptance_no_docs_features_links"  test_acceptance_no_docs_features_links  nav
    run_test "seeded_nav_is_present_and_nonempty" test_seeded_nav_is_present_and_nonempty nav
    run_test "reinstall_preserves_consumer_nav"   test_reinstall_preserves_consumer_navigation nav

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
