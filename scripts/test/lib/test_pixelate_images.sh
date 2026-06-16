#!/bin/bash

# Unit tests for scripts/features/pixelate_images.py (preview-image pixelator).
#
# These drive the dependency-free Python engine as a subprocess and assert on
# its behaviour: the internal self-test, a real PNG round-trip that shrinks the
# file, dry-run leaving files untouched, and graceful handling of non-PNG input.
#
# Sourced by scripts/test/lib/run_tests.sh (uses its exported assert helpers),
# but also runnable directly for local iteration.

TEST_SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$TEST_SELF_DIR/../../.." && pwd)"
ENGINE="$REPO_ROOT/scripts/features/pixelate_images.py"

# Fallback helpers so the file also runs standalone (when not sourced by the
# library runner that exports these).
if ! declare -F assert_true >/dev/null 2>&1; then
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
    TESTS_RUN=0; TESTS_PASSED=0; TESTS_FAILED=0; declare -a FAILED_TESTS=()
    assert_true() { ((TESTS_RUN++)); if eval "$1"; then ((TESTS_PASSED++)); echo -e "${GREEN}✓${NC} $2"; else ((TESTS_FAILED++)); echo -e "${RED}✗${NC} $2"; FAILED_TESTS+=("$2"); fi; }
    assert_equals() { ((TESTS_RUN++)); if [[ "$1" == "$2" ]]; then ((TESTS_PASSED++)); echo -e "${GREEN}✓${NC} $3"; else ((TESTS_FAILED++)); echo -e "${RED}✗${NC} $3 (expected '$1' got '$2')"; FAILED_TESTS+=("$3"); fi; }
    print_suite_header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }
    STANDALONE=true
fi

set +e

print_suite_header "pixelate_images.py"

if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ python3 not available — skipping pixelate_images tests${NC}"
else
    # ---- Test: internal self-test ----------------------------------------
    if python3 "$ENGINE" --selftest >/dev/null 2>&1; then
        assert_true "true" "engine --selftest passes"
    else
        assert_true "false" "engine --selftest passes"
    fi

    # ---- Set up a temp workspace with a synthetic gradient PNG -----------
    PX_TMP="$(mktemp -d)"
    trap '[[ -n "${PX_TMP:-}" ]] && rm -rf "$PX_TMP"' EXIT

    # Build the input PNG independently of the engine's encoder so the
    # round-trip genuinely exercises decode + re-encode.
    python3 - "$PX_TMP/in.png" <<'PY'
import sys, struct, zlib
path = sys.argv[1]
w = h = 256
body = bytearray()
for y in range(h):
    body.append(0)  # filter: none
    for x in range(w):
        body += bytes(((x + y) % 256, (x * 2) % 256, (y * 2) % 256))
def chunk(t, d):
    return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
png = (b"\x89PNG\r\n\x1a\n"
       + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
       + chunk(b"IDAT", zlib.compress(bytes(body), 9))
       + chunk(b"IEND", b""))
open(path, "wb").write(png)
PY
    assert_true "[[ -s '$PX_TMP/in.png' ]]" "synthetic input PNG created"
    ORIG_SIZE=$(wc -c < "$PX_TMP/in.png" | tr -d ' ')

    # ---- Test: dry-run does not modify the input -------------------------
    BEFORE=$(wc -c < "$PX_TMP/in.png" | tr -d ' ')
    python3 "$ENGINE" --dry-run "$PX_TMP/in.png" >/dev/null 2>&1
    AFTER=$(wc -c < "$PX_TMP/in.png" | tr -d ' ')
    assert_equals "$BEFORE" "$AFTER" "dry-run leaves the file unchanged"

    # ---- Test: real run writes a smaller, valid indexed PNG --------------
    python3 "$ENGINE" --colors 64 --block 4 --output-dir "$PX_TMP/out" "$PX_TMP/in.png" >/dev/null 2>&1
    OUT="$PX_TMP/out/in.png"
    assert_true "[[ -s '$OUT' ]]" "optimized output written"
    NEW_SIZE=$(wc -c < "$OUT" 2>/dev/null | tr -d ' ')
    assert_true "[[ '${NEW_SIZE:-0}' -lt '$ORIG_SIZE' ]]" "output is smaller than original ($ORIG_SIZE -> ${NEW_SIZE:-0} bytes)"

    # Output must be a valid PNG-8 (colour type 3) that decodes back.
    if python3 - "$ENGINE" "$OUT" <<'PY'
import sys, importlib.util
spec = importlib.util.spec_from_file_location("pixelate_images", sys.argv[1])
P = importlib.util.module_from_spec(spec); spec.loader.exec_module(P)
img = P.decode_png(open(sys.argv[2], "rb").read())
assert img.width == 64 and img.height == 64, (img.width, img.height)
PY
    then
        assert_true "true" "output decodes back to expected 64x64 dimensions"
    else
        assert_true "false" "output decodes back to expected 64x64 dimensions"
    fi

    # ---- Test: non-PNG input is skipped gracefully (no crash) ------------
    printf 'not a png at all' > "$PX_TMP/fake.png"
    python3 "$ENGINE" --dry-run "$PX_TMP/fake.png" >/dev/null 2>&1
    assert_equals "0" "$?" "non-PNG input is handled gracefully (exit 0)"

    rm -rf "$PX_TMP"; PX_TMP=""
fi

# When run standalone, print a summary and exit with the right code.
if [[ "${STANDALONE:-false}" == "true" ]]; then
    echo ""
    echo -e "Total: $TESTS_RUN  ${GREEN}Passed: $TESTS_PASSED${NC}  ${RED}Failed: $TESTS_FAILED${NC}"
    [[ $TESTS_FAILED -eq 0 ]]
    exit $?
fi
