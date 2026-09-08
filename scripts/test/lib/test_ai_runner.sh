#!/bin/bash

# Bridge for scripts/ci/test_ai_runner.sh (the shared ai-runner kit).
#
# scripts/ai/run.sh is the fleet's universal AI runner, adopted byte-identically
# from lifehacker.dev together with .github/actions/claude-run. Its exit-code
# contract — a call that was ATTEMPTED and REJECTED exits 1 and names the reason,
# a genuine no-op stays 0 — is pinned by scripts/ci/test_ai_runner.sh, which is
# itself a kit file and so cannot be reshaped into this runner's assertion style.
# This wrapper is what puts it on the CI path: run_tests.sh sources this file,
# and ./scripts/bin/test runs run_tests.sh on every PR.
#
# Same rationale as test_agent_review_result.sh: a test no runner invokes is a
# test that does not exist. If the kit test moves, move this line with it.

AIR_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

print_suite_header "AI runner exit contract (scripts/ci/test_ai_runner.sh)"

air_output="$(bash "$AIR_ROOT/scripts/ci/test_ai_runner.sh" 2>&1)"
air_status=$?
echo "$air_output"
assert_equals "0" "$air_status" \
    "scripts/ci/test_ai_runner.sh passes (a rejected AI call is never a green step)"
