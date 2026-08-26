# ADR — ORM Choice: TypeORM with PostgreSQL

- **Date:** 2026-08-24
- **Status:** Accepted

## Context

The backend is a data-heavy NestJS service: ~40 entities (users, vaults,
deposits, withdrawals, sessions, orders, verifications, credit scores,
Soroban events …) with relational integrity requirements and a long-lived
migration history that must be reproducible across environments.

> **Provenance note:** the original decision predates current maintainer
> records. This ADR documents the observed architecture and the rationale we
> adopt going forward; it does not reconstruct a historical discussion.

## Decision

The project uses **TypeORM 0.3.x** (`typeorm`, `@nestjs/typeorm`) against
**PostgreSQL**, integrated via `TypeOrmModule`/`forFeature` repository
injection:

- Entities live in `harvest-finance/backend/src/database/entities/`.
- Migrations are explicit TypeScript files in
  `src/database/migrations/`, enumerated by
  `src/database/data-source.ts` and applied with the TypeORM CLI
  (`npm run migration:run | migration:revert | migration:generate`).
- Runtime schema synchronization is disabled (`synchronize: false`);
  `NODE_ENV=test` is the only place where auto-sync is allowed.
- Connection pooling is tuned through env vars
  (`DB_POOL_MAX`, `DB_POOL_MIN`, timeouts) in `data-source.ts`.
- A read-replica helper exists (`src/database/read-replica.service.ts`)
  for read scaling.

## Alternatives Considered

| Alternative | Trade-off |
|-------------|-----------|
| **Prisma** | Excellent DX and migrations, but a second schema language (`.prisma`) alongside decorators, weaker fit with Nest repository patterns at the time of writing, and no native path for the existing 30+ hand-written migrations |
| **Sequelize** | Older API, less first-class NestJS integration, decorator story inferior to TypeORM's entity model |
| **MikroORM** | Strong identity map and unit-of-work, smaller ecosystem than TypeORM within NestJS samples |
| **Raw SQL / Knex** | Maximum control but loses declarative relations used pervasively across modules |

## Consequences

- **Benefits:** deep `@nestjs/typeorm` integration (DI'd repositories,
  transactions via `manager`), decorator-based entities co-located with
  domain code, deterministic CLI-driven migrations.
- **Costs:** migration list must be kept manually in sync between
  `data-source.ts` and `app.module.ts`; query-builder mistakes surface at
  runtime rather than compile time; TypeORM major upgrades require care.
- **Operational implications:** deployments must order
  `migration:run` before/with app rollout (see
  [deployment-runbook.md](../deployment-runbook.md)); pool sizing env vars
  should be reviewed when scaling replicas.
