# Contracts (Solidity / Foundry) — DEPRECATED / LEGACY

This directory contains the original Ethereum/Solidity vault implementation
(Foundry + OpenZeppelin). **It is deprecated and no longer the active
direction of the project.**

The product now targets **Stellar / Soroban** (Rust). The in-progress Soroban
port of the core vault lives in [`../contracts-soroban`](../contracts-soroban),
with a migration roadmap and known gaps documented in its `NOTES.md`.

## Why this was archived

Grant materials and application code describe a Stellar/Soroban stack. Keeping a
live, actively-claimed Solidity vault alongside that created a tech-stack
mismatch that failed review. This code is kept here for reference, audit, and
historical comparison only — it is **not** deployed by the current product and
should not be treated as canonical.

## What's inside

- `src/Vault.sol`, `src/BaseVault.sol` — ERC4626-style vault
- `src/Controller.sol`, `src/StrategyManager.sol`, `src/BaseStrategy.sol`,
  `src/MockAaveStrategy.sol` — yield strategy layer (Ethereum-native, Aave-based)
- `src/GovernanceTimelock.sol`, `src/GnosisSafeAdminRouter.sol` — governance/admin
- `src/PriceOracle.sol`, `src/Storage.sol`, `src/VaultFactory.sol` — supporting contracts
- `test/`, `script/`, `certora/`, `legacy-tests/` — test & verification harness

## Building (historical)

```bash
cd contracts-legacy
forge build
forge test
```

This is frozen at the state it was archived; do not add new features here.
