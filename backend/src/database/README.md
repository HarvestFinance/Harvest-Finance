# Database Schema Documentation

This document describes the PostgreSQL database schema for the Harvest Finance agricultural marketplace application.

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
   - [Users](#users)
   - [Orders](#orders)
   - [Transactions](#transactions)
   - [Verifications](#verifications)
   - [CreditScores](#credit-scores)
4. [Indexes](#indexes)
5. [Constraints](#constraints)
6. [PostgreSQL-Specific Features](#postgresql-specific-features)

---

## Overview

The database schema is designed for an agricultural marketplace where farmers can sell crops to buyers, with Stellar blockchain integration for payments and an inspector verification system for quality assurance.

### Technology Stack

- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Migrations**: TypeORM Migrations

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     Users      │       │   CreditScores │
│                 │       │                 │
│  - id (PK)     │◄──────│  - farmer_id    │
│  - email       │  1:1  │    (FK, UQ)     │
│  - password    │       │  - score        │
│  - role        │       │  - history      │
│  - stellar_addr │       │    (JSONB)      │
└────────┬────────┘       └─────────────────┘
         │
         │ 1:N (as farmer)
         │
         ▼
┌───────────────────────────────────────────────┐
│                    Orders                     │
│                                               │
│  - id (PK)                                    │
│  - farmer_id (FK)                             │
│  - buyer_id (FK)                              │
│  - crop_type                                  │
│  - quantity                                   │
│  - price                                      │
│  - status                                     │
│  - escrow_tx_hash                             │
└───────────────────────┬───────────────────────┘
                        │
                        │ 1:1
                        ▼
┌───────────────────────────────────────────────┐
│                Transactions                   │
│                                               │
│  - id (PK)                                    │
│  - order_id (FK, UQ)                          │
│  - stellar_tx_hash (UQ)                       │
│  - amount                                     │
│  - status                                     │
│  - type                                       │
└───────────────────────────────────────────────┘
                        │
                        │ 1:1
                        ▼
┌───────────────────────────────────────────────┐
│                Verifications                  │
│                                               │
│  - id (PK)                                    │
│  - order_id (FK, UQ)                          │
│  - inspector_id (FK)                          │
│  - proof_hash                                 │
│  - status                                     │
│  - inspection_date                            │
└───────────────────────────────────────────────┘
```

---

## Tables

### Users

The users table stores all participants in the marketplace.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Auto-generated | Unique identifier |
| `email` | VARCHAR | UNIQUE, NOT NULL | User's email address |
| `password` | VARCHAR | NOT NULL, SELECT:false | Hashed password |
| `role` | ENUM | DEFAULT 'FARMER' | User role (FARMER, BUYER, INSPECTOR, ADMIN) |
| `stellar_address` | VARCHAR | NULLABLE | Stellar blockchain address |
| `is_active` | BOOLEAN | DEFAULT true | Account active status |
| `first_name` | VARCHAR | NULLABLE | User's first name |
| `last_name` | VARCHAR | NULLABLE | User's last name |
| `phone` | VARCHAR | NULLABLE | Contact phone number |
| `address` | VARCHAR | NULLABLE | Physical address |
| `profile_image_url` | VARCHAR | NULLABLE | URL to profile image |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |

**Relationships:**
- One User → Many Orders (as farmer)
- One User → Many Orders (as buyer)
- One User → Many Verifications (as inspector)
- One User → One CreditScore (as farmer)

---

### Orders

The orders table represents agricultural product transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Auto-generated | Unique identifier |
| `farmer_id` | UUID | FK → users(id), NOT NULL | Reference to farmer (seller) |
| `buyer_id` | UUID | FK → users(id), NOT NULL | Reference to buyer |
| `crop_type` | VARCHAR | NOT NULL | Type of crop being sold |
| `quantity` | DECIMAL(10,2) | NOT NULL | Quantity of crop |
| `quantity_unit` | VARCHAR | DEFAULT 'kg' | Unit of measurement |
| `price` | DECIMAL(12,2) | NOT NULL | Total price |
| `status` | ENUM | DEFAULT 'PENDING' | Order status |
| `description` | TEXT | NULLABLE | Order description |
| `delivery_address` | VARCHAR | NULLABLE | Delivery location |
| `expected_delivery_date` | DATE | NULLABLE | Expected delivery |
| `escrow_tx_hash` | VARCHAR | NULLABLE | Stellar escrow transaction hash |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |

**Order Statuses:**
- `PENDING` - Order created, awaiting acceptance
- `ACCEPTED` - Farmer accepted the order
- `IN_ESCROW` - Payment in escrow on Stellar
- `COMPLETED` - Order fulfilled
- `CANCELLED` - Order cancelled
- `EXPIRED` - Order expired

**Relationships:**
- Many Orders → One User (farmer)
- Many Orders → One User (buyer)
- One Order → One Transaction
- One Order → One Verification

---

### Transactions

The transactions table records Stellar blockchain transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Auto-generated | Unique identifier |
| `order_id` | UUID | FK → orders(id), NOT NULL | Reference to order |
| `stellar_tx_hash` | VARCHAR | UNIQUE, NOT NULL | Stellar transaction hash |
| `amount` | DECIMAL(12,2) | NOT NULL | Transaction amount |
| `asset_code` | VARCHAR | DEFAULT 'XLM' | Asset code (XLM, USDC, etc.) |
| `asset_issuer` | VARCHAR | NULLABLE | Asset issuer account |
| `status` | ENUM | DEFAULT 'PENDING' | Transaction status |
| `type` | ENUM | DEFAULT 'ESCROW_DEPOSIT' | Transaction type |
| `source_account` | VARCHAR | NULLABLE | Source Stellar account |
| `destination_account` | VARCHAR | NULLABLE | Destination Stellar account |
| `stellar_memo` | VARCHAR | NULLABLE | Stellar memo |
| `confirmed_at` | TIMESTAMP | NULLABLE | Confirmation timestamp |
| `memo` | TEXT | NULLABLE | Additional notes |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |

**Transaction Statuses:**
- `PENDING` - Transaction submitted, not confirmed
- `CONFIRMED` - Transaction confirmed on blockchain
- `FAILED` - Transaction failed
- `CANCELLED` - Transaction cancelled

**Transaction Types:**
- `ESCROW_DEPOSIT` - Buyer deposits funds to escrow
- `ESCROW_RELEASE` - Funds released to farmer
- `ESCROW_REFUND` - Funds refunded to buyer
- `DIRECT_PAYMENT` - Direct payment (non-escrow)

**Relationships:**
- One Transaction → One Order

---

### Verifications

The verifications table stores inspector approvals for orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Auto-generated | Unique identifier |
| `order_id` | UUID | FK → orders(id), UNIQUE, NOT NULL | Reference to order |
| `inspector_id` | UUID | FK → users(id), NOT NULL | Reference to inspector |
| `proof_hash` | VARCHAR | NOT NULL | IPFS hash of verification proof |
| `status` | ENUM | DEFAULT 'PENDING' | Verification status |
| `notes` | TEXT | NULLABLE | Inspector notes |
| `inspection_date` | DATE | NULLABLE | Date of inspection |
| `crop_quality` | VARCHAR | NULLABLE | Quality assessment |
| `quantity_verified` | DECIMAL(10,2) | NULLABLE | Verified quantity |
| `verification_documents` | TEXT[] | NULLABLE | Array of document URLs |
| `approved_at` | TIMESTAMP | NULLABLE | Approval timestamp |
| `rejected_at` | TIMESTAMP | NULLABLE | Rejection timestamp |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |

**Verification Statuses:**
- `PENDING` - Awaiting inspection
- `APPROVED` - Order verified by inspector
- `REJECTED` - Verification rejected
- `CANCELLED` - Verification cancelled

**Relationships:**
- One Verification → One Order
- Many Verifications → One User (inspector)

---

### CreditScores

The credit_scores table stores farmer credit ratings and history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Auto-generated | Unique identifier |
| `farmer_id` | UUID | FK → users(id), UNIQUE, NOT NULL | Reference to farmer |
| `score` | INT | DEFAULT 0 | Credit score (0-1000) |
| `total_transactions` | INT | DEFAULT 0 | Total number of transactions |
| `successful_transactions` | INT | DEFAULT 0 | Successful transactions count |
| `failed_transactions` | INT | DEFAULT 0 | Failed transactions count |
| `total_volume` | DECIMAL(14,2) | DEFAULT 0 | Total transaction volume |
| `average_rating` | DECIMAL(3,2) | DEFAULT 0 | Average buyer rating (0-5) |
| `total_ratings` | INT | DEFAULT 0 | Number of ratings received |
| `history` | JSONB | DEFAULT '[]' | Score change history |
| `last_updated` | TIMESTAMP | NULLABLE | Last score update |
| `last_order_id` | UUID | NULLABLE | Last order reference |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |

**History JSONB Structure:**
```json
[
  {
    "date": "2024-01-15T10:30:00Z",
    "score": 750,
    "reason": "New order completed",
    "orderId": "uuid-of-order"
  }
]
```

**Relationships:**
- One CreditScore → One User (farmer)

---

## Indexes

### Users Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_users_email` | email | UNIQUE | Fast email lookup |
| `idx_users_role` | role | NON-UNIQUE | Role-based queries |
| `idx_users_stellar_address` | stellar_address | NON-UNIQUE | Stellar address lookup |

### Orders Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_orders_farmer_id` | farmer_id | NON-UNIQUE | Farmer's orders |
| `idx_orders_buyer_id` | buyer_id | NON-UNIQUE | Buyer's orders |
| `idx_orders_status` | status | NON-UNIQUE | Status filtering |
| `idx_orders_crop_type` | crop_type | NON-UNIQUE | Crop search |
| `idx_orders_created_at` | created_at | NON-UNIQUE | Date range queries |
| `idx_orders_status_created` | status, created_at | NON-UNIQUE | Combined filtering |

### Transactions Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_transactions_order_id` | order_id | NON-UNIQUE | Order transactions |
| `idx_transactions_status` | status | NON-UNIQUE | Status filtering |
| `idx_transactions_stellar_tx_hash` | stellar_tx_hash | UNIQUE | Hash lookup |
| `idx_transactions_created_at` | created_at | NON-UNIQUE | Date queries |

### Verifications Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_verifications_order_id` | order_id | UNIQUE | Order verification |
| `idx_verifications_inspector_id` | inspector_id | NON-UNIQUE | Inspector verifications |
| `idx_verifications_status` | status | NON-UNIQUE | Status filtering |
| `idx_verifications_created_at` | created_at | NON-UNIQUE | Date queries |

### CreditScores Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_credit_scores_farmer_id` | farmer_id | UNIQUE | Farmer credit lookup |
| `idx_credit_scores_score` | score | NON-UNIQUE | Score filtering |

---

## Constraints

### Foreign Key Constraints
| Table | Constraint | Columns | References | On Delete |
|-------|------------|---------|-------------|-----------|
| orders | fk_orders_farmer | farmer_id | users(id) | CASCADE |
| orders | fk_orders_buyer | buyer_id | users(id) | CASCADE |
| transactions | fk_transactions_order | order_id | orders(id) | CASCADE |
| verifications | fk_verifications_order | order_id | orders(id) | CASCADE |
| verifications | fk_verifications_inspector | inspector_id | users(id) | CASCADE |
| credit_scores | fk_credit_scores_farmer | farmer_id | users(id) | CASCADE |

### Unique Constraints
| Table | Columns |
|-------|---------|
| users | email |
| transactions | stellar_tx_hash |
| verifications | order_id |
| credit_scores | farmer_id |

---

## PostgreSQL-Specific Features

### UUID Primary Keys
All tables use PostgreSQL's native UUID type with `uuid_generate_v4()` for automatic ID generation.

### ENUM Types
Custom PostgreSQL enum types are used for:
- `user_role_enum`: FARMER, BUYER, INSPECTOR, ADMIN
- `order_status_enum`: PENDING, ACCEPTED, IN_ESCROW, COMPLETED, CANCELLED, EXPIRED
- `transaction_status_enum`: PENDING, CONFIRMED, FAILED, CANCELLED
- `transaction_type_enum`: ESCROW_DEPOSIT, ESCROW_RELEASE, ESCROW_REFUND, DIRECT_PAYMENT
- `verification_status_enum`: PENDING, APPROVED, REJECTED, CANCELLED

### JSONB
The `credit_scores.history` field uses PostgreSQL's JSONB type for flexible, indexed storage of score change history.

### Array Types
The `verifications.verification_documents` field uses PostgreSQL's array type for storing multiple document URLs.

### Cascading Deletes
All foreign key relationships use `ON DELETE CASCADE` to ensure referential integrity is maintained.

---

## Running Migrations

### Generate Migration
```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

### Run Migrations
```bash
npm run migration:run
```

### Revert Last Migration
```bash
npm run migration:revert
```

---

## Entity Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Order, Transaction, Verification, CreditScore } from './database/entities';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(CreditScore)
    private creditScoreRepository: Repository<CreditScore>,
  ) {}
  
  // Implementation...
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial schema with all 5 tables |
