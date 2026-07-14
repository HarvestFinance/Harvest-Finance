# Harvest Finance — Soroban Contracts (Stellar)

This is the **active** smart-contract direction for Harvest Finance: a
Stellar / Soroban (Rust) port of the original Ethereum vault.

- `vault/` — the core `Vault` contract, ported from the Solidity
  `Vault.sol` (see `../contracts-legacy` for the archived original).
  Implements ERC4626-style share accounting, deposit cap, per-ledger
  withdrawal rate limit, pause/unpause, emergency asset rescue, and
  admin/pauser auth.
- `vault/tests/integration.rs` — integration tests (run with `cargo test`).
- `NOTES.md` — migration status, known risks (incl. the `i128` share-math
  overflow concern), and the remaining work before this is production-ready.

## Status

**In progress / first draft.** The core vault is ported but the strategy
layer (Controller / StrategyManager / BaseStrategy), MEV/slippage protection,
upgradeability, governance timelock, and Gnosis Safe admin routing are **not
yet done**. Do not claim full Soroban parity until those exist — see
`NOTES.md`.

## Build & test

```bash
cd vault
cargo build
cargo test
```
