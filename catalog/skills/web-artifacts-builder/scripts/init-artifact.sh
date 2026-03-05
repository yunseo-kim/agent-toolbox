#!/bin/bash
set -euo pipefail

VITE_LATEST="7.3.1"
VITE_FALLBACK="6.4.1"
REACT_VERSION="19.2.4"
TYPESCRIPT_VERSION="5.9.3"
TAILWIND_VERSION="4.2.1"
SHADCN_VERSION="3.8.5"

# Check if Node.js is installed
if ! command -v node > /dev/null 2>&1; then
  echo "❌ Error: Node.js is required."
  exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm > /dev/null 2>&1; then
  echo "❌ Error: pnpm is required. Install it first with: npm install -g pnpm"
  exit 1
fi

if [ "$#" -ne 1 ]; then
  echo "Usage: bash scripts/init-artifact.sh <project-name>"
  exit 1
fi

PROJECT_NAME="$1"
if [[ ! "$PROJECT_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
  echo "❌ Error: project-name must match ^[A-Za-z0-9][A-Za-z0-9._-]*$"
  exit 1
fi

if [ -e "$PROJECT_NAME" ]; then
  echo "❌ Error: '$PROJECT_NAME' already exists."
  exit 1
fi

# Detect Node version
NODE_FULL_VERSION="$(node -v | cut -d'v' -f2)"
NODE_MAJOR="$(printf '%s' "$NODE_FULL_VERSION" | cut -d'.' -f1)"
NODE_MINOR="$(printf '%s' "$NODE_FULL_VERSION" | cut -d'.' -f2)"

echo "Detected Node.js version: v$NODE_FULL_VERSION"

if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ Error: Node.js 18 or higher is required."
  exit 1
fi

# Set Vite version based on Node version
if [ "$NODE_MAJOR" -ge 23 ]; then
  VITE_VERSION="$VITE_LATEST"
elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -ge 12 ]; then
  VITE_VERSION="$VITE_LATEST"
elif [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; then
  VITE_VERSION="$VITE_LATEST"
else
  VITE_VERSION="$VITE_FALLBACK"
fi

if [ "$VITE_VERSION" = "$VITE_LATEST" ]; then
  echo "✅ Using Vite $VITE_VERSION"
else
  echo "✅ Using Vite $VITE_VERSION fallback for current Node compatibility"
fi

echo "🚀 Creating React + TypeScript + Vite project: $PROJECT_NAME"
# Create new Vite project
pnpm create vite "$PROJECT_NAME" --template react-ts

# Navigate into project directory
cd "$PROJECT_NAME"

echo "📦 Installing base dependencies..."
pnpm install
pnpm add react@"$REACT_VERSION" react-dom@"$REACT_VERSION"
pnpm add -D typescript@"$TYPESCRIPT_VERSION" vite@"$VITE_VERSION" @types/node tailwindcss@"$TAILWIND_VERSION" @tailwindcss/vite

echo "Configuring TypeScript path aliases"
node <<'EOF'
const fs = require("node:fs");

const files = ["tsconfig.json", "tsconfig.app.json"];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const withoutLineComments = text
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  const clean = withoutLineComments.replace(/\/\*[\s\S]*?\*\//g, "").replace(/,(\s*[}\]])/g, "$1");
  const config = JSON.parse(clean);
  config.compilerOptions = config.compilerOptions || {};
  config.compilerOptions.baseUrl = ".";
  config.compilerOptions.paths = { "@/*": ["./src/*"] };
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}
EOF

echo "Configuring Vite aliases and Tailwind v4 plugin"
cat > vite.config.ts <<'EOF'
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
EOF

echo "Preparing CSS entrypoint for Tailwind v4 + shadcn"
cat > src/index.css << 'EOF'
@import "tailwindcss";
EOF

echo "Initializing shadcn from upstream CLI"
pnpm dlx shadcn@"$SHADCN_VERSION" init -y -b neutral

echo "Adding common shadcn/ui components"
pnpm dlx shadcn@"$SHADCN_VERSION" add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button button-group calendar card carousel chart checkbox collapsible combobox command context-menu dialog direction drawer dropdown-menu empty field hover-card input input-group input-otp item kbd label menubar native-select navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner spinner switch table tabs textarea toast toggle toggle-group tooltip -y -o

echo "✅ Setup complete! You can now use Tailwind CSS and shadcn/ui in your project."
echo "To start developing:"
echo "  cd $PROJECT_NAME"
echo "  pnpm dev"
