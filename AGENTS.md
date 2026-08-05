Be extremely concise. Sacrifice grammar for concision.
Frontend is partially migrated from vanilla JS to SolidJS — new components use `.tsx`, legacy code remains vanilla.
Single test file: `pnpm vitest run path/to/test.ts`
When running oxc lint, always use `--format agent`.
For typechecking, use `pnpm oxlint --type-aware --type-check` instead of `tsc`.
For styling, use Tailwind CSS, class property, `cn` utility. Do not use classlist. Only colors available are those defined in Tailwind config.
In legacy code, use `i` tags with FontAwesome classes. In new code, use `Fa` component.
In plan mode, before writing up a plan, ask clarifying questions if needed. At the end of plan mode, give me a list of unresolved questions to answer, if any. Make them concise.

## Session Summary (Jul 14)

### TypeUZ branding
- Landing page (`/`) → TypeUZ hero, O'zbekiston flag, IT markaz kontakti
- Header/footer → typeuz.uz, Telegram kontakt
- Routing → / typeuz.uz qismlarga (test, about, settings, leaderboards, account)
- 404, email-handler, SupportModal, ContactModal → typeuz ga o'zgartirildi
- CSS: `typeuz` (dark), `typeuz_light` (light) temalari
- Rang: #FF5A1F (main orange)
- Default config: uzbek language
- About page: rewritten for typeuz
- Leaderboard: simplified (select → time/language, clean table, emoji top-3)
- Screenshot watermark: `typeuz.uz`, filename `typeuz-result-*.png`

### Backend
- MongoDB/Redis/Firebase required → dev rejimida ishlaydi (local JSON fayllar)
- Server localhost:5005
- Auth: email/parol + Google, gender/age/avatar schema da bor
- Email client → dev rejimida console.log
- Discord WebSocket → o'chirildi
- Rate limiter → dev rejimida o'chirildi
- George queue → o'chirildi
- Unused imports/dev tools olib tashlandi
- `esw` olib tashlandi

### Still has monkeytype references (not cleaned yet)
- `backend/email-templates/` (reset-password, verification)
- `backend/scripts/openapi.ts` (title/description/url)
- `frontend/src/ts/elements/psa.tsx` (monkeytype.instatus.com)
- `frontend/src/ts/elements/merch-banner.tsx` (monkeytype.store)
- `frontend/vite-plugins/env-config.ts` (api.monkeytype.com default)
- `frontend/src/ts/components/pages/account-settings/ApeKeysTab.tsx` (monkeytype link)
- `frontend/src/ts/controllers/eg-ad-controller.ts` (monkeytype.com ad param)
- `frontend/static/robots.txt`, `sitemap.xml`, `.well-known/security.txt`
- `frontend/vite.config.ts` (sentry org/key)
- `backend/src/utils/misc.ts` (default frontend URL)
- `backend/src/init/email-client.ts` (email subject/from)
- `backend/src/api/routes/docs.ts` (CSP)
- `frontend/src/ts/components/pages/account-settings/AccountTab.tsx` (Discord text, name editing removed—moved to EditProfileModal)
- `packages/contracts` imports (minor - `@typeuz/...` package refs)

### Settings page removed (Jul 15)
- Sozlamalar nav item → olib tashlandi
- `/settings` route → olib tashlandi (route-controller.ts, page-controller.ts, index.html div, PageName type union)
- Name editing → EditProfileModal ga ko'chirildi (showUpdateNameModal trigger button)
- AccountTab'dagi UpdateAccountName sektsiyasi → olib tashlandi
- `settings-highlight` CSS class → olib tashlandi (tailwind.css)
- SettingsPage.tsx + mount.tsx registration olib tashlandi

### Yangi funksiyalar (Jul 15)
- **About page** kengaytirildi: tarix, 9 xususiyat, AI tahlil promo, 6 savolli FAQ, statistika, CTA
- **Legal pages** (privacy, terms, security) → to'liq O'zbek tilida, O'zbekiston qonunchiligiga mos
- **CAPTCHA** Login.tsx ga qo'shildi (Register bilan bir xil showRegisterCaptchaModal)
- **AI Weekly Analysis** backend → frontend → landing promo:
  - `packages/contracts/src/users.ts` → `getWeeklyAnalysis` endpoint (GET)
  - `backend/src/api/controllers/user.ts` → `getWeeklyAnalysis` (7 kunlik natijalar, trend, daily breakdown, recommendation)
  - `backend/src/api/routes/users.ts` → route mapping
  - `frontend/src/ts/components/pages/profile/UserProfile.tsx` → `WeeklyAnalysis` card (stats, trend, chart, recommendation)
  - `frontend/src/ts/components/pages/landing/LandingPage.tsx` → FeatureCard "AI tahlil"

### Firebase olib tashlandi → custom auth (Jul 16)
- **Backend API**: `POST /auth/email/register`, `/auth/email/login`, `/auth/google`, `/auth/github`
- **JWT**: `backend/src/utils/jwt.ts` — `signToken()`/`verifyToken()`
- **Auth middleware** (`backend/src/middlewares/auth.ts`): custom JWT (Bearer) → falls back to Firebase
- **Frontend**: `custom-auth.ts` / `custom-auth-api.ts` — backend auth, localStorage token
- **firebase.ts** `init()`: dev mode → checks stored JWT first, then dev-auth
- **firebase.ts** `isAuthAvailable()`: returns `true` if JWT in localStorage
- **auth.tsx** `signIn`, `signUp`, `signInWithProvider`, `signOut`: fallback to custom auth when Firebase Auth unavailable
- **ts-rest-adapter.ts**: sends stored JWT as `Bearer` header
- **User DAL**: added `findByEmail()`
- **Dev store**: `backend/src/utils/dev-store.ts` — JSON file persistence in `.dev-data/`
- **Auth routes**: use `findUserByEmail` + `devGet`/`devSet` in dev mode (no MongoDB needed)

### Hali tozalanmagan monkeytype reference
- ✅ All cleaned. Remaining: `frontend/static/challenges/sourcecode.txt` (historical typing content), `scripts/rename-packages.sh` (migration script), `AGENTS.md` (status doc).

### Jul 22 — MongoDB → Supabase PostgreSQL migration (backend)
- **DAL rewrite**: All 13 DAL files (`psa.ts`, `admin-uids.ts`, `quote-ratings.ts`, `config.ts`, `logs.ts`, `report.ts`, `preset.ts`, `ape-keys.ts`, `blocklist.ts`, `public.ts`, `result.ts`, `new-quotes.ts`, `connections.ts`, `leaderboards.ts`, `user.ts`) rewritten from MongoDB driver to `pg` (PostgreSQL) with JSONB columns.
- **db.ts**: Replaced `collection<T>()` with `query()`, `queryOne()`, `queryAll()`, backward-compatible `collection()` shim for admin.ts / legacy code.
- **`.env`**: Changed `DB_URI`/`DB_NAME` → `DATABASE_URL`.
- **`misc.ts`**: Removed `ObjectId`, `replaceObjectId`/`replaceObjectIds` now identity (since `_id` is always `string`).
- **Controllers fixed**: `admin.ts`, `ape-key.ts`, `connections.ts`, `result.ts`, `user.ts`, `quote.ts`, `leaderboard.ts`, `public.ts`, `dev.ts` — updated all MongoDB method calls, `toHexString()` → direct use, `contentId` → `content_id`, snake_case ↔ camelCase mappings.
- **Jobs**: `delete-inactive-users.ts` rewritten to `db.query()`; `update-leaderboards.ts` fixed type.
- **Migration**: `supabase/migrations/0001_init.sql` created with full PG schema.
- **Build**: `pnpm build-be` passes cleanly (7 packages, 0 errors).
- **Still todo**: integration tests (PG testcontainer), deploy (Railway backend, Netlify frontend), frontend owa.uz‑style UI enhancements.
