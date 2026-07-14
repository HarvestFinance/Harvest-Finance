# Deposit API Test Guide

## Test Endpoints

### 1. Deposit to Vault
```bash
POST /api/v1/vaults/{vaultId}/deposit
Authorization: Bearer {access_token_from_login}
Content-Type: application/json

{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 1000.50
}
```

### 2. Get User's Vaults
```bash
GET /api/v1/vaults/my-vaults
Authorization: Bearer {access_token_from_login}
```

### 3. Get Specific Vault
```bash
GET /api/v1/vaults/{vaultId}
Authorization: Bearer {access_token_from_login}
```

### 4. Get Public Vaults
```bash
GET /api/v1/vaults/public
```

## Validation Rules

### Deposit Validation
- ✅ Amount must be greater than 0
- ✅ Amount cannot exceed 1,000,000
- ✅ Vault must exist and be active
- ✅ Vault must have available capacity
- ✅ User must be authenticated

### Error Responses
- **400 Bad Request**: Invalid amount, vault at capacity, or vault inactive
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Vault does not exist
- **500 Internal Server**: Database or processing errors

## Success Response Example
```json
{
  "vault": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "ownerId": "123e4567-e89b-12d3-a456-426614174000",
    "type": "CROP_PRODUCTION",
    "status": "ACTIVE",
    "vaultName": "My Crop Production Vault",
    "description": "Vault for financing wheat production",
    "totalDeposits": 51000.50,
    "maxCapacity": 100000.00,
    "availableCapacity": 49000.00,
    "utilizationPercentage": 51.0,
    "interestRate": 5.5,
    "maturityDate": "2024-12-31T23:59:59Z",
    "lockPeriodEnd": null,
    "isPublic": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-12-01T10:30:00Z"
  },
  "deposit": {
    "id": "456e7890-e89b-12d3-a456-426614174111",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "vaultId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "CONFIRMED",
    "amount": 1000.50,
    "transactionHash": "mock_tx_1701234567890",
    "createdAt": "2023-12-01T10:30:00Z",
    "confirmedAt": "2023-12-01T10:30:05Z"
  },
  "userTotalDeposits": 25000.75
}
```

## Atomic Operations

The deposit system uses database transactions to ensure:
- ✅ Deposit record is created atomically
- ✅ Vault total is updated atomically  
- ✅ Vault status updates to FULL_CAPACITY when needed
- ✅ No race conditions between concurrent deposits

## Security Features

- ✅ JWT authentication required for all endpoints
- ✅ User ID is overridden from authenticated token
- ✅ Vault ownership validation
- ✅ Input validation with class-validator
- ✅ Proper error handling and logging

## Testing Steps

1. **Setup**: Run migrations and start server
2. **Authentication**: Login to get JWT token
3. **Create Test Vault**: Use existing vault or create new one
4. **Test Valid Deposit**: Deposit within capacity limits
5. **Test Invalid Deposits**: 
   - Negative amount (should return 400)
   - Amount exceeding capacity (should return 400)
   - Invalid vault ID (should return 404)
6. **Test Unauthorized**: Call without JWT token (should return 401)
7. **Verify Atomic Updates**: Check vault totals after deposit

## Database Schema

### Vaults Table
- `id` - UUID Primary Key
- `owner_id` - UUID Foreign Key to users
- `type` - Enum (CROP_PRODUCTION, EQUIPMENT_FINANCING, etc.)
- `status` - Enum (ACTIVE, INACTIVE, FROZEN, FULL_CAPACITY)
- `vault_name` - VARCHAR(100)
- `description` - TEXT (nullable)
- `total_deposits` - DECIMAL(18,8)
- `max_capacity` - DECIMAL(18,8)
- `interest_rate` - DECIMAL(18,8)
- `maturity_date` - TIMESTAMP WITH TIME ZONE (nullable)
- `lock_period_end` - TIMESTAMP WITH TIME ZONE (nullable)
- `is_public` - BOOLEAN
- `created_at` - TIMESTAMP WITH TIME ZONE
- `updated_at` - TIMESTAMP WITH TIME ZONE

### Deposits Table
- `id` - UUID Primary Key
- `user_id` - UUID Foreign Key to users
- `vault_id` - UUID Foreign Key to vaults
- `status` - Enum (PENDING, CONFIRMED, FAILED, REFUNDED)
- `amount` - DECIMAL(18,8)
- `transaction_hash` - TEXT (nullable)
- `stellar_transaction_id` - TEXT (nullable)
- `confirmed_at` - TIMESTAMP WITH TIME ZONE (nullable)
- `notes` - TEXT (nullable)
- `created_at` - TIMESTAMP WITH TIME ZONE
- `updated_at` - TIMESTAMP WITH TIME ZONE
