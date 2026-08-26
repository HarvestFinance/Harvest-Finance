# API Rate Limits

Harvest Finance implements rate limiting to protect the API from abuse,
brute-force attacks, and general performance degradation. This document
describes **how limiting actually works today**; if you change throttling
code, update this file in the same PR.

Two independent systems exist:

1. **Global tiered throttler** — `@nestjs/throttler`, applied to every route
   through the `ThrottlerGuard` registered as an `APP_GUARD`.
   Configured in `src/common/config/throttler.config.ts`.
2. **Custom per-route limiter** — the `RateLimitGuard` + `@RateLimit`
   decorator pair (`src/common/guards/rate-limit.guard.ts`,
   `src/common/decorators/rate-limit.decorator.ts`), used for long-window
   (hourly) caps on sensitive auth flows.

---

## 1. Global tiers

The throttler registers three *named* tiers. Every endpoint is subject to
**all three simultaneously** unless a route overrides a specific tier with
`@Throttle({ <tier>: { limit, ttl } })`.

| Tier | Default limit | Default window | Env overrides | Intended use |
|------|---------------|----------------|---------------|--------------|
| `short` | 5 requests | 1 second | `THROTTLE_SHORT_LIMIT` / `THROTTLE_SHORT_TTL` | Absorb burst floods and scripted hammering |
| `medium` | 30 requests | 10 seconds | `THROTTLE_MEDIUM_LIMIT` / `THROTTLE_MEDIUM_TTL` | Cap sustained rapid polling from one client |
| `long` | 100 requests | 60 seconds | `THROTTLE_LIMIT` / `THROTTLE_TTL` | Baseline per-minute quota for normal clients |

All TTL values are milliseconds. Exceeding any tier returns HTTP 429
(formatted by `ThrottlerExceptionFilter`). Counters are tracked per client
IP/tracker via the throttler storage.

### Tier overrides in effect today

Only overrides that name an existing tier (`short`, `medium`, `long`)
actually take effect:

| Endpoint | Override | Effective change |
|----------|----------|------------------|
| `POST /api/v1/auth/register` | `{ long: { limit: 10, ttl: 60000 } }` | Per-minute cap tightened from 100 → 10 |
| `POST /api/v1/auth/login` | `{ long: 5 / 60 s }` | Per-minute cap tightened from 100 → 5 |
| `POST /wallets/custodial/export-key` | `{ long: { limit: 3, ttl: 3600000 } }` | Max 3 exports/hour |

### ⚠️ Known caveat: inert `default:` overrides

Several routes use `@Throttle({ default: { limit: N, ttl: 60000 } })` — e.g.
the Stellar auth endpoints, most mutating `/api/v1/vaults/*` routes, and
farm-vault writes. **No tier named `default` is registered** (config defines
only `short`/`medium`/`long`), so these overrides do not match anything and
those routes run under the plain three-tier defaults listed above. The
decorator values shown there (10/min, 20/min) are therefore *intended*, not
effective. Do not rely on them until the config registers a `default` tier
or the decorators are renamed to `long`.

---

## 2. Custom hourly limiter (auth flows)

Applied via `@UseGuards(RateLimitGuard)` + `@RateLimit({...})`; bypasses the
tiered throttler entirely and enforces one hourly counter per IP:

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `POST /api/v1/auth/forgot-password` | 5 | 1 hour | Protects email infrastructure from spam/harassment |
| `POST /api/v1/auth/reset-password` | 5 | 1 hour | Hardens reset tokens against brute force |
| `POST /api/v1/auth/resend-verification` | 3 | 1 hour | Limits verification-email churn |

---

## How to modify rate limits

1. **Global tiers**: set env vars (`.env`): e.g. `THROTTLE_LONG_LIMIT=200`,
   `THROTTLE_TTL=60000` (see table above for each variable pair).
2. **Per-endpoint**: use `@Throttle` naming an existing tier:

   ```typescript
   @Throttle({ long: { limit: 3, ttl: 3600000 } })
   @Post('expensive-operation')
   ```

3. **Hourly caps on sensitive flows**: prefer the `@RateLimit` decorator as
   the password-reset endpoints do.
