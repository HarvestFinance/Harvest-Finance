# Prometheus Metrics

## `GET /metrics`

- **Path:** `/metrics` (root level, outside the `/api` prefix — the
  conventional scrape location).
- **Auth:** none today. The endpoint is hidden from Swagger
  (`@ApiExcludeEndpoint`). It is subject to the global rate-limit tiers;
  if your scraper polls more aggressively than the tier defaults allow,
  exempt it or raise limits via `THROTTLE_*` env vars.
- **Content type:** Prometheus text exposition format
  (`prom-client.register.contentType`).
- **Implementation:** `src/observability/metrics/`
  (`MetricsService`, `MetricsController`, `HttpMetricsInterceptor`).

## Exposed metrics

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `http_requests_total` | counter | `method`, `route`, `status_code` | Total HTTP requests per route/status |
| `http_request_duration_seconds` | histogram | `method`, `route` | Latency distribution; buckets 5 ms → 10 s |

The `route` label is derived from the matched Express route pattern (low
cardinality); requests to `/metrics` itself are excluded to avoid scrape
self-amplification.

> Metrics count requests and durations only. No payloads, user identifiers,
> payroll values, or credentials are exposed through this endpoint.

Default Node.js process metrics (`process_cpu_*`, event loop lag, heap) are
**not** currently enabled; enable `collectDefaultMetrics()` in
`MetricsService` if you need them.

## Scraping configuration

Prometheus scrape job example:

```yaml
scrape_configs:
  - job_name: harvest-backend
    metrics_path: /metrics
    static_configs:
      - targets: ["backend-host:5000"]
```

In docker-compose deployments, point the target at the published backend
port and ensure the scraper can reach it (the compose healthcheck path is
also unversioned, so no `/api` prefix is involved).

## Development / testing usage

```bash
curl -s http://localhost:5000/metrics | grep -E "^http_"
# after a few API calls you should see non-zero counters, e.g.
# http_requests_total{method="GET",route="/api/v1/vaults",status_code="200"} 3
```

The `HttpMetricsInterceptor` instruments every HTTP request automatically —
no per-controller wiring needed.
