#!/bin/bash

# Unit tests for version.sh library

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "$SCRIPT_DIR/../../lib" && pwd)"

# Set up test environment
export DRY_RUN=true
export INTERACTIVE=false
export VERBOSE=false

# Source the library
source "$LIB_DIR/version.sh"

# Disable errexit for test assertions (sourcing common.sh enables it)
set +e

print_suite_header "version.sh"

# Test: validate_version_format
echo "Testing validate_version_format..."

valid_versions=("0.0.1" "1.0.0" "10.20.30" "999.999.999")
for version in "${valid_versions[@]}"; do
    # Run in subshell because error() calls exit 1
    if (validate_version_format "$version" 2>/dev/null); then
        assert_true "true" "Valid version format accepted: $version"
    else
        assert_true "false" "Valid version format accepted: $version"
    fi
done

invalid_versions=("1.0" "1.0.0.0" "v1.0.0" "1.0.0-beta" "abc.def.ghi")
for version in "${invalid_versions[@]}"; do
    # Run in subshell because error() calls exit 1
    if (validate_version_format "$version" 2>/dev/null); then
        assert_false "true" "Invalid version format rejected: $version"
    else
        assert_false "false" "Invalid version format rejected: $version"
    fi
done

# Test: calculate_new_version
echo -e "\nTesting calculate_new_version..."

result=$(calculate_new_version "1.2.3" "patch")
assert_equals "1.2.4" "$result" "Patch bump: 1.2.3 → 1.2.4"

result=$(calculate_new_version "1.2.3" "minor")
assert_equals "1.3.0" "$result" "Minor bump: 1.2.3 → 1.3.0"

result=$(calculate_new_version "1.2.3" "major")
assert_equals "2.0.0" "$result" "Major bump: 1.2.3 → 2.0.0"

result=$(calculate_new_version "0.0.9" "patch")
assert_equals "0.0.10" "$result" "Patch bump with digit rollover: 0.0.9 → 0.0.10"

result=$(calculate_new_version "0.9.9" "minor")
assert_equals "0.10.0" "$result" "Minor bump resets patch: 0.9.9 → 0.10.0"

result=$(calculate_new_version "9.9.9" "major")
assert_equals "10.0.0" "$result" "Major bump resets minor and patch: 9.9.9 → 10.0.0"

# Test: version_less_than
echo -e "\nTesting version_less_than..."

if version_less_than "1.0.0" "2.0.0"; then
    assert_true "true" "1.0.0 < 2.0.0"
else
    assert_true "false" "1.0.0 < 2.0.0"
fi

if version_less_than "1.2.3" "1.2.4"; then
    assert_true "true" "1.2.3 < 1.2.4"
else
    assert_true "false" "1.2.3 < 1.2.4"
fi

if version_less_than "2.0.0" "1.0.0"; then
    assert_false "true" "2.0.0 not < 1.0.0"
else
    assert_false "false" "2.0.0 not < 1.0.0"
fi

if version_less_than "1.2.3" "1.2.3"; then
    assert_false "true" "1.2.3 not < 1.2.3 (equal)"
else
    assert_false "false" "1.2.3 not < 1.2.3 (equal)"
fi

# Test: get_version_from_tag
echo -e "\nTesting get_version_from_tag..."

result=$(get_version_from_tag "v1.2.3")
assert_equals "1.2.3" "$result" "Remove 'v' prefix: v1.2.3 → 1.2.3"

result=$(get_version_from_tag "1.2.3")
assert_equals "1.2.3" "$result" "No prefix to remove: 1.2.3 → 1.2.3"

echo -e "\n${GREEN}version.sh tests complete${NC}"
