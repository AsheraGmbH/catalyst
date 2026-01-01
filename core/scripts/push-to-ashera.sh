#!/bin/bash
# Push current changes to ashera-catalyst repo testing-rebase branch
# Usage: ./push-to-ashera.sh [commit-message]

set -e

COMMIT_MSG="${1:-fix: apply build error fixes from Vercel logs}"
BRANCH="testing-rebase"
REMOTE="ashera"

# Check if ashera remote exists
if ! git remote | grep -q "^${REMOTE}$"; then
  echo "📡 Adding ashera remote..."
  git remote add ${REMOTE} https://github.com/AsheraGmbH/ashera-catalyst.git
fi

# Fetch latest from ashera
echo "📥 Fetching latest from ${REMOTE}/${BRANCH}..."
git fetch ${REMOTE} ${BRANCH} || echo "⚠️  Branch may not exist yet on remote"

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
git commit -m "$COMMIT_MSG" || {
  echo "⚠️  No changes to commit (may have been committed already)"
  exit 0
}

# Push to ashera-catalyst repo
echo ""
echo "📤 Pushing to ${REMOTE}/${BRANCH}..."
git push ${REMOTE} HEAD:${BRANCH} || {
  echo "❌ Push failed. You may need to:"
  echo "   1. Set up authentication (GitHub token or SSH)"
  echo "   2. Force push if needed: git push ${REMOTE} HEAD:${BRANCH} --force"
  exit 1
}

echo ""
echo "✅ Successfully pushed to ${REMOTE}/${BRANCH}!"
echo "💡 Vercel will automatically rebuild on push"
