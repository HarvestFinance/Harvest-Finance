# 🤝 Contributing to Harvest Finance

Thank you for helping empower smallholder farmers! This guide covers everything you need to contribute effectively.

---

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Developer Workflow at a Glance](#developer-workflow-at-a-glance)
- [Makefile Commands](#makefile-commands)
- [Pre-Commit Hooks](#pre-commit-hooks)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Workflow](#pull-request-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Project Documentation Map](#project-documentation-map)

---

## Getting Started

### 0. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22.x | backend & frontend |
| npm | 10.x | ships with Node; lockfile-based installs (`npm ci`) |
| Docker + Docker Compose | recent stable | runs PostgreSQL + Redis locally |
| Foundry (optional) | latest | only for `contracts/` work |

Or open the repository in **GitHub Codespaces / a Dev Container**
(`.devcontainer/devcontainer.json` provisions Node 22, git, VS Code
extensions, and forwards ports 3000/3001/5432/6379).

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/Harvest-Finance.git
cd Harvest-Finance
```

### 2. Start Dependencies (PostgreSQL & Redis)

```bash
docker compose up -d postgres redis      # or: make db-up
```

The dev compose defaults match `.env.example` (`harvest`/`harvest_dev`,
database `harvest_dev`). Stop later with `make db-down`.

### 3. Configure Environment

```bash
cd harvest-finance/backend
npm ci                                   # install dependencies
cp .env.example .env                     # then fill in real values
```

`.env` is git-ignored — never commit it. Required variables (DB credentials,
JWT secrets, Stellar settings, webhook HMAC secrets) are **validated at
startup** with a Joi schema (`src/config/env.validation.ts`); the app fails
fast with a clear error naming each missing variable. Secret values are
never printed in that error output. See `docs/logging.md` for redaction
rules — payroll values and credentials must never be logged or committed.

### 4. Database Setup

```bash
npm run migration:run                    # apply all migrations (or: make db-migrate)
npm run seed                             # optional: synthetic demo data (or: make db-seed)
```

- `migration:generate` creates a new migration from entity changes.
- `migration:revert` rolls back the last migration.
- Seed data is fully synthetic (faker-generated users/vaults/deposits with
  fixed seed). `seed:clear` removes it, `seed:reset` re-applies.

### 5. Run the Application

```bash
npm run start:dev                        # http://localhost:5000 (or: make dev)
```

Swagger UI is available in non-production at `/api/docs`; OpenAPI JSON at
`/api/docs-json`. Health: `GET /health`, metrics: `GET /metrics`
(unversioned paths).

### 6. Frontend & Contracts (optional)

```bash
cd harvest-finance/frontend && npm ci && cp .env.example .env && npm run dev   # :3000
cd contracts && forge install && forge test                                    # optional
```

---

## Developer Workflow at a Glance

```
Clone → open in Codespaces/devcontainer or local shell
     → npm ci (backend, frontend)
     → configure .env
     → docker compose up -d postgres redis
     → migration:run → seed (optional)
     → start:dev
     → test / lint / typecheck
     → create branch → focused changes
     → pre-commit hooks (lint-staged + TS gate)
     → push & open PR
```

## Makefile Commands

The root `Makefile` wraps the project scripts (run `make help` to list):

| Command | What it does |
|---------|--------------|
| `make dev` | Backend watch mode |
| `make build` | Build the backend (`nest build`) |
| `make lint` | ESLint on backend source |
| `make typecheck` | `tsc --noEmit` over the backend |
| `make test` / `test:cov` / `test:e2e` | Backend unit / coverage / e2e tests |
| `make db-up` / `db-down` | Start / stop Postgres+Redis via Docker Compose |
| `make db-migrate` | Apply pending TypeORM migrations |
| `make db-migrate-revert` | Revert last migration |
| `make db-seed` / `db-seed-reset` | Seed synthetic data / clear & re-seed |

> **Known issue:** `tsc --noEmit` currently reports pre-existing type errors
> across parts of the codebase (tracked for paydown). The `typecheck` script
> is still the source of truth — please don't introduce *new* errors; the
> pre-commit gate enforces this via a baseline (below).

## Pre-Commit Hooks

Husky + lint-staged run automatically on `git commit` after a root
`npm install`:

1. **ESLint --fix** on staged TypeScript files under
   `harvest-finance/backend/`.
2. **TypeScript gate** when staged files include backend TS: runs
   `tsc --noEmit` and fails if your changes add a type error not already in
   the checked-in baseline (`harvest-finance/backend/tsc-baseline.txt`).
   This keeps existing debt from blocking commits while blocking new debt.

To regenerate the baseline deliberately (e.g. after paying down errors):

```bash
cd harvest-finance/backend && npm run typecheck:baseline
```

Install/refresh hooks from a clean checkout with `npm install` at the repo
root. Do not bypass hooks (`--no-verify`) except for documented merge
mechanics.

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/add-wallet-support` |
| Bug fix | `fix/<short-description>` | `fix/transaction-timeout` |
| Docs | `docs/<short-description>` | `docs/update-deployment-guide` |
| Refactor | `refactor/<short-description>` | `refactor/vault-modular` |
| Test | `test/<short-description>` | `test/vault-edge-cases` |

Always branch off `main` unless the issue specifies otherwise.

---

## Commit Messages

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. Every commit message must use the format below so that changelogs can be generated automatically.

### Format

```
<type>[optional scope]: <short description>

[optional body]

[optional footer(s)]
```

- **type** — one of the allowed values listed below (lowercase, required)
- **scope** — the area of the codebase affected, in parentheses, e.g. `auth`, `vault`, `dto` (optional)
- **short description** — imperative, present tense, no trailing period, max 72 chars
- **body** — free-form text explaining *why* the change was made (optional)
- **footer** — `BREAKING CHANGE: <description>` or issue references such as `Closes #123` (optional)

### Allowed types

| Type | When to use |
|---|---|
| `feat` | A new feature visible to users or API consumers |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests, no production code change |
| `refactor` | Code restructuring with no feature or bug-fix impact |
| `chore` | Tooling, dependencies, config, CI — nothing that affects runtime |
| `perf` | A change that improves performance |
| `style` | Formatting, whitespace — no logic change |
| `build` | Build system or external dependency updates |
| `ci` | CI/CD configuration changes |

### Examples

```
feat: add transaction export
fix: handle expired session
docs: update deployment guide
test: add vault transition coverage
chore: update development tooling
feat(auth): add Stellar wallet login endpoint
fix(vault): correct totalDeposits drift on withdrawal
```

### Breaking changes

Append `!` after the type/scope and add a `BREAKING CHANGE:` footer:

```
feat(api)!: rename deposit response fields

BREAKING CHANGE: `amount_deposited` is now `principal`; update all API clients accordingly
```

Reference the issue number in the PR description with `Closes #<issue>`.

---

## Pull Request Workflow

1. **Claim** the issue by commenting on it
2. **Create** a branch from `main` using the conventions above
3. **Make focused commits** — one logical change per commit, Conventional
   Commit messages; let the pre-commit hooks lint/type-gate each one
4. **Run checks locally before pushing:**

   ```bash
   cd harvest-finance/backend
   npm run lint            # eslint (auto-fix)
   npm run typecheck       # tsc --noEmit (no new errors vs baseline)
   npm test                # unit/integration suites
   npm run build           # nest build
   ```

5. **Open** a PR against `main` with:
   - Clear title matching the issue
   - Description of what changed and why
   - Screenshots for UI changes
   - `Closes #<issue-number>`
6. **Review CI** — the CI workflow runs backend lint/tests/build and
   frontend lint/tests/build on every PR; fix anything red before review
7. **Respond** to review feedback promptly — push follow-up commits or
   rebase; avoid force-pushing mid-review unless asked

---

## Coding Standards

### TypeScript / NestJS (Backend)

- Follow the existing module layout: `controller` → `service` →
  `repository/entity`; DTOs per feature folder.
- Use `async/await`, not raw Promises.
- Validate every external input with `class-validator` DTOs; the global
  pipe whitelists and rejects unknown properties (HTTP 422).
- Use NestJS guards for protected routes; never hand-roll auth checks in
  controllers.
- Throw typed exceptions (`BadRequestException`, …) so filters can map them;
  document error semantics where non-obvious (see
  `SorobanExceptionFilter`).
- Document public service methods and non-obvious behavior with JSDoc/TSDoc;
  don't restate obvious code.
- Never log or return secrets, private keys, tokens, or payroll values
  ([logging rules](docs/logging.md)).
- Formatting: Prettier (`npm run format`), enforced via
  `eslint-config-prettier`/`eslint-plugin-prettier`.
- Linting: ESLint flat config (`eslint.config.mjs`).

### Solidity (Contracts)

- Follow [Checks-Effects-Interactions](https://docs.soliditylang.org/en/latest/security-considerations.html)
- Use `ReentrancyGuard` on all state-mutating functions
- Add NatSpec (`@notice`, `@param`, `@return`) to all public functions
- Prefer libraries for reusable pure math

### Documentation

- Update docs in the same PR as behavior changes:
  API/versioning → `docs/api/versioning.md`; ops → `docs/deployment-runbook.md`;
  architecture decisions → new `docs/adr/YYYY-MM-DD-slug.md`.
- Significant architecture choices get an ADR before/with the change.

---

## Testing Requirements

| Layer | Minimum Coverage | Command |
|---|---|---|
| Backend unit | ≥ 90% | `npm run test:cov` |
| Backend e2e | Key flows | `npm run test:e2e` |
| Contracts fuzz | 10,000 runs | `forge test` |

- All PRs must pass CI before merge
- New features must include corresponding tests
- Bug fixes must include a regression test

---

## Project Documentation Map

| Topic | Location |
|-------|----------|
| System architecture & diagram | `docs/architecture.md`, `docs/architecture-diagram.md` |
| Architecture decision records | `docs/adr/YYYY-MM-DD-slug.md` |
| API versioning & deprecation policy | `docs/api/versioning.md` |
| Rate limits | `docs/rate-limits.md` |
| Health checks / metrics / logging | `docs/health-checks.md`, `docs/metrics.md`, `docs/logging.md` |
| Deployment & rollback | `docs/deployment-runbook.md` |
| Auth DTO reference | `harvest-finance/backend/src/auth/dto/README.md` |
| Multi-chain adapters guide | `harvest-finance/backend/src/multi-chain/README.md` |
| Generated code docs (Compodoc) | `cd harvest-finance/backend && npm run docs` → `documentation/` (git-ignored) |
