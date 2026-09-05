#!/bin/bash

# Bridge for scripts/ci/test_visual_evidence_autogen.py (ZER0-085).
#
# The planner/decider behind visual-evidence-autogen.yml lives in
# scripts/ci/visual_evidence_autogen.py, next to the other CI helpers, and its
# tests are Python beside it. This wrapper puts them on the CI path: run_tests.sh
# sources this file, and ./scripts/bin/test runs run_tests.sh on every PR — the
# same arrangement as test_agent_review_result.sh, for the same reason (a test
# suite no runner invokes rots silently).

VEA_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

print_suite_header "Visual-evidence autogen planner (scripts/ci/visual_evidence_autogen.py)"

if command -v python3 >/dev/null 2>&1; then
    vea_output="$(python3 "$VEA_ROOT/scripts/ci/test_visual_evidence_autogen.py" 2>&1)"
    vea_status=$?
    echo "$vea_output"
    assert_equals "0" "$vea_status" \
        "scripts/ci/test_visual_evidence_autogen.py passes (plan/decide/contract guards)"
else
    echo "python3 not available — skipping the visual-evidence autogen tests"
fi
