#!/bin/bash

# DEPRECATED: This script is deprecated and will be removed in v0.8.0
# Please use the new simplified build command instead.

set -e

# Colors
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  ⚠️  DEPRECATION WARNING                                   ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This script (build.sh) is deprecated and will be removed in v0.8.0${NC}"
echo ""
echo -e "Please use the new simplified command instead:"
echo -e "  ${CYAN}./scripts/build${NC} [options]"
echo ""
echo -e "The new command is:"
echo -e "  ✅ Simpler and more focused"
echo -e "  ✅ Uses modular libraries"
echo -e "  ✅ Better error handling"
echo -e "  ✅ Fully tested"
echo ""
echo -e "${YELLOW}Redirecting to new command in 3 seconds...${NC}"
sleep 3
echo ""

# Redirect to new command
exec "$(dirname "$0")/build" "$@"
