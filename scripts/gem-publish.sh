#!/bin/bash

# DEPRECATED: This script is deprecated and will be removed in v0.8.0
# Please use the new simplified release command instead.

set -e

# Colors
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  ⚠️  DEPRECATION WARNING                                   ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This script (gem-publish.sh) is deprecated and will be removed in v0.8.0${NC}"
echo ""
echo -e "Please use the new simplified command instead:"
echo -e "  ${CYAN}./scripts/release${NC} [patch|minor|major] [options]"
echo ""
echo -e "Benefits of the new command:"
echo -e "  ✅ Cleaner, more maintainable code"
echo -e "  ✅ Modular library-based architecture"
echo -e "  ✅ Comprehensive test coverage"
echo -e "  ✅ Better error handling"
echo -e "  ✅ Easier to understand and modify"
echo ""
echo -e "Example migration:"
echo -e "  ${YELLOW}OLD:${NC} ./scripts/gem-publish.sh patch --dry-run"
echo -e "  ${CYAN}NEW:${NC} ./scripts/release patch --dry-run"
echo ""
echo -e "For more information, see:"
echo -e "  • scripts/lib/README.md"
echo -e "  • docs/RELEASE_WORKFLOW_IMPROVEMENTS.md"
echo ""
echo -e "${YELLOW}Redirecting to new command in 3 seconds...${NC}"
sleep 3
echo ""

# Redirect to new command
exec "$(dirname "$0")/release" "$@"
