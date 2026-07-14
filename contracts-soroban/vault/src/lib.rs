#![no_std]
//! Soroban port of Vault.sol
//!
//! Ported from the Solidity/Foundry vault (contracts/src/Vault.sol).
//! Core semantics preserved:
//!   - ERC4626-style share accounting (toShares / toAssets, see VaultLib.sol)
//!   - Role-based admin (admin, pauser) instead of OZ AccessControl
//!   - Deposit cap
//!   - Per-ledger withdrawal rate limit (ledger sequence stands in for block.number)
//!   - Pause / unpause
//!   - Emergency asset rescue (cannot rescue the vault's own underlying asset)
//!
//! NOT yet ported (left as follow-up work, see NOTES.md in this dir):
//!   - MEV/slippage protection via price oracle (depositWithSlippage etc.) —
//!     Soroban's execution model (no public mempool in the same sense as EVM)
//!     changes the threat model here; needs its own design, not a 1:1 port.
//!   - UUPS upgradeability — Soroban contracts upgrade via `update_current_contract_wasm`
//!     gated by admin auth; wire this in once the upgrade governance process is decided.
//!   - Gnosis Safe admin routing (GnosisSafeAdminRouter.sol) — no Soroban equivalent;
//!     needs a native multisig design (e.g. n-of-m custom auth, or a dedicated
//!     multisig contract that becomes the vault's admin address).

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Asset,           // Address of underlying SEP-41 token
    TotalAssets,      // i128
    DepositCap,       // i128
    Paused,           // bool
    Admin,            // Address
    Pauser,           // Address
    MaxWithdrawalPerLedger, // i128
    LastWithdrawalLedger,   // u32
    CumulativeWithdrawalsInLedger, // i128
    Shares(Address),  // per-holder share balance
    TotalShares,      // i128
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    ZeroAssets = 1,
    ZeroReceiver = 2,
    ZeroOwner = 3,
    DepositCapExceeded = 4,
    ZeroSharesMinted = 5,
    ZeroSharesBurned = 6,
    ZeroAssetsRedeemed = 7,
    InsufficientShares = 8,
    InsufficientVaultAssets = 9,
    WithdrawalLimitExceeded = 10,
    ZeroToken = 11,
    ZeroRecipient = 12,
    CannotRescueVaultAsset = 13,
    NothingToRescue = 14,
    Paused = 15,
    NotAuthorized = 16,
    AlreadyInitialized = 17,
}

#[contract]
pub struct Vault;

#[contractimpl]
impl Vault {
    /// Equivalent to Solidity's `initialize`. Soroban contracts have no
    /// constructor; init is a normal function guarded against re-entry.
    pub fn initialize(env: Env, asset: Address, admin: Address, pauser: Address) -> Result<(), VaultError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VaultError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Pauser, &pauser);
        env.storage().instance().set(&DataKey::TotalAssets, &0i128);
        env.storage().instance().set(&DataKey::TotalShares, &0i128);
        // i128::MAX stands in for Solidity's type(uint256).max as "uncapped"
        env.storage().instance().set(&DataKey::DepositCap, &i128::MAX);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::MaxWithdrawalPerLedger, &0i128);
        Ok(())
    }

    // --- Share math (VaultLib.sol equivalent) ---

    fn to_shares(assets: i128, total_supply: i128, total_assets: i128) -> i128 {
        if total_supply == 0 {
            return assets;
        }
        // NOTE: Solidity relies on 256-bit headroom for assets * totalSupply.
        // i128 has far less headroom; for production, use i256 (soroban-sdk
        // doesn't natively expose i256 in contract types) or clamp/validate
        // inputs to avoid overflow. Flagging this explicitly rather than
        // silently porting the assumption over.
        (assets * total_supply) / total_assets
    }

    fn to_assets(shares: i128, total_supply: i128, total_assets: i128) -> i128 {
        if total_supply == 0 {
            return shares;
        }
        (shares * total_assets) / total_supply
    }

    // --- Core actions ---

    pub fn deposit(env: Env, from: Address, assets: i128, receiver: Address) -> Result<i128, VaultError> {
        from.require_auth();
        Self::require_not_paused(&env)?;

        if assets <= 0 {
            return Err(VaultError::ZeroAssets);
        }

        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap();
        let cap: i128 = env.storage().instance().get(&DataKey::DepositCap).unwrap();
        if total_assets + assets > cap {
            return Err(VaultError::DepositCapExceeded);
        }

        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();
        let shares = Self::to_shares(assets, total_shares, total_assets);
        if shares <= 0 {
            return Err(VaultError::ZeroSharesMinted);
        }

        // Pull underlying asset from depositor into this contract (SEP-41 token client)
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = soroban_sdk::token::Client::new(&env, &asset);
        token.transfer(&from, &env.current_contract_address(), &assets);

        env.storage().instance().set(&DataKey::TotalAssets, &(total_assets + assets));
        env.storage().instance().set(&DataKey::TotalShares, &(total_shares + shares));
        let receiver_shares: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Shares(receiver.clone()))
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::Shares(receiver.clone()), &(receiver_shares + shares));

        env.events()
            .publish((symbol_short!("deposit"), from, receiver), (assets, shares));

        Ok(shares)
    }

    pub fn withdraw(env: Env, owner: Address, assets: i128, receiver: Address) -> Result<i128, VaultError> {
        owner.require_auth();

        if assets <= 0 {
            return Err(VaultError::ZeroAssets);
        }

        Self::check_withdrawal_limit(&env, assets)?;

        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap();
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();
        let shares = Self::to_shares(assets, total_shares, total_assets);
        if shares <= 0 {
            return Err(VaultError::ZeroSharesBurned);
        }

        let owner_shares: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Shares(owner.clone()))
            .unwrap_or(0);
        if owner_shares < shares {
            return Err(VaultError::InsufficientShares);
        }
        if total_assets < assets {
            return Err(VaultError::InsufficientVaultAssets);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Shares(owner.clone()), &(owner_shares - shares));
        env.storage().instance().set(&DataKey::TotalShares, &(total_shares - shares));
        env.storage().instance().set(&DataKey::TotalAssets, &(total_assets - assets));

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = soroban_sdk::token::Client::new(&env, &asset);
        token.transfer(&env.current_contract_address(), &receiver, &assets);

        env.events()
            .publish((symbol_short!("withdraw"), owner, receiver), (assets, shares));

        Ok(shares)
    }

    pub fn redeem(env: Env, owner: Address, shares: i128, receiver: Address) -> Result<i128, VaultError> {
        owner.require_auth();

        if shares <= 0 {
            return Err(VaultError::ZeroSharesBurned);
        }

        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap();
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();
        let assets = Self::to_assets(shares, total_shares, total_assets);
        if assets <= 0 {
            return Err(VaultError::ZeroAssetsRedeemed);
        }

        Self::check_withdrawal_limit(&env, assets)?;

        let owner_shares: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Shares(owner.clone()))
            .unwrap_or(0);
        if owner_shares < shares {
            return Err(VaultError::InsufficientShares);
        }
        if total_assets < assets {
            return Err(VaultError::InsufficientVaultAssets);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Shares(owner.clone()), &(owner_shares - shares));
        env.storage().instance().set(&DataKey::TotalShares, &(total_shares - shares));
        env.storage().instance().set(&DataKey::TotalAssets, &(total_assets - assets));

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = soroban_sdk::token::Client::new(&env, &asset);
        token.transfer(&env.current_contract_address(), &receiver, &assets);

        env.events()
            .publish((symbol_short!("withdraw"), owner, receiver), (assets, shares));

        Ok(assets)
    }

    fn check_withdrawal_limit(env: &Env, amount: i128) -> Result<(), VaultError> {
        let limit: i128 = env
            .storage()
            .instance()
            .get(&DataKey::MaxWithdrawalPerLedger)
            .unwrap_or(0);
        if limit == 0 {
            return Ok(()); // disabled, matches Solidity's limit==0 short-circuit
        }

        let current_ledger = env.ledger().sequence();
        let last_ledger: u32 = env
            .storage()
            .instance()
            .get(&DataKey::LastWithdrawalLedger)
            .unwrap_or(0);

        if current_ledger > last_ledger {
            env.storage().instance().set(&DataKey::LastWithdrawalLedger, &current_ledger);
            env.storage()
                .instance()
                .set(&DataKey::CumulativeWithdrawalsInLedger, &amount);
        } else {
            let cumulative: i128 = env
                .storage()
                .instance()
                .get(&DataKey::CumulativeWithdrawalsInLedger)
                .unwrap_or(0);
            let new_cumulative = cumulative + amount;
            if new_cumulative > limit {
                return Err(VaultError::WithdrawalLimitExceeded);
            }
            env.storage()
                .instance()
                .set(&DataKey::CumulativeWithdrawalsInLedger, &new_cumulative);
        }
        Ok(())
    }

    // --- Admin functions ---

    pub fn set_withdrawal_limit(env: Env, caller: Address, limit: i128) -> Result<(), VaultError> {
        Self::require_admin(&env, &caller)?;
        env.storage().instance().set(&DataKey::MaxWithdrawalPerLedger, &limit);
        Ok(())
    }

    pub fn set_deposit_cap(env: Env, caller: Address, cap: i128) -> Result<(), VaultError> {
        Self::require_admin(&env, &caller)?;
        env.storage().instance().set(&DataKey::DepositCap, &cap);
        Ok(())
    }

    pub fn pause(env: Env, caller: Address) -> Result<(), VaultError> {
        Self::require_pauser(&env, &caller)?;
        env.storage().instance().set(&DataKey::Paused, &true);
        Ok(())
    }

    pub fn unpause(env: Env, caller: Address) -> Result<(), VaultError> {
        Self::require_pauser(&env, &caller)?;
        env.storage().instance().set(&DataKey::Paused, &false);
        Ok(())
    }

    pub fn emergency_withdraw(
        env: Env,
        caller: Address,
        token_addr: Address,
        recipient: Address,
    ) -> Result<i128, VaultError> {
        Self::require_admin(&env, &caller)?;

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        if token_addr == asset {
            return Err(VaultError::CannotRescueVaultAsset);
        }

        let token = soroban_sdk::token::Client::new(&env, &token_addr);
        let balance = token.balance(&env.current_contract_address());
        if balance == 0 {
            return Err(VaultError::NothingToRescue);
        }

        token.transfer(&env.current_contract_address(), &recipient, &balance);
        Ok(balance)
    }

    // --- View functions ---

    pub fn convert_to_shares(env: Env, assets: i128) -> i128 {
        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap();
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();
        Self::to_shares(assets, total_shares, total_assets)
    }

    pub fn convert_to_assets(env: Env, shares: i128) -> i128 {
        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap();
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();
        Self::to_assets(shares, total_shares, total_assets)
    }

    pub fn total_assets(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalAssets).unwrap()
    }

    pub fn balance_of(env: Env, holder: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Shares(holder))
            .unwrap_or(0)
    }

    // --- Auth helpers ---

    fn require_admin(env: &Env, caller: &Address) -> Result<(), VaultError> {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if *caller != admin {
            return Err(VaultError::NotAuthorized);
        }
        Ok(())
    }

    fn require_pauser(env: &Env, caller: &Address) -> Result<(), VaultError> {
        caller.require_auth();
        let pauser: Address = env.storage().instance().get(&DataKey::Pauser).unwrap();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if *caller != pauser && *caller != admin {
            return Err(VaultError::NotAuthorized);
        }
        Ok(())
    }

    fn require_not_paused(env: &Env) -> Result<(), VaultError> {
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            return Err(VaultError::Paused);
        }
        Ok(())
    }
}
