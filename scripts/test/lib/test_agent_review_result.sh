#!/bin/bash

# Bridge for scripts/ci/test_agent_review_result.py (issue #418).
#
# The guard that decides whether the Claude content review actually ran lives in
# scripts/ci/agent_review_result.py, next to the other CI helper
# (classify_changes.py), and its tests are written in Python beside it. This
# wrapper is what puts them on the CI path: run_tests.sh sources this file, and
# ./scripts/bin/test runs run_tests.sh on every PR.
#
# scripts/issues/test_verify_close.py is the cautionary example — a real test
# suite that no runner ever invoked. Do not let this one drift the same way: if
# the Python tests move, move this line with them.

ARR_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

print_suite_header "Claude review guard (scripts/ci/agent_review_result.py)"

if command -v python3 >/dev/null 2>&1; then
    arr_output="$(python3 "$ARR_ROOT/scripts/ci/test_agent_review_result.py" 2>&1)"
    arr_status=$?
    echo "$arr_output"
    assert_equals "0" "$arr_status" \
        "scripts/ci/test_agent_review_result.py passes (the #418 401-swallow guard)"
else
    echo "python3 not available — skipping the Claude review guard tests"
fi
