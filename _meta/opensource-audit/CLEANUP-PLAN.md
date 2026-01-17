# Open Source Cleanup Plan: heycontent → heycontext

**Date:** 2026-01-17
**Repository:** heycontent-web
**Target Name:** heycontext-web

---

## Executive Summary

The repository is in **good shape** for open-sourcing. No critical secrets were found in git history. However, there are:
- **95 references** to "heycontent" that need renaming
- **Hardcoded infrastructure IDs** (GCP project numbers, Convex deployments) that should be externalized
- **Internal URLs** that expose infrastructure details

**Git history cleanup:** NOT required (no secrets found)

---

## Phase 1: CRITICAL - Remove Before Open Source

### 1.1 Externalize Infrastructure IDs

| Current Value | Type | Files | Action |
|--------------|------|-------|--------|
| `216038426364` | GCP Project Number | middleware.ts, next.config.js, deploy.sh | Move to `GCP_PROJECT_ID` env var |
| `454219` | GCP Project ID | middleware.ts | Move to env var |
| `AW-17670765753` | Google Ads ID | layout.tsx | Move to `GOOGLE_ADS_ID` env var |

### 1.2 Externalize Convex Deployment URLs

Remove hardcoded Convex URLs from CSP in `src/middleware.ts`:
```
benevolent-basilisk-784.convex.cloud
whimsical-clownfish-162.convex.cloud
lovely-koala-465.convex.cloud
combative-lark-727.convex.cloud
```

**Solution:** Use `NEXT_PUBLIC_CONVEX_URL` to dynamically construct CSP

### 1.3 Remove Internal Backend URLs

Replace hardcoded fallbacks with environment-only:
- `backend.hicontent.co` → `NEXT_PUBLIC_BACKEND_URL` (no fallback)
- Cloud Run URLs → derived from env vars

---

## Phase 2: Rename heycontent → heycontext

### 2.1 Package & Project (2 files)

```bash
# package.json
"name": "heycontent" → "name": "heycontext"

# README.md
heycontent-web/ → heycontext-web/
cd heycontent-web → cd heycontext-web
```

### 2.2 API Key Format (BREAKING CHANGE) - 24 references

**Current format:** `heycontent_<userId>_<hash>`
**New format:** `heycontext_<userId>_<hash>`

Files to update:
- `src/app/lib/validateApiKey.ts`
- `src/app/lib/api-helpers.ts`
- `src/app/api/chat/utils.ts`
- `src/app/api/chat/*/route.ts` (multiple)
- `src/app/api/ambient_insights/*/route.ts`
- `src/app/api/projects/[projectId]/generate-widgets/route.ts`
- `rules/auth.md`

**MIGRATION REQUIRED:**
- Existing API keys in database will need migration
- Consider supporting both formats during transition period

### 2.3 Styling & Theme (8 references)

```javascript
// tailwind.config.ts
heycontent: { ... } → heycontext: { ... }

// CSS Variables
--heycontent-green → --heycontext-green
--heycontent-yellow → --heycontext-yellow
--heycontent-purple → --heycontext-purple
--heycontent-light-yellow → --heycontext-light-yellow

// Classes (global find/replace)
bg-heycontent-* → bg-heycontext-*
text-heycontent-* → text-heycontext-*
```

### 2.4 UI Text (12 references)

| File | Change |
|------|--------|
| `src/app/auth/register/page.tsx` | "Welcome to HeyContent." → "Welcome to HeyContext." |
| `src/app/settings/SettingsScreen.tsx` | "Welcome to HeyContent" → "Welcome to HeyContext" |
| `src/app/legal/privacy/page.tsx` | "HeyContent" → "HeyContext" |
| `src/app/lib/email.ts` | "Welcome to HeyContent!" → "Welcome to HeyContext!" |
| `src/components/ui/logo.tsx` | alt="HeyContent Logo" → alt="HeyContext Logo" |
| `src/components/ui/color-theme-demo.tsx` | Multiple HeyContent → HeyContext |
| `src/app/dashboard/notes/components/cards/TipsCard.tsx` | "heycontent"/"HeyContent" → "heycontext"/"HeyContext" |
| `src/app/settings/tabs/EmailPreferencesTab.tsx` | "from HeyContent" → "from HeyContext" |
| `src/app/api/icon/route.ts` | "HeyContent" → "HeyContext" |

### 2.5 File/Directory Renames (4 files)

```bash
# Image files
mv public/heycontent-logo.svg public/heycontext-logo.svg
mv public/hey-content-small-square.svg public/heycontext-small-square.svg
mv public/hey-content-medium-square.svg public/heycontext-medium-square.svg
mv public/hey-content-large-square.svg public/heycontext-large-square.svg
```

Then update references in:
- `public/manifest.json`
- `src/components/ui/logo.tsx`

### 2.6 Deployment & Infrastructure (8 references)

```bash
# scripts/deploy.sh
SERVICE_NAME="heycontent-web" → SERVICE_NAME="heycontext-web"

# .github/workflows/production-deployment.yml
heycontent-web-divertissement-ai.vercel.app → heycontext-web-divertissement-ai.vercel.app
```

### 2.7 Documentation (15 references)

Files to update with global find/replace:
- `rules/auth.md`
- `rules/api_integrations.md`
- `rules/note_image_display.md`
- `MIGRATION.md`
- `PROGRESSIVE_TRANSLATION_SYSTEM.md`
- `src/helpContent/README.md`
- `src/app/dashboard/notes/CUSTOM_COMMAND_PROMPTS.md`

---

## Phase 3: Additional Cleanup

### 3.1 Remove Internal References

| Item | File | Action |
|------|------|--------|
| Figma design link | Comments | Remove or replace with "[internal]" |
| Staging URLs | middleware.ts | Remove from open source CSP |

### 3.2 Clean Up Example Files

Verify `.env.example` is safe:
- ✅ Contains only placeholders
- Add documentation for required vs optional vars

### 3.3 Update README for Open Source

Add sections for:
- Open source license (choose one: MIT, Apache 2.0, etc.)
- How to set up for development
- Required environment variables
- Contributing guidelines

---

## Execution Commands

### Quick Find All heycontent References
```bash
cd /Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web
grep -ri "heycontent" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .next
```

### Global Replace (after backup)
```bash
# Case-sensitive replacements
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md" \) \
  -not -path "./node_modules/*" -not -path "./.next/*" \
  -exec sed -i '' 's/heycontent/heycontext/g' {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md" \) \
  -not -path "./node_modules/*" -not -path "./.next/*" \
  -exec sed -i '' 's/HeyContent/HeyContext/g' {} \;
```

---

## Git History Options

**Current Assessment:** No BFG/git-filter-repo needed

If you still want a clean history:

### Option A: Squash to single commit (simplest)
```bash
git checkout --orphan new-main
git add -A
git commit -m "Initial open source release"
git branch -D main
git branch -m main
git push -f origin main
```

### Option B: Keep history (current recommendation)
History is clean. Just make cleanup changes as normal commits.

---

## Checklist

- [ ] Phase 1.1: Externalize GCP IDs
- [ ] Phase 1.2: Externalize Convex URLs
- [ ] Phase 1.3: Remove hardcoded backend URLs
- [ ] Phase 2.1: Update package.json name
- [ ] Phase 2.2: Update API key format (+ migration plan)
- [ ] Phase 2.3: Update tailwind/theme config
- [ ] Phase 2.4: Update UI text
- [ ] Phase 2.5: Rename image files + update refs
- [ ] Phase 2.6: Update deployment configs
- [ ] Phase 2.7: Update documentation
- [ ] Phase 3.1: Remove internal references
- [ ] Phase 3.2: Verify .env.example
- [ ] Phase 3.3: Update README with OSS sections
- [ ] Add LICENSE file
- [ ] Final grep check for any missed references
- [ ] Test build and deployment
