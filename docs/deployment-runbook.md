# Deployment Runbook

Operational procedures for the Harvest Finance stack. Everything below
reflects the automation that exists in this repository
(`.github/workflows/cd.yml`, `docker-compose.prod.yml`,
`docker-compose.staging.yml`). Provider-specific steps that are **not**
represented in the repo (host provisioning, DNS, secrets management) are
explicitly marked ⚠️ *provider-specific* — fill them in with your
infrastructure owner's runbook rather than guessing.

## Environments

| Environment | Branch | URL | Compose file |
|-------------|--------|-----|--------------|
| Production | `main` | `app.harvestfinance.io` (frontend) · `api.harvestfinance.io` (backend, Traefik) | `docker-compose.prod.yml` |
| Staging | `develop` | `staging.harvestfinance.io` | `docker-compose.staging.yml` |

Images are built by the CD workflow and pushed to GHCR:

- `ghcr.io/<owner>/harvest-finance-backend:<sha>` plus `:latest` (prod) or `:staging`
- `ghcr.io/<owner>/harvest-finance-frontend:<sha>` likewise

Deployment runs `docker compose -f docker-compose.<env>.yml pull && up -d`
over SSH on the target host (`STAGING_*` / `PROD_*` environment secrets).
⚠️ *provider-specific:* host access control and secret storage.

## Health checks

After any deploy or incident, verify:

```bash
# backend aggregate health (DB + Redis + Horizon + payment stream)
curl -fsS https://api.harvestfinance.io/health | jq '.status'
# expect: "ok"

# container-level status on the host
docker compose -f docker-compose.prod.yml ps
```

Details of what `/health` verifies and failure semantics:
[health-checks.md](health-checks.md). Prometheus scraping guidance lives in
[metrics.md](metrics.md).

## Rollback

**When:** error-rate spikes, failed health checks after a new image,
data-corrupting behavior, or a bad migration. Roll back promptly; do not
debug on production.

**Identify the previous known-good version:**

1. Find the last green CD run for the environment in GitHub Actions; its
   commit SHA is the good image tag.
2. Or list local images on the host: `docker images | grep harvest-finance-backend`.

**Execute rollback** (backend shown; repeat for frontend if needed):

```bash
ssh <prod-host>
cd /opt/harvest-finance
export REGISTRY=ghcr.io
export IMAGE_TAG=<previous-good-sha>
docker compose -f docker-compose.prod.yml pull backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
```

**Database migration considerations:**

- Migrations are applied manually (`npm run migration:run` via a one-off
  container) — check whether the failing release introduced migrations:

  ```bash
  docker compose -f docker-compose.prod.yml run --rm backend \
    npx typeorm migration:show -d src/database/data-source.ts
  ```

- TypeORM migrations run forward only. If the new release added migrations,
  rolling back the image does NOT revert them. Prefer a **forward-fix
  migration**; reverting (`migration:revert`) is destructive and should be
  rehearsed on staging first with a database backup restored.
- Always take/snapshot a Postgres backup before rollback work involving
  migrations. ⚠️ *provider-specific:* backup tooling/retention.

## Scaling

### Backend (stateless HTTP)

The prod compose file already declares `replicas: 2` behind Traefik with
start-first rolling updates. Scale up:

```bash
docker compose -f docker-compose.prod.yml up -d --scale backend=4
```

Constraints to review before scaling out:

- **WebSocket affinity** — Socket.IO has no Redis adapter yet
  ([ADR](adr/2026-08-24-websocket-library-socket-io.md)); gateway fan-out is
  per-instance. Add `@socket.io/redis-adapter` before relying on multi-node
  WebSocket rooms.
- **BullMQ workers** run inside each backend replica; scaling replicas also
  scales job concurrency (notifications concurrency via
  `NOTIFICATION_WORKER_CONCURRENCY`, exports fixed at 2 per instance).
- Connection pools multiply per replica — keep `DB_POOL_MAX × replicas`
  under the PostgreSQL `max_connections` budget.

### Frontend

Same pattern (`--scale frontend=N`); stateless Next.js servers.

### Stateful services

- **PostgreSQL** — scale vertically first (memory/CPU, currently capped at
  1G in compose); then consider the read-replica support already present
  (`ReadReplicaService`) before sharding.
- **Redis** — used for L2 cache + BullMQ. `maxmemory 256mb` with
  `allkeys-lru`; raise memory before raising traffic, monitor eviction rate.
  Redis persistence is volume-backed; treat it as disposable cache but not
  as a queue data store you can lose casually (jobs in flight would drop).

### Load balancer / TLS

Traefik v3 terminates TLS via Let's Encrypt (labels in the compose files)
and forwards websocket upgrades by default. ⚠️ *provider-specific:* edge
CDN/WAF configuration is outside this repository.

## Deploy-time environment requirements

The app refuses to boot when required configuration is missing (Joi schema
in `src/config/env.validation.ts`): DB credentials, JWT secrets, Stellar
network settings, webhook HMAC secrets, etc. A crash-looping backend right
after deploy usually means a missing env var — check container logs
(`docker compose logs backend`) before assuming a code fault. Secrets are
supplied via `.env.prod` / GitHub environment secrets; never bake them into
images ([logging.md](logging.md) documents redaction expectations).
