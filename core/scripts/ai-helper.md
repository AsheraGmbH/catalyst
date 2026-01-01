# AI Assistant Helper Guide

This document helps the AI assistant understand how to work with this codebase and push fixes.

## Quick Commands for AI Assistant

**Repository:** https://github.com/AsheraGmbH/ashera-catalyst  
**Branch:** testing-rebase  
**Local Path:** `C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst`

### 1. Check Current Git Status
```bash
cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
git status
git branch --show-current
git remote -v
```

### 2. Fetch Vercel Build Logs
```bash
# Get latest deployment logs
node core/scripts/fetch-vercel-logs.js --latest

# Or use Vercel CLI directly
vercel ls --limit=5
vercel logs [deployment-id]
```

### 3. Sync Changes to Git Repo and Push
```powershell
# Step 1: Sync changes from workspace to git repo
.\core\scripts\sync-to-git-repo.ps1

# Step 2: Navigate to git repo and commit
cd "C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst"
git add -A
git commit -m "fix: resolve TypeScript errors in rebase"
git push origin testing-rebase
```

**Important:** 
- When working in `C:\Users\mariu\Documents\ASHERA CATALYST\catalyst`, always sync to git repo before committing
- Or work directly in `C:\Users\mariu\Documents\GITBRANCH\ashera-catalyst`
- The sync script preserves the directory structure and excludes node_modules, .git, etc.

### 4. Common Rebase Fix Patterns

When fixing build errors from the `/OLD` to new structure rebase:

#### Import Path Updates
```bash
# Find imports referencing OLD directory
grep -r "from.*OLD/" core/
grep -r "import.*OLD/" core/

# Common patterns to fix:
# - `from '../../OLD/...'` → `from '../...'` or `from '@/...'`
# - `import ... from 'OLD/...'` → update to new structure
```

#### Missing Dependencies
```bash
# Check package.json for missing deps
cd core && npm install
# Review build errors for missing packages
```

#### TypeScript Errors
```bash
# Run typecheck
cd core && npm run typecheck

# Common fixes:
# - Update type imports
# - Fix module resolution in tsconfig.json
# - Update path aliases
```

### 5. Workflow for Debugging Build Errors

1. **Get the error**:
   ```bash
   node core/scripts/fetch-vercel-logs.js --latest
   # Or check GitHub issue created by workflow
   ```

2. **Identify the issue**:
   - Read error logs
   - Check for common patterns (import errors, type errors, missing deps)

3. **Make the fix**:
   - Edit files using search_replace or write tools
   - Test locally if possible: `cd core && npm run build`

4. **Commit and push**:
   ```bash
   git add -A
   git commit -m "fix: [describe the fix]"
   git push origin [branch-name]
   ```

5. **Monitor**:
   - Check Vercel for new build
   - Or trigger workflow manually in GitHub Actions

### 6. Understanding the Rebase Context

- **Old structure**: Code in `/OLD` directory
- **New structure**: Code in `/core` and `/packages` directories
- **Common issues**:
  - Import paths need updating
  - File locations changed
  - Package structure changed
  - Type definitions moved

### 7. Testing Fixes Locally

```bash
# Build the project
cd core
npm run build

# Type check
npm run typecheck

# Lint (if needed)
npm run lint
```

### 8. When You Can't Push Directly

If git push fails (authentication issues), the AI can:
1. Create a detailed fix description
2. Provide exact commands for the user to run
3. Create a patch file that can be applied
4. Document the fix in a comment/issue

### 9. Using GitHub Actions Workflow

The workflow can be triggered to:
- Fetch latest build logs automatically
- Create issues with errors
- Attempt auto-fixes
- Push fixes back to branch

To trigger manually:
- Go to GitHub Actions → "Vercel Build Monitor & Auto-Fix" → Run workflow

### 10. Best Practices

- **Always check git status** before making changes
- **Test locally** when possible before pushing
- **Use descriptive commit messages** that reference the build error
- **Push to feature branches** if on main/master
- **Reference deployment IDs** in commit messages for traceability
