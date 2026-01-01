# Quick Start: Vercel Build Feedback Loop

## 🎯 Goal
Enable automatic monitoring of Vercel build errors and allow the AI assistant to push fixes directly to your GitHub branch.

## ⚡ Quick Setup (5 minutes)

### Step 1: Initialize Git (if not already done)
```bash
cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
git remote add origin https://github.com/AsheraGmbH/ashera-catalyst.git
git checkout testing-rebase
```

**Repository:** https://github.com/AsheraGmbH/ashera-catalyst  
**Branch:** testing-rebase

### Step 2: Add GitHub Secrets
Go to: **https://github.com/AsheraGmbH/ashera-catalyst → Settings → Secrets and variables → Actions**

Add these secrets:
- `VERCEL_TOKEN` - Get from [Vercel Account Settings](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - Run: `vercel inspect [any-deployment] --format=json | grep orgId`
- `VERCEL_PROJECT_ID` - Run: `vercel inspect [any-deployment] --format=json | grep projectId`

### Step 3: Install Vercel CLI (for local use)
```bash
npm install -g vercel
vercel login
```

### Step 4: Test the Workflow
1. Go to **GitHub → Actions** tab
2. Select **"Vercel Build Monitor & Auto-Fix"**
3. Click **"Run workflow"**
4. Leave deployment ID empty (fetches latest)
5. Click **"Run workflow"** button

## 🚀 Usage

### Syncing Changes to Git Repo

Since you're working in two directories, use the sync script:

```powershell
# Sync all changes from workspace to git repo
.\core\scripts\sync-to-git-repo.ps1

# Sync specific file/directory
.\core\scripts\sync-to-git-repo.ps1 "core/scripts/generate.cjs"
```

### For You (Manual)
```bash
# Fetch latest build logs
node core/scripts/fetch-vercel-logs.js --latest

# Fetch specific deployment
node core/scripts/fetch-vercel-logs.js [deployment-id]
```

### For AI Assistant
The AI can now:
1. ✅ Read build logs from GitHub issues (auto-created by workflow)
2. ✅ Fetch logs using the script
3. ✅ Make fixes to code
4. ✅ Push fixes using git commands (if you have auth set up)

### Automatic Monitoring
- Workflow runs every 5 minutes
- Creates GitHub issues when build errors occur
- Can auto-fix common errors and push to branch

## 🔧 Enable AI to Push Directly

### Option A: GitHub CLI (Recommended)
```bash
# Install GitHub CLI
winget install GitHub.cli  # Windows
# or: brew install gh      # Mac

# Authenticate
gh auth login

# Now AI can use: gh pr create, git push, etc.
```

### Option B: Personal Access Token
1. Create token: **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Grant `repo` scope
3. Set as environment variable or use with git:
   ```bash
   cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
   git remote set-url origin https://[token]@github.com/AsheraGmbH/ashera-catalyst.git
   ```

### Option C: SSH Keys
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys
# Test: ssh -T git@github.com
```

## 📋 What Happens Next

1. **Vercel build fails** → Workflow detects it
2. **Workflow creates GitHub issue** → With build logs and errors
3. **AI reads the issue** → Analyzes errors
4. **AI makes fixes** → Edits code files
5. **AI pushes fixes** → Commits and pushes to branch
6. **Vercel rebuilds** → (automatic on push)
7. **Loop continues** → Until build succeeds

## 🐛 Troubleshooting

### "Workflow not found"
- Make sure `.github/workflows/vercel-build-monitor.yml` exists
- Check it's committed to your branch

### "Authentication failed"
- Verify `VERCEL_TOKEN` secret is correct
- Check token hasn't expired
- Ensure token has read access to deployments

### "Can't push to branch"
- Check branch protection rules
- Verify `GITHUB_TOKEN` has write permissions
- Try pushing to a feature branch first

### "No deployments found"
- Make sure you have at least one Vercel deployment
- Check `VERCEL_PROJECT_ID` matches your project

## 📚 Full Documentation

See `FEEDBACK_LOOP_SETUP.md` for detailed documentation.

## 🎉 You're Ready!

Once secrets are set up, the feedback loop is active. The AI assistant can now:
- See your build errors automatically
- Fix issues and push updates
- Iterate until builds succeed

No more copy-pasting logs! 🚀
