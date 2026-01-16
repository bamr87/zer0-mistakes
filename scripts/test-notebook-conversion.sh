#!/bin/bash
#
# Quick test script for Jupyter notebook conversion
# Run this after Docker build completes
#

set -euo pipefail

echo "=========================================="
echo "Testing Jupyter Notebook Conversion"
echo "=========================================="
echo ""

# Test 1: Check if Docker container is running
echo "[TEST 1] Checking Docker container status..."
if docker-compose ps | grep -q "Up"; then
    echo "✓ Docker container is running"
else
    echo "⚠ Starting Docker container..."
    docker-compose up -d
    sleep 5
fi
echo ""

# Test 2: Verify Python and nbconvert are installed
echo "[TEST 2] Verifying Python and nbconvert in Docker..."
if docker-compose exec -T jekyll python3 -c "import nbconvert; print('nbconvert version:', nbconvert.__version__)" 2>/dev/null; then
    echo "✓ Python and nbconvert are installed"
else
    echo "✗ nbconvert is not installed in Docker"
    echo "  Run: docker-compose build to rebuild the container"
    exit 1
fi
echo ""

# Test 3: List notebooks
echo "[TEST 3] Listing notebooks to convert..."
docker-compose exec -T jekyll ./scripts/convert-notebooks.sh --list
echo ""

# Test 4: Clean any existing converted files
echo "[TEST 4] Cleaning existing converted files..."
rm -f pages/_notebooks/*.md
rm -rf assets/images/notebooks/*
echo "✓ Cleaned"
echo ""

# Test 5: Convert notebooks
echo "[TEST 5] Converting notebooks..."
docker-compose exec -T jekyll ./scripts/convert-notebooks.sh --verbose
echo ""

# Test 6: Verify converted file exists
echo "[TEST 6] Verifying converted files..."
if [ -f "pages/_notebooks/test-notebook.md" ]; then
    echo "✓ Converted file exists: pages/_notebooks/test-notebook.md"
    echo ""
    echo "Front matter preview:"
    head -15 pages/_notebooks/test-notebook.md
    echo ""
    echo "File size: $(wc -l < pages/_notebooks/test-notebook.md) lines"
else
    echo "✗ Converted file not found"
    exit 1
fi
echo ""

# Test 7: Check for images
echo "[TEST 7] Checking for extracted images..."
if [ -d "assets/images/notebooks" ]; then
    image_count=$(find assets/images/notebooks -type f 2>/dev/null | wc -l)
    echo "✓ Found $image_count image file(s)"
else
    echo "ℹ No images extracted (notebook may not have plots)"
fi
echo ""

# Test 8: Validate front matter
echo "[TEST 8] Validating front matter..."
if head -1 pages/_notebooks/test-notebook.md | grep -q "^---$"; then
    echo "✓ Front matter starts correctly"
    if sed -n '2,15p' pages/_notebooks/test-notebook.md | grep -q "^title:"; then
        echo "✓ Title field present"
    fi
    if sed -n '2,15p' pages/_notebooks/test-notebook.md | grep -q "^layout: notebook"; then
        echo "✓ Layout set to 'notebook'"
    fi
else
    echo "✗ Front matter malformed"
fi
echo ""

# Summary
echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start Jekyll server: docker-compose up"
echo "2. Visit: http://localhost:4000/notebooks/test-notebook/"
echo "3. Check styling and layout"
echo ""
echo "To force reconvert:"
echo "  docker-compose exec jekyll ./scripts/convert-notebooks.sh --force"
echo ""
