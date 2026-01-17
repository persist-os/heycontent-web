# Rename Audit: heycontent → heycontext

**Date:** 2026-01-17
**Total References Found:** 95 instances

---

## Summary by Category

| Category | Count |
|----------|-------|
| Package & Config | 2 |
| File/Directory Names | 4 |
| Styling & Theme | 8 |
| API Key Format | 24 |
| UI Text | 12 |
| Documentation | 15 |
| Deployment | 8 |
| Web Manifest/Icons | 7 |
| Comments | 5 |
| Compare Pages (already correct) | 3 |
| **Total** | **95** |

---

## 1. Package & Project Configuration (2)

| File | Line | Current | Replace With |
|------|------|---------|--------------|
| `package.json` | 2 | `"name": "heycontent"` | `"name": "heycontext"` |
| `README.md` | 38, 114 | `heycontent-web/` | `heycontext-web/` |

---

## 2. File & Directory Names (4)

| Current Path | New Path |
|--------------|----------|
| `/public/heycontent-logo.svg` | `/public/heycontext-logo.svg` |
| `/public/hey-content-small-square.svg` | `/public/heycontext-small-square.svg` |
| `/public/hey-content-medium-square.svg` | `/public/heycontext-medium-square.svg` |
| `/public/hey-content-large-square.svg` | `/public/heycontext-large-square.svg` |

**Note:** `/src/app/compare/heycontext-vs-*` directories already use correct naming.

---

## 3. Styling & Theme (8)

| File | Line | Current | Replace With |
|------|------|---------|--------------|
| `tailwind.config.ts` | 91 | `heycontent: {` | `heycontext: {` |
| `src/lib/theme-utils.ts` | 63-64 | `--heycontent-green`, `--heycontent-yellow` | `--heycontext-green`, `--heycontext-yellow` |
| `src/components/ui/color-theme-demo.tsx` | Multiple | `bg-heycontent-*`, `HeyContent Yellow` | `bg-heycontext-*`, `HeyContext Yellow` |

**CSS Custom Properties to rename:**
- `--heycontent-green` → `--heycontext-green`
- `--heycontent-yellow` → `--heycontext-yellow`
- `--heycontent-purple` → `--heycontext-purple`
- `--heycontent-light-yellow` → `--heycontext-light-yellow`

---

## 4. API Key Format (24) - BREAKING CHANGE

**Current Format:** `heycontent_<userId>_<hash>`
**New Format:** `heycontext_<userId>_<hash>`

### Files to Update:

| File | Lines | Pattern |
|------|-------|---------|
| `rules/auth.md` | 23-24, 35, 40 | Documentation of format |
| `src/app/lib/validateApiKey.ts` | 10, 14-15, 19, 44 | Validation logic |
| `src/app/lib/api-helpers.ts` | 104, 169, 171, 188, 234, 284 | Prefix checks |
| `src/app/api/projects/[projectId]/generate-widgets/route.ts` | 30-31 | Comment & check |
| `src/app/api/chat/conversation/[chatId]/route.ts` | 116-117 | `startsWith('heycontent_')` |
| `src/app/api/chat/[chatId]/route.ts` | 41-42 | `startsWith('heycontent_')` |
| `src/app/api/chat/history/route.ts` | 115-116 | `startsWith('heycontent_')` |
| `src/app/api/chat/utils.ts` | 10, 12, 14 | Extraction function |
| `src/app/api/ambient_insights/route.ts` | 21 | `apiKeyParts[0] === 'heycontent'` |
| `src/app/api/ambient_insights/remove/route.ts` | 23 | `apiKeyParts[0] === 'heycontent'` |

### Migration Required:
- Database records with old format keys need migration
- Consider supporting both formats temporarily

---

## 5. UI Text (12)

| File | Line | Current | Replace With |
|------|------|---------|--------------|
| `src/app/auth/register/page.tsx` | 12 | "Welcome to HeyContent." | "Welcome to HeyContext." |
| `src/app/settings/SettingsScreen.tsx` | 97 | "Welcome to HeyContent" | "Welcome to HeyContext" |
| `src/app/legal/privacy/page.tsx` | 127 | "related to HeyContent" | "related to HeyContext" |
| `src/app/lib/email.ts` | 14 | "Welcome to HeyContent!" | "Welcome to HeyContext!" |
| `src/components/ui/logo.tsx` | 21 | `alt="HeyContent Logo"` | `alt="HeyContext Logo"` |
| `src/components/ui/color-theme-demo.tsx` | 42, 57, 83, 99, 213 | Multiple HeyContent | HeyContext |
| `src/app/dashboard/notes/components/cards/TipsCard.tsx` | 50-52, 65, 67, 106, 111 | Detection logic | Update strings |
| `src/app/settings/tabs/EmailPreferencesTab.tsx` | 97 | "from HeyContent" | "from HeyContext" |
| `src/app/dashboard/partnerships/components/InlineEmailReply.tsx` | 73 | Comment | Update comment |
| `src/app/api/icon/route.ts` | 10 | "HeyContent" | "HeyContext" |

---

## 6. Documentation (15)

| File | Changes Needed |
|------|----------------|
| `rules/auth.md` | Multiple HeyContent references |
| `rules/api_integrations.md` | Lines 3, 31, 37 |
| `rules/note_image_display.md` | Lines 21, 146 |
| `MIGRATION.md` | Line 3 |
| `PROGRESSIVE_TRANSLATION_SYSTEM.md` | Line 112 - path reference |
| `src/helpContent/README.md` | Line 1 - title |
| `src/app/dashboard/notes/CUSTOM_COMMAND_PROMPTS.md` | Lines 230, 233, 238, 242, 247, 254-255 |

---

## 7. Deployment & Infrastructure (8)

| File | Line | Current | Replace With |
|------|------|---------|--------------|
| `scripts/deploy.sh` | 6 | `SERVICE_NAME="heycontent-web"` | `SERVICE_NAME="heycontext-web"` |
| `scripts/deploy.sh` | 10 | Convex domain | Update domain |
| `next.config.js` | 74 | allowedHosts domain | Update domain |
| `.github/workflows/production-deployment.yml` | 37, 59, 73, 81 | Health check URLs | Update URLs |
| `.github/workflows/production-deployment.yml` | 186-187 | Deployment links | Update links |
| `.github/workflows/production-deployment.yml` | 296-298 | Docs references | Update refs |

---

## 8. Web Manifest & Icons (7)

| File | Lines | Current | Replace With |
|------|-------|---------|--------------|
| `public/manifest.json` | 12, 18, 24, 40, 53 | `/hey-content-*-square.svg` | `/heycontext-*-square.svg` |
| `src/components/ui/logo.tsx` | 12-14 | Logo path references | Update paths |

---

## 9. Comments (5)

| File | Line | Note |
|------|------|------|
| `src/app/lib/google-auth.ts` | 33 | Comment mentions "not HeyContent" - update |
| `src/app/dashboard/notes/components/cards/NoteCard.tsx` | 133 | `.includes('heycontent')` check |

---

## Already Correct (3)

These directories already use "heycontext":
- `/src/app/compare/heycontext-vs-chatgpt/`
- `/src/app/compare/heycontext-vs-claude/`
- `/src/app/compare/heycontext-vs-notion-ai/`

---

## Execution Script

```bash
# Create backup branch first
git checkout -b pre-rename-backup
git checkout main

# Rename files
cd /Users/ariaxhan/Documents/Vaults/CodingVault/heycontent-web
mv public/heycontent-logo.svg public/heycontext-logo.svg
mv public/hey-content-small-square.svg public/heycontext-small-square.svg
mv public/hey-content-medium-square.svg public/heycontext-medium-square.svg
mv public/hey-content-large-square.svg public/heycontext-large-square.svg

# Global text replace (run separately for case sensitivity)
# Test with grep first, then apply with sed
```
