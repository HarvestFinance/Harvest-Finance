## Summary
Adds a platform-wide circuit breaker that allows administrators to instantly halt and resume all deposit and withdrawal operations across all service instances.

## Purpose / Motivation
To protect user funds and limit platform liability during critical events (e.g. smart contract failures, third-party oracle/RPC failures, or malicious exploits), administrators need a quick, highly reliable way to pause all transactional actions (deposits and withdrawals) across all vault types (Stellar, farm-vaults, and insurance-funds).

## Changes Made
- **PlatformCircuitBreakerService**: Implements breaker state validation, activation (`open`), and deactivation (`close`) with state persistence in Redis cache.
- **PlatformCircuitBreakerGuard**: Throws a `503 Service Unavailable` with a clear message `Maintenance Mode` when the circuit breaker is active.
- **Admin Endpoints**: Adds `POST /api/v1/admin/platform/circuit-breaker/open` and `/api/v1/admin/platform/circuit-breaker/close` with proper admin role checking and audit trail logging.
- **Controller Protections**: Applied `@UseGuards(PlatformCircuitBreakerGuard)` to deposit and withdrawal endpoints in:
  - `VaultsController`
  - `FarmVaultsController`
  - `InsuranceFundController`
- **Unit and Integration Tests**:
  - `platform-circuit-breaker.service.spec.ts`
  - `platform-circuit-breaker.guard.spec.ts`
  - `circuit-breaker.controller.spec.ts`
  - `circuit-breaker.e2e-spec.ts` (End-to-end verification of endpoint blocking, propagation via Redis, and rapid toggles)

## How to Test
1. Set up env variables and ensure Redis is running.
2. Run backend E2E tests:
   ```bash
   npm run test:e2e test/circuit-breaker.e2e-spec.ts
   ```
3. Test manually by authenticating as admin:
   - Open circuit breaker: `POST /api/v1/admin/platform/circuit-breaker/open`
   - Attempt deposit or withdraw; confirm it fails with `503 Service Unavailable (Maintenance Mode)`.
   - Close circuit breaker: `POST /api/v1/admin/platform/circuit-breaker/close`
   - Attempt deposit or withdraw; confirm it succeeds.

## Related Issues
Implements the platform-wide circuit breaker specification.

## Checklist
- [x] Code builds successfully
- [x] Tests added/updated
- [x] No console errors
- [x] Documentation updated
