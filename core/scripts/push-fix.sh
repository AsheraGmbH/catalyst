#!/bin/bash
# Helper script to push fixes to GitHub after making changes
# Usage: ./push-fix.sh "commit message" [branch-name]

set -e

COMMIT_MSG="${1:-fix: apply build error fixes}"
BRANCH="${2:-$(git branch --show-current 2>/dev/null || echo 'main')}"

echo "🚀 Pushing fixes to GitHub..."
echo "   Branch: $BRANCH"
echo "   Message: $COMMIT_MSG"

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a git repository"
  exit 1
fi

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
  echo "⚠️  No changes to commit"
  exit 0
fi

# Stage all changes
echo "📦 Staging changes..."
git add -A

# Show what will be committed
echo ""
echo "📋 Changes to be committed:"
git diff --cached --stat

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Push
echo ""
echo "📤 Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

echo ""
echo "✅ Successfully pushed fixes!"
