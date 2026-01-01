# Stability Log

## Phase 0 - Repo Orientation

### Workspace Layout
- **Root package**: `@bigcommerce/catalyst` (monorepo root)
- **Next.js app workspace**: `core/` (contains the main Next.js application)
- **Package manager**: pnpm 10.12.4 (pinned in packageManager field)
- **Node version**: 22 (from `.nvmrc`, but system has v25.2.1 - ⚠️ mismatch)

### Current Scripts (Root)
- `dev`: `dotenv -e .env.local -- turbo run dev`
- `build`: `dotenv -e .env.local -- turbo run build`
- `lint`: `dotenv -e .env.local -- turbo lint`
- `test`: `turbo run test`
- `typecheck`: `turbo typecheck`

### Current Scripts (Core)
- `dev`: `npm run generate && next dev`
- `generate`: `dotenv -e .env.local -- node ./scripts/generate.cjs`
- `build`: `npm run generate && next build`
- `build:stub`: Stub mode build (for validation without env vars)
- `start`: `next start`
- `lint`: `eslint . --ext .js,.jsx,.ts,.tsx`
- `typecheck`: `tsc --noEmit`

### Node/Package Manager Versions
- **Node**: `.nvmrc` specifies 22, but system has v25.2.1 (⚠️ needs alignment)
- **pnpm**: 10.12.4 (matches packageManager field)

### Environment Variables
- **No `.env.example` found** (⚠️ needs to be created)
- Required vars: `BIGCOMMERCE_STORE_HASH`, `BIGCOMMERCE_STOREFRONT_TOKEN`, `BIGCOMMERCE_CHANNEL_ID`
- Optional: `NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME`, `ORDER_ENCRYPTION_KEY`, PayPal vars, etc.

### Next.js Config Status
- TypeScript: `ignoreBuildErrors: !!process.env.CI` (only ignores in CI - ✅ acceptable)
- ESLint: `ignoreDuringBuilds: true` (⚠️ This violates rule 2 - needs review/fix)

---

## Phase 1 - Clean Baseline Run

### Test Results
_To be filled after running baseline tests_

---

## Phase 2 - Fix Loop

### Fixes Applied
_To be documented as fixes are applied_

---

## Phase 3 - Production Start + Smoke

### Smoke Test Results
_To be filled after production start_

---

## Phase 4 - Prevent Regressions

### Scripts Added
_To be documented_

---

## Summary

### Commands That Pass the Gate
_To be filled_

### Changes Made
_To be filled_

### Remaining Risks
_To be filled_
