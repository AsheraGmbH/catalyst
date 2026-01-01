#!/bin/bash
# Configure git remote with GitHub token and push fixes

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN environment variable is required"
  echo ""
  echo "Please provide the token in one of these ways:"
  echo "  1. Set as environment variable:"
  echo "     export GITHUB_TOKEN='ghp_xxxxx'"
  echo "     $0"
  echo ""
  echo "  2. Or provide it directly:"
  echo "     GITHUB_TOKEN='ghp_xxxxx' $0"
  exit 1
fi

echo "🔧 Configuring git remote with GitHub token..."
git remote set-url ashera https://x-access-token:${GITHUB_TOKEN}@github.com/AsheraGmbH/ashera-catalyst.git

echo "🔍 Testing access to ashera-catalyst repo..."
if git ls-remote ashera testing-rebase > /dev/null 2>&1; then
  echo "✅ Access confirmed!"
else
  echo "❌ Cannot access repository. Please check:"
  echo "   1. Token has 'repo' scope"
  echo "   2. Token has access to AsheraGmbH/ashera-catalyst"
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo ""
echo "📤 Pushing fixes to ashera-catalyst/testing-rebase..."
echo "   From: $CURRENT_BRANCH"
echo "   To: ashera/testing-rebase"

if git push ashera ${CURRENT_BRANCH}:testing-rebase; then
  echo ""
  echo "✅ Successfully pushed!"
  echo "💡 Vercel will automatically trigger a new build"
  echo ""
  echo "📊 To monitor the build:"
  echo "   export VERCEL_TOKEN='NPiFeOp1T8ZJmnoOBm4GezAN'"
  echo "   node core/scripts/fetch-vercel-logs-api.js --latest --watch"
else
  echo ""
  echo "❌ Push failed. Please check the error above."
  exit 1
fi
