# Solidity → Soroban Migration Notes

## Done
- `vault/src/lib.rs` — core `Vault.sol` logic ported: deposit, withdraw, redeem,
  share math (VaultLib), deposit cap, per-ledger withdrawal rate limit
  (ledger sequence stands in for `block.number`), pause/unpause, emergency
  asset rescue, admin/pauser auth via `require_auth()`.

## Explicitly NOT done yet — do not claim these are ported
1. **MEV/slippage protection** (`depositWithSlippage`, `_enforceMEVProtection`,
   `PriceOracle.sol`). Soroban/Stellar's execution and mempool model is
   different enough from EVM that this needs a fresh threat-model discussion,
   not a line-by-line port. Flag as "planned" in any public materials, not
   "done."
2. **UUPS upgradeability**. Soroban upgrades via
   `env.deployer().update_current_contract_wasm(new_hash)`, gated by your own
   auth check — structurally different from OZ's proxy pattern. Needs its own
   design + a decision on who can authorize upgrades (single admin vs.
   timelock vs. multisig).
3. **GovernanceTimelock.sol** — no direct port yet. Soroban timelocks are
   typically hand-rolled (store a scheduled execution ledger number + hash of
   the pending call, require the delay to pass, then execute). Worth building
   as its own contract.
4. **GnosisSafeAdminRouter.sol / IGnosisSafe.sol** — no Gnosis Safe equivalent
   on Stellar. If multisig admin control matters for the vault, this needs a
   native design: either an n-of-m signature threshold check inside the
   vault's `require_admin`, or a separate multisig contract that becomes the
   vault's stored `Admin` address.
5. **Controller.sol / StrategyManager.sol / BaseStrategy.sol /
   MockAaveStrategy.sol** — the yield-strategy layer. Not started. This is
   the largest remaining chunk (strategies that deploy vault assets into
   yield sources) and depends on what Stellar-native yield sources you
   actually intend to integrate with — there's no Aave on Stellar, so this
   can't be a like-for-like port; it needs a real design decision on what
   the vault's assets actually do while deposited.
6. **VaultFactory.sol** — Soroban factory pattern differs (deploy via
   `env.deployer().with_current_contract(...)` or uploading a shared Wasm
   hash and instantiating multiple contract instances from it). Straightforward
   to build once Vault is finalized, but not yet done.
7. **Storage.sol** — Solidity uses this for storage-layout safety across
   upgrades (a proxy-pattern concern). Not directly applicable to Soroban's
   storage model (typed `DataKey` enum keys), so this doesn't need a 1:1 port —
   just confirm your Soroban contracts use consistent `DataKey` structuring,
   which `vault/src/lib.rs` already does.

## Known risk in the current port
- Share math (`to_shares` / `to_assets`) uses `i128`, ported directly from the
  Solidity version's `uint256` math. Solidity has 256-bit headroom for
  `assets * totalSupply`; `i128` does not. For large deposits/supply this can
  overflow. Before this goes anywhere near mainnet: either bound realistic
  input sizes and add explicit overflow checks, or move to a wider
  intermediate type / fixed-point library. This is flagged in a code comment
  but needs a real decision, not just a comment.

## Recommended order to continue
1. Get `vault/` compiling and passing real unit + integration tests
   (`cargo test`, then `soroban contract invoke` against local testnet).
2. Resolve the i128 overflow risk above before anything else.
3. Design the multisig/admin model (#4) since Controller and Strategy work
   depend on knowing who can authorize what.
4. Only then take on the strategy layer (#5) — it's the biggest unknown
   because "what does Stellar-native yield deployment even look like here"
   is a product decision, not just a translation task.

## Testing
No Soroban tests exist yet for this contract. Before treating this as
functional, write `#[test]` cases using `soroban_sdk::testutils::Address as _`
and a mock token to at least cover: deposit/withdraw/redeem happy paths,
deposit cap enforcement, withdrawal rate limiting across ledger boundaries,
pause blocking deposits, and emergency withdraw refusing to touch the vault's
own asset. The existing Foundry fuzz tests in `contracts/test/` are a good
source of edge cases to carry over (zero amounts, exact-cap boundary, etc.) —
worth porting those test *cases*, if not the test *framework*, since Soroban
doesn't use Foundry.
