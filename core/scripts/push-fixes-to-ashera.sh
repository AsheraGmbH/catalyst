#!/bin/bash
# Push fixes from catalyst repo to ashera-catalyst repo testing-rebase branch
# This script handles the cross-repo push

set -e

CURRENT_BRANCH=$(git branch --show-current)
TARGET_REPO="ashera"
TARGET_BRANCH="testing-rebase"

echo "🚀 Pushing fixes to ashera-catalyst repo..."
echo "   From: $CURRENT_BRANCH"
echo "   To: $TARGET_REPO/$TARGET_BRANCH"
echo ""

# Check if we have changes to push
if git diff --quiet HEAD origin/$CURRENT_BRANCH 2>/dev/null && git diff --cached --quiet; then
  echo "⚠️  No new changes to push"
  exit 0
fi

# Try to push
echo "📤 Attempting to push..."
if git push $TARGET_REPO $CURRENT_BRANCH:$TARGET_BRANCH 2>&1; then
  echo ""
  echo "✅ Successfully pushed to $TARGET_REPO/$TARGET_BRANCH!"
  echo "💡 Vercel will automatically rebuild"
  exit 0
else
  echo ""
  echo "❌ Push failed. This might be due to:"
  echo "   1. Token doesn't have write access to ashera-catalyst repo"
  echo "   2. Repository permissions issue"
  echo ""
  echo "💡 Manual push options:"
  echo "   Option 1: Push manually from your local machine"
  echo "   cd /path/to/catalyst"
  echo "   git remote add ashera https://github.com/AsheraGmbH/ashera-catalyst.git"
  echo "   git push ashera $CURRENT_BRANCH:testing-rebase"
  echo ""
  echo "   Option 2: Create a PR from catalyst to ashera-catalyst"
  echo "   Option 3: Cherry-pick the commit in ashera-catalyst repo"
  echo ""
  echo "📋 Commit to push:"
  git log --oneline -1
  echo ""
  echo "📋 Files changed:"
  git diff --name-only HEAD~1 HEAD
  exit 1
fi
