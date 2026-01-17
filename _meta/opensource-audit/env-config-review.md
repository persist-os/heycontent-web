# Environment & Configuration Audit

**Date:** 2026-01-17
**Repository:** heycontent-web (preparing for open source)

---

## Good Practices Found

### Properly Handled Secrets
- `.env` files correctly gitignored
- `firebase_key.json` properly gitignored
- `.env.example` contains only placeholder values
- `NEXT_PUBLIC_` prefix correctly used for client-side vars
- `FIREBASE_SERVICE_ACCOUNT_JSON` used via environment variable
- `RESEND_API_KEY` properly externalized

### .gitignore Coverage
```
.env
.env.local
.env.development
.env.test
.env.production
firebase_key.json
*.pem
```

---

## Critical Issues

### 1. HARDCODED PRODUCTION URLs IN MIDDLEWARE
**File:** `src/middleware.ts`
**Severity:** HIGH

Multiple production URLs hardcoded in CSP connect-src policy:
- `https://backend.hicontent.co`
- `http://backend.hicontent.co`
- `https://content-backend-216038426364.us-central1.run.app`
- `https://content-backend-216038426364.us-east1.run.app`
- `https://content-backend-216038426364.us-west1.run.app`
- `https://content-backend-staging-216038426364.us-central1.run.app`
- `https://us-central1-content-454219.cloudfunctions.net`

**Action:** Move to environment variables or config file

### 2. HARDCODED CONVEX DEPLOYMENT URLs
**File:** `src/middleware.ts` (lines 55-62)
**Severity:** HIGH

```
wss://benevolent-basilisk-784.convex.cloud
wss://whimsical-clownfish-162.convex.cloud
wss://lovely-koala-465.convex.cloud
wss://combative-lark-727.convex.cloud
```

**Action:** Extract to environment variables

### 3. EXPOSED GCP PROJECT IDs
**Severity:** MEDIUM

Two GCP Project IDs exposed:
- `216038426364` (multiple files)
- `454219` (Cloud Functions endpoint)

**Files affected:**
- `src/middleware.ts`
- `next.config.js`
- `scripts/deploy.sh`

**Action:** Move to environment variables

### 4. HARDCODED IMAGE DOMAINS
**File:** `next.config.js`
**Severity:** MEDIUM

`heycontent-web-216038426364.us-central1.run.app`

**Action:** Externalize to environment variable

---

## TypeScript Configuration Notes

**File:** `tsconfig.json`

Strict mode disabled (acceptable for existing project, note for contributors):
- `"strict": false`
- `"noImplicitAny": false`
- `"noUnusedParameters": false`
- `"noUnusedLocals": false`

**Build config issue:**
- `"typescript": { "ignoreBuildErrors": true }` in next.config.js

---

## Environment Variables Required

For open source deployment, these environment variables are needed:

```env
# Required
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_BACKEND_URL=
BACKEND_URL=
NEXT_PUBLIC_APP_URL=

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=

# Optional Services
RESEND_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

---

## Recommendations

1. **Create centralized config** for CSP policies that reads from environment
2. **Document all required env vars** in README for open source setup
3. **Remove all hardcoded GCP identifiers** before making public
4. **Consider using runtime config** instead of build-time for sensitive URLs
