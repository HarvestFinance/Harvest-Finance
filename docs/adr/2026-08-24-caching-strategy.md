# ADR — Caching Strategy: Two-Level In-Memory + Redis via cache-manager

- **Date:** 2026-08-24
- **Status:** Accepted

## Context

Hot paths hit external systems repeatedly: Soroban contract reads, Stellar
account lookups, and vault state queries backing dashboards and the
multi-chain adapters. Round-trips to PostgreSQL, Redis, or Horizon on every
request add latency and load. At the same time the deployment must keep
working in developer environments where Redis may be absent.

> **Provenance note:** this ADR documents the current architecture (as of
> the performance/scalability work in mid-2026) and the rationale going
> forward; earlier incremental choices are not individually recorded.

## Decision

The global cache (`src/app.module.ts`, `CacheModule.registerAsync` with
`isGlobal: true`) uses **cache-manager v7 multi-store**:

- **L1 — process memory:** `Keyv` over `CacheableMemory`
  (`ttl: 60_000 ms`, `lruSize: 5000`). Absorbs hot-key bursts without any
  network hop.
- **L2 — Redis:** `createKeyv(redisUrl)` from `@keyv/redis`, activated only
  when `REDIS_URL` is set; shares the Redis instance with BullMQ.
- **Fallback:** when no `REDIS_URL` is configured (local dev without
  Docker), a pure in-memory store (`ttl: 600 s`, `max: 100`) keeps the app
  functional.

Domain TTLs are owned by consumers such as
`ContractCacheService` (`vault:state:*` 60 s, `account:info:*` 600 s,
default 300 s).

Two auxiliary caches exist alongside the global one:

- The **Soroban module** registers its own legacy
  `cache-manager-redis-yet` store (`CACHE_TTL`, default 600 s) for contract
  data.
- **BullMQ** queues (notifications, exports) use the same Redis for jobs —
  not caching, but the reason Redis is a required production dependency.

## Alternatives Considered

| Alternative | Trade-off |
|-------------|-----------|
| **Redis-only** | One cache layer to reason about, but every cache hit pays a network round-trip and local dev requires Redis |
| **In-memory only** | Fastest, but stale-per-instance under scaling and unbounded memory risk without LRU |
| **HTTP-level caching / CDN** | Only helps public GETs; most hot data is per-user/authenticated |
| **Direct DB materialized views** | Good for aggregates, wrong tool for per-request read-through caching |

## Consequences

- **Benefits:** graceful degradation without Redis; L1 absorbs read storms;
  shared Redis instance keeps the operational surface small (one cache+queue
  service).
- **Costs:** two cache libraries coexist (`cache-manager`/Keyv globally,
  legacy `cache-manager-redis-yet` in Soroban); multi-store invalidation
  must consider both L1 staleness (≤60 s) and L2 TTLs; per-instance L1s can
  briefly disagree after a write until TTL expiry.
- **Operational implications:** monitor Redis memory alongside Postgres;
  treat `FLUSHDB` as a cold-start event (cache stampede protection relies on
  upstream rate limits); see [../deployment-runbook.md](../deployment-runbook.md)
  scaling notes.
