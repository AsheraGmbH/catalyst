#!/bin/bash
# Fetch latest Vercel build logs, analyze errors, and prepare fixes
# This script works with the ashera-catalyst repo on testing-rebase branch

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
ASHERA_REPO="AsheraGmbH/ashera-catalyst"
BRANCH="testing-rebase"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN environment variable is required"
  echo "   Set it with: export VERCEL_TOKEN='your-token'"
  exit 1
fi

echo "🔍 Fetching latest Vercel deployment..."

# Get latest deployment ID
DEPLOYMENT_ID=$(node -e "
const https = require('https');
const req = https.request('https://api.vercel.com/v6/deployments?limit=1', {
  headers: { 'Authorization': 'Bearer $VERCEL_TOKEN' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.deployments && json.deployments[0]) {
        console.log(json.deployments[0].uid);
      } else {
        console.error('No deployments found');
        process.exit(1);
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      process.exit(1);
    }
  });
});
req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});
req.end();
")

if [ -z "$DEPLOYMENT_ID" ]; then
  echo "❌ Failed to get deployment ID"
  exit 1
fi

echo "✅ Found deployment: $DEPLOYMENT_ID"
echo ""

# Fetch logs using the API script
echo "📥 Fetching build logs..."
node /workspace/core/scripts/fetch-vercel-logs-api.js "$DEPLOYMENT_ID" || {
  echo "⚠️  API script failed, trying alternative method..."
  node /workspace/core/scripts/get-deployment-details.js "$DEPLOYMENT_ID"
}

echo ""
echo "📋 Build logs saved to .vercel-logs/"
echo "💡 Review the logs and fix errors, then push to:"
echo "   git remote add ashera https://github.com/$ASHERA_REPO.git  # if not already added"
echo "   git push ashera HEAD:testing-rebase"
