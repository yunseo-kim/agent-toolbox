#!/bin/bash
set -euo pipefail

PARCEL_VERSION="2.16.4"
INLINER_VERSION="8.0.0"

echo "📦 Bundling React app to a single HTML artifact..."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is required. Install it first with: npm install -g pnpm"
  exit 1
fi

# Check if we're in a project directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: No package.json found. Run this script from your project root."
  exit 1
fi

# Check if index.html exists
if [ ! -f "index.html" ]; then
  echo "❌ Error: No index.html found in project root."
  echo "   This script requires an index.html entry point."
  exit 1
fi

# Install bundling dependencies
echo "📦 Installing bundling dependencies..."
pnpm add -D parcel@"$PARCEL_VERSION" @parcel/config-default@"$PARCEL_VERSION" web-resource-inliner@"$INLINER_VERSION"

# Create Parcel config with tspaths resolver
if [ ! -f ".parcelrc" ]; then
  echo "🔧 Creating Parcel configuration..."
  cat > .parcelrc << 'EOF'
{
  "extends": "@parcel/config-default"
}
EOF
fi

# Clean previous build
echo "🧹 Cleaning previous build output..."
rm -rf dist bundle.html

# Build with Parcel
echo "🔨 Building with Parcel..."
pnpm exec parcel build index.html --dist-dir dist --no-source-maps

# Inline everything into single HTML
if [ ! -f "dist/index.html" ]; then
  echo "Error: Parcel did not generate dist/index.html"
  exit 1
fi

echo "🎯 Inlining assets into bundle.html..."
node << 'EOF'
const fs = require("node:fs/promises");
const path = require("node:path");
const inliner = require("web-resource-inliner");

async function run() {
  const htmlPath = path.resolve("dist/index.html");
  const html = await fs.readFile(htmlPath, "utf8");

  const inlined = await new Promise((resolve, reject) => {
    inliner.html(
      {
        fileContent: html,
        relativeTo: path.dirname(htmlPath),
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
  });

  await fs.writeFile("bundle.html", inlined, "utf8");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
EOF

# Get file size
FILE_SIZE="$(du -h bundle.html | cut -f1)"

echo ""
echo "✅ Bundle complete!"
echo "📄 Output: bundle.html ($FILE_SIZE)"
echo ""
echo "You can now use this single HTML file as an artifact in conversations."
echo "To test locally: open bundle.html in your browser"
