# Harvest Finance GitHub Issues (201-400)

Frontend/backend-focused continuation of the issue backlog. Organized into waves below.


## Wave 5: Frontend — Good First Issues (201-250)

### 201. **Add aria-label attributes to the Button component**
    - Hint: frontend/src/components/ui/Button/Button.tsx — icon-only variants expose no accessible name.
    - Ensure loading/disabled states are announced to screen readers.
    - Labels: frontend, good first issue

### 202. **Add loading skeletons to VaultCard**
    - Hint: frontend/src/components/dashboard/VaultCard.tsx — render components/ui/Skeleton while data is undefined.
    - Keep skeleton dimensions matching the final card to avoid layout shift.
    - Labels: frontend, good first issue

### 203. **Document the useNotifications hook**
    - Hint: frontend/src/hooks/useNotifications.ts — add JSDoc describing return shape and event channels.
    - Include a minimal usage example for toasts vs in-app badges.
    - Labels: frontend, good first issue

### 204. **Add alt-text fallback for vault imagery in VaultTable**
    - Hint: frontend/src/components/dashboard/VaultTable.tsx — derive alt from vault name when image missing.
    - Labels: frontend, good first issue

### 205. **Memoize expensive selectors in the portfolio store**
    - Hint: frontend/src/store — wrap derived totals with useMemo / reselect to prevent re-render storms.
    - Labels: frontend, good first issue

### 206. **Add keyboard focus ring to Modal close button**
    - Hint: frontend/src/components/ui/Modal/Modal.tsx — ensure :focus-visible outline is visible.
    - Labels: frontend, good first issue

### 207. **Create a reusable EmptyState component**
    - Hint: frontend/src/components/ui — used by vaults/portfolio/transactions pages when lists are empty.
    - Labels: frontend, good first issue

### 208. **Add rel=noopener to external links in landing**
    - Hint: frontend/src/components/landing — audit anchor tags that open docs/marketplaces in new tabs.
    - Labels: frontend, good first issue

### 209. **Document the lib/api client request helpers**
    - Hint: frontend/src/lib/api — explain auth header injection, error normalization, and base URL resolution.
    - Labels: frontend, good first issue

### 210. **Add a confirmed-delete guard to community GroupCard remove**
    - Hint: frontend/src/components/community/GroupCard.tsx — require a second confirmation before deletion.
    - Labels: frontend, good first issue

### 211. **Extract shared currency formatting util**
    - Hint: frontend/src/lib — consolidate number/USD formatting duplicated across BalanceDisplay and VaultOverview.
    - Labels: frontend, good first issue

### 212. **Add Storybook-style prop docs to Card**
    - Hint: frontend/src/components/ui/Card/Card.tsx — document padding/elevation/as variants.
    - Labels: frontend, good first issue

### 213. **Fix inconsistent button sizes across dashboard**
    - Hint: Compare frontend/src/components/ui/Button/Button.tsx with dashboard DepositModal/WithdrawModal triggers.
    - Labels: frontend, good first issue

### 214. **Add an accessible label to ThemeToggle**
    - Hint: frontend/src/components/ui/ThemeToggle.tsx — announce current light/dark state on toggle.
    - Labels: frontend, good first issue

### 215. **Add unit tests for lib/validations schemas**
    - Hint: frontend/src/lib/validations — cover deposit amount, email, and Stellar public key schemas.
    - Labels: frontend, good first issue

### 216. **Document the i18n message structure**
    - Hint: frontend/src/messages and src/i18n — explain key namespacing and how to add a new locale.
    - Labels: frontend, good first issue

### 217. **Add a hover/focus state to ListingCard**
    - Hint: frontend/src/components/marketplace/ListingCard.tsx — add elevation and cursor pointer.
    - Labels: frontend, good first issue

### 218. **Replace hardcoded color literals with theme tokens**
    - Hint: Audit frontend/src/components/dashboard for raw hex values that bypass the theme provider.
    - Labels: frontend, good first issue

### 219. **Add a max-width container to settings page**
    - Hint: frontend/src/app/settings/page.tsx — prevent over-stretching on ultra-wide viewports.
    - Labels: frontend, good first issue

### 220. **Add a favicon/theme-color metadata**
    - Hint: frontend/src/app/layout.tsx — set icons and themeColor for mobile/PWA.
    - Labels: frontend, good first issue

### 221. **Document the freighter wallet adapter**
    - Hint: frontend/src/lib/freighter — explain connect, sign, and public key retrieval flows.
    - Labels: frontend, good first issue

### 222. **Add reduced-motion support to YieldChart animations**
    - Hint: frontend/src/components/YieldChart.tsx — respect prefers-reduced-motion.
    - Labels: frontend, good first issue

### 223. **Add a tooltip to StrategyBadge variants**
    - Hint: frontend/src/components/ui/Badge/StrategyBadge.tsx — explain each strategy type on hover.
    - Labels: frontend, good first issue

### 224. **Add input character counters to CreatePostForm**
    - Hint: frontend/src/components/community/CreatePostForm.tsx — show remaining characters vs max length.
    - Labels: frontend, good first issue

### 225. **Standardize error message copy in auth pages**
    - Hint: frontend/src/app/login, signup, forgot-password, reset-password — centralize strings in messages.
    - Labels: frontend, good first issue

### 226. **Add a skip-to-content link in layout**
    - Hint: frontend/src/app/layout.tsx — improve keyboard navigation for screen readers.
    - Labels: frontend, good first issue

### 227. **Document the analytics tracking wrapper**
    - Hint: frontend/src/lib/analytics — describe event names and when page views fire.
    - Labels: frontend, good first issue

### 228. **Add loading state to WalletConnectModal submit**
    - Hint: frontend/src/components/wallet/WalletConnectModal.tsx — disable button + spinner during connect.
    - Labels: frontend, good first issue

### 229. **Add accessible table captions to TransactionTable**
    - Hint: frontend/src/components/portfolio/TransactionTable.tsx — add a <caption> describing the data.
    - Labels: frontend, good first issue

### 230. **Extract a shared Spinner component**
    - Hint: frontend/src/components/ui — replace ad-hoc spinners in dashboard/modals with one component.
    - Labels: frontend, good first issue

### 231. **Add a responsive breakpoint check to Admin dashboard**
    - Hint: frontend/src/app/admin/dashboard — ensure charts stack on small screens.
    - Labels: frontend, good first issue

### 232. **Document the types directory contracts**
    - Hint: frontend/src/types — describe Vault, Deposit, Strategy DTOs and their backend source.
    - Labels: frontend, good first issue

### 233. **Add focus trap to ExportKeyModal**
    - Hint: frontend/src/components/wallet/ExportKeyModal.tsx — keep Tab focus inside the modal.
    - Labels: frontend, good first issue

### 234. **Add a clear-all button to notification center**
    - Hint: frontend/src/components/Notification — let users dismiss all at once.
    - Labels: frontend, good first issue

### 235. **Add a default sort to VaultTable**
    - Hint: frontend/src/components/dashboard/VaultTable.tsx — default sort by TVL or APY descending.
    - Labels: frontend, good first issue

### 236. **Document the app router route groups**
    - Hint: frontend/src/app — explain (marketing) vs dashboard layout boundaries and shared loaders.
    - Labels: frontend, good first issue

### 237. **Add a friendly empty state to YieldAnalytics page**
    - Hint: frontend/src/app/yield-analytics/page.tsx — guide users when no history exists.
    - Labels: frontend, good first issue

### 238. **Add alt text to SeasonalTipCard illustrations**
    - Hint: frontend/src/components/seasonal-tips/SeasonalTipCard.tsx — describe imagery for AT users.
    - Labels: frontend, good first issue

### 239. **Add a reusable ConfirmDialog primitive**
    - Hint: frontend/src/components/ui — back DeleteVault/Withdraw confirmations with one accessible dialog.
    - Labels: frontend, good first issue

### 240. **Add visible labels (not just placeholders) to auth forms**
    - Hint: frontend/src/app/login, signup — associate <label> with each input for a11y.
    - Labels: frontend, good first issue

### 241. **Document the store persistence strategy**
    - Hint: frontend/src/store — explain what is persisted to localStorage and hydration timing.
    - Labels: frontend, good first issue

### 242. **Add hover preview thumbnail to VaultActivityFeed rows**
    - Hint: frontend/src/components/VaultActivityFeed.tsx — optional asset preview on row hover.
    - Labels: frontend, good first issue

### 243. **Add a print stylesheet for portfolio overview**
    - Hint: frontend/src/components/portfolio/PortfolioOverview.tsx — hide nav/chrome when printing.
    - Labels: frontend, good first issue

### 244. **Add a 'copy address' button to BalanceDisplay**
    - Hint: frontend/src/components/wallet/BalanceDisplay.tsx — clipboard copy with confirmation toast.
    - Labels: frontend, good first issue

### 245. **Add story/test for MobileVaultCard**
    - Hint: frontend/src/components/dashboard/MobileVaultCard.tsx — snapshot test at 375px width.
    - Labels: frontend, good first issue

### 246. **Document the lib/errors taxonomy**
    - Hint: frontend/src/lib/errors — map backend error codes to user-facing messages.
    - Labels: frontend, good first issue

### 247. **Add a debounce to community search input**
    - Hint: frontend/src/app/community — throttle the search request to avoid spamming the API.
    - Labels: frontend, good first issue

### 248. **Add contrast-checked status colors**
    - Hint: Audit success/warning/danger colors in dashboard vs WCAG AA on the theme background.
    - Labels: frontend, good first issue

### 249. **Add a 'back to top' control on long lists**
    - Hint: frontend/src/app/transactions, marketplace — floating button after N rows.
    - Labels: frontend, good first issue

### 250. **Document the realtime websocket client setup**
    - Hint: frontend/src/lib/api or hooks — explain reconnection, auth handshake, and channel subscribe.
    - Labels: frontend, good first issue


## Wave 6: Frontend — Intermediate Improvements (251-300)

### 251. **Implement optimistic updates for deposit/withdraw**
    - Hint: frontend/src/components/dashboard/DepositModal.tsx — update balance immediately, reconcile on confirmation.
    - Add rollback on failure with a toast explaining the revert.
    - Labels: frontend

### 252. **Add pagination to Transactions page**
    - Hint: frontend/src/app/transactions — cursor/offset pagination with a 'load more' and page controls.
    - Labels: frontend

### 253. **Build a shared form validation layer**
    - Hint: frontend/src/lib/validations + components/ui/Input — wire zod errors into field-level messages.
    - Labels: frontend

### 254. **Implement vault detail page routing with loading UI**
    - Hint: frontend/src/app/vaults — add dynamic [id] route with Suspense and notFound handling.
    - Labels: frontend

### 255. **Add a strategy comparison view**
    - Hint: frontend/src/app/strategies — compare APY, risk, and duration side-by-side from yield-analytics.
    - Labels: frontend

### 256. **Implement infinite scroll for marketplace listings**
    - Hint: frontend/src/app/marketplace + ListingCard — IntersectionObserver driven fetch-next-page.
    - Labels: frontend

### 257. **Add a global error boundary with recovery**
    - Hint: frontend/src/app/layout.tsx — catch render errors, show reset + report actions.
    - Labels: frontend

### 258. **Implement dark/light chart theming**
    - Hint: frontend/src/components/YieldChart.tsx and AnalyticsCharts — read theme tokens for axis/grid colors.
    - Labels: frontend

### 259. **Add file upload preview to CreatePostForm**
    - Hint: frontend/src/components/community/CreatePostForm.tsx — image preview, size/type validation.
    - Labels: frontend

### 260. **Build a reusable DataToolbar (search + filter + sort)**
    - Hint: frontend/src/components/ui — used by vaults, transactions, marketplace, community.
    - Labels: frontend

### 261. **Implement wallet connection state machine**
    - Hint: frontend/src/lib/freighter + store — model disconnected/connecting/connected/error states explicitly.
    - Labels: frontend

### 262. **Add a toast notification system for API errors**
    - Hint: frontend/src/components/Notification + lib/errors — surface non-fatal backend errors as toasts.
    - Labels: frontend

### 263. **Implement CSV/PDF export from frontend**
    - Hint: frontend/src/components/dashboard/ExportButton.tsx — client-side export using existing backend export endpoint.
    - Labels: frontend

### 264. **Add a multi-step signup wizard**
    - Hint: frontend/src/app/signup — split profile, wallet, and preferences into steps with progress.
    - Labels: frontend

### 265. **Build an operator directory with filters**
    - Hint: frontend/src/app/operators + components/operator — filter by region, rating, crops.
    - Labels: frontend

### 266. **Implement realtime platform metrics polling fallback**
    - Hint: frontend/src/components/realtime/LivePlatformMetrics.tsx — poll REST when websocket is down.
    - Labels: frontend

### 267. **Add skeleton screens for dashboard sections**
    - Hint: frontend/src/app/dashboard — per-section skeletons instead of one global spinner.
    - Labels: frontend

### 268. **Implement client-side caching for vault list**
    - Hint: frontend/src/lib/api — cache GET /vaults with stale-while-revalidate to cut latency.
    - Labels: frontend

### 269. **Add a confirmation step with fee preview to WithdrawModal**
    - Hint: frontend/src/components/dashboard/WithdrawModal.tsx — show estimated network + vault fees before sign.
    - Labels: frontend

### 270. **Build a notifications inbox page**
    - Hint: frontend/src/app + hooks/useNotifications — list, mark read, preferences link.
    - Labels: frontend

### 271. **Implement accessible combobox for strategy select**
    - Hint: frontend/src/components/dashboard/StrategyDetails.tsx — keyboard-navigable, ARIA 1.2 combobox.
    - Labels: frontend

### 272. **Add pull-to-refresh on mobile dashboard**
    - Hint: frontend/src/app/dashboard/mobile — touch gesture to refetch vault data.
    - Labels: frontend

### 273. **Implement deep-linking for vault/strategy share**
    - Hint: frontend/src/app/vaults/[id] — copy link button and og:image metadata for social.
    - Labels: frontend

### 274. **Add a 'what changed' diff view for vault edits (admin)**
    - Hint: frontend/src/components/Admin/VaultManagement.tsx — show before/after of edited fields.
    - Labels: frontend

### 275. **Build a reusable Stepper component**
    - Hint: frontend/src/components/ui — used by signup wizard, deposit flow, operator onboarding.
    - Labels: frontend

### 276. **Implement search-as-you-type for help center**
    - Hint: frontend/src/app/help + content/help — client filter with highlight + no backend round-trip.
    - Labels: frontend

### 277. **Add a risk disclaimer modal before first deposit**
    - Hint: frontend/src/components/dashboard/DepositModal.tsx — require acknowledge for new users.
    - Labels: frontend

### 278. **Implement responsive admin data tables**
    - Hint: frontend/src/components/Admin + components/ui/Table — horizontal scroll + column hide on mobile.
    - Labels: frontend

### 279. **Add an offline banner when network drops**
    - Hint: frontend/src/app/layout.tsx — listen to navigator.onLine and show retry.
    - Labels: frontend

### 280. **Build a reusable Avatar component**
    - Hint: frontend/src/components/ui — initials fallback, image load error handling, sizes.
    - Labels: frontend

### 281. **Implement vault favorite/bookmark list**
    - Hint: frontend/src/store — persist bookmarks locally and surface on dashboard.
    - Labels: frontend

### 282. **Add a chart tooltip with exact values**
    - Hint: frontend/src/components/operator/ScoreHistoryChart.tsx — hover crosshair + value readout.
    - Labels: frontend

### 283. **Implement settings page sections (profile, security, notifications)**
    - Hint: frontend/src/app/settings/page.tsx — tabbed sections wired to backend DTOs.
    - Labels: frontend

### 284. **Add a guided onboarding tour**
    - Hint: frontend/src/app/dashboard — spotlight key actions for first-time users.
    - Labels: frontend

### 285. **Build an accessible date range picker**
    - Hint: frontend/src/components/ui — used by yield-analytics and transactions filters.
    - Labels: frontend

### 286. **Implement lazy-loaded route chunks**
    - Hint: frontend/src/app — verify next/dynamic or automatic code-splitting for heavy pages (analytics, admin).
    - Labels: frontend

### 287. **Add a 'copy invite link' for community groups**
    - Hint: frontend/src/components/community/GroupCard.tsx — generate shareable link with clipboard toast.
    - Labels: frontend

### 288. **Implement form autosave for long community posts**
    - Hint: frontend/src/components/community/CreatePostForm.tsx — persist draft to localStorage.
    - Labels: frontend

### 289. **Add a 'recently viewed vaults' rail on dashboard**
    - Hint: frontend/src/app/dashboard — track views in store, render horizontal rail.
    - Labels: frontend

### 290. **Build a reusable Tabs primitive**
    - Hint: frontend/src/components/ui — ARIA tablist used by settings, strategy details, admin.
    - Labels: frontend

### 291. **Implement currency/locale switcher**
    - Hint: frontend/src/app/layout.tsx + lib — switch fiat display and number formatting globally.
    - Labels: frontend

### 292. **Add a confirmation toast after successful deposit**
    - Hint: frontend/src/components/dashboard/DepositModal.tsx — link toast to transaction detail.
    - Labels: frontend

### 293. **Implement viewport-based image lazy loading**
    - Hint: frontend/src/components/landing + marketplace — native loading='lazy' / blur-up placeholders.
    - Labels: frontend

### 294. **Add a 'reset filters' affordance to toolbars**
    - Hint: frontend/src/components/ui (DataToolbar) — one-click clear of search/filter/sort.
    - Labels: frontend

### 295. **Build a keyboard shortcuts help dialog**
    - Hint: frontend/src/components/providers — show bindings (? key) for power users.
    - Labels: frontend

### 296. **Implement a11y-tested focus order on auth flow**
    - Hint: frontend/src/app/login + signup — tab order matches visual order; no focus traps.
    - Labels: frontend

### 297. **Add a 'view as farmer / operator / admin' preview toggle (dev)**
    - Hint: frontend/src/app/settings — local role switcher for QA without backend auth.
    - Labels: frontend

### 298. **Implement relative time formatting (e.g. '2h ago')**
    - Hint: frontend/src/lib — shared formatter used by feeds, transactions, notifications.
    - Labels: frontend

### 299. **Add a 'share progress' card for achievements**
    - Hint: frontend/src/components — surface achievements with og share for community.
    - Labels: frontend

### 300. **Build a reusable StatCard (label/value/delta/trend)**
    - Hint: frontend/src/components/ui — back dashboard KPIs and admin analytics.
    - Labels: frontend


## Wave 7: Frontend — Advanced & Component Architecture (301-340)

### 301. **Establish a centralized API client with typed errors**
    - Hint: frontend/src/lib/api — single fetch wrapper returning typed success/error unions; retire inline fetch calls.
    - Labels: frontend, architecture

### 302. **Introduce React Query / SWR for server state**
    - Hint: Replace ad-hoc useEffect fetching in dashboard/vaults with a cached query layer.
    - Labels: frontend, architecture

### 303. **Define a design-token pipeline (CSS vars + TS)**
    - Hint: frontend/src/components/ui/theme — export tokens as TS constants consumed by components and charts.
    - Labels: frontend, architecture

### 304. **Create a component variant system with CVA**
    - Hint: frontend/src/components/ui — standardize Button/Card/Modal variants via class-variance-authority.
    - Labels: frontend, architecture

### 305. **Implement a route-level loading & error convention**
    - Hint: frontend/src/app — enforce loading.tsx + error.tsx + not-found.tsx per segment.
    - Labels: frontend, architecture

### 306. **Build a feature-based folder convention**
    - Hint: Refactor components/* into feature modules (vault, wallet, community) with co-located tests.
    - Labels: frontend, architecture

### 307. **Add end-to-end tests for the deposit flow**
    - Hint: frontend/src/__tests__ + Playwright — connect wallet, deposit, assert balance + toast.
    - Labels: frontend, architecture

### 308. **Implement a mock API layer for local development**
    - Hint: frontend/src/lib/api — MSW handlers so UI dev runs without backend.
    - Labels: frontend, architecture

### 309. **Standardize date/time handling with a single lib**
    - Hint: Replace ad-hoc Date usage with date-fns/Intl consistently across feeds and analytics.
    - Labels: frontend, architecture

### 310. **Add visual regression testing for core UI**
    - Hint: Integrate Chromatic/Playwright screenshots for dashboard, modals, and charts.
    - Labels: frontend, architecture

### 311. **Implement a frontend feature-flag system**
    - Hint: frontend/src/lib — toggle experimental UI (AI assistant, new marketplace) without deploys.
    - Labels: frontend, architecture

### 312. **Create a shared layout primitives package**
    - Hint: frontend/src/components/ui/Container, Card, Modal — promote to internal UI lib.
    - Labels: frontend, architecture

### 313. **Add performance budgets to the build**
    - Hint: frontend/package.json + CI — fail build if first-load JS exceeds threshold.
    - Labels: frontend, architecture

### 314. **Implement proper SSR/CSR boundary for wallet data**
    - Hint: frontend/src/app — ensure wallet-dependent UI is client-only to avoid hydration mismatch.
    - Labels: frontend, architecture

### 315. **Build an accessible chart component library**
    - Hint: frontend/src/components — wrap YieldChart/ScoreHistoryChart with canvas + table fallbacks.
    - Labels: frontend, architecture

### 316. **Add a centralized toast/notification manager**
    - Hint: frontend/src/components/Notification — single queue with priority, dedupe, and stacking.
    - Labels: frontend, architecture

### 317. **Implement i18n runtime language switching**
    - Hint: frontend/src/i18n + messages — switch locale without full reload, persist choice.
    - Labels: frontend, architecture

### 318. **Add a component testing harness (RTL)**
    - Hint: frontend/src/lib/__tests__ — configure jest/testing-library with theme + providers wrapper.
    - Labels: frontend, architecture

### 319. **Establish a11y CI with axe**
    - Hint: Run jest-axe in component tests and a11y lint in CI for PRs.
    - Labels: frontend, architecture

### 320. **Implement a typed navigation/routing helper**
    - Hint: frontend/src/lib — typed route builders to avoid stringly-typed router.push calls.
    - Labels: frontend, architecture

### 321. **Create a Storybook for the UI kit**
    - Hint: Document every components/ui primitive with variants and a11y notes.
    - Labels: frontend, architecture

### 322. **Add a frontend observability/error reporter**
    - Hint: frontend/src/lib/analytics — capture unhandled errors + route timing to backend observability.
    - Labels: frontend, architecture

### 323. **Implement request cancellation on unmount**
    - Hint: frontend/src/lib/api — abort in-flight requests when components unmount to avoid setState warnings.
    - Labels: frontend, architecture

### 324. **Build a theming switch that persists per-device**
    - Hint: frontend/src/components/providers/ThemeProvider.tsx — respect OS preference + manual override stored.
    - Labels: frontend, architecture

### 325. **Add a11y audits to the landing page**
    - Hint: frontend/src/components/landing — headings order, landmarks, color contrast.
    - Labels: frontend, architecture

### 326. **Implement a cache invalidation strategy for mutations**
    - Hint: When deposit/withdraw succeeds, invalidate vault + portfolio queries precisely.
    - Labels: frontend, architecture

### 327. **Create a reusable Modal/Dialog with focus scope**
    - Hint: frontend/src/components/ui/Modal — portals, scroll lock, ESC, focus return.
    - Labels: frontend, architecture

### 328. **Add bundle analysis to CI**
    - Hint: Generate webpack/rollup report and comment size deltas on PRs.
    - Labels: frontend, architecture

### 329. **Implement a consistent empty/error/loading triplet**
    - Hint: frontend/src/components/ui — EmptyState, ErrorState, LoadingState used app-wide.
    - Labels: frontend, architecture

### 330. **Build a role-based UI gate component**
    - Hint: frontend/src/components — <Can role='admin'> wrapper driven by auth store.
    - Labels: frontend, architecture

### 331. **Add a design-system documentation site**
    - Hint: Auto-generate from components/ui with usage + a11y guidance.
    - Labels: frontend, architecture

### 332. **Implement safe HTML rendering for community posts**
    - Hint: frontend/src/components/community/PostCard.tsx — sanitize user HTML to avoid XSS.
    - Labels: frontend, architecture

### 333. **Add a frontend rate-limit/backoff for polling**
    - Hint: frontend/src/lib/api — exponential backoff when 429 from backend realtime/metrics.
    - Labels: frontend, architecture

### 334. **Create a reusable money input with formatting**
    - Hint: frontend/src/components/ui/Input — live currency formatting + min/max validation for amounts.
    - Labels: frontend, architecture

### 335. **Implement a consistent focus-visible policy**
    - Hint: frontend/src/components/ui/theme — global :focus-visible outline token.
    - Labels: frontend, architecture

### 336. **Add a service-worker for offline asset caching**
    - Hint: frontend — precache shell, runtime-cache API GETs for read-only views.
    - Labels: frontend, architecture

### 337. **Build an in-app changelog/release notes view**
    - Hint: frontend/src/app/help — fetch release notes, show 'what's new' on version bump.
    - Labels: frontend, architecture

### 338. **Implement a type-safe env config module**
    - Hint: frontend/src/lib — zod-validated NEXT_PUBLIC_* config with defaults.
    - Labels: frontend, architecture

### 339. **Add a 'reduce data usage' mode**
    - Hint: frontend/src/store — disable auto-refresh, lower chart resolution, skip images.
    - Labels: frontend, architecture

### 340. **Establish a contribution guide for frontend components**
    - Hint: Document naming, prop patterns, testing, and a11y checklist in repo docs.
    - Labels: frontend, architecture


## Wave 8: Backend — Feature & Integration Work (341-380)

### 341. **Add cursor-based pagination to vaults controller**
    - Hint: backend/src/vaults/vaults.controller.ts + vaults.service.ts — keyset pagination for large vault lists.
    - Labels: backend, feature

### 342. **Implement webhook retry with exponential backoff**
    - Hint: backend/src/webhooks/webhooks.service.ts — durable retry queue with dead-letter after N attempts.
    - Labels: backend, feature

### 343. **Add Telegram notification delivery provider**
    - Hint: backend/src/integrations/telegram/telegram.service.ts — send deposit/withdraw/alert messages.
    - Labels: backend, feature

### 344. **Implement SMS provider abstraction**
    - Hint: backend/src/notifications/sms/sms.service.ts — interface so Twilio/ Vonage swap without call-site changes.
    - Labels: backend, feature

### 345. **Add email template rendering with i18n**
    - Hint: backend/src/notifications/email/email-templating.service.ts — locale-aware templates per user preference.
    - Labels: backend, feature

### 346. **Build a payment provider interface + Stripe adapter**
    - Hint: backend/src/payments/interfaces + providers — uniform charge/refund/payout API.
    - Labels: backend, feature

### 347. **Implement rewards accrual job**
    - Hint: backend/src/rewards/rewards.service.ts — scheduled calculation of user/operator rewards.
    - Labels: backend, feature

### 348. **Add custodial wallet transfer limits & allowlist**
    - Hint: backend/src/wallets/custodial-wallet.service.ts — per-user daily caps and counterparty allowlist.
    - Labels: backend, feature

### 349. **Implement insurance claim review workflow**
    - Hint: backend/src/insurance/insurance.service.ts — pending/approved/denied states with auditor notes.
    - Labels: backend, feature

### 350. **Add portfolio valuation snapshot job**
    - Hint: backend/src/portfolio/portfolio.service.ts — periodic total-value computation for history charts.
    - Labels: backend, feature

### 351. **Implement realtime gateway auth & room scoping**
    - Hint: backend/src/realtime/realtime.gateway.ts — authenticate socket, restrict rooms by role/vault ownership.
    - Labels: backend, feature

### 352. **Add CQRS command validation pipeline for vaults**
    - Hint: backend/src/vaults/cqrs/commands — validate + authorize each command before handling.
    - Labels: backend, feature

### 353. **Implement domain-event outbox pattern**
    - Hint: backend/src/domain-events — transactional outbox so events (deposit, withdraw) are reliably published.
    - Labels: backend, feature

### 354. **Add secrets rotation for Stellar signing keys**
    - Hint: backend/src/common/secrets/secrets.service.ts — rotate custodial keys with dual-signature transition.
    - Labels: backend, feature

### 355. **Implement batch processor for statement generation**
    - Hint: backend/src/common/batch/batch-processor.service.ts — chunk large jobs with concurrency control.
    - Labels: backend, feature

### 356. **Add cache layer for frequently-read vault metrics**
    - Hint: backend/src/common/cache — TTL cache for TVL/APY to reduce recompute on hot paths.
    - Labels: backend, feature

### 357. **Implement multi-chain adapter registration**
    - Hint: backend/src/multi-chain — dynamic registration of chain adapters with health checks.
    - Labels: backend, feature

### 358. **Add webhook signature verification middleware**
    - Hint: backend/src/webhooks/guards + webhook-signature.service.ts — HMAC verify inbound webhooks.
    - Labels: backend, feature

### 359. **Implement export job for large datasets (streaming)**
    - Hint: backend/src/export/export.service.ts — stream CSV/Excel to avoid memory spikes.
    - Labels: backend, feature

### 360. **Add AI query-history analytics endpoint**
    - Hint: backend/src/ai-query-history/ai-query-history.service.ts — aggregate assistant usage by user/vault.
    - Labels: backend, feature

### 361. **Implement community feed moderation tools**
    - Hint: backend/src/community/community.service.ts — report, hide, and flag endpoints for moderators.
    - Labels: backend, feature

### 362. **Add harvest scheduler with failure handling**
    - Hint: backend/src/harvest/harvest-scheduler.service.ts — idempotent runs, alert on missed harvest.
    - Labels: backend, feature

### 363. **Implement achievements evaluation engine**
    - Hint: backend/src/achievements/achievements.service.ts — event-driven unlock of user milestones.
    - Labels: backend, feature

### 364. **Add verification delivery via IPFS**
    - Hint: backend/src/verification/services/ipfs.service.ts — pin proofs and return content-addressed URI.
    - Labels: backend, feature

### 365. **Implement risk scoring service v2**
    - Hint: backend/src/analytics/risk.service.ts — incorporate volatility, liquidity, and concentration.
    - Labels: backend, feature

### 366. **Add farm-intelligence weather caching**
    - Hint: backend/src/farm-intelligence/services/weather.service.ts — cache external weather to cut cost/latency.
    - Labels: backend, feature

### 367. **Implement state-sync reconciliation job**
    - Hint: backend/src/state-sync/state-sync.service.ts — detect drift between indexer and on-chain state.
    - Labels: backend, feature

### 368. **Add notification preferences enforcement**
    - Hint: backend/src/notifications/notification-preferences.service.ts — respect per-channel opt-outs.
    - Labels: backend, feature

### 369. **Implement orders settlement reconciliation**
    - Hint: backend/src/orders/orders.service.ts — match off-chain orders to on-chain fulfillment.
    - Labels: backend, feature

### 370. **Add coop-marketplace search & filter API**
    - Hint: backend/src/coop-marketplace/coop-marketplace.service.ts — query by category, price, region.
    - Labels: backend, feature

### 371. **Implement audit log for admin actions**
    - Hint: backend/src/admin/admin.service.ts — record who changed what on vaults/users.
    - Labels: backend, feature

### 372. **Add health checks for external dependencies**
    - Hint: backend/src/health/health.controller.ts — Horizon, DB, cache, webhook endpoints status.
    - Labels: backend, feature

### 373. **Implement idempotency keys for mutating endpoints**
    - Hint: backend/src/common — middleware storing request idempotency-key -> result to prevent double charges.
    - Labels: backend, feature

### 374. **Add structured config validation at boot**
    - Hint: backend/src/config — validate all env on startup; fail fast with clear message.
    - Labels: backend, feature

### 375. **Implement soft-delete + restore for users**
    - Hint: backend/src/users/users.service.ts — GDPR-friendly deletion with grace period.
    - Labels: backend, feature

### 376. **Add rate-limit per-route configuration**
    - Hint: backend/src/common/config/throttler.config.ts — tune limits for auth vs read endpoints.
    - Labels: backend, feature

### 377. **Implement vault fee computation service**
    - Hint: backend/src/vaults/fees.service.ts — performance/management fees with configurable schedule.
    - Labels: backend, feature

### 378. **Add withdrawal-queue service with ETA**
    - Hint: backend/src/vaults/withdrawal-queue.service.ts — FIFO queue + estimated completion time.
    - Labels: backend, feature

### 379. **Implement deposit-event replay protection**
    - Hint: backend/src/vaults/deposit-event.service.ts — dedupe by ledger/event id to avoid double credit.
    - Labels: backend, feature

### 380. **Add background job for yield-analytics rollups**
    - Hint: backend/src/yield-analytics/yield-analytics.service.ts — hourly/daily APY aggregates.
    - Labels: backend, feature


## Wave 9: Cross-cutting — Performance, Testing, UX & Observability (381-400)

### 381. **Add frontend bundle route-level code splitting report**
    - Hint: CI — annotate PRs with per-route JS size; flag regressions >10%.
    - Labels: enhancement, performance

### 382. **Implement backend response compression**
    - Hint: backend/src/main.ts — enable gzip/brotli for JSON and export endpoints.
    - Labels: enhancement, performance

### 383. **Add end-to-end API contract tests**
    - Hint: test/ — assert OpenAPI spec matches controller responses for vaults/orders/users.
    - Labels: testing, backend

### 384. **Implement request tracing IDs across FE->BE**
    - Hint: backend/src/common/middleware + frontend lib/api — propagate X-Request-Id, surface in errors.
    - Labels: observability, backend

### 385. **Add real-user monitoring for frontend**
    - Hint: frontend/src/lib/analytics — capture LCP/CLS/INP and send to observability.
    - Labels: observability, frontend

### 386. **Implement database query logging & slow-query alerts**
    - Hint: backend/src/database/data-source.ts + observability — log >100ms queries.
    - Labels: database, observability

### 387. **Add component-level render profiling**
    - Hint: frontend/src — use React Profiler in dev to flag re-renders in dashboard grids.
    - Labels: performance, frontend

### 388. **Implement cache stampede protection**
    - Hint: backend/src/common/cache — single-flight refresh for hot keys like platform metrics.
    - Labels: performance, backend

### 389. **Add accessibility smoke tests to E2E suite**
    - Hint: frontend/src/__tests__ — axe checks on critical flows (login, deposit, admin).
    - Labels: testing, ux

### 390. **Implement graceful degradation for realtime**
    - Hint: backend/src/realtime — when gateway overwhelmed, degrade to polling without erroring clients.
    - Labels: reliability, backend

### 391. **Add idempotent frontend mutation retries**
    - Hint: frontend/src/lib/api — retry deposit/withdraw POSTs safely using idempotency keys.
    - Labels: reliability, frontend

### 392. **Implement backend bulk endpoints for dashboard**
    - Hint: backend/src/vaults + portfolio — /bulk endpoint to fetch vault+balance+apy in one call.
    - Labels: performance, backend

### 393. **Add design-token-driven chart theming E2E**
    - Hint: Ensure YieldChart/AnalyticsCharts recolor on theme switch in tests.
    - Labels: ux, frontend

### 394. **Implement API deprecation headers & sunset**
    - Hint: backend/src/common/config/versioning.config.ts — emit Deprecation/Sunset on old API versions.
    - Labels: architecture, backend

### 395. **Add frontend error boundary telemetry correlation**
    - Hint: frontend/src/app/layout.tsx — attach request id + user to reported crashes.
    - Labels: observability, frontend

### 396. **Implement load tests for deposit spike**
    - Hint: test/ — simulate N concurrent deposits; measure p95 and queue depth.
    - Labels: testing, performance

### 397. **Add a11y lint rules to CI**
    - Hint: eslint jsx-a11y in frontend CI; block new violations.
    - Labels: ux, frontend

### 398. **Implement backend circuit breaker for Horizon calls**
    - Hint: backend/src/stellar/services/stellar-client.service.ts — open circuit on repeated failures.
    - Labels: reliability, backend

### 399. **Add a design-system visual diff in PRs**
    - Hint: Chromatic/Percy comment on UI PRs with changed components.
    - Labels: ux, frontend

### 400. **Implement cross-service distributed tracing**
    - Hint: backend/src/observability + frontend — OpenTelemetry spans from UI through API to Stellar calls.
    - Labels: observability, architecture

