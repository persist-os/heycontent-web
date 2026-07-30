---
type: note
status: active
created: 2026-01-17
---

# Internal/Private Information Audit

**Date:** 2026-01-17
**Scope:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web`

---

## CRITICAL: Must Address Before Open-Sourcing

### 1. Google Cloud Project IDs (HIGH)

**Issue:** GCP project number `216038426364` is hardcoded in multiple files.

| File | Line | Content |
|------|------|---------|
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts` | 65-68 | Cloud Run URLs with project number |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/next.config.js` | 23, 74 | CSP headers and image domains |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/scripts/deploy.sh` | 5, 10 | `PROJECT_ID="content-454219"` and Cloud Run domain |

**Files affected:**
- `src/middleware.ts`: Lines 65-68, 71
- `next.config.js`: Lines 23, 74
- `scripts/deploy.sh`: Lines 5, 10

**Recommendation:** Move to environment variables or replace with placeholders.

---

### 2. Convex Deployment Identifiers (HIGH)

**Issue:** Production Convex deployment URLs are hardcoded in CSP.

| Identifier | Type |
|------------|------|
| `benevolent-basilisk-784.convex.cloud` | Production deployment |
| `whimsical-clownfish-162.convex.cloud` | Production deployment |
| `lovely-koala-465.convex.cloud` | Production deployment |
| `combative-lark-727.convex.cloud` | Production deployment |

**File:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts` (lines 55-62)

**Recommendation:** Move to environment variable or generate CSP dynamically from `NEXT_PUBLIC_CONVEX_URL`.

---

### 3. Google Ads Conversion ID (MEDIUM)

**Issue:** Google Ads tracking ID hardcoded in layout.

| File | Line | Value |
|------|------|-------|
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/layout.tsx` | 265, 273 | `AW-17670765753` |

**Recommendation:** Move to environment variable `NEXT_PUBLIC_GOOGLE_ADS_ID`.

---

### 4. Cloud Functions URL (MEDIUM)

**Issue:** Direct Cloud Functions URL exposes project structure.

| File | Line | URL |
|------|------|-----|
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts` | 71 | `https://us-central1-content-454219.cloudfunctions.net` |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/dashboard/notes/hooks/useImageUpload.ts` | 51 | Same URL |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/rules/image_upload.md` | 103, 212 | Same URL (docs) |

**Recommendation:** Route through backend URL environment variable.

---

### 5. Backend Domain (MEDIUM)

**Issue:** Production backend domain `backend.hicontent.co` hardcoded as fallback.

| File | Line |
|------|------|
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts` | 63-64 |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/dashboard/import/chatgpt/chatGPTImportService.ts` | 22 |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/api/projects/[projectId]/generate-widgets/route.ts` | 106 |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/api/projects/[projectId]/status/route.ts` | 4 |
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/api/projects/[projectId]/start/route.ts` | 4 |

**Recommendation:** Remove hardcoded fallback; require env var.

---

### 6. Figma Design Link (LOW)

**Issue:** Internal Figma design system URL exposed.

| File | Line | URL |
|------|------|-----|
| `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/components/ui/response-options.tsx` | 23 | `https://www.figma.com/design/V8NnSKXPeF7Lls9LfAKptZ/HeyContext-Design-System?node-id=1640-1816` |

**Recommendation:** Remove or replace with generic comment.

---

## LOW RISK: Acceptable for Open Source

### Email Addresses

| Email | Context | Risk |
|-------|---------|------|
| `hello@persistos.co` | Public contact email | LOW - Intentionally public |
| `hello@heycontext.co` | Sender email for Resend | LOW - Will need user's own |
| `*@example.com` | Placeholder/test data | NONE - Standard placeholder |

**Files:** Legal pages, Footer, email service, test fixtures.

---

### Third-Party Service References

These are standard and expected in config:

| Service | Usage | Files |
|---------|-------|-------|
| Stripe | Payment processing | `middleware.ts`, `next.config.js` |
| Firebase | Authentication | Multiple |
| Convex | Database | Multiple |
| PostHog | Analytics | `instrumentation-client.ts`, `next.config.js` |
| Resend | Email | `src/app/lib/email.ts` |
| Clerk | Auth (dependency) | `package.json` |

---

### localhost References

All localhost references are in:
- Development fallbacks (`|| 'http://localhost:8000'`)
- Test configurations (`jest.setup.js`)
- Documentation (`README.md`)

**Risk:** NONE - Standard development patterns.

---

## Summary

| Severity | Count | Action Required |
|----------|-------|-----------------|
| HIGH | 2 | Must fix before open source |
| MEDIUM | 4 | Should fix before open source |
| LOW | 1 | Optional cleanup |

### Files Requiring Changes

1. **`/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts`** - Remove hardcoded Convex URLs, Cloud Run URLs, backend domain
2. **`/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/next.config.js`** - Remove project-specific URLs from CSP
3. **`/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/scripts/deploy.sh`** - Parameterize project ID
4. **`/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/layout.tsx`** - Move Google Ads ID to env var
5. **`/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/dashboard/notes/hooks/useImageUpload.ts`** - Use env var for Cloud Functions
6. **Various API routes** - Remove hardcoded backend.hicontent.co fallback

---

## Recommended `.env.example` Additions

```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT_NUMBER="your-project-number"
NEXT_PUBLIC_CLOUD_FUNCTIONS_URL="your-cloud-functions-url"

# Analytics
NEXT_PUBLIC_GOOGLE_ADS_ID="your-google-ads-id"

# Convex (already exists, ensure CSP uses it)
NEXT_PUBLIC_CONVEX_URL="your-convex-deployment-url"
```
