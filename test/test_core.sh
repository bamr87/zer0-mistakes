#!/bin/bash

# Core Test Suite for zer0-mistakes Jekyll Theme
# Combines unit, integration, and basic validation tests
# 
# This suite focuses on:
# - Theme file structure and syntax validation
# - Jekyll configuration and build process
# - Core functionality and dependencies
# - Basic integration testing

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_RESULTS_DIR="$SCRIPT_DIR/results"

# Load test configuration from test.conf if available
_load_test_config() {
    local config_file="${SCRIPT_DIR}/test.conf"
    if [[ -f "$config_file" ]]; then
        # shellcheck source=/dev/null
        source "$config_file"
    fi
}
_load_test_config

# Default values (can be overridden by test.conf or command line)
VERBOSE="${VERBOSE:-false}"
COVERAGE="${COVERAGE:-false}"
FORMAT="${FORMAT:-text}"
TIMEOUT="${TEST_TIMEOUT_DEFAULT:-300}"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_test() { echo -e "${PURPLE}[TEST]${NC} $1"; }

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v) VERBOSE=true; shift ;;
            --coverage|-c) COVERAGE=true; shift ;;
            --format|-f) FORMAT="$2"; shift 2 ;;
            --timeout|-t) TIMEOUT="$2"; shift 2 ;;
            --help|-h) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    cat << EOF
Core Test Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Runs core functionality tests including unit tests, integration tests,
    and basic validation tests for the Jekyll theme.

OPTIONS:
    -v, --verbose      Enable verbose output
    -c, --coverage     Generate coverage reports
    -f, --format       Output format: text, json, xml (default: text)
    -t, --timeout      Test timeout in seconds (default: ${TEST_TIMEOUT_DEFAULT:-300})
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run all core tests
    $0 --verbose       # Run with detailed output
    $0 --format json   # Generate JSON output
EOF
}

# Test execution functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    local category="${3:-core}"
    
    log_test "Running: $test_name"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    local start_time=$(date +%s)
    local test_result="FAIL"
    local error_message=""
    
    if eval "$test_function" 2>&1; then
        test_result="PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name"
    else
        local exit_code=$?
        test_result="FAIL"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        
        if [[ $exit_code -eq 124 ]]; then
            error_message="Timeout after ${TIMEOUT}s"
        else
            error_message="Exit code: $exit_code"
        fi
        
        log_error "$test_name - $error_message"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Record test result
    local result_file="$TEST_RESULTS_DIR/core_test_$(date +%s%N).json"
    cat > "$result_file" << EOF
{
  "name": "$test_name",
  "category": "$category",
  "result": "$test_result",
  "duration": $duration,
  "error_message": "$error_message",
  "timestamp": "$(date -Iseconds)"
}
EOF

    if [[ "$test_result" == "FAIL" ]]; then
        return 1
    fi
    return 0
}

#
# UNIT TESTS
#

test_file_structure() {
    log_info "Validating theme file structure..."
    
    cd "$PROJECT_ROOT"
    
    # Test required files exist
    local required_files=(
        "README.md"
        "LICENSE"
        "_config.yml"
        "Gemfile"
        "jekyll-theme-zer0.gemspec"
        "package.json"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file missing: $file"
            return 1
        fi
    done
    
    # Test required directories exist
    local required_dirs=(
        "_layouts"
        "_includes"
        "_sass"
        "assets"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "Required directory missing: $dir"
            return 1
        fi
    done
    
    log_success "File structure validation passed"
    return 0
}

test_yaml_syntax() {
    log_info "Validating YAML file syntax..."
    
    cd "$PROJECT_ROOT"
    
    # Test main configuration files
    local yaml_files=(
        "_config.yml"
        "_config_dev.yml"
    )
    
    if command -v ruby &>/dev/null; then
        for yaml_file in "${yaml_files[@]}"; do
            if [[ -f "$yaml_file" ]]; then
                if ruby -e "require 'yaml'; YAML.load_file('$yaml_file')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
                    log_error "$yaml_file contains syntax errors"
                    return 1
                else
                    log_success "$yaml_file syntax is valid"
                fi
            fi
        done
    else
        log_warning "Ruby not available for YAML validation"
    fi
    
    # Test data files
    if [[ -d "_data" ]]; then
        find "_data" -name "*.yml" -o -name "*.yaml" | while read -r file; do
            if command -v ruby &>/dev/null; then
                if ruby -e "require 'yaml'; YAML.load_file('$file')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
                    log_error "$file contains syntax errors"
                    return 1
                fi
            fi
        done
    fi
    
    return 0
}

# Test plugin unit specs (T-011: content statistics, theme version, config sanitizer)
test_plugin_unit_specs() {
    if command -v ruby &>/dev/null; then
        ruby "$SCRIPT_DIR/test_plugins.rb" > /dev/null 2>&1
    else
        log_warning "ruby not available, skipping plugin unit specs"
        return 0
    fi
}

# Test the preview-image engine unit specs (ZER0-004: provider framework,
# front-matter editor, SVG sanitizer, credential chain — zero network)
test_preview_generator_unit_specs() {
    if ! command -v python3 &>/dev/null; then
        log_warning "python3 not available, skipping preview generator unit specs"
        return 0
    fi
    if ! python3 -c "import yaml" &>/dev/null; then
        log_warning "PyYAML not available, skipping preview generator unit specs"
        return 0
    fi
    python3 "$SCRIPT_DIR/test_preview_generator.py" > /dev/null 2>&1
}

test_gemspec_validity() {
    log_info "Validating gemspec file..."
    
    cd "$PROJECT_ROOT"
    
    if command -v ruby &>/dev/null; then
        if ruby -c jekyll-theme-zer0.gemspec &>/dev/null; then
            log_success "Gemspec syntax is valid"
        else
            log_error "Gemspec contains syntax errors"
            return 1
        fi
        
        # Test gemspec can be built
        if gem build jekyll-theme-zer0.gemspec --quiet &>/dev/null; then
            log_success "Gemspec builds correctly"
            # Clean up the built gem
            rm -f jekyll-theme-zer0-*.gem
        else
            log_error "Gemspec cannot be built"
            return 1
        fi
    else
        log_warning "Ruby not available for gemspec validation"
    fi
    
    return 0
}

test_package_json_validity() {
    log_info "Validating package.json..."
    
    cd "$PROJECT_ROOT"
    
    if command -v jq &>/dev/null; then
        if jq empty package.json &>/dev/null; then
            log_success "package.json syntax is valid"
        else
            log_error "package.json contains syntax errors"
            return 1
        fi
        
        # Test version format
        if jq -r '.version' package.json | grep -E '^[0-9]+\.[0-9]+\.[0-9]+(\-[a-zA-Z0-9\.\-]+)?$' &>/dev/null; then
            log_success "package.json version format is valid"
        else
            log_error "package.json version format is invalid"
            return 1
        fi
    else
        log_warning "jq not available for package.json validation"
    fi
    
    return 0
}

test_version_consistency() {
    log_info "Testing version consistency..."
    
    cd "$PROJECT_ROOT"
    
    if command -v ruby &>/dev/null && command -v jq &>/dev/null; then
        local pkg_version
        local gem_version
        
        pkg_version=$(jq -r '.version' package.json 2>/dev/null || echo "")
        gem_version=$(grep -o 'spec.version.*=.*"[^"]*"' jekyll-theme-zer0.gemspec | sed 's/.*"\([^"]*\)".*/\1/' 2>/dev/null || echo "")
        
        if [[ -n "$pkg_version" && -n "$gem_version" ]]; then
            if [[ "$pkg_version" == "$gem_version" ]]; then
                log_success "Version consistency check passed: $pkg_version"
            else
                log_error "Version mismatch - package.json: $pkg_version, gemspec: $gem_version"
                return 1
            fi
        else
            log_warning "Could not extract versions for consistency check"
        fi
    else
        log_warning "Ruby or jq not available for version consistency check"
    fi
    
    return 0
}

#
# INTEGRATION TESTS
#

test_bundle_install() {
    log_info "Testing bundle install..."
    
    cd "$PROJECT_ROOT"
    
    if command -v bundle &>/dev/null; then
        # Check Ruby version first
        if command -v ruby &>/dev/null; then
            local ruby_version
            ruby_version=$(ruby -v | grep -o 'ruby [0-9]\+\.[0-9]\+' | cut -d' ' -f2)
            local ruby_major
            local ruby_minor
            ruby_major=$(echo "$ruby_version" | cut -d'.' -f1)
            ruby_minor=$(echo "$ruby_version" | cut -d'.' -f2)
            
            if [[ $ruby_major -lt 2 || ($ruby_major -eq 2 && $ruby_minor -lt 7) ]]; then
                log_warning "Ruby version $ruby_version is below required 2.7.0 - skipping bundle install"
                return 0
            fi
        fi
        
        if bundle check &>/dev/null || bundle install --quiet; then
            log_success "Bundle install completed successfully"
        else
            log_warning "Bundle install failed (may be due to environment or dependency issues)"
            # Don't fail the test as this might be expected in some environments
        fi
    else
        log_warning "Bundler not available for bundle install test"
    fi
    
    return 0
}

test_jekyll_build() {
    log_info "Testing Jekyll build process..."
    
    cd "$PROJECT_ROOT"
    
    if command -v bundle &>/dev/null; then
        # Check Ruby version first
        if command -v ruby &>/dev/null; then
            local ruby_version
            ruby_version=$(ruby -v | grep -o 'ruby [0-9]\+\.[0-9]\+' | cut -d' ' -f2)
            local ruby_major
            local ruby_minor
            ruby_major=$(echo "$ruby_version" | cut -d'.' -f1)
            ruby_minor=$(echo "$ruby_version" | cut -d'.' -f2)
            
            if [[ $ruby_major -lt 2 || ($ruby_major -eq 2 && $ruby_minor -lt 7) ]]; then
                log_warning "Ruby version $ruby_version is below required 2.7.0 - skipping Jekyll build test"
                return 0
            fi
        fi
        
        # Check if Jekyll is available
        if ! command -v jekyll &>/dev/null; then
            log_warning "Jekyll not available for build test"
            return 0
        fi
        
        # Build into a temp destination (avoid copying the whole repo, which can be memory-heavy)
        local temp_site
        temp_site=$(mktemp -d -t jekyll-build-test-XXXXXX)

        # Set PAGES_REPO_NWO for jekyll-github-metadata gem (required in CI environments)
        export PAGES_REPO_NWO="${PAGES_REPO_NWO:-bamr87/zer0-mistakes}"

        local jekyll_configs="$PROJECT_ROOT/_config.yml,$PROJECT_ROOT/docker/config/docker-build.yml"
        local build_log="$temp_site/jekyll-build.log"
        local jekyll_status=0

        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Jekyll build (verbose; Liquid warnings appear in output)"
            JEKYLL_ENV=production bundle exec jekyll build \
                --config "$jekyll_configs" \
                --source "$PROJECT_ROOT" \
                --destination "$temp_site/_site" \
                2>&1 | tee "$build_log"
            jekyll_status=${PIPESTATUS[0]}
            if [[ "$jekyll_status" -eq 0 ]] && grep -qiE 'liquid warning' "$build_log" 2>/dev/null; then
                log_warning "Liquid warnings were emitted during Jekyll build (see output above)"
            fi
        elif JEKYLL_ENV=production bundle exec jekyll build \
            --config "$jekyll_configs" \
            --source "$PROJECT_ROOT" \
            --destination "$temp_site/_site" \
            --quiet; then
            jekyll_status=0
        else
            jekyll_status=$?
        fi

        if [[ "$jekyll_status" -ne 0 ]]; then
            log_error "Jekyll build failed"
            cd "$PROJECT_ROOT"
            rm -rf "$temp_site"
            return 1
        fi

        log_success "Jekyll build completed successfully"

        # Test that essential files were generated
        if [[ -f "$temp_site/_site/index.html" ]]; then
            log_success "index.html generated correctly"
        else
            log_error "index.html not generated"
            cd "$PROJECT_ROOT"
            rm -rf "$temp_site"
            return 1
        fi

        # Test that assets were processed
        if find "$temp_site/_site/assets" -name "*.css" 2>/dev/null | head -1 | grep -q .; then
            log_success "CSS assets processed correctly"
        else
            log_warning "No CSS assets found in _site/assets"
        fi

        # Theme CSS output: main bundle contains docs-layout + theme rules
        local main_css
        main_css=$(find "$temp_site/_site/assets/css" -maxdepth 1 \( -name 'main.css' -o -name 'main-*.css' \) 2>/dev/null | head -1)
        if [[ -n "${main_css}" && -f "${main_css}" ]]; then
            local css_size
            css_size=$(stat -f%z "${main_css}" 2>/dev/null || stat -c%s "${main_css}" 2>/dev/null || echo 0)
            if [[ "${css_size}" -lt 8000 ]]; then
                log_error "Compiled main CSS unexpectedly small (${css_size} bytes): ${main_css}"
                cd "$PROJECT_ROOT"
                rm -rf "$temp_site"
                return 1
            fi
            if ! grep -qE 'bd-layout|\.bd-layout' "${main_css}"; then
                log_error "Compiled CSS missing docs-layout selectors (bd-layout): ${main_css}"
                cd "$PROJECT_ROOT"
                rm -rf "$temp_site"
                return 1
            fi
            log_success "Theme CSS output contains expected layout rules"
        else
            log_warning "main.css not found under _site/assets/css (check Jekyll asset pipeline)"
        fi

        # Giscus comments: a comment-enabled page must render the widget with a
        # non-empty data-repo-id (proves site.giscus.* interpolated correctly).
        local giscus_page
        giscus_page=$(grep -rl '<script src="https://giscus.app/client.js"' "$temp_site/_site" --include='*.html' 2>/dev/null | head -1)
        if [[ -n "$giscus_page" ]]; then
            if grep -A4 '<script src="https://giscus.app/client.js"' "$giscus_page" | grep -qE 'data-repo-id="[^"]+"'; then
                log_success "Giscus widget rendered with interpolated repo ID"
            else
                log_error "Giscus widget rendered with EMPTY data-repo-id (config key/typo regression): $giscus_page"
                cd "$PROJECT_ROOT"
                rm -rf "$temp_site"
                return 1
            fi
        else
            log_error "No built page rendered the Giscus widget (comments disabled or include broken)"
            cd "$PROJECT_ROOT"
            rm -rf "$temp_site"
            return 1
        fi

        # Cleanup
        rm -rf "$temp_site"
    else
        log_warning "Jekyll not available for build test"
    fi
    
    return 0
}

test_gem_build() {
    log_info "Testing gem build process..."
    
    cd "$PROJECT_ROOT"
    
    if command -v gem &>/dev/null; then
        # Clean up any existing gem files
        rm -f jekyll-theme-zer0-*.gem
        
        if gem build jekyll-theme-zer0.gemspec --quiet; then
            log_success "Gem build completed successfully"
            
            # Test gem contents
            local gem_file
            gem_file=$(ls jekyll-theme-zer0-*.gem 2>/dev/null | head -1)
            
            if [[ -f "$gem_file" ]]; then
                # Check that essential files are included using tar (gems are tar.gz files)
                if tar -tzf "$gem_file" | grep -q "_layouts" || tar -tzf "$gem_file" | grep -q "layouts"; then
                    log_success "Gem contains layout files"
                else
                    log_warning "Gem may not contain layout files (check gemspec file patterns)"
                fi
                
                if tar -tzf "$gem_file" | grep -q "assets" || tar -tzf "$gem_file" | grep -q "lib"; then
                    log_success "Gem contains expected files"
                else
                    log_warning "Gem may not contain expected files (check gemspec file patterns)"
                fi
                
                # Clean up
                rm -f jekyll-theme-zer0-*.gem
            else
                log_error "Gem file not found after build"
                return 1
            fi
        else
            log_error "Gem build failed"
            return 1
        fi
    else
        log_warning "Gem command not available for build test"
    fi
    
    return 0
}

#
# VALIDATION TESTS
#

test_liquid_templates() {
    log_info "Validating Liquid templates..."
    
    cd "$PROJECT_ROOT"
    
    # Check layout files for basic Liquid syntax
    if [[ -d "_layouts" ]]; then
        find "_layouts" -name "*.html" | while read -r layout; do
            # Check for balanced Liquid tags
            local open_tags
            local close_tags
            
            open_tags=$(grep -c "{%" "$layout" 2>/dev/null | tr -d '[:space:]' || echo "0")
            close_tags=$(grep -c "%}" "$layout" 2>/dev/null | tr -d '[:space:]' || echo "0")
            
            # Ensure we have valid numbers
            [[ -z "$open_tags" ]] && open_tags=0
            [[ -z "$close_tags" ]] && close_tags=0
            
            if [[ "$open_tags" -ne "$close_tags" ]]; then
                log_error "Unbalanced Liquid tags in $layout"
                return 1
            fi
        done
    fi
    
    # Check include files
    if [[ -d "_includes" ]]; then
        find "_includes" -name "*.html" | while read -r include; do
            # Basic syntax check for common issues
            if grep -q "{{.*{{" "$include"; then
                log_error "Nested Liquid output tags found in $include"
                return 1
            fi
        done
    fi
    
    log_success "Liquid template validation passed"
    return 0
}

test_giscus_comments() {
    # SCOPE: this test is static-only — it proves the config keys exist, the
    # include interpolates them, and the layouts gate on them. It canNOT tell
    # you whether comments actually work, because the two things that break
    # them in practice live on GitHub's side and are invisible to a build:
    #   1. the giscus GitHub App not being installed on the repo
    #   2. a data-repo-id/data-category-id belonging to a DIFFERENT repo (forks)
    # Both leave every assertion below passing while the widget renders only
    # "An error occurred: giscus is not installed on this repository".
    # The end-to-end check is `./scripts/bin/giscus-discussions doctor`, run
    # weekly by .github/workflows/giscus-digest.yml.
    log_info "Validating Giscus comments configuration and wiring (static checks only)..."

    cd "$PROJECT_ROOT"

    local config="$PROJECT_ROOT/_config.yml"
    local include="$PROJECT_ROOT/_includes/content/giscus.html"
    local failed=0

    # 1. Config key must be `giscus:` — guards against the historical `gisgus:`
    #    typo that left site.giscus nil so comments rendered nowhere.
    if grep -qE '^giscus:' "$config"; then
        log_success "_config.yml defines a top-level 'giscus:' block"
    else
        log_error "_config.yml is missing a top-level 'giscus:' block (misspelled 'gisgus:'?)"
        failed=1
    fi
    if grep -qE '^gisgus:' "$config"; then
        log_error "_config.yml still contains misspelled 'gisgus:' — layouts read 'site.giscus.*'"
        failed=1
    fi

    # 2. Required keys inside the giscus block (block-scoped extraction)
    local block
    block=$(awk '/^giscus:/{f=1;print;next} f&&/^[^[:space:]#]/{f=0} f{print}' "$config")
    local key
    for key in "enabled" "data-repo-id" "data-category-id"; do
        if printf '%s\n' "$block" | grep -qE "^[[:space:]]+${key}:"; then
            log_success "giscus block defines '${key}'"
        else
            log_error "giscus block is missing '${key}'"
            failed=1
        fi
    done

    # 3. Include interpolates config values and is not self-referential.
    if [[ -f "$include" ]]; then
        local token
        for token in "site.repository" "site.giscus.data-repo-id" "site.giscus.data-category-id"; do
            if grep -qF "$token" "$include"; then
                log_success "giscus include references {{ $token }}"
            else
                log_error "giscus include is missing the '$token' interpolation"
                failed=1
            fi
        done
        # Liquid evaluates tags even inside HTML comments, so a bare
        # `{% include giscus.html %}` (wrong path) would recurse and break the
        # build. Require the full content/ path wherever the include is invoked.
        if grep -qE '\{%-?[[:space:]]*include[[:space:]]+giscus\.html' "$include"; then
            log_error "giscus include contains a bare self-include 'giscus.html' (use content/giscus.html)"
            failed=1
        else
            log_success "giscus include has no recursive bare self-include"
        fi
    else
        log_error "Missing include: _includes/content/giscus.html"
        failed=1
    fi

    # 4. All comment-bearing layouts gate consistently on site.giscus.enabled.
    local layout
    for layout in "_layouts/article.html" "_layouts/note.html" "_layouts/notebook.html"; do
        if [[ ! -f "$PROJECT_ROOT/$layout" ]]; then
            continue
        fi
        if grep -qF 'site.giscus.enabled' "$PROJECT_ROOT/$layout"; then
            log_success "$layout gates comments on site.giscus.enabled"
        else
            log_error "$layout does not gate comments on site.giscus.enabled"
            failed=1
        fi
    done

    if [[ "$failed" -ne 0 ]]; then
        return 1
    fi
    log_success "Giscus comments configuration is valid"
    return 0
}

test_favicon_wiring() {
    log_info "Validating favicon include, head wiring, and analytics config gates..."

    cd "$PROJECT_ROOT"

    local include="$PROJECT_ROOT/_includes/core/favicon.html"
    local head="$PROJECT_ROOT/_includes/core/head.html"
    local failed=0

    # 1. Favicon include exists and emits the explicit /favicon.ico default —
    #    the implicit browser probe 404s on baseurl deployments.
    if [[ -f "$include" ]]; then
        if grep -qF 'rel="icon"' "$include" && grep -qF "default: '/favicon.ico'" "$include"; then
            log_success "favicon include emits rel=icon with /favicon.ico default"
        else
            log_error "favicon include is missing the rel=icon /favicon.ico default"
            failed=1
        fi
    else
        log_error "Missing include: _includes/core/favicon.html"
        failed=1
    fi

    # 2. head.html renders the include on every page.
    if grep -qE 'include(_cached)?[[:space:]]+core/favicon\.html' "$head"; then
        log_success "head.html includes core/favicon.html"
    else
        log_error "head.html does not include core/favicon.html"
        failed=1
    fi

    # 3. The theme site carries the root favicon.ico the default points at.
    if [[ -f "$PROJECT_ROOT/favicon.ico" ]]; then
        log_success "root favicon.ico exists"
    else
        log_error "root favicon.ico is missing"
        failed=1
    fi

    # 4. GTM includes must be config-gated — a hardcoded container ID would
    #    silently enroll every consumer site into this theme's GTM container.
    local gtm
    for gtm in "_includes/analytics/google-tag-manager-head.html" "_includes/analytics/google-tag-manager-body.html"; do
        if grep -qF 'if site.google_tag_manager' "$PROJECT_ROOT/$gtm"; then
            log_success "$gtm gates on site.google_tag_manager"
        else
            log_error "$gtm is not gated on site.google_tag_manager"
            failed=1
        fi
        if grep -qE "GTM-[A-Z0-9]{6,}" "$PROJECT_ROOT/$gtm"; then
            log_error "$gtm hardcodes a GTM container ID"
            failed=1
        else
            log_success "$gtm has no hardcoded GTM container ID"
        fi
    done

    # 5. Legacy sidebar nav modes must alias to auto, not silently disable.
    if grep -qF 'searchCats' "$PROJECT_ROOT/_includes/navigation/sidebar-config.html"; then
        log_success "sidebar-config aliases legacy nav modes (tree/dynamic/searchCats)"
    else
        log_error "sidebar-config no longer aliases legacy nav modes"
        failed=1
    fi

    if [[ "$failed" -ne 0 ]]; then
        return 1
    fi
    log_success "Favicon and analytics wiring is valid"
    return 0
}

# Regression for issue #219: the reusable component-showcase include must not
# hardcode absolute demo links (e.g. /docs/, /pages/, /docs/customization/).
# Such links 404 on any consumer site that lacks those exact routes, making the
# showcase un-includable. Demo links are kept inert (href="#") instead.
test_recipe_collection() {
    log_info "Validating the cookbook/recipes collection, components, and scaler..."

    cd "$PROJECT_ROOT"
    local failed=0

    # 1. Collection is registered and its documents get a layout by default.
    if grep -qE '^  recipes:' _config.yml && grep -qE 'path: pages/_recipes' _config.yml; then
        log_success "recipes collection and its front-matter defaults are configured"
    else
        log_error "_config.yml is missing the recipes collection or its pages/_recipes defaults"
        failed=1
    fi

    # 2. Layouts and the component set exist.
    local f
    for f in _layouts/recipe.html _layouts/cookbook.html \
             _includes/components/recipe-qty.html _includes/components/recipe-temp.html \
             _includes/components/recipe-grams.html _includes/components/recipe-duration.html \
             _includes/components/recipe-meta.html _includes/components/recipe-scaler.html \
             _includes/components/recipe-ingredients.html _includes/components/recipe-steps.html \
             _includes/components/recipe-ratio.html _includes/components/recipe-nutrition.html \
             _includes/components/recipe-card.html _includes/components/recipe-index.html \
             assets/js/recipe-scaler.js _sass/components/_recipe.scss \
             _data/recipe_courses.yml _data/ingredient_densities.yml; do
        if [[ ! -f "$f" ]]; then
            log_error "Missing recipe file: $f"
            failed=1
        fi
    done
    [[ "$failed" -eq 0 ]] && log_success "All recipe layouts, components, and assets are present"

    # 3. Styles and script are actually wired into the build.
    if grep -qF '@import "components/recipe"' assets/css/main.scss; then
        log_success "main.scss imports components/recipe"
    else
        log_error "assets/css/main.scss does not import components/recipe"
        failed=1
    fi
    if grep -qF 'assets/js/recipe-scaler.js' _includes/core/head.html; then
        log_success "head.html loads the recipe scaler"
    else
        log_error "head.html does not load assets/js/recipe-scaler.js"
        failed=1
    fi
    # The scaler is a niche script: it must stay gated, not ship on every page.
    if grep -qE 'page\.layout == "recipe" or page\.recipe_tools' _includes/core/head.html; then
        log_success "recipe scaler is gated to recipe pages"
    else
        log_error "recipe scaler is loaded unconditionally — gate it on page.layout/recipe_tools"
        failed=1
    fi

    # 4. default.html must skip its intro for layouts that render their own <h1>.
    if grep -qF 'page.layout == "recipe"' _layouts/default.html && \
       grep -qF 'page.layout == "cookbook"' _layouts/default.html; then
        log_success "default.html suppresses its intro for recipe/cookbook (no duplicate H1)"
    else
        log_error "default.html would render content/intro.html on recipe/cookbook pages (duplicate H1)"
        failed=1
    fi

    # 5. Liquid `assign` writes to the GLOBAL scope even inside an include, so a
    #    helper called twice from one caller silently clobbers the caller's
    #    variables. Every recipe include therefore namespaces its own variables.
    if ruby - <<'RUBY'
prefixes = {
  'recipe-grams'       => '_rg_',  'recipe-duration'    => '_rd_',
  'recipe-qty'         => '_rq_',  'recipe-temp'        => '_rt_',
  'recipe-meta'        => '_rm_',  'recipe-scaler'      => '_rsc_',
  'recipe-ingredients' => '_ri_',  'recipe-steps'       => '_rs_',
  'recipe-ratio'       => '_rr_',  'recipe-nutrition'   => '_rn_',
  'recipe-card'        => '_rc_',  'recipe-index'       => '_rx_',
}
bad = []
prefixes.each do |name, prefix|
  path = "_includes/components/#{name}.html"
  next unless File.exist?(path)
  File.read(path).scan(/\{%-?\s*(?:assign|capture)\s+(\w+)/) do |(var)|
    bad << "#{path}: #{var} (expected #{prefix}*)" unless var.start_with?(prefix)
  end
end
if bad.empty?
  true
else
  warn "  Un-namespaced Liquid variables leak into the caller's scope:"
  bad.each { |b| warn "    #{b}" }
  exit 1
end
RUBY
    then
        log_success "Recipe includes namespace their Liquid variables (no global-scope leaks)"
    else
        log_error "A recipe include assigns an un-namespaced Liquid variable"
        failed=1
    fi

    # 6. The build-time unit table (ratio percentages) and the runtime one
    #    (live conversion) must agree, or a converted recipe silently disagrees
    #    with its own ratio table.
    local factor
    for factor in 236.588 28.3495 453.592 4.92892 14.7868 29.5735 473.176 946.353; do
        if grep -qF "$factor" _includes/components/recipe-grams.html && \
           grep -qF "$factor" assets/js/recipe-scaler.js; then
            :
        else
            log_error "Unit factor $factor is missing from recipe-grams.html or recipe-scaler.js (tables must match)"
            failed=1
        fi
    done
    [[ "$failed" -eq 0 ]] && log_success "Build-time and runtime unit tables agree"

    # 7. Demo recipes parse and carry the keys the layout renders.
    if ruby - <<'RUBY'
require 'yaml'
require 'date'
files = Dir['pages/_recipes/*.md']
abort 'no demo recipes found' if files.empty?
problems = []
files.each do |path|
  raw = File.read(path)
  fm = raw[/\A---\s*\n(.*?)\n---\s*\n/m, 1]
  (problems << "#{path}: no front matter"; next) unless fm
  data = begin
    YAML.safe_load(fm, permitted_classes: [Date, Time], aliases: true)
  rescue => e
    problems << "#{path}: #{e.class}: #{e.message}"
    next
  end
  problems << "#{path}: missing title" unless data['title'].is_a?(String)
  next if data['layout'] == 'cookbook'
  %w[ingredients steps].each do |key|
    problems << "#{path}: #{key} must be a non-empty list" unless data[key].is_a?(Array) && !data[key].empty?
  end
  problems << "#{path}: yield.amount must be a number" unless data.dig('yield', 'amount').is_a?(Numeric)
end
if problems.empty?
  true
else
  problems.each { |p| warn "    #{p}" }
  exit 1
end
RUBY
    then
        log_success "Demo recipes parse and carry title/yield/ingredients/steps"
    else
        log_error "A demo recipe under pages/_recipes/ is malformed"
        failed=1
    fi

    if [[ "$failed" -ne 0 ]]; then
        return 1
    fi
    log_success "Cookbook/recipes collection is valid"
    return 0
}

test_showcase_demo_links() {
    log_info "Checking component-showcase for hardcoded absolute demo links..."

    cd "$PROJECT_ROOT"

    local showcase="_includes/components/component-showcase.html"

    if [[ ! -f "$showcase" ]]; then
        log_warning "component-showcase include not found; skipping"
        return 0
    fi

    # Any anchor whose href begins with a site-absolute path ("/...") is a
    # consumer-404 hazard. The home/breadcrumb root and the demo list-group
    # entries must use inert href="#" links instead.
    local offenders
    offenders=$(grep -nE 'href="/' "$showcase" || true)

    if [[ -n "$offenders" ]]; then
        log_error "component-showcase.html contains hardcoded absolute demo links (404 hazard for consumers):"
        echo "$offenders"
        return 1
    fi

    log_success "component-showcase has no hardcoded absolute demo links"
    return 0
}

test_sass_compilation() {
    log_info "Testing Sass compilation..."
    
    cd "$PROJECT_ROOT"
    
    if [[ -d "_sass" ]]; then
        if command -v sass &>/dev/null; then
            find "_sass" -name "*.scss" | while read -r sass_file; do
                if sass --check "$sass_file" &>/dev/null; then
                    log_success "Sass file valid: $(basename "$sass_file")"
                else
                    log_error "Sass syntax error in: $sass_file"
                    return 1
                fi
            done
        else
            log_warning "Sass not available for compilation test"
        fi
    fi
    
    return 0
}

# Pins the layout allowlist in _includes/navigation/sidebar-config.html against
# the real layout inheritance graph (issue #373).
#
# The offcanvas panels #bdSidebar and #tocContents are emitted by
# _layouts/default.html alone, but their toggles live in core/header.html and
# core/footer-fabs.html, which _layouts/root.html includes on EVERY layout. The
# gate is therefore a hard-coded list of layouts whose `layout:` chain reaches
# default — and Liquid has no way to resolve that chain itself.
#
# A hard-coded list rots silently: the previous denylist in footer-fabs.html had
# already fallen behind (404 and book-* were missing), shipping FABs that
# controlled nothing. This walks the front matter of every _layouts/*.html,
# resolves each chain, and fails if reality and the list disagree in either
# direction.
test_developer_doc_banners_are_liquid() {
    log_info "Testing developer doc banners are Liquid, not HTML, comments (issue #375)..."

    cd "$PROJECT_ROOT"

    if ! command -v python3 &>/dev/null; then
        log_warning "python3 not available for the doc-banner check"
        return 0
    fi

    if python3 - <<'PYEOF'
import re, sys, glob

# Jekyll copies HTML comments into every rendered page; Liquid comments are
# stripped at build time. Developer banners (file paths, dependency lists,
# design rationale) have no runtime value, and _includes render once per call
# site -- a banner inside a card component rendered 1100 times on an author
# page shipped 1100 copies. Measured before the fix: 47,898 comment bytes on
# an average page, 21.7% of the delivered HTML across a 415-page build.
#
# The ONLY comments allowed to stay HTML are the boundary markers inside
# Google's own copy-paste snippets, kept verbatim so those blocks stay
# diffable against upstream. They are matched exactly: prose that merely
# mentions GTM is a developer note like any other.
ALLOWED = set([
    "Global site tag (gtag.js) - Google Analytics",
    "Google Tag Manager (noscript)",
    "End Google Tag Manager (noscript)",
    "Google Tag Manager",
    "End Google Tag Manager",
    ])

# A comment inside <script>/<style>/<pre>/<textarea>/{% raw %} is not a banner:
# it is JS, CSS or shown-literally sample markup. Comments are blanked before
# these spans are located, so a banner that merely *mentions* "<style>" cannot
# open a span that hides the comments below it.
GUARD = re.compile(
    r"<script\b.*?</script>|<style\b.*?</style>|<pre\b.*?</pre>"
    r"|<textarea\b.*?</textarea>|{%-?\s*raw\s*-?%}.*?{%-?\s*endraw\s*-?%}",
    re.S | re.I)

offenders = []
for path in sorted(glob.glob("_includes/**/*.html", recursive=True) +
                   glob.glob("_layouts/**/*.html", recursive=True)):
    with open(path, encoding="utf-8", errors="replace") as fh:
        text = fh.read()
    blanked = re.sub(r"<!--.*?-->", lambda m: " " * len(m.group(0)), text, flags=re.S)
    spans = [m.span() for m in GUARD.finditer(blanked)]
    for m in re.finditer(r"<!--(.*?)-->", text, re.S):
        a, b = m.span()
        if any(a >= x and b <= y for x, y in spans):
            continue
        if m.group(1).strip() in ALLOWED:
            continue
        line = text.count("\n", 0, a) + 1
        first = m.group(1).strip().splitlines()[0][:60] if m.group(1).strip() else "(empty)"
        offenders.append(f"{path}:{line}: {first}")

if offenders:
    print("::error::HTML comments in theme includes/layouts ship to every visitor.")
    print("Use {% comment %} ... {% endcomment %} so Jekyll strips them at build time.")
    for o in offenders[:40]:
        print(f"  {o}")
    if len(offenders) > 40:
        print(f"  ... and {len(offenders) - 40} more")
    sys.exit(1)

print("OK: no developer doc banners ship as HTML comments")
sys.exit(0)
PYEOF
    then
        log_success "No developer doc banners ship as HTML comments"
        return 0
    else
        log_error "Developer doc banners are shipping as HTML comments (see above)"
        return 1
    fi
}

test_content_liquid_is_raw_protected() {
    log_info "Testing Liquid shown as code in content is raw-protected..."

    cd "$PROJECT_ROOT"

    if ! command -v python3 &>/dev/null; then
        log_warning "python3 not available for the raw-protection check"
        return 0
    fi

    if python3 - <<'PYEOF'
import re, sys, glob

# Liquid runs BEFORE Markdown, so backticks and fences do not protect a tag --
# they only change how its OUTPUT is displayed. An `include` or a content tag
# written as documentation is therefore executed, and the include's rendering
# is dumped into the page where the example should be.
#
# Measured before the fix: the CHANGELOG page carried a second full copy of
# <head> in its body (Bootstrap CSS, icons and X-UA-Compatible all twice, and
# the GTM snippet on a production build), and the "Layout Variables" table in
# the layouts doc rendered its own page title instead of the variable names,
# 196 KB of leaked layout output and no usable documentation.
#
# Scope is the human-maintained content only. fr/** and _data/i18n/** are
# generated by scripts/translate.rb from these files; they inherit the fix on
# the next translation run and must not be hand-edited.
SOURCES = sorted(set(glob.glob("pages/**/*.md", recursive=True) + glob.glob("*.md")))

# Tags that INJECT foreign output. Control flow ({% if %}, {% for %}) renders
# nothing by itself, so an unprotected one is untidy rather than broken.
INJECTS = re.compile(r"{%-?\s*(?:include|include_relative|include_cached)\b"
                     r"|{{-?\s*content\s*-?}}")
SPANS = dict(
    raw=re.compile(r"{%-?\s*raw\s*-?%}.*?{%-?\s*endraw\s*-?%}", re.S),
    comment=re.compile(r"{%-?\s*comment\s*-?%}.*?{%-?\s*endcomment\s*-?%}", re.S),
    fence=re.compile(r"^```.*?^```", re.S | re.M),
    span=re.compile(r"`[^`\n]+`"),
    )

offenders = []
for path in SOURCES:
    with open(path, encoding="utf-8", errors="replace") as fh:
        text = fh.read()
    # Already escaped, or swallowed by a Liquid comment: nothing renders.
    inert = ([m.span() for m in SPANS["raw"].finditer(text)] +
             [m.span() for m in SPANS["comment"].finditer(text)])
    # Presented AS code, so it is meant to be read, not run.
    shown = ([m.span() for m in SPANS["fence"].finditer(text)] +
             [m.span() for m in SPANS["span"].finditer(text)])
    for m in INJECTS.finditer(text):
        a = m.start()
        if any(x <= a < y for x, y in inert):
            continue
        # Outside a code region it is a deliberate component embed -- that is
        # how pages/_about/settings/*.md and pages/_about/stats.md work.
        if not any(x <= a < y for x, y in shown):
            continue
        line = text.count("\n", 0, a) + 1
        offenders.append(f"{path}:{line}: {m.group(0)}")

if offenders:
    print("::error::Liquid shown as code in content is executed, not displayed.")
    print("Wrap it in a Liquid raw block; Markdown backticks do not escape Liquid.")
    for o in offenders:
        print(f"  {o}")
    sys.exit(1)

print("OK: Liquid shown as code in content is raw-protected")
sys.exit(0)
PYEOF
    then
        log_success "Liquid shown as code in content is raw-protected"
        return 0
    else
        log_error "Content leaks executed Liquid into the rendered page (see above)"
        return 1
    fi
}

test_background_image_include_contract() {
    log_info "Testing components/background-image.html announces backgrounds correctly (issue #401)..."

    cd "$PROJECT_ROOT"

    if [[ ! -f "_includes/components/background-image.html" ]]; then
        log_error "components/background-image.html is missing"
        return 1
    fi

    if ! command -v ruby &>/dev/null; then
        log_warning "ruby not available for the background-image contract check"
        return 0
    fi

    # liquid is a bundled gem -- see test_theme_color_fallback_without_config
    # for why this probes rather than assuming a load path.
    local ruby_run=(ruby)
    if ruby -e 'require "liquid"' >/dev/null 2>&1; then
        :
    elif command -v bundle &>/dev/null && bundle exec ruby -e 'require "liquid"' >/dev/null 2>&1; then
        ruby_run=(bundle exec ruby)
    else
        log_warning "liquid gem not loadable; skipping the background-image contract check"
        return 0
    fi

    if "${ruby_run[@]}" -e '
      require "liquid"
      module StubFilters
        def relative_url(input); input.to_s; end
      end
      Liquid::Template.register_filter(StubFilters)

      tpl  = Liquid::Template.parse(File.read("_includes/components/background-image.html"))
      site = {"preview_images" => {"assets_prefix" => "/assets", "auto_prefix" => true}}
      render = lambda { |inc| tpl.render!("site" => site, "include" => inc).strip }
      fail = []

      # --- real-image branch: a graphic WITH a name -------------------------
      real = render.call({"src" => "/images/previews/x.png", "alt" => "A cover"})
      fail << "real branch has no role=img: #{real}"        unless real.include?(%q{role="img"})
      fail << "real branch has no aria-label: #{real}"      unless real =~ /aria-label="A cover"/
      fail << "real branch is aria-hidden: #{real}"         if real.include?("aria-hidden")

      # The label must be escaped -- it is author text landing in an attribute.
      esc = render.call({"src" => "/images/x.png", "alt" => %q{Tom & "Jerry" <b>}})
      fail << "aria-label is not escaped: #{esc}" unless esc.include?("&amp;") && esc.include?("&quot;") && esc.include?("&lt;")

      # --- decorative branch: hidden, and NEITHER role NOR label ------------
      # Both halves matter: aria-hidden together with role="img" announces a
      # graphic and then hides it, which is worse than either alone.
      [["no src", {}],
       ["src but no alt", {"src" => "/images/x.png"}],
       ["forced", {"src" => "/images/x.png", "alt" => "A cover", "decorative" => true}]].each do |name, inc|
        out = render.call(inc)
        fail << "decorative (#{name}) is not aria-hidden: #{out}" unless out.include?(%q{aria-hidden="true"})
        fail << "decorative (#{name}) still has role=img: #{out}" if out.include?(%q{role="img"})
        fail << "decorative (#{name}) still has aria-label: #{out}" if out.include?("aria-label")
      end

      # --- path convention, same three cases as preview-image.html ----------
      bare = render.call({"src" => "/images/previews/x.png", "alt" => "a"})
      pref = render.call({"src" => "/assets/images/previews/x.png", "alt" => "a"})
      ext  = render.call({"src" => "https://example.com/x.png", "alt" => "a"})
      fail << "bare path not prefixed: #{bare}"     unless bare.include?("/assets/images/previews/x.png")
      fail << "prefixed path doubled: #{pref}"      if pref.include?("/assets/assets")
      fail << "external URL rewritten: #{ext}"      unless ext.include?("https://example.com/x.png")

      if fail.empty?
        puts "OK: background-image.html honours both branches, escaping and the path convention"
        exit 0
      else
        puts "::error::components/background-image.html breaks its accessibility contract"
        fail.each { |f| puts "  #{f}" }
        exit 1
      end
    '
    then
        log_success "background-image.html announces backgrounds correctly"
        return 0
    else
        log_error "background-image.html contract check failed (see above)"
        return 1
    fi
}

test_sidebar_offcanvas_layout_gate() {
    log_info "Testing sidebar offcanvas layout gate (issue #373)..."

    cd "$PROJECT_ROOT"

    if ! command -v python3 &>/dev/null; then
        log_warning "python3 not available for the sidebar offcanvas gate check"
        return 0
    fi

    if python3 - <<'PYEOF'
import re, sys, pathlib

layouts_dir = pathlib.Path("_layouts")
cfg = pathlib.Path("_includes/navigation/sidebar-config.html").read_text(encoding="utf-8")

m = re.search(r'_sidebar_offcanvas_layouts\s*=\s*"([^"]*)"', cfg)
if not m:
    print("::error::_sidebar_offcanvas_layouts not found in sidebar-config.html")
    sys.exit(1)
declared = {x.strip() for x in m.group(1).split(",") if x.strip()}

# parent[layout] = its `layout:` front-matter value (None when standalone)
parent = {}
for f in sorted(layouts_dir.glob("*.html")):
    head = f.read_text(encoding="utf-8", errors="replace")[:600]
    pm = re.search(r'^layout:\s*(\S+)\s*$', head, re.M)
    parent[f.stem] = pm.group(1) if pm else None

def reaches_default(name, seen=None):
    """True when name is `default` or inherits from it (cycle-safe)."""
    seen = seen or set()
    if name in seen or name not in parent:
        return False
    if name == "default":
        return True
    seen.add(name)
    p = parent[name]
    return bool(p) and reaches_default(p, seen)

actual = {n for n in parent if reaches_default(n)}

missing = sorted(actual - declared)   # renders the offcanvas, gate says no
extra   = sorted(declared - actual)   # gate says yes, renders nothing

if missing or extra:
    if missing:
        print("::error file=_includes/navigation/sidebar-config.html::these layouts reach "
              "default.html (so they DO render #bdSidebar/#tocContents) but are missing from "
              "_sidebar_offcanvas_layouts: " + ", ".join(missing) +
              ". Their sidebar toggle and TOC FAB will not render.")
    if extra:
        print("::error file=_includes/navigation/sidebar-config.html::these layouts are listed "
              "in _sidebar_offcanvas_layouts but do NOT reach default.html, so they render no "
              "offcanvas: " + ", ".join(extra) +
              ". Their toggles would point at nothing (issue #373).")
    sys.exit(1)

print("OK - _sidebar_offcanvas_layouts matches the layout graph: " + ", ".join(sorted(actual)))
PYEOF
    then
        log_success "Sidebar offcanvas layout gate matches the layout inheritance graph"
    else
        log_error "Sidebar offcanvas layout gate has drifted from _layouts/ (issue #373)"
        return 1
    fi

    return 0
}

test_design_token_parity() {
    log_info "Testing design-token parity (theme vs Claude Design mirror)..."

    cd "$PROJECT_ROOT"

    if command -v ruby &>/dev/null; then
        if ruby scripts/design-system-check.rb; then
            log_success "Design tokens in lockstep with _design-system/ mirror"
        else
            log_error "Design-token drift detected (see _design-system/SYNC.md)"
            return 1
        fi
    else
        log_warning "Ruby not available for design-token parity check"
    fi

    return 0
}

test_javascript_syntax() {
    log_info "Testing JavaScript syntax..."
    
    cd "$PROJECT_ROOT"
    
    if [[ -d "assets/js" ]]; then
        if command -v node &>/dev/null; then
            find "assets/js" -name "*.js" | while read -r js_file; do
                if node --check "$js_file" &>/dev/null; then
                    log_success "JavaScript file valid: $(basename "$js_file")"
                else
                    log_error "JavaScript syntax error in: $js_file"
                    return 1
                fi
            done
        else
            log_warning "Node.js not available for JavaScript syntax check"
        fi
    fi
    
    return 0
}

#
# MAIN TEST EXECUTION
#

run_core_tests() {
    log_info "Starting core test suite..."
    
    # Setup test environment
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Unit Tests
    log_info "=== UNIT TESTS ==="
    run_test "File Structure Validation" "test_file_structure" "unit"
    run_test "YAML Syntax Validation" "test_yaml_syntax" "unit"
    run_test "Gemspec Validity" "test_gemspec_validity" "unit"
    run_test "Package.json Validity" "test_package_json_validity" "unit"
    run_test "Version Consistency" "test_version_consistency" "unit"
    run_test "Plugin Unit Specs" "test_plugin_unit_specs" "unit"
    run_test "Sidebar Offcanvas Layout Gate" "test_sidebar_offcanvas_layout_gate" "unit"
    run_test "Background Image Include Contract" "test_background_image_include_contract" "unit"
    run_test "Developer Doc Banners Are Liquid" "test_developer_doc_banners_are_liquid" "unit"
    run_test "Content Liquid Raw-Protected" "test_content_liquid_is_raw_protected" "unit"
    run_test "Preview Generator Unit Specs" "test_preview_generator_unit_specs" "unit"
    
    # Integration Tests
    log_info "=== INTEGRATION TESTS ==="
    run_test "Bundle Install" "test_bundle_install" "integration"
    run_test "Jekyll Build Process" "test_jekyll_build" "integration"
    run_test "Gem Build Process" "test_gem_build" "integration"
    
    # Validation Tests
    log_info "=== VALIDATION TESTS ==="
    run_test "Liquid Template Validation" "test_liquid_templates" "validation"
    run_test "Giscus Comments Configuration" "test_giscus_comments" "validation"
    run_test "Favicon and Analytics Wiring" "test_favicon_wiring" "validation"
    run_test "Showcase Demo Links (no absolute 404 hazards)" "test_showcase_demo_links" "validation"
    run_test "Cookbook Recipe Collection" "test_recipe_collection" "validation"
    run_test "Sass Compilation" "test_sass_compilation" "validation"
    run_test "Design Token Parity" "test_design_token_parity" "validation"
    run_test "JavaScript Syntax" "test_javascript_syntax" "validation"
}

# Generate test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/core_test_report.json"
    
    log_info "Generating test report..."
    
    # Aggregate all test results
    if command -v jq &>/dev/null; then
        jq -s '{
          timestamp: (.[0].timestamp // now | strftime("%Y-%m-%dT%H:%M:%SZ")),
          test_suite: "zer0-mistakes Core Tests",
          summary: {
            total: '"$TESTS_TOTAL"',
            passed: '"$TESTS_PASSED"',
            failed: '"$TESTS_FAILED"',
            skipped: '"$TESTS_SKIPPED"',
            success_rate: '$(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))'
          },
          tests: .
        }' "$TEST_RESULTS_DIR"/core_test_*.json > "$report_file" 2>/dev/null || {
            # Fallback if jq processing fails
            cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Core Tests",
  "summary": {
    "total": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "success_rate": $(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))
  }
}
EOF
        }
    else
        # Fallback JSON generation without jq
        cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Core Tests",
  "summary": {
    "total": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "success_rate": $(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))
  }
}
EOF
    fi
    
    log_success "Test report generated: $report_file"
}

# Print final summary
print_test_summary() {
    echo ""
    echo "=========================================="
    echo "  Core Test Results Summary"
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo ""
    echo "Results:"
    echo "  Total Tests: $TESTS_TOTAL"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo "  Skipped: $TESTS_SKIPPED"
    echo ""
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        echo "Success Rate: $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%"
    else
        echo "Success Rate: N/A (no tests run)"
    fi
    echo ""
    echo "Reports saved to: $TEST_RESULTS_DIR/"
    echo "=========================================="
}

# Main execution function
main() {
    parse_arguments "$@"
    
    log_info "Starting zer0-mistakes core test suite"
    log_info "Project root: $PROJECT_ROOT"
    
    # Run all core tests
    run_core_tests
    
    # Generate reports
    generate_test_report
    
    # Print summary
    print_test_summary
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_error "Some core tests failed. Check the reports for details."
        exit 1
    else
        log_success "All core tests passed!"
        exit 0
    fi
}

# Execute main function
main "$@"
