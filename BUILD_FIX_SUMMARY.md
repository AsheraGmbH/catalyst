# Build Fix Summary

## Issue Fixed
Build error: `ENOENT: no such file or directory, open '/vercel/path0/core/.next/server/app/[locale]/(default)/browser/default-stylesheet.css'`

**Root Cause:** Next.js was trying to resolve CSS files referenced in Builder.io HTML during build-time static analysis, but these files don't exist in the build environment.

## Solution Implemented

### 1. Created Client-Side Builder.io Wrapper
- **File:** `core/lib/builder-io/BuilderIoClientWrapper.tsx`
- Fetches Builder.io content on the client side only
- Completely excludes Builder.io from server-side rendering and build process

### 2. Created API Route
- **File:** `core/app/api/builder-io/route.ts`
- Server endpoint to fetch Builder.io HTML at runtime
- Handles errors gracefully

### 3. Updated Product Page
- **File:** `core/app/[locale]/(default)/product/[slug]/page.tsx`
- Replaced server-side `BuilderIoRenderedHTMLString` with client-side `BuilderIoClientWrapper`
- Uses Next.js `dynamic` import with `ssr: false` to exclude from build

## Files Changed
```
M  core/app/[locale]/(default)/product/[slug]/page.tsx
A  core/app/api/builder-io/route.ts
A  core/lib/builder-io/BuilderIoClientWrapper.tsx
A  core/scripts/fetch-and-fix-build.sh
A  core/scripts/push-to-ashera.sh
A  core/scripts/push-fixes-to-ashera.sh
```

## Commit
```
commit 5d38e37e1c01970d9fefe22e8f316f4184ebb135
fix: prevent Builder.io CSS file resolution errors during build
```

## How to Push to ashera-catalyst

Since the current token doesn't have access to `ashera-catalyst` repo, you'll need to push manually:

### Option 1: Push from Local Machine
```bash
# In your local catalyst repo
cd /path/to/catalyst
git remote add ashera https://github.com/AsheraGmbH/ashera-catalyst.git
git fetch ashera testing-rebase
git push ashera cursor/catalyst-rebase-build-issues-67d8:testing-rebase
```

### Option 2: Cherry-pick in ashera-catalyst Repo
```bash
# In ashera-catalyst repo
cd /path/to/ashera-catalyst
git checkout testing-rebase
git pull origin testing-rebase
# Cherry-pick the commit
git cherry-pick 5d38e37e1c01970d9fefe22e8f316f4184ebb135
git push origin testing-rebase
```

### Option 3: Manual File Copy
Copy these files from catalyst to ashera-catalyst:
- `core/app/[locale]/(default)/product/[slug]/page.tsx`
- `core/app/api/builder-io/route.ts`
- `core/lib/builder-io/BuilderIoClientWrapper.tsx`

## Expected Result

After pushing, Vercel should:
1. Automatically trigger a new build
2. Successfully complete the build without the CSS file resolution error
3. Deploy the updated application

## Monitoring Next Build

After you push, I can monitor the build using:
```bash
export VERCEL_TOKEN="NPiFeOp1T8ZJmnoOBm4GezAN"
node core/scripts/fetch-vercel-logs-api.js --latest --watch
```

This will fetch the latest deployment and watch for completion.
