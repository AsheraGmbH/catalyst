# Build Log Scripts

## Quick Start

### Option 1: Direct API Access (Recommended)
**No CLI installation needed!**

```powershell
# 1. Set your Vercel token (get from https://vercel.com/account/tokens)
$env:VERCEL_TOKEN = "your-token-here"

# Optional: Set project/team IDs
$env:VERCEL_PROJECT_ID = "your-project-id"
$env:VERCEL_TEAM_ID = "your-team-id"

# 2. Fetch latest build logs
node core/scripts/fetch-vercel-logs-api.js --latest

# 3. Or watch build in real-time (polls every 10s)
node core/scripts/fetch-vercel-logs-api.js --latest --watch
```

### Option 2: Vercel CLI
**Requires: `npm install -g vercel`**

```bash
# Fetch latest deployment logs
node core/scripts/fetch-vercel-logs.js --latest

# Fetch specific deployment
node core/scripts/fetch-vercel-logs.js [deployment-id]
```

## Scripts

### `fetch-vercel-logs-api.js`
- ✅ Uses Vercel REST API directly
- ✅ No CLI installation required
- ✅ Supports `--watch` mode for real-time monitoring
- ✅ Automatically extracts errors
- ✅ Saves logs to `.vercel-logs/` directory

### `fetch-vercel-logs.js`
- Uses Vercel CLI
- Requires `vercel` command to be installed
- Simpler but requires CLI setup

### `check-build-status.js`
- Checks GitHub for build error issues
- Provides links to workflow and dashboard

## Output

All scripts save logs to `.vercel-logs/` directory:
- `build-[deployment-id].txt` - Full build logs
- `errors-[deployment-id].txt` - Extracted errors only
- `deployment-[deployment-id].json` - Deployment metadata

## Timing

Vercel builds typically take ~90 seconds. Use `--watch` to monitor in real-time.
