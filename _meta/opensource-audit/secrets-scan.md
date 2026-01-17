# Secrets and Sensitive Information Scan Report

**Repository:** heycontent-web
**Date:** 2026-01-17
**Scan Type:** Static analysis for hardcoded secrets and sensitive information
**Scope:** Pre-open-source release security audit

---

## Executive Summary

**RISK LEVEL: LOW**

No critical secrets (API keys, passwords, private keys) were found hardcoded in the codebase. The repository demonstrates good security practices with proper use of environment variables and gitignore configurations.

However, several **infrastructure identifiers** are exposed that should be reviewed before open-sourcing.

---

## Findings Summary

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 0 | No hardcoded API keys, passwords, or private keys |
| HIGH | 0 | No exposed OAuth secrets or database credentials |
| MEDIUM | 4 | Infrastructure identifiers and internal URLs |
| LOW | 3 | Test/mock values and example configurations |

---

## Detailed Findings

### CRITICAL - None Found

Searched patterns with **no matches**:
- `sk_` / `pk_` (Stripe keys)
- `AKIA` (AWS access keys)
- `-----BEGIN` (Private keys/certificates)
- `ghp_` (GitHub personal access tokens)
- `xox[baprs]-` (Slack tokens)
- `AIza` (Google API keys)
- MongoDB/PostgreSQL/MySQL connection strings
- Base64-encoded secrets

---

### HIGH - None Found

Checked and clear:
- No hardcoded OAuth client secrets (all use `process.env.*`)
- No Firebase service account JSON committed
- No JWT secrets or encryption keys
- `.env` files properly gitignored

---

### MEDIUM - Infrastructure Exposure

#### 1. GCP Project Number Exposed

**Severity:** MEDIUM
**Files:**
- `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts:65-68`
- `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/next.config.js:23, 74`
- `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/scripts/deploy.sh:10`

**What was found:**
```
GCP Project Number: 216038426364
```

**Exposed URLs:**
```
https://content-backend-216038426364.us-central1.run.app
https://content-backend-216038426364.us-east1.run.app
https://content-backend-216038426364.us-west1.run.app
https://content-backend-staging-216038426364.us-central1.run.app
https://heycontent-web-216038426364.us-central1.run.app
https://us-central1-content-454219.cloudfunctions.net
```

**Impact:** Reveals internal GCP infrastructure. While not directly exploitable, it provides reconnaissance value.

**Recommendation:** Move to environment variable `NEXT_PUBLIC_GCP_PROJECT_NUMBER` or use a reverse proxy to hide Cloud Run URLs.

---

#### 2. Convex Deployment Names Exposed

**Severity:** MEDIUM
**File:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts:55-62`

**What was found:**
```
benevolent-basilisk-784.convex.cloud
whimsical-clownfish-162.convex.cloud
lovely-koala-465.convex.cloud
combative-lark-727.convex.cloud
```

**Impact:** Reveals production Convex deployment names. Could be used for reconnaissance or targeted attacks.

**Recommendation:** Consider using a single environment variable for allowed Convex domains or configure via a separate non-committed config file.

---

#### 3. Production Backend Domain Hardcoded

**Severity:** MEDIUM
**Files:**
- `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts:63-64`
- `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/dashboard/import/chatgpt/chatGPTImportService.ts:22`
- `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/api/projects/[projectId]/generate-widgets/route.ts:106`
- Multiple other API routes

**What was found:**
```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';
```

**Impact:** Exposes production backend domain as fallback. This reveals infrastructure details.

**Recommendation:** Remove hardcoded fallback; require `NEXT_PUBLIC_BACKEND_URL` to be set via environment variable.

---

#### 4. Staging Environment URL Exposed

**Severity:** MEDIUM
**File:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/middleware.ts:68`

**What was found:**
```
https://content-backend-staging-216038426364.us-central1.run.app
```

**Impact:** Exposes staging environment URL which may have weaker security controls.

**Recommendation:** Remove staging URLs from production code; use environment-based configuration.

---

### LOW - Test/Mock Values

#### 1. Test API Keys in Jest Setup

**Severity:** LOW
**File:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/jest.setup.js:18-23`
**Line:** 18-23

**What was found:**
```javascript
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud';
```

**Impact:** None - these are clearly test/mock values for testing.

**Recommendation:** No action needed. These are appropriate for test setup.

---

#### 2. Example Environment File

**Severity:** LOW
**File:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/.env.example`

**What was found:**
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
```

**Impact:** None - these are placeholder values, not real credentials.

**Recommendation:** No action needed. This is the correct pattern for example files.

---

#### 3. Firebase Admin SDK Pattern

**Severity:** LOW
**File:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/src/app/lib/firebase-admin.ts:30`

**What was found:**
```typescript
const keyPath = path.resolve(process.cwd(), 'firebase_key.json');
```

**Impact:** References local file `firebase_key.json` which is properly gitignored.

**Recommendation:** Ensure `firebase_key.json` remains in `.gitignore` (currently present at line 69).

---

## Verification: Secure Patterns Found

The codebase demonstrates good security practices:

### 1. Environment Variables Used Correctly
All sensitive values reference `process.env.*`:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `NEXT_PUBLIC_FIREBASE_*` variables
- `NEXT_PUBLIC_CONVEX_URL`

### 2. Gitignore Properly Configured
**File:** `/Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web/.gitignore`

Protected files:
```
.env*.local
.env
.env.development
.env.test
.env.production
*.pem
firebase_key.json
```

### 3. No Actual Credentials in History
Based on existing git history audit (`_meta/opensource-audit/git-history-audit.md`), no credentials were ever committed.

---

## Recommendations for Open-Source Release

### Priority 1: Fix Before Release

1. **Remove hardcoded GCP project numbers**
   - Create environment variable: `NEXT_PUBLIC_GCP_PROJECT_NUMBER`
   - Update all Cloud Run URLs to use this variable

2. **Remove hardcoded Convex deployment names from middleware**
   - Move to environment variable or separate config file

3. **Remove production backend fallback URLs**
   - Change `|| 'https://backend.hicontent.co'` patterns to require env var

### Priority 2: Recommended

4. **Add pre-commit hook for secret detection**
   ```bash
   # Install gitleaks or detect-secrets
   brew install gitleaks
   gitleaks detect --source . --verbose
   ```

5. **Create SECURITY.md**
   - Document required environment variables
   - Explain credential setup process
   - Provide security contact

### Priority 3: Optional

6. **Add .env validation at startup**
   - Fail fast if required env vars are missing
   - Prevents accidental deployment without credentials

---

## Files Scanned

**Total files examined:** 500+
**File types:** `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.env*`

**Search patterns used:**
- API key patterns: `sk_`, `pk_`, `api_key`, `apikey`, `AKIA`
- Secret patterns: `secret`, `password`, `token`, `credential`
- Key patterns: `-----BEGIN`, `private_key`, `privateKey`
- Database patterns: `mongodb://`, `postgres://`, `mysql://`
- Service-specific: `AIza`, `xox`, `ghp_`, `slack`, `twilio`, `sendgrid`

---

## Conclusion

**The codebase is safe from critical secret exposure.** No API keys, passwords, private keys, or credentials are hardcoded.

The main concern is **infrastructure information disclosure** (GCP project numbers, Convex deployment names, production URLs). While not directly exploitable, this information should be abstracted to environment variables before open-sourcing to follow security best practices.

**Status: CONDITIONALLY APPROVED FOR OPEN-SOURCE**
- Requires: Fix MEDIUM severity items (infrastructure exposure)
- Optional: Implement pre-commit secret scanning

---

## Audit Metadata

- **Scanner:** Manual static analysis + pattern-based grep
- **Patterns searched:** 25+
- **False positives reviewed:** Yes
- **Git history checked:** Via existing audit report
- **Auditor:** Security Scanner Agent
