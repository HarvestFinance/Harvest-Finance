# Logging (Pino)

The backend logs structured JSON via **Pino** (`pino`, `pino-http`), wrapped
by `CustomLoggerService` (`src/logger/`) so NestJS's `Logger` API and the
app share one configuration.

## Configuration

| Aspect | Behavior |
|--------|----------|
| Level | `LOG_LEVEL` env var — one of `trace, debug, info, warn, error, fatal`. Default `info`. |
| Base fields | `{ pid }`; every line is JSON with `level`, `time`, `msg`, context. |
| Pretty output | `LOG_PRETTY=true\|1\|yes` forces `pino-pretty` (colorized). Default: **on** outside production, **off** in production. |
| Files | Multi-target transport always writes `logs/application.log` (all levels) and `logs/error.log` (`error+`), creating the directory as needed. |
| Stdout | Always written (pretty or raw depending on the above) — container log drivers pick it up. |
| App wiring | `main.ts` enables `bufferLogs` and installs the custom logger as the Nest logger. |

## Request correlation

`HttpLoggerMiddleware` (`pino-http`) runs for every route:

- **Request ID:** taken from the incoming `x-request-id` header or a fresh
  UUID v4. Echo it to clients; error responses include the same
  `requestId` (see `HttpExceptionFilter`).
- Auto-logging skips `/health`, `/metrics`, and `/api/docs` to keep noise
  down.
- Serialized request/response fields are limited to `{ id, method, url }`
  and `{ statusCode }` plus duration.

## Redaction — REQUIRED reading

Pino's `redact` strips sensitive values from any log record whose path
matches:

```
password, refreshToken, refresh_token, access_token, authorization,
headers.authorization, req.headers.authorization, token, secret,
body.password, body.refreshToken, body.refresh_token, body.access_token,
body.token, body.secret, user.password, user.refreshToken,
user.refresh_token, user.token, user.secret
```

Matched values are replaced with `[REDACTED]`.

**Policy:** payroll amounts, credentials, private keys, JWTs/tokens, and
other secrets must never be logged — not at any level, not in development.
When adding new log statements that touch request bodies or user objects,
either rely on the redact paths above or log only non-sensitive fields
explicitly. If you introduce a new sensitive field name, add its paths to
the redaction list in `src/logger/custom-logger.service.ts` in the same PR.

## Usage conventions

- Inject `CustomLoggerService` (or extend the Nest `Logger`) rather than
  calling `console.*` in application code.
- Prefer structured events for operational alerting:
  `logger.errorEvent('stellar_tx_failed', { code })`.
- Pass a context string (`'AuthService'`) so lines are filterable by module.

## Development tips

```bash
tail -f harvest-finance/backend/logs/application.log | npx pino-pretty   # pretty-print file output
LOG_LEVEL=debug LOG_PRETTY=1 npm run start:dev                           # verbose local run
```
