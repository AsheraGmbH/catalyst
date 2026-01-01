# Direct Vercel Build Log Access Plan

## Goal
Access Vercel build logs directly without manual intervention, enabling real-time debugging.

## Options (Ranked by Ease)

### ✅ Option 1: Vercel REST API (Recommended - No CLI Required)
**Status:** ✅ Implemented

**Script:** `core/scripts/fetch-vercel-logs-api.js`

**Advantages:**
- No CLI installation needed
- Works with just API token
- Can poll/watch builds in real-time
- Direct API access

**Usage:**
```bash
# Set token (get from https://vercel.com/account/tokens)
$env:VERCEL_TOKEN = "your-token-here"

# Optional: Set project/team IDs for filtering
$env:VERCEL_PROJECT_ID = "your-project-id"
$env:VERCEL_TEAM_ID = "your-team-id"

# Fetch latest deployment logs
node core/scripts/fetch-vercel-logs-api.js --latest

# Watch build in real-time (polls every 10s)
node core/scripts/fetch-vercel-logs-api.js --latest --watch

# Fetch specific deployment
node core/scripts/fetch-vercel-logs-api.js [deployment-id]
```

**Implementation:**
- Uses Vercel REST API v2/v6/v13 endpoints
- Streams deployment events
- Saves logs to `.vercel-logs/` directory
- Extracts errors automatically

---

### Option 2: Vercel CLI via npx (No Global Install)
**Status:** Can be implemented

**Advantages:**
- Official CLI tool
- No global installation needed (use npx)
- Simple commands

**Usage:**
```bash
# List deployments
npx vercel ls --token=$VERCEL_TOKEN

# Get logs
npx vercel logs [deployment-id] --token=$VERCEL_TOKEN

# Inspect deployment
npx vercel inspect [deployment-id] --token=$VERCEL_TOKEN --format=json
```

**Implementation:**
- Update `fetch-vercel-logs.js` to use `npx vercel` instead of `vercel`
- Fallback if API method doesn't work

---

### Option 3: GitHub Actions Workflow (Already Implemented)
**Status:** ✅ Already created

**Advantages:**
- Automatic monitoring
- Creates GitHub issues
- No local setup needed

**Usage:**
- Manual trigger: GitHub Actions → Run workflow
- Automatic: Runs every 5 minutes
- Creates issues with build errors

---

### Option 4: Vercel Webhooks → GitHub API
**Status:** Can be implemented

**Advantages:**
- Real-time notifications
- Automatic triggering

**Setup:**
1. Configure Vercel webhook on build completion
2. Webhook calls GitHub API to create issue/comment
3. AI can read issues automatically

---

## Recommended Approach

**Primary:** Use Option 1 (REST API script)
- Fastest to set up
- No dependencies
- Real-time access

**Backup:** Use Option 2 (npx CLI)
- If API endpoints change
- More reliable for some operations

**Monitoring:** Use Option 3 (GitHub Actions)
- Automatic issue creation
- Historical tracking

## Implementation Steps

### Step 1: Get Vercel Token
1. Go to: https://vercel.com/account/tokens
2. Create new token
3. Copy token

### Step 2: Set Environment Variables
```powershell
# PowerShell
$env:VERCEL_TOKEN = "your-token-here"

# Or create .env.local file
VERCEL_TOKEN=your-token-here
VERCEL_PROJECT_ID=your-project-id  # Optional
VERCEL_TEAM_ID=your-team-id         # Optional
```

### Step 3: Test the Script
```bash
# Wait ~90 seconds after push, then:
node core/scripts/fetch-vercel-logs-api.js --latest

# Or watch in real-time:
node core/scripts/fetch-vercel-logs-api.js --latest --watch
```

### Step 4: Integrate with AI Workflow
The script outputs logs to `.vercel-logs/` which I can read directly.

## API Endpoints Used

1. **List Deployments:** `GET /v6/deployments`
2. **Get Deployment:** `GET /v13/deployments/{id}`
3. **Stream Events:** `GET /v2/deployments/{id}/events` (SSE)
4. **Build Logs:** `GET /v1/deployments/{id}/build-logs` (if available)

## Error Handling

- Falls back to dashboard link if API fails
- Provides deployment info JSON
- Extracts errors from logs automatically
- Shows build state and error details

## Next Steps

1. ✅ Created API-based script
2. ⏳ Test with actual Vercel token
3. ⏳ Integrate into debugging workflow
4. ⏳ Add to git repo and document

## Notes

- Builds typically take ~90 seconds
- Use `--watch` flag to monitor in real-time
- Logs are saved locally for analysis
- Errors are automatically extracted and highlighted
