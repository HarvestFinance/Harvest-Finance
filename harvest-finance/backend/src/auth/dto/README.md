# Auth DTO Reference

This directory holds the request/response shapes for the authentication
module (`src/auth`). Each DTO below documents its fields: what they mean,
whether they are required, their format and validation constraints, and how
they are used in the auth flow.

Validation is enforced by `class-validator` decorators via the global
`ValidationPipe` (see `main.ts`) — unknown properties are rejected with HTTP
422 (`forbidNonWhitelisted`).

> Keep this file synchronized with the DTO classes. If you change a field,
> update the matching section here in the same PR.

---

## Request DTOs

### `register.dto.ts` — `RegisterDto`

Used by `POST /api/v1/auth/register`.

| Field | Type | Required | Constraints | Purpose |
|-------|------|----------|-------------|---------|
| `email` | `string` | ✅ | Valid email (`@IsEmail`), non-empty | Login identifier; must be unique |
| `password` | `string` | ✅ | 12–32 chars; must contain lowercase, uppercase, digit, and one of `@$!%*?&` | Credential; stored as a bcrypt hash |
| `role` | `UserRole` enum | ✅ | One of `FARMER`, `BUYER`, `INSPECTOR`, `ADMIN` | RBAC role assigned at signup (drives route guards) |
| `full_name` | `string` | ✅ | 2–100 chars | Display name on the profile |
| `phone_number` | `string` | ➖ optional | ≤ 20 chars | Contact info |
| `stellar_address` | `string` | ➖ optional | ≤ 56 chars | Self-custodied Stellar wallet (`G…` address) to link at registration |
| `use_custodial_wallet` | `boolean` | ➖ optional | Boolean | When true, the service provisions a custodial wallet instead of using `stellar_address` |

Password policy note: registration enforces the complexity regex above;
login does not re-check complexity (only non-empty), so legacy passwords keep
working if the policy ever tightens.

### `login.dto.ts` — `LoginDto`

Used by `POST /api/v1/auth/login`.

| Field | Type | Required | Constraints | Purpose |
|-------|------|----------|-------------|---------|
| `email` | `string` | ✅ | Valid email, non-empty | Identifies the account |
| `password` | `string` | ✅ | Non-empty string | Verified against the stored bcrypt hash |

On success the service rotates session state and returns an
`AuthResponseDto`. Repeated failures trigger account lockout
(`MAX_LOGIN_ATTEMPTS`, `LOCKOUT_*` env configuration).

### `refresh-token.dto.ts` — `RefreshTokenDto`

Used by `POST /api/v1/auth/refresh`.

| Field | Type | Required | Constraints | Purpose |
|-------|------|----------|-------------|---------|
| `refresh_token` | `string` | ✅ | Non-empty string | JWT refresh token from login/register. Verified server-side, matched against hashed session records; reuse of a consumed token revokes the whole token family |

### `forgot-password.dto.ts` — `ForgotPasswordDto`

Used by `POST /api/v1/auth/forgot-password`.

| Field | Type | Required | Constraints | Purpose |
|-------|------|----------|-------------|---------|
| `email` | `string` | ✅ | Valid email, non-empty | Address that receives the reset link. Always answers success to prevent email enumeration |

### `reset-password.dto.ts` — `ResetPasswordDto`

Used by `POST /api/v1/auth/reset-password`.

| Field | Type | Required | Constraints | Purpose |
|-------|------|----------|-------------|---------|
| `token` | `string` | ✅ | Non-empty string | Single-use reset token e-mailed to the user |
| `new_password` | `string` | ✅ | Same 12–32 char + complexity policy as registration | Replacement credential (stored bcrypt-hashed) |

### `session.dto.ts`

Session management endpoints under `/auth/sessions`.

**`SessionPaginationQueryDto`** — query parameters for listing sessions:

| Field | Type | Required | Constraints | Purpose |
|-------|------|----------|-------------|---------|
| `page` | `number` | ➖ optional (default `1`) | Integer ≥ 1 | Page index |
| `limit` | `number` | ➖ optional (default `10`) | Integer 1–50 | Page size |

**Response classes:** `SessionResponseDto` (id, deviceName, ipAddress,
userAgent, lastUsedAt, createdAt, expiresAt, isCurrent), `SessionListResponseDto`
(`items`, `total`, `page`, `limit`), `RevokeSessionResponseDto`
(`success`, `message`). These shape Swagger output only — no request validation.

### `stellar-auth.dto.ts` — SEP-10 wallet login

**`StellarChallengeDto`** — `POST /auth/stellar/challenge`:

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `public_key` | `string` | ✅ | Stellar `G…` account requesting a challenge transaction |

**`StellarVerifyDto`** — `POST /auth/stellar/verify`:

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `transaction` | `string` | ✅ | Base64 challenge transaction signed by the client's secret key |

**Response classes:** `StellarChallengeResponseDto` (`server_public_key`,
`transaction`, `network_passphrase`) and `StellarAuthResponseDto`
(`access_token`, `refresh_token`, `user{ id, stellar_address, role,
full_name }`).

---

## Response DTOs

Defined in `auth-response.dto.ts`; used for Swagger documentation and
`@Expose()`-filtered serialization.

| Class | Fields | Used by |
|-------|--------|---------|
| `UserResponseDto` | `id`, `email`, `role`, `full_name`, `phone_number?`, `stellar_address?`, `wallet_type?` (`none`/`self-custody`/`custodial`) — never includes password hashes | Nested `user` object of auth responses |
| `AuthResponseDto` | `access_token`, `refresh_token`, `user` | Register / login / OAuth callbacks |
| `TokenResponseDto` | `access_token`, `token_type` (always `Bearer`), optional `refresh_token` when rotation issued a new pair | Refresh endpoint |
| `LogoutResponseDto` | `success`, `message` | Logout |
| `MessageResponseDto` | `success`, `message` | Verify-email / resend-verification |
| `ErrorResponseDto` | `statusCode`, `message`, `error` | Swagger error schema |

---

## Barrel exports

`index.ts` re-exports: `register.dto`, `login.dto`, `refresh-token.dto`,
`forgot-password.dto`, `reset-password.dto`, `auth-response.dto`.
`session.dto.ts` and `stellar-auth.dto.ts` are imported directly where used.
