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
echo -e "${YELLOW}This script (release.sh) is deprecated and will be removed in v0.8.0${NC}"
echo ""
echo -e "Please use the new simplified command instead:"
echo -e "  ${CYAN}./scripts/release${NC} [patch|minor|major] [options]"
echo ""
echo -e "The new command provides the same functionality with:"
echo -e "  ✅ Simpler interface"
echo -e "  ✅ Better documentation"
echo -e "  ✅ Modular architecture"
echo -e "  ✅ Full test coverage"
echo ""
echo -e "${YELLOW}Redirecting to new command in 3 seconds...${NC}"
sleep 3
echo ""

# Redirect to new command
exec "$(dirname "$0")/release" "$@"
