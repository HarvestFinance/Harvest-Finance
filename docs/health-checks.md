# Health Checks

The backend exposes a single aggregate health endpoint.

## `GET /health`

- **Path:** `/health` (root level — intentionally outside the `/api`
  prefix so container orchestrators can probe it without version coupling).
- **Auth:** none. Exempt from rate limiting (`@SkipThrottle`).
- **Implementation:** `src/health/health.controller.ts` using
  `@nestjs/terminus`, aggregating the indicators below.

### What is checked

| Check | Key | Mechanism | Timeout |
|-------|-----|-----------|---------|
| PostgreSQL | `database` | Terminus `TypeOrmHealthIndicator.pingCheck` | 3 s |
| Redis | custom | Fresh client from `REDIS_URL`, `PING` | 3 s |
| Stellar Horizon | `stellar-horizon` | `server.ledgers().limit(1)` against testnet/mainnet per `STELLAR_NETWORK` | 3 s |
| Stellar payment stream | `stellar-payment-stream` | In-memory liveness of the Horizon payments stream (`getStreamHealth()`) | n/a |

### Healthy response

```json
{
  "status": "ok",
  "info": { "database": { "status": "up" }, "redis": { "status": "up" },
            "stellar-horizon": { "status": "up" } },
  "error": {},
  "details": { "...same keys...": { "status": "up" } }
}
```

HTTP status is `200` when every check reports up. The payment-stream
indicator may report a degraded state without flipping the overall status
to 5xx; treat it as an early warning for indexer/stream connectivity.

### Failure behavior

Any failed indicator makes Terminus answer `503 Service Unavailable` with
the failing key(s) under `error` and their message, e.g. a down database:

```json
{ "status": "error", "error": { "database": { "status": "down", "message": "..." } } }
```

### Operational interpretation

- **503 + `database: down`** — app cannot reach Postgres; check DB host,
  credentials, pool exhaustion (`DB_POOL_*`), then restart if stuck.
- **503 + `redis: down`** — cache/queue outage; API may still serve some
  traffic but jobs stall; restore Redis first.
- **503 + `stellar-horizon: down`** — Horizon unreachable from this host;
  verify egress/network policy and Stellar incident status.
- **Load balancers / containers:** treat `GET /health` 200 as readiness;
  the docker-compose stack uses this path in its container healthcheck.

## Related surfaces

- `GET /health/multi-chain` — aggregated health of the registered chain
  adapters (`healthy` / `degraded` / `offline` per chain); see
  `harvest-finance/backend/src/multi-chain/multi-chain-health.controller.ts`.
- Prometheus process metrics: [metrics.md](metrics.md).
