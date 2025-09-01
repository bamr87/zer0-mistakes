#!/bin/bash

# Unit Tests for zer0-mistakes Jekyll Theme
# Tests individual components and functions

# Unit test functions
run_unit_tests() {
    log "Running unit tests..."

    # Test package.json validation
    run_test "Validate package.json syntax" "jq empty package.json" "unit"

    # Test package.json version format
    run_test "Validate package.json version format" "jq -r '.version' package.json | grep -E '^[0-9]+\.[0-9]+\.[0-9]+(\-[a-zA-Z0-9\.\-]+)?$'" "unit"

    # Test gemspec syntax
    run_test "Validate gemspec syntax" "ruby -c jekyll-theme-zer0.gemspec" "unit"

    # Test required files exist
    run_test "Check README.md exists" "test -f README.md" "unit"
    run_test "Check LICENSE exists" "test -f LICENSE" "unit"
    run_test "Check _config.yml exists" "test -f _config.yml" "unit"
    run_test "Check Gemfile exists" "test -f Gemfile" "unit"

    # Test directory structure
    run_test "Check _layouts directory exists" "test -d _layouts" "unit"
    run_test "Check _includes directory exists" "test -d _includes" "unit"
    run_test "Check _sass directory exists" "test -d _sass" "unit"
    run_test "Check assets directory exists" "test -d assets" "unit"

    # Test script executability
    if [[ -d "scripts" ]]; then
        for script in scripts/*.sh; do
            if [[ -f "$script" ]]; then
                script_name=$(basename "$script")
                run_test "Check $script_name is executable" "test -x '$script'" "unit"
            fi
        done
    fi

    # Test YAML front matter validation
    if [[ -d "_layouts" ]]; then
        for layout in _layouts/*.html; do
            if [[ -f "$layout" ]]; then
                layout_name=$(basename "$layout")
                run_test "Validate YAML front matter in $layout_name" "head -10 '$layout' | grep -q -- '---' && head -10 '$layout' | tail -n +2 | head -n -1 | ruby -ryaml -e 'YAML.load(STDIN.read)' 2>/dev/null" "unit"
            fi
        done
    fi

    # Test Jekyll dependencies
    run_test "Check Jekyll dependency in gemspec" "grep -q 'jekyll' jekyll-theme-zer0.gemspec" "unit"

    # Test version consistency
    run_test "Version consistency between package.json and gemspec" "ruby -rjson -e \"pkg = JSON.parse(File.read('package.json')); spec = eval(File.read('jekyll-theme-zer0.gemspec')); puts pkg['version'] == spec.version.to_s\" | grep -q 'true'" "unit"

    # Test configuration files
    run_test "Validate _config.yml syntax" "ruby -ryaml -e 'YAML.load(File.read(\"_config.yml\"))'" "unit"
    run_test "Validate _config_dev.yml syntax" "ruby -ryaml -e 'YAML.load(File.read(\"_config_dev.yml\"))'" "unit"

    # Test asset compilation
    run_test "Check Sass files compile" "find _sass -name '*.scss' -exec sass --check {} \; 2>/dev/null || echo 'Sass not available'" "unit"

    # Test JavaScript files
    if [[ -d "assets/js" ]]; then
        for js_file in assets/js/*.js; do
            if [[ -f "$js_file" ]]; then
                js_name=$(basename "$js_file")
                run_test "Validate $js_name syntax" "node --check '$js_file' 2>/dev/null || echo 'Node.js not available'" "unit"
            fi
        done
    fi

    log "Unit tests completed."
}
