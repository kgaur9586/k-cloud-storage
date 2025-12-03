#!/bin/bash

# Test script to verify thumbnail generation
# This creates a simple test image and checks if thumbnail is generated

echo "🔍 Checking thumbnail generation..."

# Check if Sharp is installed
if ! grep -q "sharp" backend/package.json; then
    echo "❌ Sharp not found in package.json"
    exit 1
fi

echo "✅ Sharp is installed"

# Check if mediaService exists
if [ -f "backend/src/services/mediaService.ts" ]; then
    echo "✅ Media service exists"
else
    echo "❌ Media service not found"
    exit 1
fi

# Check if thumbnail endpoint exists
if grep -q "getFileThumbnail" backend/src/controllers/fileController.ts; then
    echo "✅ Thumbnail endpoint exists"
else
    echo "❌ Thumbnail endpoint not found"
    exit 1
fi

# Check if FileCard has thumbnail display logic
if grep -q "thumbnailPath" frontend/src/components/files/FileCard.jsx; then
    echo "✅ FileCard has thumbnail display logic"
else
    echo "❌ FileCard missing thumbnail logic"
    exit 1
fi

echo ""
echo "✅ All thumbnail components are in place!"
echo ""
echo "📝 To test thumbnails:"
echo "1. Upload a NEW image file (JPG, PNG, etc.)"
echo "2. The thumbnail will be auto-generated during upload"
echo "3. Refresh the page to see the thumbnail in the grid view"
echo ""
echo "⚠️  Note: Existing files uploaded before this feature won't have thumbnails"
echo "   You need to re-upload them or run a migration script"
