# System Architecture

Harvest Finance is a monorepo containing a **Next.js frontend**, a
**NestJS backend** (the core of the system, in
`harvest-finance/backend/src`), Foundry-based **Soroban/Stellar contracts**
(`contracts/`), and operational docs. A visual companion lives in
[architecture-diagram.md](architecture-diagram.md).

## Layers

```
Client (Next.js / third-party API consumers)
        │  HTTPS  /api/v{N}/…
        ▼
API layer — NestJS HTTP + Socket.IO gateways
   middleware: request validation · pino-http request logging
   guards:     ThrottlerGuard (global) · JwtAuthGuard · RolesGuard
   pipes:      ValidationPipe (whitelist, 422)
   filters:    HttpExceptionFilter · ThrottlerExceptionFilter · SorobanExceptionFilter
   versioning: URI (/api/v1) + VersioningInterceptor headers
        ▼
Application services (~40 feature modules)
   auth · vaults · farm-vaults · portfolio · analytics · stellar ·
   soroban indexer · multi-chain adapters · orders · coop-marketplace ·
   verifications · notifications · export · rewards · admin · …
        ▼
Infrastructure
   PostgreSQL (TypeORM) · Redis (cache + BullMQ) ·
   Stellar Horizon · Soroban RPC · IPFS · OAuth providers
```

## Cross-cutting concerns

| Concern | Implementation |
|---------|----------------|
| Configuration | `ConfigModule` + Joi schema (`src/config/env.validation.ts`) — fails fast on missing/invalid required vars at startup |
| Logging | Pino structured logging with redaction; per-request IDs via pino-http ([logging.md](logging.md)) |
| Caching | cache-manager L1 memory + L2 Redis ([ADR](adr/2026-08-24-caching-strategy.md)) |
| Rate limiting | Tiered throttler + custom hourly limiter ([rate-limits.md](rate-limits.md)) |
| API versioning | URI versioning with deprecation headers ([api/versioning.md](api/versioning.md)) |
| Input safety | `InputSanitizerService`, DTO whitelist validation, webhook HMAC verification |
| Observability | `/health` and `/metrics` endpoints ([health-checks.md](health-checks.md), [metrics.md](metrics.md)) |

## Domain highlights

- **Vaults** follow an explicit lifecycle state machine
  (`VaultStatus`: ACTIVE / FULL_CAPACITY / FROZEN / INACTIVE /
  SUSPENDED — documented on the enum in
  `src/database/entities/vault.entity.ts`). Deposits push a vault to
  `FULL_CAPACITY`; withdrawals return it to `ACTIVE`.
- **Stellar integration** wraps Horizon/Soroban access behind services with
  retry classification (`stellar-retry.ts`) and a circuit breaker;
  transaction failures are translated to consistent API errors by
  `SorobanExceptionFilter`.
- **Multi-chain yield reporting** is pluggable through the `ChainAdapter`
  interface (see `harvest-finance/backend/src/multi-chain/README.md`);
  adapters degrade gracefully so one down chain cannot break aggregation.
- **Background work** (notifications, exports) is queued through BullMQ and
  processed by in-process workers.

## Key decisions

See [adr/](adr/) for accepted Architecture Decision Records (TypeORM,
Socket.IO, caching strategy).

## Further reading

- Deployment & operations: [deployment-runbook.md](deployment-runbook.md)
- Health checks: [health-checks.md](health-checks.md)
- Metrics: [metrics.md](metrics.md)
- Logging: [logging.md](logging.md)
- API reference index: [api/README.md](api/README.md)
- Contributing workflow: [../CONTRIBUTING.md](../CONTRIBUTING.md)
