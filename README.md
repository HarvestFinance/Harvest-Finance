# <p align="center">
<img width="1254" height="1254" alt="ChatGPT Image Aug 13, 2026, 03_49_51 PM" src="https://github.com/user-attachments/assets/d1cc40c6-e962-41fb-bcb0-a03d8af056bc" />



[Screencast From 2026-08-13 16-03-43.webm](https://github.com/user-attachments/assets/250e4aa5-5fa0-4a28-86d7-9d378fca6242)

<img width="1366" height="650" alt="Screenshot From 2026-08-13 16-05-11" src="https://github.com/user-attachments/assets/c31dab87-23d9-44ef-b243-93cb3b939d8a" />
<img width="1366" height="650" alt="Screenshot From 2026-08-13 16-05-35" src="https://github.com/user-attachments/assets/874a958f-1987-4f5d-b5b7-5b5c5105bf35" />

</p>

<p align="center">
  <b>Blockchain-powered supply chain financing infrastructure for smallholder farmers, built on Stellar.</b>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://stellar.org"><img src="https://img.shields.io/badge/Stellar-XLM-blue" alt="Stellar"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://discord.gg/harvestfinance"><img src="https://img.shields.io/badge/Discord-Join%20Us-7289DA" alt="Discord"></a>
</p>

---

## 📊 Project Status

| Component | Status |
|-----------|--------|
| Frontend | 🟢 |
| Backend API | 🟢 |
| Database | 🟢 |
| Stellar Integration | 🟢 |
| Soroban Event Indexer | 🟡 |
| Automated Tests | 🟢 |
| CI/CD | 🟢 |
| Production Deployment | 🟡 |
| Smart Contract Audit | 🔴 |

**Status: Active Development**

---

## 1. Overview

Harvest Finance addresses the **$1.5 trillion trade finance gap** for smallholder farmers. By leveraging the **Stellar blockchain**, the platform provides:

- **Pre-Funding**: Upfront capital at **60%** for confirmed orders against verified purchase orders.
- **Smart Escrow**: Automated, trustless payments via Stellar Claimable Balances.
- **Zero Hidden Fees**: Transaction costs under **$0.00001** with ~5s settlement on Stellar.
- **Reputation Scoring**: On-chain credit history built from real transaction data.

The platform combines a **Next.js** web application, **NestJS/TypeScript** backend, **PostgreSQL** database, and **Stellar/Soroban** blockchain infrastructure to manage purchase orders, financing requests, escrow/payment workflows, transaction history, and reputation data.

### Why Stellar?

- **Fast settlement**: ~5 second ledger close time enables near-instant payment release.
- **Low transaction costs**: Base fees are typically 100 stroops ($0.00001) per operation.
- **Native claimable balances**: Stellar's built-in `createClaimableBalance` operation provides escrow semantics without custom smart contract logic.
- **Soroban smart contracts**: The platform indexes Soroban ContractEvents via RPC to build real-time dashboards.
- **Multi-asset support**: Native XLM plus Stellar Asset Contracts allow financing in multiple tokens.

---

## 2. Problem

Smallholder farmers can have confirmed purchase orders but still lack the working capital needed to fulfill them. Traditional trade finance is slow, expensive, and requires collateral that farmers often cannot provide. This creates a **$1.5 trillion global gap** in agricultural trade finance.

---

## 3. Solution

Harvest Finance provides financing infrastructure around verified purchase orders. Buyers create and confirm orders, farmers accept them, and the platform releases upfront capital (60%) via Stellar escrow. Delivery verification with GPS and IPFS proof triggers final settlement. Reputation scores are built from on-chain transaction history.

---

## 4. How It Works

```
Buyer creates Purchase Order
                 ↓
Farmer accepts order
                 ↓
Stellar Claimable Balance escrow is created (buyer + farmer as claimants)
                 ↓
Farmer requests upfront payment (60%)
                 ↓
Platform releases 60% via direct Stellar payment
                 ↓
Farmer delivers crop
                 ↓
Inspector verifies delivery (GPS + IPFS image + multi-sig approval)
                 ↓
Platform releases remaining balance
                 ↓
Transaction history recorded on Stellar
                 ↓
Farmer reputation score updated
```

### Step-by-step technical walkthrough

- **Purchase Order**: Buyer calls `POST /api/v1/orders` with cropType, quantity, and price. Only users with `UserRole.BUYER` can create orders (`harvest-finance/backend/src/orders/orders.controller.ts:42`).
- **Verification**: Order status transitions from `PENDING` → `ACCEPTED` when a `FARMER` calls `POST /api/v1/orders/:id/accept` (`harvest-finance/backend/src/orders/orders.service.ts:48-91`).
- **Escrow**: On acceptance, `OrdersService.acceptOrder()` calls `StellarService.createEscrow()`, which builds a Stellar transaction using `Operation.createClaimableBalance`. The farmer receives `Claimant.predicateUnconditional()` and the buyer receives `Claimant.predicateNot(predicateBeforeAbsoluteTime(deadline))` (`harvest-finance/backend/src/stellar/services/stellar.service.ts:479-492`).
- **Financing Request / Upfront Payment**: The farmer calls `POST /api/v1/orders/:id/upfront`. The backend calculates `order.price * order.quantity * 0.6` and submits an `Operation.payment` to the farmer's Stellar address (`harvest-finance/backend/src/orders/orders.service.ts:93-127`).
- **Settlement**: After delivery, inspectors submit verifications via `POST /verifications` with GPS coordinates and an IPFS image hash. Verifications require multi-signature approval from `INSPECTOR`, `SUPERVISOR`, and `CLIENT` roles (`harvest-finance/backend/src/verification/verification.controller.ts:148-174`).
- **Transaction History**: Stellar transactions are queried via `GET /api/v1/stellar/account/:publicKey/transactions` with cursor-based pagination, and decoded from XDR to human-readable operations (`harvest-finance/backend/src/stellar/services/stellar.service.ts:160-333`).
- **Reputation**: The `CreditScore` entity tracks `totalTransactions`, `successfulTransactions`, `failedTransactions`, `totalVolume`, and `averageRating` per farmer (`harvest-finance/backend/src/database/entities/credit-score.entity.ts:36-97`).

---

## 5. Key Features

- **Purchase order management** — OrdersModule with CreateOrderDto, QueryOrdersDto, and status lifecycle (`PENDING`, `ACCEPTED`, `IN_ESCROW`, `COMPLETED`, `CANCELLED`, `EXPIRED`) in `harvest-finance/backend/src/orders/order-status.enum.ts:1-8`.
- **Financing requests** — 60% upfront release via `releaseUpfrontPayment` in `harvest-finance/backend/src/stellar/services/stellar.service.ts:373-444`.
- **Stellar payments** — Direct `Operation.payment` with fee-bump support and retry logic (`harvest-finance/backend/src/stellar/services/stellar.service.ts:393-444`).
- **Claimable Balance escrow** — `createClaimableBalance` with time-locked predicates and balance ID extraction from result_xdr (`harvest-finance/backend/src/stellar/services/stellar.service.ts:450-583`).
- **Transaction tracking** — Paginated Horizon history with XDR decoding, fee estimation, and FeeBumpTransaction support (`harvest-finance/backend/src/stellar/stellar.controller.ts:80-189`).
- **Reputation / credit history** — CreditScore entity with JSONB history array and scheduled recalculation (`harvest-finance/backend/src/database/entities/credit-score.entity.ts:36-97`).
- **Role-based dashboards** — UserRole enum: `FARMER`, `BUYER`, `INSPECTOR`, `ADMIN` enforced by RolesGuard (`harvest-finance/backend/src/database/entities/user.entity.ts:21-26`, `harvest-finance/backend/src/auth/guards/roles.guard.ts:6-27`).
- **Delivery verification** — GPS validation, IPFS image upload, and multi-sig approval workflow (`harvest-finance/backend/src/verification/verification.controller.ts:61-274`).
- **Soroban event indexing** — Cursor-persistent indexer polls Soroban RPC every 30s and persists ContractEvents with version-aware parsing (`harvest-finance/backend/src/soroban/soroban-indexer.service.ts:157-177`).
- **Multi-chain yield adapters** — Stellar, Solana, Ethereum, and Polygon adapters behind a common ChainAdapter interface (`harvest-finance/backend/src/multi-chain/adapters/`).
- **Real-time updates** — Socket.io gateways emit deposit, withdrawal, and milestone events (`harvest-finance/backend/src/realtime/realtime.module.ts:1-43`).
- **Farm vaults** — Crop-cycle-linked savings vaults with milestone tracking and projected growth (`harvest-finance/backend/src/farm-vaults/farm-vaults.service.ts:29-194`).
- **Notifications** — In-app, email, and SMS notification preferences stored as JSONB on the User entity (`harvest-finance/backend/src/database/entities/user.entity.ts:145-157`).

---

## 6. Product Demo

- **Live Application**: https://app.harvestfinance.io (production), https://staging.harvestfinance.io (staging)
- **API Documentation**: `GET /api/docs` on a running backend instance (non-production only)
- **Screenshots**: See `harvest-finance/frontend/public/screenshots/` (placeholder paths in `harvest-finance/frontend/public/manifest.json:61-68`)

---

## 7. System Architecture

```
                     HARVEST FINANCE
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Next.js Frontend             Admin Dashboard
      (Next.js 15, Tailwind,        (NestJS + Socket.io)
       Zustand, React Query)
             │
             ▼
       NestJS API Layer
      (36 feature modules)
             │
      ┌──────┼──────────┐
      │      │          │
      ▼      ▼          ▼
   Auth    Orders    Financing
   (JWT,  (Purchase  (Escrow,
   OAuth,  Orders,   60% upfront,
   Stellar)Verification) Settlement)
      │      │          │
      └──────┼──────────┘
             │
             ▼
        Data Layer
             │
      ┌──────┴──────┐
      ▼             ▼
 PostgreSQL      Redis
 (TypeORM,       (Cache,
 30+ entities,   Session)
 25+ migrations)
             │
             ▼
      Stellar Integration
             │
       ┌─────┴─────┐
       ▼           ▼
   Stellar      Soroban
   Network      Contracts
   (Horizon,    (Event
    Claimable    Indexer)
    Balances,
    Fee Bump)
```

### Layer breakdown

**Frontend** (`harvest-finance/frontend/src/app/`): 17 Next.js App Router pages including dashboard, vaults, farm-vaults, transactions, portfolio, settings, login, signup, community, marketplace, yield-analytics, realtime, and admin routes.

**Backend** (`harvest-finance/backend/src/`): 36 NestJS modules registered in AppModule (`harvest-finance/backend/src/app.module.ts:109-227`). Key modules include AuthModule, OrdersModule, VerificationModule, PaymentsModule, StellarModule, SorobanModule, VaultsModule, FarmVaultsModule, MultiChainModule, YieldAnalyticsModule, InsuranceModule, CommunityModule, NotificationsModule, RealtimeModule, WebhooksModule, and AdminModule.

**Data Layer**: PostgreSQL via TypeORM with 30+ entities and 25+ TypeORM migrations (`harvest-finance/backend/src/database/migrations/`). Redis via cache-manager-redis-yet for Soroban RPC caching and general application caching.

**Blockchain Layer**: Direct Stellar SDK integration (stellar-sdk v13/v14) for account management, escrow, payments, and fee-bump transactions. Soroban event indexing via JSON-RPC to soroban-testnet.stellar.org or soroban-rpc.mainnet.stellar.gateway.fm.

---

## 8. Technical Stack

### Frontend
- **Framework**: Next.js 15 (`harvest-finance/frontend/package.json:36`)
- **Language**: TypeScript 5 (`harvest-finance/frontend/package.json:82`)
- **Styling**: TailwindCSS v4, PostCSS (`harvest-finance/frontend/package.json:80`)
- **State**: Zustand 5, React Query v5 (`harvest-finance/frontend/package.json:24`, `harvest-finance/frontend/package.json:52`)
- **Blockchain**: @stellar/stellar-sdk v15, @stellar/freighter-api v6 (`harvest-finance/frontend/package.json:22`, `harvest-finance/frontend/package.json:47`)
- **Realtime**: socket.io-client v4 (`harvest-finance/frontend/package.json:45`)
- **Forms**: React Hook Form + Zod (`harvest-finance/frontend/package.json:41`, `harvest-finance/frontend/package.json:51`)
- **UI**: Radix UI primitives, Lucide icons, Recharts (`harvest-finance/frontend/package.json:19-21`, `harvest-finance/frontend/package.json:36`, `harvest-finance/frontend/package.json:46`)
- **i18n**: next-intl, i18next (`harvest-finance/frontend/package.json:50`, `harvest-finance/frontend/package.json:32`)
- **PWA**: next-pwa, Workbox (`harvest-finance/frontend/package.json:48`, `harvest-finance/frontend/package.json:46-47`)

### Backend
- **Framework**: NestJS 11 (`harvest-finance/backend/package.json:38-46`)
- **Language**: TypeScript 5.7 (`harvest-finance/backend/package.json:129`)
- **Runtime**: Node.js 20+ (CI uses Node 20, Docker uses Node 22-bookworm-slim)
- **ORM**: TypeORM 0.3 with PostgreSQL 16 (`harvest-finance/backend/package.json:93`, `harvest-finance/backend/package.json:81`)
- **Cache**: Redis 7 via cache-manager-redis-yet (`harvest-finance/backend/package.json:67`, `harvest-finance/backend/package.json:87`)
- **Auth**: Passport (JWT, Google OAuth, GitHub OAuth, Stellar SEP-10) (`harvest-finance/backend/package.json:76-80`, `harvest-finance/backend/package.json:92`)
- **Blockchain**: stellar-sdk v13/v14, @stellar/freighter-api v6 (`harvest-finance/backend/package.json:58-59`, `harvest-finance/backend/package.json:91`)
- **Multi-chain**: ethers v6, @solana/web3.js v1.98 (`harvest-finance/backend/package.json:71`, `harvest-finance/backend/package.json:57`)
- **API**: REST (versioned `/api/v{N}/`) + GraphQL (Apollo) + Swagger (`harvest-finance/backend/package.json:33`, `harvest-finance/backend/package.json:49`)
- **Realtime**: socket.io v4 (`harvest-finance/backend/package.json:90`)
- **Validation**: class-validator, zod v4 (`harvest-finance/backend/package.json:68`, `harvest-finance/backend/package.json:94`)
- **Observability**: pino + pino-http, prom-client metrics (`harvest-finance/backend/package.json:83-84`)
- **PDF/Excel**: pdfkit, exceljs (`harvest-finance/backend/package.json:80`, `harvest-finance/backend/package.json:72`)
- **Bot**: telegraf (Telegram) (`harvest-finance/backend/package.json:92`)

### Blockchain
- **Primary**: Stellar Network (testnet and mainnet)
- **Smart Contracts**: Soroban (event indexing only; no Rust contracts deployed from this repo)
- **Escrow**: Stellar Claimable Balances (createClaimableBalance / claimClaimableBalance)
- **Payments**: Direct Stellar payments with fee-bump transaction support

### Database
- **Primary**: PostgreSQL 16 (TypeORM migrations)
- **Cache/Session**: Redis 7
- **Entities**: 30+ TypeORM entities including User, Order, Verification, CreditScore, Vault, FarmVault, SorobanEvent, Notification, CropCycle, InsurancePlan, CommunityPost, CoopListing, etc.
- **Migrations**: 25+ versioned TypeORM migrations in `harvest-finance/backend/src/database/migrations/`

### Testing
- **Backend**: Jest 30 + ts-jest + supertest (`harvest-finance/backend/package.json:120-125`)
- **Frontend**: Jest 30 + Testing Library + Vitest (`harvest-finance/frontend/package.json:76-83`)
- **E2E**: Jest e2e config (`harvest-finance/backend/package.json:21`)

### DevOps
- **Containerization**: Docker multi-stage builds for backend and frontend
- **CI/CD**: GitHub Actions (CI, CD, Security Scan)
- **Secrets**: Environment variables, AWS Secrets Manager, or HashiCorp Vault

---

## 9. Repository Structure

```
Harvest-Finance/
├── harvest-finance/
│   ├── backend/                    # NestJS API service
│   │   ├── src/
│   │   │   ├── achievements/       # Gamification module
│   │   │   ├── admin/              # Admin dashboard & circuit breaker
│   │   │   ├── ai-query-history/   # AI assistant query logging
│   │   │   ├── analytics/          # Vault scoring & risk analytics
│   │   │   ├── app.module.ts       # Root module (36 imports)
│   │   │   ├── auth/               # JWT, OAuth, Stellar SEP-10 auth
│   │   │   ├── chains/             # Chain adapter interfaces
│   │   │   ├── common/             # Guards, interceptors, sanitization, secrets
│   │   │   ├── community/          # Community posts, groups, reactions
│   │   │   ├── config/             # Environment validation & versioning config
│   │   │   ├── coop-marketplace/   # Cooperative listings & orders
│   │   │   ├── database/           # TypeORM entities, migrations (25+), seed data
│   │   │   ├── domain-events/      # Domain event definitions
│   │   │   ├── export/             # CSV/PDF export service
│   │   │   ├── farm-intelligence/  # AI-powered farm insights
│   │   │   ├── farm-vaults/        # Crop-cycle-linked savings vaults
│   │   │   ├── harvest/            # Yield harvesting scheduler
│   │   │   ├── health/             # Health check endpoints
│   │   │   ├── insurance/          # Crop insurance plans & claims
│   │   │   ├── integrations/       # Telegram bot integration
│   │   │   ├── logger/             # Structured Pino logging
│   │   │   ├── main.ts             # Bootstrap (Swagger, WebSocket, validation)
│   │   │   ├── multi-chain/        # Stellar, Solana, Ethereum, Polygon adapters
│   │   │   ├── notifications/      # In-app, email, SMS notifications
│   │   │   ├── observability/      # Prometheus metrics
│   │   │   ├── orders/             # Purchase order CRUD + Stellar escrow
│   │   │   ├── payments/           # Fiat on-ramp (Paystack, mock)
│   │   │   ├── portfolio/          # Cross-account portfolio aggregation
│   │   │   ├── realtime/           # Socket.io gateways for live updates
│   │   │   ├── rewards/            # Reward distribution logic
│   │   │   ├── soroban/            # Soroban ContractEvent indexer & parsers
│   │   │   ├── state-sync/         # External state synchronization
│   │   │   ├── stellar/            # Horizon client, escrow, fee estimation
│   │   │   ├── users/              # User management DTOs
│   │   │   ├── vaults/             # Vault CQRS, deposits, withdrawals, APY
│   │   │   ├── verification/       # Delivery verification, GPS, IPFS, multi-sig
│   │   │   ├── wallets/            # Custodial wallet encryption & management
│   │   │   ├── webhooks/           # HMAC-signed webhook ingress
│   │   │   └── yield-analytics/    # Yield projection & analytics
│   │   ├── Dockerfile              # Multi-stage Node 22 production image
│   │   ├── package.json            # Dependencies & scripts
│   │   └── test/                   # E2E test fixtures
│   ├── frontend/                   # Next.js 15 web application
│   │   ├── src/
│   │   │   ├── app/                # App Router pages (17 routes)
│   │   │   ├── components/         # Reusable UI components
│   │   │   │   ├── auth/           # StellarAuth, ProtectedRoute
│   │   │   │   ├── dashboard/      # Vault cards, charts, modals
│   │   │   │   ├── ui/             # Radix-based design system
│   │   │   │   └── ...
│   │   │   ├── lib/                # API client, utilities, stores
│   │   │   └── messages/           # i18n translation files
│   │   ├── public/                 # Static assets (favicon.svg, icons, screenshots)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── Dockerfile
│   └── docs/
│       └── scoring-model.md        # Vault scoring methodology
├── contracts/                      # Solidity DeFi contracts (separate from main app)
│   ├── src/                        # Vault, Strategy, Controller, Governance
│   ├── test/                       # Foundry test suite
│   ├── script/                     # Deployment scripts
│   ├── certora/                    # Certora formal verification specs
│   └── foundry.toml
├── backend/                        # Shared backend utilities
├── src/                            # Shared frontend utilities & component tests
├── docs/                           # Root documentation
│   ├── api/                        # API versioning docs
│   ├── contracts/                  # Contract docs
│   ├── security/                   # Bug bounty program
│   └── ...
├── .github/workflows/              # CI, CD, Security Scan pipelines
├── docker-compose.yml              # Development environment (Postgres, Redis, backend, frontend)
├── docker-compose.staging.yml      # Staging deployment config
├── docker-compose.prod.yml         # Production deployment config
├── Makefile                        # Developer shortcuts (dev, test, lint, db)
├── package.json                    # Root workspace config
├── CONTRIBUTING.md
└── README.md
```

---

## 10. Core Technical Workflows

### Financing workflow
1. Buyer creates order via `POST /api/v1/orders` (`harvest-finance/backend/src/orders/orders.controller.ts:37-50`).
2. Farmer accepts via `POST /api/v1/orders/:id/accept` (`harvest-finance/backend/src/orders/orders.controller.ts:70-82`).
3. Backend creates Stellar `createClaimableBalance` escrow with buyer and farmer as claimants (`harvest-finance/backend/src/stellar/services/stellar.service.ts:450-583`).
4. Farmer requests upfront payment via `POST /api/v1/orders/:id/upfront` (`harvest-finance/backend/src/orders/orders.controller.ts:84-92`).
5. Backend releases 60% via `Operation.payment` to farmer's Stellar address (`harvest-finance/backend/src/stellar/services/stellar.service.ts:373-444`).

### Payment workflow
- **Direct Stellar payment**: Built in `StellarService.releaseUpfrontPayment()` using TransactionBuilder + Operation.payment + optional submitWithFeeBump (`harvest-finance/backend/src/stellar/services/stellar.service.ts:393-444`).
- **Escrow release**: Farmer claims claimable balance via `Operation.claimClaimableBalance` (`harvest-finance/backend/src/stellar/services/stellar.service.ts:589-672`).
- **Escrow refund**: Buyer claims expired balance after deadline (`harvest-finance/backend/src/stellar/services/stellar.service.ts:678-756`).
- **Fiat on-ramp**: PaymentsModule provides PaystackFiatOnRampProvider and MockFiatOnRampProvider via configurable factory (`harvest-finance/backend/src/payments/payments.module.ts:8-42`).

### Purchase order workflow
- **States**: `PENDING` → `ACCEPTED` → `IN_ESCROW` → `COMPLETED` / `CANCELLED` / `EXPIRED` (`harvest-finance/backend/src/orders/order-status.enum.ts:1-8`).
- **Acceptance**: Race-condition safe status update with escrow transaction hash recording (`harvest-finance/backend/src/orders/orders.service.ts:48-91`).
- **Rollback**: If escrow creation fails, order status rolls back to PENDING (`harvest-finance/backend/src/orders/orders.service.ts:84-90`).

### Reputation workflow
- **CreditScore entity**: Tracks score (int), totalTransactions, successfulTransactions, failedTransactions, totalVolume (decimal 14,2), averageRating (decimal 3,2), and history (JSONB array of CreditScoreHistoryEntry) (`harvest-finance/backend/src/database/entities/credit-score.entity.ts:36-97`).
- **History entries**: Each entry records date, score, reason, orderId, and verificationId (`harvest-finance/backend/src/database/entities/credit-score.entity.ts:16-22`).

---

## 11. Stellar Integration

### Why Stellar
- **Settlement speed**: ~5 second ledger close time.
- **Cost**: Base fees of ~100 stroops ($0.00001) per operation.
- **Claimable Balances**: Native `createClaimableBalance` operation provides time-locked, multi-party escrow without custom smart contracts.
- **Soroban**: Smart contract platform for event emission and complex logic; the platform indexes ContractEvents via RPC.
- **Asset issuance**: Stellar Asset Contracts allow custom token issuance for financing in non-XLM assets.

### How transactions work
```
Application
     ↓
NestJS Backend
     ↓
StellarService (stellar-sdk v13/v14)
     ↓
Transaction construction (TransactionBuilder + Operation)
     ↓
Signing (Keypair.fromSecret)
     ↓
Submission (submitTransaction / submitWithFeeBump)
     ↓
Stellar Network (Horizon + Soroban RPC)
     ↓
Confirmation
     ↓
Application database (TypeORM)
```
Transaction lifecycle is implemented in `harvest-finance/backend/src/stellar/services/stellar.service.ts`. The StellarClientService wraps Horizon calls with retry logic (`harvest-finance/backend/src/stellar/utils/stellar-retry.ts`) and a circuit breaker (`harvest-finance/backend/src/stellar/utils/circuit-breaker.ts`).

### Claimable Balances
The escrow implementation uses two claimants:
- **Farmer**: `Claimant.predicateUnconditional()` — can claim immediately.
- **Buyer**: `Claimant.predicateNot(Claimant.predicateBeforeAbsoluteTime(deadline))` — can only claim after the deadline if funds remain.

Transaction is built at `harvest-finance/backend/src/stellar/services/stellar.service.ts:494-507`. The balanceId is extracted from the result_xdr using `StellarSdk.xdr.TransactionResult.fromXDR` and `createClaimableBalanceResult()` (`harvest-finance/backend/src/stellar/services/stellar.service.ts:1138-1168`).

### Soroban
The SorobanModule (`harvest-finance/backend/src/soroban/soroban.module.ts:1-36`) provides:
- **SorobanIndexerService**: Polls Soroban RPC every 30 seconds (`@Cron(CronExpression.EVERY_30_SECONDS)`) for ContractEvents and persists them to PostgreSQL (`harvest-finance/backend/src/soroban/soroban-indexer.service.ts:157-177`).
- **ContractVersionRegistry**: Resolves contract versions per ledger for schema-aware parsing (`harvest-finance/backend/src/soroban/parsers/contract-version-registry.ts`).
- **EventParserFactory**: Version-aware event parsing (v1, v2 parsers) (`harvest-finance/backend/src/soroban/parsers/event-parser.factory.ts`).
- **Cursor persistence**: Indexer state is persisted in indexer_state table and resumed on startup (`harvest-finance/backend/src/soroban/soroban-indexer.service.ts:107-151`).

### Transaction verification
Transactions are verified via Horizon:
- `GET /api/v1/stellar/transaction/:hash` returns status, ledger, fee, and operation list (`harvest-finance/backend/src/stellar/stellar.controller.ts:171-189`).
- Decoded transaction history is available at `GET /api/v1/stellar/account/:publicKey/transactions/decoded` which parses XDR envelopes into human-readable operations (`harvest-finance/backend/src/stellar/services/stellar.service.ts:276-333`).
- Fee estimation is available at `GET /api/v1/stellar/fee` with p10/p20/p50/p75/p90/p99 percentiles (`harvest-finance/backend/src/stellar/services/stellar.service.ts:921-967`).

### Network used
Configurable via `STELLAR_NETWORK` env var. Defaults to testnet. Mainnet support is implemented but guarded by a warning log in StellarService constructor (`harvest-finance/backend/src/stellar/services/stellar.service.ts:59-64`).

---

## 12. Smart Contracts

### Contracts

**Soroban Event Indexer** (backend service, not a deployed contract):
- **SorobanIndexerService** — polls Soroban RPC, persists events, manages cursor state.
- **ContractVersionRegistry** — maps contract IDs to schema versions per ledger.
- **EventParserFactory** + v1/event-parser-v1.ts, v2/event-parser-v2.ts — decode Soroban event topics/values into typed entities.

**No Rust smart contracts** are deployed or compiled from this repository. The `contracts/` directory at the repo root contains Solidity DeFi contracts (Vault, Strategy, Controller) that are unrelated to the Harvest Finance agricultural platform. The platform's on-chain logic relies on Stellar's native operations (`createClaimableBalance`, `payment`, `setOptions`) rather than custom Soroban contracts.

### Testing
- Soroban indexer tests: `harvest-finance/backend/src/soroban/tests/soroban-cursor-persistence.spec.ts`, `soroban-indexer-filter.spec.ts`, `ttl-stress-test.spec.ts`.
- Soroban parser tests: `harvest-finance/backend/src/soroban/parsers/contract-version-registry.spec.ts`, `event-parser.factory.spec.ts`.
- Stellar integration tests: `harvest-finance/backend/src/stellar/tests/stellar.integration.spec.ts`, `stellar-fee-estimation.spec.ts`, `stellar.feebump.spec.ts`, `stellar.unit.spec.ts`.
- Stellar circuit breaker: `harvest-finance/backend/src/stellar/utils/circuit-breaker.spec.ts`.
- Stellar retry: `harvest-finance/backend/src/stellar/utils/stellar-retry.spec.ts`.

### Security considerations
The platform has not undergone an independent third-party smart-contract audit. Soroban contracts (if deployed externally) should be audited before mainnet use. The backend's on-chain operations are limited to standard Stellar SDK primitives with input validation (`validatePublicKey`, `validateAmount`) and fee-cap enforcement (`FeeCapExceededException`).

---

## 13. Backend Architecture

### NestJS modules
36 feature modules are registered in AppModule (`harvest-finance/backend/src/app.module.ts:109-227`):
AuthModule, UsersModule, VaultsModule, FarmIntelligenceModule, ExportModule, FarmVaultsModule, HarvestModule, HealthModule, OrdersModule, VerificationModule, DatabaseModule, MultiChainModule, PortfolioModule, RealtimeModule, SorobanModule, StellarModule, AnalyticsModule, StateSyncModule, PaymentsModule, AchievementsModule, AdminModule, InsuranceModule, NotificationsModule, RewardsModule, ObservabilityModule, AppConfigModule, CommonModule, LoggerModule, WebhooksModule, CommunityModule, CoopMarketplaceModule, DomainEventsModule, YieldAnalyticsModule, PortfolioModule, StateSyncModule.

### API architecture
- **Versioned REST**: All routes use URI versioning (`/api/v1/...`) enforced by `VersioningInterceptor` and `ApiVersions` decorator (`harvest-finance/backend/src/common/config/versioning.config.ts`).
- **GraphQL**: Apollo Server with auto-generated schema and Playground enabled in non-production (`harvest-finance/backend/src/app.module.ts:194-198`).
- **WebSockets**: Socket.io adapters for realtime vault and deposit events (`harvest-finance/backend/src/main.ts:51-52`).
- **Swagger**: Available at `/api/docs` in non-production with bearer auth, structured tags for each module, and example error schemas (`harvest-finance/backend/src/main.ts:57-139`).

### Authentication
- **JWT**: Access tokens (1h) + refresh tokens (7d) with rotation (`harvest-finance/backend/src/auth/strategies/jwt-refresh.strategy.ts`).
- **OAuth**: Google and GitHub via Passport (`harvest-finance/backend/src/auth/strategies/google.strategy.ts`, `github.strategy.ts`).
- **Stellar SEP-10**: Challenge-response authentication using StellarStrategy (`harvest-finance/backend/src/auth/strategies/stellar.strategy.ts`).
- **Rate limiting**: Tiered throttler (short/medium/long) plus custom RateLimitGuard for password reset (`harvest-finance/backend/src/auth/auth.controller.ts:70, 214-220`).

### Database
- **ORM**: TypeORM 0.3 with synchronize: false and explicit migrations (`harvest-finance/backend/src/app.module.ts:188`).
- **Entities**: 30+ entities including User, Order, Verification, CreditScore, Vault, FarmVault, SorobanEvent, Notification, CropCycle, InsurancePlan, CommunityPost, CoopListing, Session, SecurityEvent, CustodialWallet, VaultApproval, InsuranceClaim, etc.
- **Migrations**: 25+ versioned migrations from 1700000000000 to 1700000000023.

### Blockchain services
- **StellarService**: Account management, escrow creation/release/refund, upfront payment, multi-sig setup, fee estimation, fee-bump transactions, transaction history, decoded XDR parsing.
- **StellarClientService**: Horizon RPC wrapper with retry and circuit breaker.
- **SorobanIndexerService**: Background event indexer with cursor persistence and version-aware parsing.
- **MultiChainService**: Abstract adapter interface with Stellar, Solana, Ethereum, and Polygon implementations.

### Validation
- **Global pipes**: ValidationPipe with whitelist: true, forbidNonWhitelisted: true, transform: true, and 422 status code (`harvest-finance/backend/src/main.ts:37-47`).
- **DTOs**: class-validator + zod across all modules.
- **Input sanitization**: InputSanitizerService (`harvest-finance/backend/src/common/sanitization/input-sanitizer.service.spec.ts`).

### Error handling
- **Global filters**: HttpExceptionFilter, ThrottlerExceptionFilter, SorobanExceptionFilter (`harvest-finance/backend/src/main.ts:30-34`).
- **Structured errors**: Consistent JSON error format with statusCode, timestamp, path, method, message.

---

## 14. Frontend Architecture

### Next.js
- **Version**: Next.js 15 (`harvest-finance/frontend/package.json:36`)
- **Router**: App Router with 17 page routes
- **Rendering**: Server Components by default with "use client" for interactive pages

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Email/password + OAuth + Stellar wallet login |
| `/signup` | Registration with role selection |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset with token |
| `/dashboard` | Portfolio hub with vault overview, charts, metrics |
| `/dashboard/farm-vaults` | Crop-cycle savings vaults with milestone tracking |
| `/dashboard/mobile` | Mobile-optimized dashboard layout |
| `/dashboard/soroban-signing` | Soroban transaction signing interface |
| `/vaults` | Vault management |
| `/transactions` | Stellar transaction history |
| `/portfolio` | Cross-account portfolio aggregation |
| `/yield-analytics` | Yield forecasting and analytics |
| `/community` | Community posts, groups, leaderboard |
| `/marketplace` | Cooperative marketplace listings |
| `/settings` | User preferences, notification settings |
| `/help` | Help and search |
| `/realtime` | Realtime activity feed |
| `/admin/dashboard` | Admin analytics and stats |
| `/admin/realtime` | Admin realtime monitoring |

### Components
- **Design system**: Radix UI primitives (Dialog, DropdownMenu, Toast) + TailwindCSS v4 (`harvest-finance/frontend/src/components/ui/`).
- **Dashboard**: VaultOverview, VaultCard, VaultTable, TransactionList, YieldChart, DepositModal, WithdrawModal (`harvest-finance/frontend/src/components/dashboard/`).
- **Auth**: StellarAuth (Freighter integration), ProtectedRoute, AuthShell (`harvest-finance/frontend/src/components/auth/`).
- **AI Assistant**: AIAssistantChat, ChatMessage, QueryHistory (`harvest-finance/frontend/src/components/ai-assistant/`).
- **Admin**: DashboardStats, AnalyticsCharts, UserManagement, VaultManagement (`harvest-finance/frontend/src/components/Admin/`).

### State management
- **Server state**: TanStack React Query v5 (`harvest-finance/frontend/package.json:24`)
- **Client state**: Zustand 5 (`harvest-finance/frontend/package.json:52`)
- **Offline**: Dexie (IndexedDB wrapper) for local data persistence (`harvest-finance/frontend/package.json:29`)
- **Forms**: React Hook Form + Zod resolvers (`harvest-finance/frontend/package.json:41`, `harvest-finance/frontend/package.json:51`)

### Authentication
- **Stellar wallet**: @stellar/freighter-api v6 for wallet connection and transaction signing (`harvest-finance/frontend/src/components/auth/StellarAuth.tsx`).
- **JWT**: Stored in HTTP-only cookies or local storage with automatic refresh.
- **OAuth**: Google and GitHub redirect flows.

### API integration
- **HTTP client**: Axios with interceptors (`harvest-finance/frontend/src/lib/api-client.ts`).
- **Realtime**: socket.io-client for live vault and deposit updates (`harvest-finance/frontend/src/components/dashboard/VaultActivityFeed.tsx`).
- **i18n**: next-intl with server-side locale detection from cookies (`harvest-finance/frontend/src/app/layout.tsx:57-66`).
- **PWA**: next-pwa + Workbox for offline capability (`harvest-finance/frontend/package.json:48`).

---

## 15. Security

### Authentication
- **JWT**: 1h access tokens, 7d refresh tokens with rotation (`harvest-finance/backend/src/auth/strategies/jwt-refresh.strategy.ts`).
- **Stellar SEP-10**: Challenge-response flow for wallet-based auth (`harvest-finance/backend/src/auth/strategies/stellar.strategy.ts`).
- **OAuth**: Google and GitHub with account linking via UserOAuthLink entity.
- **Session management**: Session entity with device tracking and TTL-based logout (`harvest-finance/backend/src/auth/logout-ttl.spec.ts`).

### Authorization
- **Role-based access control**: UserRole enum (FARMER, BUYER, INSPECTOR, ADMIN) enforced by RolesGuard and JwtAuthGuard (`harvest-finance/backend/src/auth/guards/roles.guard.ts:6-27`).
- **Route-level guards**: @Roles() decorator on controllers (e.g., OrdersController restricts order creation to BUYER and acceptance to FARMER).

### Input validation
- **Global pipe**: ValidationPipe with whitelist, forbidNonWhitelisted, transform, and 422 status (`harvest-finance/backend/src/main.ts:37-47`).
- **DTOs**: class-validator + zod across all modules.
- **Input sanitization**: InputSanitizerService (`harvest-finance/backend/src/common/sanitization/input-sanitizer.service.spec.ts`).

### Error handling
- **Global filters**: HttpExceptionFilter, ThrottlerExceptionFilter, SorobanExceptionFilter (`harvest-finance/backend/src/main.ts:30-34`).
- **Structured errors**: Consistent JSON error format with statusCode, timestamp, path, method, message.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center"><b>Built with ❤️ for farmers worldwide 🌾</b></p>
