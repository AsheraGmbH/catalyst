# Feedback Loop Updates - Repository Configuration

## Changes Made

All feedback loop files have been updated to work with the correct repository and branch:

### Repository Information
- **GitHub Repo:** https://github.com/AsheraGmbH/ashera-catalyst
- **Branch:** `testing-rebase`
- **Local Git Repo:** `C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst`
- **Workspace (Cursor):** `C:\Users\mariu\Documents\ASHERA CATALYST\catalyst`

## Updated Files

### 1. `.github/workflows/vercel-build-monitor.yml`
- ✅ Set to checkout `testing-rebase` branch
- ✅ Explicitly configured for `AsheraGmbH/ashera-catalyst` repository
- ✅ Default branch references changed from `main` to `testing-rebase`

### 2. `FEEDBACK_LOOP_SETUP.md`
- ✅ Updated repository references
- ✅ Updated branch references
- ✅ Added note about `testing-rebase` branch

### 3. `QUICK_START_FEEDBACK_LOOP.md`
- ✅ Updated setup instructions with correct paths
- ✅ Added sync script usage instructions
- ✅ Updated repository URLs

### 4. `core/scripts/ai-helper.md`
- ✅ Added repository and branch information
- ✅ Updated commands to use correct paths
- ✅ Added sync workflow instructions

### 5. New Files Created
- ✅ `WORKING_DIRECTORY_INFO.md` - Explains the dual-directory setup
- ✅ `core/scripts/sync-to-git-repo.ps1` - PowerShell script to sync changes

## New Features

### Sync Script (`core/scripts/sync-to-git-repo.ps1`)

A PowerShell script to sync changes from your workspace to the git repository:

```powershell
# Sync all changes
.\core\scripts\sync-to-git-repo.ps1

# Sync specific file/directory
.\core\scripts\sync-to-git-repo.ps1 "core/scripts/generate.cjs"
```

This script:
- Copies files from workspace to git repo
- Excludes `node_modules`, `.git`, `.next`, `.vercel`
- Preserves directory structure
- Provides next-step instructions

## Workflow

### For Manual Use
1. Make changes in workspace: `C:\Users\mariu\Documents\ASHERA CATALYST\catalyst`
2. Sync to git repo: `.\core\scripts\sync-to-git-repo.ps1`
3. Commit in git repo: `cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst" && git commit -m "message"`
4. Push: `git push origin testing-rebase`

### For GitHub Actions
The workflow automatically:
- Checks out `testing-rebase` branch from `AsheraGmbH/ashera-catalyst`
- Fetches Vercel build logs
- Creates GitHub issues with errors
- Can auto-fix and push back to `testing-rebase` branch

## Next Steps

1. **Copy these updated files to your git repo:**
   ```powershell
   .\core\scripts\sync-to-git-repo.ps1
   ```

2. **Commit the workflow and scripts:**
   ```powershell
   cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
   git add .github/workflows/vercel-build-monitor.yml
   git add core/scripts/
   git add *.md
   git commit -m "feat: add Vercel build feedback loop for testing-rebase branch"
   git push origin testing-rebase
   ```

3. **Set up GitHub Secrets** (in `ashera-catalyst` repo):
   - Go to: https://github.com/AsheraGmbH/ashera-catalyst/settings/secrets/actions
   - Add: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

4. **Test the workflow:**
   - Go to: https://github.com/AsheraGmbH/ashera-catalyst/actions
   - Run "Vercel Build Monitor & Auto-Fix" workflow manually

## Important Notes

- The workflow is configured specifically for `testing-rebase` branch
- All pushes will go to `testing-rebase` branch in `ashera-catalyst` repo
- The sync script helps manage the dual-directory setup
- GitHub Actions will automatically use the correct repo and branch

## Verification

To verify everything is set up correctly:

1. Check workflow file references the right repo:
   ```bash
   grep "AsheraGmbH/ashera-catalyst" .github/workflows/vercel-build-monitor.yml
   grep "testing-rebase" .github/workflows/vercel-build-monitor.yml
   ```

2. Check git remote in the actual repo:
   ```powershell
   cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
   git remote -v
   git branch --show-current
   ```

Both should show `AsheraGmbH/ashera-catalyst` and `testing-rebase`.
