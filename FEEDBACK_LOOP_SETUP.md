# Vercel Build Feedback Loop Setup

This guide explains how to set up a feedback loop so that build errors from Vercel can be automatically monitored, logged, and fixed.

## Overview

The feedback loop consists of:
1. **GitHub Actions Workflow** - Monitors Vercel builds and creates issues/comments
2. **Local Script** - Fetch build logs manually for debugging
3. **Auto-fix Capabilities** - Attempts to fix common build errors automatically

## Prerequisites

### 1. GitHub Secrets

Add these secrets to your GitHub repository: **https://github.com/AsheraGmbH/ashera-catalyst** (Settings → Secrets and variables → Actions):

- `VERCEL_TOKEN` - Your Vercel API token (get from [Vercel Settings](https://vercel.com/account/tokens))
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

**Note:** This workflow is configured for the `testing-rebase` branch in the `ashera-catalyst` repository.

To find your Vercel IDs:
```bash
vercel inspect [deployment-url] --format=json
# Or check your Vercel project settings
```

### 2. Local Setup

Install Vercel CLI globally:
```bash
npm install -g vercel
```

Authenticate:
```bash
vercel login
```

### 3. Git Configuration

Ensure your repository is initialized and connected to GitHub:
```bash
cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
git remote add origin https://github.com/AsheraGmbH/ashera-catalyst.git
git checkout testing-rebase
```

**Note:** The workflow is configured to work with the `testing-rebase` branch in the `ashera-catalyst` repository.

## Usage

### Option 1: GitHub Actions Workflow (Recommended)

The workflow automatically monitors builds and creates issues when errors occur.

#### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **"Vercel Build Monitor & Auto-Fix"** workflow
3. Click **"Run workflow"**
4. Optionally provide:
   - Deployment ID (leave empty to fetch latest)
   - Enable/disable auto-fix
   - Enable/disable auto-push

#### Automatic Monitoring

The workflow runs every 5 minutes to check for new builds. You can also trigger it via webhook:

1. In Vercel, go to your project settings
2. Add a webhook that calls:
   ```
   POST https://api.github.com/repos/YOUR_ORG/YOUR_REPO/dispatches
   ```
   With payload:
   ```json
   {
     "event_type": "vercel-build-failed",
     "client_payload": {
       "deployment_id": "$VERCEL_DEPLOYMENT_ID"
     }
   }
   ```

### Option 2: Local Script

Fetch logs manually using the provided script:

```bash
# Fetch latest deployment logs
node core/scripts/fetch-vercel-logs.js --latest

# Fetch specific deployment
node core/scripts/fetch-vercel-logs.js [deployment-id]

# Fetch and attempt auto-fix
node core/scripts/fetch-vercel-logs.js --latest --auto-fix

# Fetch and open in VS Code
node core/scripts/fetch-vercel-logs.js --latest --open
```

Logs are saved to `.vercel-logs/` directory.

### Option 3: Direct Vercel CLI

```bash
# List recent deployments
vercel ls

# Get logs for a deployment
vercel logs [deployment-id]

# Inspect deployment details
vercel inspect [deployment-id] --format=json
```

## How It Works

### 1. Build Monitoring

The GitHub Actions workflow:
- Fetches the latest Vercel deployment (or a specific one)
- Downloads build logs
- Extracts errors and warnings
- Creates/updates GitHub issues with the errors
- Uploads full logs as artifacts

### 2. Auto-Fixing

When enabled, the workflow attempts to fix common errors:
- Missing module imports
- Incorrect import paths
- TypeScript type errors
- Missing dependencies

Fixes are committed to a new branch and pushed automatically.

### 3. Issue Management

Issues are created with:
- Build log excerpts
- Error summaries
- Links to full logs
- Deployment information

Issues are labeled with `vercel-build-error` and `automated` for easy filtering.

## Extending Auto-Fix Logic

To add custom auto-fix logic, edit `.github/workflows/vercel-build-monitor.yml`:

```yaml
- name: Analyze and Auto-Fix Common Errors
  run: |
    # Add your custom fix logic here
    # Example: Fix import paths
    if grep -q "Cannot find module.*OLD" build-logs.txt; then
      # Update import paths from OLD to new structure
      find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*OLD/|from|g'
    fi
```

## Troubleshooting

### Workflow fails to authenticate

- Verify `VERCEL_TOKEN` secret is set correctly
- Check that the token has the right permissions
- Ensure `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct

### Can't push to branch

- Ensure the workflow has `contents: write` permission
- Check that `GITHUB_TOKEN` has sufficient permissions
- Verify the branch exists and is not protected

### Logs are empty

- Check that the deployment ID is correct
- Verify Vercel CLI is authenticated
- Ensure the deployment is recent (old deployments may not have logs)

## Best Practices

1. **Review auto-fixes** before merging - they're helpful but may need manual review
2. **Use feature branches** - auto-fixes create branches automatically if on main
3. **Monitor issues** - Check the `vercel-build-error` label regularly
4. **Keep logs** - Logs are retained for 7 days as artifacts
5. **Extend gradually** - Start with monitoring, then enable auto-fix for specific error types

## Integration with Cursor/AI Assistant

To enable the AI assistant to see build logs:

1. **Via GitHub Issues**: The assistant can read issues created by the workflow
2. **Via Artifacts**: Download artifacts from workflow runs
3. **Via Local Script**: Run the fetch script and share the logs directory

The assistant can then:
- Analyze build errors
- Suggest fixes
- Create pull requests with fixes
- Update code based on error patterns

## Next Steps

1. Set up GitHub secrets
2. Test the workflow manually
3. Configure Vercel webhooks (optional)
4. Extend auto-fix logic for your specific errors
5. Monitor and iterate

For questions or issues, check the workflow logs or create an issue in the repository.
