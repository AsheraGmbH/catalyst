# Working Directory Information

## Repository Structure

### Actual Git Repository
- **Path:** `C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst`
- **Remote:** https://github.com/AsheraGmbH/ashera-catalyst
- **Branch:** `testing-rebase
- **This is where git commits should be made**

### Current Working Directory (Cursor)
- **Path:** `C:\Users\mariu\Documents\ASHERA CATALYST\catalyst`
- **Purpose:** Development/editing workspace
- **Note:** This directory may not be a git repository or may be a different clone

## Workflow

When making changes:

1. **Edit files** in `C:\Users\mariu\Documents\ASHERA CATALYST\catalyst` (current workspace)
2. **Copy changes** to `C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst` (git repo)
3. **Commit and push** from the git repo directory

Or work directly in the git repo:
```bash
cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
# Make edits here, then commit
```

## Quick Commands

### Check which directory you're in
```powershell
pwd
```

### Navigate to git repo
```powershell
cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
```

### Copy files from workspace to git repo
```powershell
# Copy specific file
Copy-Item "C:\Users\mariu\Documents\ASHERA CATALYST\catalyst\path\to\file" "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst\path\to\file" -Force

# Copy entire directory (be careful!)
# Robocopy "C:\Users\mariu\Documents\ASHERA CATALYST\catalyst\core" "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst\core" /MIR
```

## GitHub Actions

The workflow (`.github/workflows/vercel-build-monitor.yml`) is configured to:
- Work with repository: `AsheraGmbH/ashera-catalyst`
- Checkout branch: `testing-rebase`
- Push fixes back to: `testing-rebase` branch

## Important Notes

- The workflow will automatically use the correct repo and branch
- When committing locally, ensure you're in the git repo directory
- The AI assistant should be aware of this dual-directory setup
- Changes made in the workspace need to be synced to the git repo before committing
