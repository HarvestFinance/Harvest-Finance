# Harvest Finance — Consolidated Rewardable Issues

All 400 granular issues (Waves 1–9) have been compressed into the following 10
high-impact, well-scoped issues. Each issue aggregates related sub-tasks,
provides clear acceptance criteria, and includes concrete implementation hints
with file references. Contributors who complete any issue in full are eligible
for reward assessment.

---

## Issue 1 — Security Hardening Initiative

**Labels:** `security`, `backend`, `frontend`, `high-priority`, `rewardable`

### Description

Harvest Finance currently ships several known security gaps across the backend
and frontend codebases. This issue tracks the implementation of a comprehensive
security-hardening pass that closes OWASP Top 10 attack vectors and protects
user funds and data.

### Background / Rationale

The platform handles Stellar key management, JWT authentication, financial
vault operations, and user PII. Several issues explicitly call out insecure
defaults (`origin: '*'`, hardcoded JWT fallback secrets) and missing protections
(CSRF, SQL injection guards, secret encryption). Consolidating these into one
cohesive initiative ensures defense-in-depth is applied consistently.

### Acceptance Criteria

- [ ] **CORS** — `realtime.gateway.ts:26` replaces `origin: '*'` with an
  environment-driven whitelist. The same fix applies to any `@WebSocketGateway`
  and to global `main.ts` CORS config.
- [ ] **JWT secrets** — `auth/strategies/jwt.strategy.ts:26` throws on missing
  `JWT_SECRET` instead of silently falling back to a hardcoded value.
- [ ] **Input sanitization** — `InputSanitizerService` validates Stellar
  transaction XDR size limits to prevent oversized payload attacks
  (`stellar.strategy.ts`).
- [ ] **SQL injection** — All dynamic TypeORM queries in
  `soroban-indexer.service.ts` (esp. lines 249–268) use parameterized queries
  or `FindOptions` instead of raw string interpolation.
- [ ] **Request size limits** — `app.module.ts` / `main.ts` enforces
  `body-parser` `limit` for uploads and JSON bodies.
- [ ] **CSRF protection** — State-changing REST endpoints (non-GET) require
  CSRF tokens or same-site cookie enforcement.
- [ ] **Security headers** — Helmet.js (or equivalent) configured in `main.ts`
  for XSS, HSTS, CSP, and Referrer-Policy.
- [ ] **Refresh token storage** — `auth.service.ts` hashes refresh tokens in
  the database (no plaintext comparison).
- [ ] **Secret encryption at rest** — Sensitive database values (Stellar
  signing keys, secrets) are encrypted using a vault/KMS-backed scheme
  (`common/secrets/secrets.service.ts`).
- [ ] **Audit logging** — All sensitive operations (vault modifications, fund
  transfers, user role changes) emit structured audit-log entries with
  user ID, timestamp, and operation details.
- [ ] **Password reset rate limiting** — `auth.service.ts` enforces per-email
  reset request throttling (e.g., 3 requests / hour).

### Implementation Hints

- Reuse the existing `ThrottlerGuard` and `ThrottlerModule` already wired in
  `throttler.config.ts` for rate-limit enforcement.
- Reference `RED_TEAM_TESTING_REPORT.md` for findings already documented.
- Add security-focused unit tests in `test/security/`.

### Related Original Issues

31, 33, 152, 153, 154, 155, 156, 157, 158, 161, 163, 166

---

## Issue 2 — Authentication & Authorization System Overhaul

**Labels:** `auth`, `backend`, `security`, `high-priority`, `rewardable`

### Description

The authentication system needs a full overhaul to support robust JWT
handling, Stellar-native authentication, role-based access control, two-factor
authentication, and session management. This consolidates all auth-related
sub-tasks into a single coherent deliverable.

### Acceptance Criteria

- [ ] **StellarStrategy** — `auth/strategies/stellar.strategy.ts:14-16` removes
  the unused placeholder inheritance class. Line 39 provides a clear,
  actionable error message when `STELLAR_SERVER_SECRET` is missing.
- [ ] **Role validation** — New Stellar wallet users are assigned a default
  `farmer` role; role is verified on every authenticated request.
- [ ] **Reset token query fix** — `auth.service.ts:296` queries
  `resetPasswordExpires > NOW()` (not just equality) so expired tokens are
  rejected.
- [ ] **Password reset rate limiting** — Enforced per email (see Issue 1).
- [ ] **Refresh token rotation** — `refresh` endpoint returns a rotated
  refresh token; old tokens are invalidated (`auth.controller.ts:110`
  uses proper `TokenResponseDto`).
- [ ] **Logout** — Returns a proper response DTO and clears the refresh token
  (`auth.controller.ts:128`).
- [ ] **Session invalidation** — All sessions are revoked when a user changes
  their password.
- [ ] **2FA support** — TOTP-based two-factor authentication endpoint +
  QR code provisioning flow.
- [ ] **API key management** — CRUD endpoints for per-user API keys with
  scoped permissions.
- [ ] **IP-based anomaly detection** — Login attempts from new/unusual IPs
  trigger an alert or require additional verification.
- [ ] **Device fingerprint tracking** — Optional device metadata is captured
  and stored on login for suspicious-activity detection.
- [ ] **RBAC** — Fine-grained permissions for vault operations
  (create, deposit, withdraw, migrate, pause).
- [ ] **Stellar network passphrase validation** — Prevent testnet/mainnet
  confusion by validating the passphrase on every signed transaction.
- [ ] **Stellar XDR input sanitization** — Validate and limit XDR payload
  sizes (see Issue 1).

### Implementation Hints

- Extend `auth/dto/` with DTOs for 2FA enrollment, API key creation, and
  session list/revocation.
- Use `passport-custom` or a custom strategy for Stellar signature
  verification; avoid placeholder inheritance.
- Add `auth/decorators/roles.decorator.ts` and a `RolesGuard` for RBAC.
- Reference the existing `JWT_REFRESH_EXPIRES_IN` / `JWT_ACCESS_EXPIRES_IN`
  config.

### Related Original Issues

31, 33, 36, 42, 46, 47, 48, 49, 152, 153, 158, 159, 160, 163, 164, 165, 167, 169

---

## Issue 3 — Vault Operations & Financial Integrity

**Labels:** `backend`, `vaults`, `high-priority`, `rewardable`

### Description

Vault deposit, withdrawal, capacity management, fee computation, and event
handling must be robust, auditable, and production-ready. This issue covers
the core financial engine of the platform.

### Acceptance Criteria

- [ ] **Deposit flow integration tests** — `vaults.service.ts` tested for
  successful deposit, duplicate idempotency-key rejection, and capacity-exceeded
  scenarios.
- [ ] **Withdrawal flow integration tests** — Test sufficient-balance success
  path and insufficient-balance failure path.
- [ ] **Capacity calculation** — `vaults.service.ts:112-116`
  `availableCapacity` logic is documented, tested, and uses a named constant
  instead of magic numbers (`line 95, 149`).
- [ ] **Null safety** — `vaults.service.ts:196` handles null
  `stellarTransactionId` gracefully (no crash, meaningful log).
- [ ] **Pagination validation** — Soroban controller validates `skip`/`limit`
  bounds before querying.
- [ ] **Circuit breaker** — Stellar network calls in `stellar.service.ts` are
  wrapped in a circuit-breaker pattern (open on repeated failures).
- [ ] **Repository pattern** — `Vault` and `Deposit` data access extracted into
  dedicated repositories with custom query methods.
- [ ] **Pagination support** — `getPublicVaults` supports skip/limit or
  cursor-based pagination.
- [ ] **Idempotency keys** — All mutating endpoints (`/deposit`, `/withdraw`)
  accept an `Idempotency-Key` header and deduplicate requests.
- [ ] **Domain-event outbox** — Deposit/withdrawal events are written to a
  transactional outbox so they are reliably published even if the consumer
  fails.
- [ ] **Withdrawal queue service** — `vaults/withdrawal-queue.service.ts`
  implements FIFO processing with estimated completion time (ETA).
- [ ] **Fee computation service** — `vaults/fees.service.ts` computes
  performance and management fees on a configurable schedule.
- [ ] **Deposit-event replay protection** — Events are deduplicated by
  ledger/event ID to prevent double-crediting.
- [ ] **Vault state machine** — Vault status transitions (active, paused,
  locked, closed) are documented and enforced.
- [ ] **Vault pause/resume** — Admin can pause and resume vault operations
  with proper access control.
- [ ] **Emergency withdrawal** — Users can trigger emergency withdrawal
  despite vault issues (with audit logging).
- [ ] **Vault whitelisting** — Owners can restrict vault access to an
  allowlist of addresses.
- [ ] **Time-based vault locking** — Lock deposits until a specific unlock
  date.
- [ ] **Multi-sig vault approval** — Require multiple approvals for large
  operations (threshold-based).
- [ ] **Batch operations** — Endpoints to process multiple deposits/withdrawals
  in a single transaction where supported.
- [ ] **Scheduled rebalancing** — Auto-shift vault positions based on APY
  changes (configurable threshold).
- [ ] **Yield compounding automation** — Auto-reinvest earned yields into the
  vault (opt-in, configurable frequency).

### Implementation Hints

- Use the existing `InputSanitizerService` for amount/pagination validation.
- Model vault state machine with the `VaultStatus` enum in
  `vault.entity.ts`.
- Use the Bull queue (already partially referenced in the issue backlog) for
  the withdrawal queue.
- Add CQRS-style command validation pipeline for vault mutations.

### Related Original Issues

39, 40, 44, 45, 51, 52, 54, 67, 68, 69, 71, 75, 98, 106, 109, 110, 111, 116,
118, 341, 377, 378, 379

---

## Issue 4 — Multi-chain Adapter Framework

**Labels:** `backend`, `blockchain`, `feature`, `high-priority`, `rewardable`

### Description

Harvest Finance needs a pluggable multi-chain adapter framework that supports
Stellar (existing), plus Polygon, Ethereum, and Solana. This issue covers the
adapter interface, dynamic registration, health checks, and cross-chain vault
migration.

### Acceptance Criteria

- [ ] **Chain adapter interface** —
  `multi-chain/interfaces/chain-adapter.interface.ts` defines a contract
  with: `getVaults()`, `getDeposits()`, `getAPY()`, `getTVL()`,
  `supportsChain()`, and `healthCheck()`.
- [ ] **Polygon adapter** — `PolygonYieldAdapter` implements the interface
  for Polygon (MATIC) vault data.
- [ ] **Ethereum adapter** — `EthereumYieldAdapter` for L1 Ethereum yield data.
- [ ] **Solana adapter** — `SolanaYieldAdapter` for SPL token vault support.
- [ ] **Stellar adapter** — Existing `stellar-yield.adapter.ts` conforms to
  the interface (refactor if needed).
- [ ] **Dynamic registration** — `multi-chain/adapters/chain-registry.service.ts`
  registers adapters at runtime with health-check pings.
- [ ] **Adapter health dashboard** — Each adapter reports status (healthy,
  degraded, offline) via the health-check endpoint.
- [ ] **Cross-chain vault migration** — API to transfer vault positions
  between chains (with signature verification and audit logging).
- [ ] **Soroban adapter tests** — `stellar-yield.adapter.spec.ts` extended
  with edge cases for empty results, network errors, and malformed responses.
- [ ] **Secrets rotation for signing keys** —
  `common/secrets/secrets.service.ts` supports rotating Stellar signing keys
  with a dual-signature transition period.

### Implementation Hints

- Use the existing `SorobanIndexerService` as a reference implementation for
  how blockchain data is queried and indexed.
- Adapter base class can provide shared caching/retry logic.
- Cross-chain migration should create a "migration" domain event (see Issue 3).

### Related Original Issues

9, 34, 56, 59, 101, 102, 103, 107, 346, 354, 357, 369, 388

---

## Issue 5 — Real-time Communication & WebSocket Infrastructure

**Labels:** `backend`, `frontend`, `websocket`, `feature`, `rewardable`

### Description

The real-time communication layer (WebSocket gateway, vault gateway,
notifications) must be secure, authenticated, and resilient. This issue
consolidates all WebSocket, real-time, and notification infrastructure work.

### Acceptance Criteria

- [ ] **Gateway auth & room scoping** — `realtime.gateway.ts` authenticates
  every socket connection (JWT or Stellar signature) and assigns rooms based
  on user role and vault ownership.
- [ ] **CORS fix** — `origin: '*'` replaced with env-driven whitelist
  (also tracked in Issue 1).
- [ ] **Admin vs farmer room pattern** — Documented and enforced: admin rooms
  receive platform-wide broadcasts; farmer rooms are scoped to owned vaults.
- [ ] **Alert broadcasting tests** — `realtime.gateway.ts:74-78` tested for
  correct admin vs farmer targeting.
- [ ] **Vault WebSocket emissions** — `vault.gateway.ts` tested for deposit
  and withdrawal event emission to the correct room.
- [ ] **Graceful degradation** — When the gateway is overwhelmed, clients
  automatically fall back to REST polling without errors.
- [ ] **Graceful shutdown** — WebSocket connections are cleanly closed and
  clients receive a "server shutting down" event on app termination.
- [ ] **Notification center (frontend)** — `useNotifications` hook with
  reconnection, auth handshake, and channel subscription documented and
  tested.
- [ ] **Notification delivery providers** — Telegram, SMS (Twilio/Vonage),
  and email (locale-aware templates) implemented with a unified interface.
- [ ] **Notification preferences** — Per-channel opt-outs enforced in
  `notification-preferences.service.ts`.
- [ ] **Async webhook delivery** — `webhooks.service.ts` uses an exponential-
  backoff retry queue with dead-letter handling.
- [ ] **Webhook signature verification** — Inbound webhooks are HMAC-verified
  via middleware.
- [ ] **Offline banner (frontend)** — `navigator.onLine` listener shows an
  offline banner with retry button.
- [ ] **Frontend polling backoff** — `lib/api` implements exponential
  backoff when a 429 is received from backend real-time/metrics endpoints.

### Implementation Hints

- Reference the existing `RealtimeGateway` in
  `realtime/realtime.gateway.ts:26` for the current setup.
- Use BullMQ or a similar queue for webhook retry (see also Issue 3).
- Frontend: use `socket.io-client` with exponential-reconnect strategy.

### Related Original Issues

14, 19, 29, 55, 94, 151, 194, 342, 343, 344, 345, 351, 358, 368, 390, 412,
551

---

## Issue 6 — Frontend Architecture Modernization

**Labels:** `frontend`, `architecture`, `high-priority`, `rewardable`

### Description

The frontend codebase needs a modernization pass to establish a robust,
maintainable, and scalable architecture. This covers API client, state
management, component system, theming, and build conventions.

### Acceptance Criteria

- [ ] **Centralized API client** — `lib/api` provides a single typed fetch
  wrapper returning typed success/error unions. All inline `fetch` calls are
  retired.
- [ ] **Server state management** — React Query (or SWR) replaces ad-hoc
  `useEffect` fetching in dashboard/vaults with a cached query layer.
- [ ] **Cache invalidation** — Deposit/withdraw mutations precisely
  invalidate vault + portfolio queries.
- [ ] **Design-token pipeline** — `components/ui/theme` exports design tokens
  as CSS variables + TypeScript constants consumed by components and charts.
- [ ] **Component variant system** — `class-variance-authority` (CVA) used to
  standardize Button, Card, and Modal variants.
- [ ] **Route-level loading & error convention** — Enforce `loading.tsx`,
  `error.tsx`, and `not-found.tsx` per route segment.
- [ ] **Feature-based folder structure** — Refactor `components/*` into feature
  modules (vault, wallet, community) with co-located tests.
- [ ] **SSR/CSR boundary** — Wallet-dependent UI is client-only to avoid
  hydration mismatches.
- [ ] **Type-safe navigation** — Typed route builders replace
  stringly-typed `router.push` calls.
- [ ] **i18n runtime switching** — Users can switch locale without a full
  page reload; choice persists.
- [ ] **Mock API layer** — MSW handlers allow UI development without a
  backend.
- [ ] **Bundle analysis** — CI generates a route-level code-splitting report
  and flags regressions >10%.
- [ ] **Performance budgets** — Build fails if first-load JS exceeds a
  configured threshold.
- [ ] **Service worker** — Precaching shell + runtime-caching for read-only
  API GETs.
- [ ] **Feature flags** — Toggle experimental UI (AI assistant, new
  marketplace) without deploys.
- [ ] **Consistent loading/error/empty triplet** — Reusable
  `LoadingState`, `ErrorState`, `EmptyState` components used app-wide.
- [ ] **Role-based UI gate** — `<Can role="admin">` wrapper driven by auth
  store.
- [ ] **Request cancellation** — In-flight API requests are aborted on
  component unmount.
- [ ] **Typed env config** — Zod-validated `NEXT_PUBLIC_*` config with
  defaults in `lib/env.ts`.
- [ ] **Date/time handling** — Single date library (date-fns or Intl) used
  consistently across feeds and analytics.

### Implementation Hints

- Reference existing components in `components/ui/`, `hooks/`, and `lib/`.
- Study `frontend/src/components/YieldChart.tsx` and
  `frontend/src/components/dashboard/DepositModal.tsx` for current patterns.
- Use `next/dynamic` for automatic code-splitting of heavy pages.

### Related Original Issues

251, 253, 256, 258, 260, 261, 263, 268, 283, 286, 291, 296, 301–340, 353, 359,
367, 368, 385, 387

---

## Issue 7 — Comprehensive Testing & Quality Assurance Infrastructure

**Labels:** `testing`, `backend`, `frontend`, `quality`, `rewardable`

### Description

Test coverage across the backend and frontend is fragmented. This issue
establishes a cohesive testing strategy: unit, integration, E2E, contract,
load, accessibility, and visual regression testing — with CI integration.

### Acceptance Criteria

- [ ] **InputSanitizerService unit tests** — `validateUUID`,
  `validateStellarPublicKey`, `validateContractId`, `validateEmail`,
  `validateAmount`, `sanitizeString`, `validatePagination` fully covered with
  valid/invalid/edge-case inputs.
- [ ] **stellar-retry unit tests** — `isRetryableStellarError` tested for
  status 429, 500–599, and Soroban `result_codes`.
- [ ] **Vault deposit/withdrawal integration tests** — Successful deposit,
  duplicate idempotency, capacity-exceeded, insufficient balance.
- [ ] **Auth integration tests** — Register, login, refresh, logout E2E;
  expired/invalid reset tokens; password reset token expiration window.
- [ ] **Stellar escrow creation tests** — Fee-bump and retry path coverage.
- [ ] **SorobanIndexerService tests** — Filter by contractId, event type,
  and ledger range; RPC failure + malformed response handling.
- [ ] **SorobanExceptionFilter tests** — HttpException vs generic error
  mapping.
- [ ] **RealtimeGateway alert tests** — Admin vs farmer broadcast targeting.
- [ ] **Vault WebSocket emission tests** — Deposit/withdrawal events emitted
  to correct rooms.
- [ ] **E2E Stellar health endpoint** — Connection check tested.
- [ ] **Frontend component tests** — Button, Modal, VaultTable, YieldChart,
  auth forms have unit tests via React Testing Library.
- [ ] **A11y smoke tests** — `jest-axe` checks on login, deposit, and admin
  flows; `jsx-a11y` lint rules enforced in CI.
- [ ] **Visual regression tests** — Screenshots for dashboard, modals, and
  charts via Chromatic/Playwright (or Percy).
- [ ] **API contract tests** — OpenAPI spec matched against controller
  responses for vaults/orders/users.
- [ ] **Load tests** — Simulate N concurrent deposits; measure p95 latency
  and queue depth.
- [ ] **Frontend observability** — Real-user monitoring (LCP/CLS/INP) captured
  and sent to backend observability.
- [ ] **Request tracing IDs** — `X-Request-Id` propagated from frontend
  through API to Stellar calls; surfaced in error responses.

### Implementation Hints

- Use the existing `test/` directory for integration/E2E and a new
  `__tests__` directory in each module for unit tests.
- Reuse the `DTO factory` pattern (originally issue 78) to reduce test
  boilerplate.
- Configure `jest.config.js` with proper module mapping and coverage
  thresholds (target 80%).

### Related Original Issues

16–30, 51–65, 215, 245, 275, 307, 310, 318–319, 383, 389, 395, 396

---

## Issue 8 — Observability, Monitoring & Reliability

**Labels:** `observability`, `backend`, `reliability`, `rewardable`

### Description

The platform lacks production-grade observability. This issue adds
distributed tracing, structured logging, health-check aggregation, custom
metrics, circuit breakers, and reliability patterns to ensure the system is
monitorable, debuggable, and resilient under failure.

### Acceptance Criteria

- [ ] **Distributed tracing** — OpenTelemetry traces span from frontend UI
  through API gateway to Stellar RPC calls; `X-Request-Id` / trace context
  propagated across service boundaries.
- [ ] **Structured logging** — JSON logs with correlation IDs emitted for all
  request lifecycle events (using Pino or Winston structured logger
  replacing ad-hoc `console.log` via `ConsoleLogService`).
- [ ] **Health check aggregation** — Single `/health` endpoint reports
  status of DB, Redis, Stellar RPC, Horizon, and all chain adapters.
- [ ] **Custom business metrics** — Prometheus metrics for deposits,
  withdrawals, vault creations, failed auth attempts, and stellar RPC
  latency.
- [ ] **Slow query logging** — Database queries >100ms are logged with
  context; alerts configured for anomalies.
- [ ] **Circuit breakers** — Stellar Horizon/Soroban RPC calls wrapped in
  circuit breakers (open on repeated failures, auto-half-open retry).
- [ ] **Cache stampede protection** — Single-flight refresh for hot cache
  keys (e.g., platform metrics, vault TVL/APY).
- [ ] **Graceful degradation** — When a service is down, clients receive
  fallback responses (cached or stale-while-revalidate) instead of errors.
- [ ] **Background job reliability** — BullMQ queues for notifications,
  webhook delivery, yield rollups, and harvest scheduling with retry +
  dead-letter handling.
- [ ] **Alerting** — Prometheus alerts for: high error rate, high latency,
  queue backlog > N, circuit breaker open.
- [ ] **Frontend error reporter** — Unhandled JS errors + uncaught promise
  rejections sent to backend observability with user ID + route context.
- [ ] **Audit trail** — Structured audit logs for all vault modifications,
  fund transfers, user role changes, and admin actions (see also Issue 1).
- [ ] **Log tamper detection** — Hash chain ensures audit-log integrity.
- [ ] **Performance benchmarks in CI** — Fail CI if p95 latency of key
  endpoints regresses >X% compared to baseline.

### Implementation Hints

- Reference existing `ObservabilityModule` or add one in
  `src/observability/`.
- Use the existing Bull/BullMQ queue setup referenced in the issue backlog
  for background jobs.
- Add middleware for request tracing ID generation in `src/common/middleware`.

### Related Original Issues

66, 191–200, 384, 385, 386, 395, 398, 399, 400, 553

---

## Issue 9 — Performance Optimization & Scalability

**Labels:** `backend`, `frontend`, `performance`, `rewardable`

### Description

As user and vault counts grow, the platform must scale efficiently. This
issue covers caching strategies, query optimization, pagination, streaming,
CDN offloading, and connection pooling to reduce latency and resource usage.

### Acceptance Criteria

- [ ] **Database connection pooling** — `data-source.ts` pool settings tuned
  for production (max/min pool size, idle timeout, connection TTL).
- [ ] **Query result caching** — Frequent vault list queries cached for 60s
  via Redis; cache invalidated on vault creation/update.
- [ ] **Redis caching for expensive calculations** — APY history and
  portfolio aggregation results cached with TTL.
- [ ] **Database indexes** — Indexes added on `vault.owner_id`,
  `deposit.user_id`, `vault.status`, `event.timestamp`.
- [ ] **Soroban indexer batch inserts** — Bulk `COPY` inserts instead of
  row-by-row; transactions batched.
- [ ] **Background jobs via Bull queue** — Async notification sending and
  export generation move off the request thread.
- [ ] **Keyset pagination** — Offset-based pagination replaced with
  cursor/seek-pagination for large vault and transaction lists.
- [ ] **Lazy loading** — Vault deposits only fetched when explicitly
  requested (GraphQL selection set or `?include=deposits`).
- [ ] **Gzip/Brotli compression** — Enabled in `main.ts` for JSON and
  export endpoints (backend `main.ts` compression).
- [ ] **Stellar SDK connection pooling** — HTTP agents reused for Horizon
  connections instead of creating new agents per request.
- [ ] **Streaming exports** — Large CSV/Excel exports streamed to the client
  instead of buffered in memory.
- [ ] **API response caching** — CDN-friendly `Cache-Control` headers on
  read-only endpoints (public vaults, vault metadata).
- [ ] **CDN caching for static assets** — Frontend assets served with
  long-TTL caching.
- [ ] **Bulk endpoints** — `/vaults/bulk` endpoint returns vault + balance
  + APY in a single request to avoid N+1 round-trips from the dashboard.
- [ ] **Pagination for public vaults** — `getPublicVaults` paginated with
  proper cursor support.
- [ ] **Frontend polling backoff** — Exponential backoff on 429 from
  backend real-time/metrics endpoints.
- [ ] **Memory profiling** — Heap usage monitored during batch processing;
  alerts on memory growth.
- [ ] **Query complexity limits** — If GraphQL is added (Issue 10/Future),
  enforce complexity limits to prevent DoS.
- [ ] **Request timeouts** — All external API calls (Stellar RPC, price
  oracles, IPFS) have configurable timeouts.
- [ ] **Database read replicas** — Read queries routed to replicas for
  read-heavy endpoints.

### Implementation Hints

- Reference existing `CacheManager` or `CacheModule.register()` setup.
- Study `data-source.ts` for current TypeORM config.
- Use the `@nestjs/throttler` + Redis store for distributed rate limiting.

### Related Original Issues

53, 57, 60, 72, 73, 171–190, 356, 381, 387, 388, 392, 553

---

## Issue 10 — Documentation, Developer Experience & Observability Dashboard

**Labels:** `documentation`, `devx`, `backend`, `frontend`, `rewardable`

### Description

The project has extensive inline-comment and README debt. This issue
establishes comprehensive documentation, developer tooling, and a local
development environment that makes contributing frictionless.

### Acceptance Criteria

- [ ] **Inline JSDoc** — `InputSanitizerService` parameters and return types
  documented; `stellar-retry.ts` retry logic commented for each error code.
- [ ] **API versioning documentation** — `versioning.config.ts` documents
  URI vs header versioning; `Deprecation`/`Sunset` headers emitted on old
  versions.
- [ ] **Vault state machine documentation** — `VaultStatus` enum transitions
  documented in `vault.entity.ts` or external docs.
- [ ] **SorobanExceptionFilter documentation** — Error message matching
  logic (lines 30–54) documented.
- [ ] **OpenAPI examples** — Response DTOs (e.g.,
  `StellarTransactionStatusDto`) include example values.
- [ ] **Auth module DTO README** — `auth/dto/` documented with field
  purposes.
- [ ] **Multi-chain adapter README** — How to add new chain adapters
  documented.
- [ ] **Rate limit tiers documented** — Short/medium/long throttling in
  `auth.controller.ts` explained.
- [ ] **README expansion** — `CONTRIBUTING.md` with PR process, coding
  standards, branch conventions.
- [ ] **Architecture Decision Records (ADRs)** — `docs/adr/` captures key
  decisions (ORM choice, WS library, caching strategy, etc.).
- [ ] **Architecture diagram** — Component interactions and data flow
  documented (diagram in `docs/`).
- [ ] **Pre-commit hooks** — Husky + lint-staged runs ESLint and
  `tsc --noEmit` on staged files.
- [ ] **GitHub Codespaces / devcontainer** — `.devcontainer/devcontainer.json`
  for consistent local development.
- [ ] **VS Code snippets** — `.vscode/snippets` for common NestJS patterns.
- [ ] **VS Code debug config** — `.vscode/launch.json` for debugging tests
  and the app.
- [ ] **Makefile** — Common dev commands: `make test`, `make lint`,
  `make build`, `make db-up`, `make db-migrate`.
- [ ] **Environment validation** — `main.ts` validates required env vars on
  startup; fails fast with a clear message.
- [ ] **npm scripts** — Separate `typecheck` script; DB migration scripts;
  seed script for test data.
- [ ] **Commit message convention** — Conventional commits documented.
- [ ] **Deployment runbook** — Rollback, scaling, and health-check
  procedures documented.
- [ ] **Logging configuration documentation** — Pino config options
  documented.
- [ ] **Health check documentation** — Extended health check for DB, Redis,
  Stellar RPC documented.
- [ ] **Metrics endpoint documentation** — Prometheus metrics endpoint
  documented.
- [ ] **System architecture diagram** — Created and maintained in `docs/`.

### Implementation Hints

- Follow the existing `CONTRIBUTING.md` as a starting point; expand it.
- Use `compodoc` for auto-generated NestJS API documentation.
- Reference existing `Makefile` (if present) and `package.json` scripts.
- ADAPT: Use `docs/adr/YYYY-MM-DD-slug.md` format for ADRs.

### Related Original Issues

1–15, 33, 34, 50, 66, 76, 81–100, 191–200, 194, 196, 381, 553

---

# Summary

| # | Issue Title | Lines Area | Key Original Issues |
|---|-------------|-----------|---------------------|
| 1 | Security Hardening | backend + frontend | 31, 33, 152–158, 161, 163, 166 |
| 2 | Auth & RBAC System | backend | 31–50, 46–49, 152, 158–165 |
| 3 | Vault Operations & Financial Integrity | backend | 39–54, 67–80, 106–118, 341, 377–379 |
| 4 | Multi-chain Adapter Framework | backend | 9, 34, 56, 59, 101–107, 346, 354, 357 |
| 5 | Real-time & WebSocket Infrastructure | backend + frontend | 14, 29, 55, 94, 194, 342–358, 368, 390 |
| 6 | Frontend Architecture Modernization | frontend | 251–253, 258, 260, 268, 283–296, 301–340 |
| 7 | Testing & QA Infrastructure | backend + frontend | 16–30, 51–65, 215, 245, 307–319, 383, 387–396 |
| 8 | Observability & Reliability | backend | 66, 191–200, 384–386, 395, 398–400 |
| 9 | Performance & Scalability | backend + frontend | 171–190, 381, 387–388, 392, 553 |
| 10 | Docs & Developer Experience | backend + frontend | 1–15, 66, 81–100, 191–200 |

> **Note:** Original issue numbers above 100 in the "Key Original Issues"
> column refer to the frontend/backend continuation issues (201–400) and
> cross-cutting issues (381–400). See `GITHUB_ISSUES_201_400.md` for full
> context.
