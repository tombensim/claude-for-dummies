#!/bin/bash
# CC4D Environment Check
# Detects platform, node, gh auth, vercel auth, agentation

echo "=== CC4D: CHECK_ENVIRONMENT ==="

# Platform
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "PLATFORM: macos"
else
  echo "PLATFORM: linux"
fi

# Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v 2>/dev/null)
  echo "NODE_VERSION: $NODE_VERSION"
  echo "NODE_OK: true"
else
  echo "NODE_VERSION: none"
  echo "NODE_OK: false"
fi

# GitHub CLI auth
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
  echo "GH_AUTH: true"
else
  echo "GH_AUTH: false"
fi

# Vercel CLI auth
if npx vercel whoami &> /dev/null 2>&1; then
  echo "VERCEL_AUTH: true"
else
  echo "VERCEL_AUTH: false"
fi

# Agentation
if [ -d "node_modules/agentation" ] || npm list agentation &> /dev/null 2>&1; then
  echo "AGENTATION_INSTALLED: true"
else
  echo "AGENTATION_INSTALLED: false"
fi

# Overall status
if command -v node &> /dev/null && \
   command -v gh &> /dev/null && gh auth status &> /dev/null && \
   npx vercel whoami &> /dev/null 2>&1; then
  echo "STATUS: ready"
else
  echo "STATUS: needs_setup"
fi

echo "=== END ==="
