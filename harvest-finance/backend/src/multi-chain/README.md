# Multi-chain data bridge

A thin abstraction so Harvest's yield reporting can grow beyond Stellar
without a refactor. Registered adapters today: **Stellar**, **Solana**,
**Polygon**, and **Ethereum**.

## Architecture at a glance

```
MultiChainService ── fans out via Promise.allSettled ──┐
        │                                              │
        ▼                                              ▼
   ChainRegistryService                    [StellarYieldAdapter,
   (health + lookup by chain)               SolanaYieldAdapter,
                                            PolygonYieldAdapter,
                                            EthereumYieldAdapter]
```

- **Interface** — `src/multi-chain/interfaces/chain-adapter.interface.ts`
  defines `ChainAdapter` plus the data contracts (`ChainYield`,
  `ChainVault`, `ChainDeposit`, `AdapterHealth`) and the `CHAIN_ADAPTERS`
  DI token.
- **Registration** — each adapter is a Nest provider in
  `src/multi-chain/multi-chain.module.ts`. A factory provider collects them:

  ```ts
  {
    provide: CHAIN_ADAPTERS,
    useFactory: (stellar, solana, polygon, ethereum) =>
      [stellar, solana, polygon, ethereum],
    inject: [StellarYieldAdapter, SolanaYieldAdapter, PolygonYieldAdapter, EthereumYieldAdapter],
  }
  ```

- **Consumption** — `MultiChainService` injects `@Inject(CHAIN_ADAPTERS)`
  adapters and aggregates their results; `ChainRegistryService` additionally
  keeps a `Map<chain, adapter>` for lookup/health (`get(chain)`, `getAll()`,
  `refreshHealth()`) and health-checks every adapter on module init.

## The `ChainAdapter` contract

A new adapter must implement every member of the interface:

| Member | Contract |
|--------|----------|
| `readonly chain: string` | Lower-case chain key (e.g. `'stellar'`). Unique across adapters; must match the `chain` field of every returned `ChainYield`. |
| `getVaults()` | Yield-bearing vaults exposed by this chain → `ChainVault[]` |
| `getDeposits(userId?)` | Deposits (optionally filtered to a user) → `ChainDeposit[]` |
| `getAPY(vaultId?)` | Current APR/APY in percent, or `null` when unknown |
| `getTVL(vaultId?)` | Total value locked as a decimal string in native asset units |
| `supportsChain(chain)` | Case-insensitive check against the adapter's own key |
| `healthCheck()` | `AdapterHealth` with status `healthy` / `degraded` / `offline`; never throws — catch internally and report `offline` with a message |
| `getYieldsForUser(userId)` | Flat array of positions owned by the user. Return `[]` when the user has no presence on this chain. Prefer graceful degradation over throwing |

### How network/chain configuration is supplied

Adapters read chain-specific settings from `ConfigService` environment keys
inside their constructors — there is no per-chain config file:

| Adapter | Env keys |
|---------|----------|
| Ethereum | `ETHEREUM_RPC_URL`, `ETHEREUM_VAULT_CONFIGS` (JSON array of `{ vaultAddress, name, assetCode, decimals, apr }`) |
| Polygon | `POLYGON_RPC_URL`, `POLYGON_VAULT_CONFIGS` (same shape) |
| Solana | `SOLANA_RPC_URL`, `SOLANA_VAULT_STRATEGIES` (parsed tolerantly by `parseSolanaVaultStrategies`) |
| Stellar | Reads internal Postgres deposit/vault tables; no RPC config needed |

Missing configuration is not an error: adapters report themselves as
`offline` (e.g. message `'ETHEREUM_RPC_URL is not configured'`) and yield
queries degrade to empty results.

### How errors are surfaced

Adapters **never throw upward**. Temporary upstream failures are caught
inside the adapter, which either returns `[]` or reports an offline health
status. At the service layer, `MultiChainService.getCrossChainYields` fans
out with `Promise.allSettled`: a rejected adapter contributes an entry to
the response's `errors: { chain, message }[]` array while successful
adapters' data is still returned. This keeps one downed chain from breaking
cross-chain reporting.

## Adding a New Chain Adapter

1. Create `src/multi-chain/adapters/<chain>-yield.adapter.ts` implementing
   `ChainAdapter` from `interfaces/chain-adapter.interface.ts`.
2. Pick a unique lower-case `chain` key and reuse it consistently.
3. Read any network configuration from `ConfigService` env keys inside the
   constructor; tolerate missing values (report `offline`).
4. Register the adapter class in `MultiChainModule.providers`.
5. Add it to the `CHAIN_ADAPTERS` factory injection list and returned array:

   ```ts
   {
     provide: CHAIN_ADAPTERS,
     useFactory: (stellar, myChain) => [stellar, myChain],
     inject: [StellarYieldAdapter, MyChainYieldAdapter],
   }
   ```

6. Document new env keys in `.env.example`.

No other module, controller, or existing adapter needs modification —
`MultiChainService` automatically fans out across every registered adapter.

### Tests to write

Add `<chain>-yield.adapter.spec.ts` next to the adapter, mirroring
`stellar-yield.adapter.spec.ts` / `solana-yield.adapter.spec.ts`:

- `getYieldsForUser` returns `[]` for users with no positions.
- The adapter handles missing/unconfigured upstream data without throwing.
- `supportsChain` accepts its own key and rejects others.
- `healthCheck` reports `healthy` when upstream responds and `offline`
  (with a message) when it does not.

## Related controllers

- `multi-chain.controller.ts` — cross-chain yield aggregation endpoints.
- `multi-chain-health.controller.ts` — aggregated adapter health.
- `migration.controller.ts` — vault migration tooling.
