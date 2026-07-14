#![cfg(test)]
//! Integration tests for the Soroban Vault port.
//!
//! Covers the happy paths plus the edge cases called out in NOTES.md:
//! deposit cap enforcement, per-ledger withdrawal rate limiting, pause
//! blocking deposits, and emergency withdraw refusing the vault's own asset.
//!
//! Run with: `cargo test` (requires the Soroban SDK + Rust toolchain).

use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

use harvest_vault::{Vault, VaultError};

struct TestSetup {
    env: Env,
    contract: Address,
    token: Address,
    admin: Address,
    pauser: Address,
    user: Address,
}

fn setup() -> TestSetup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let pauser = Address::generate(&env);
    let user = Address::generate(&env);

    // Deploy a mock SEP-41 token
    let token = env.register_stellar_asset_contract_v2(admin.clone());
    let token_client = TokenClient::new(&env, &token.address());
    let token_admin = StellarAssetClient::new(&env, &token.address());
    token_admin.mint(&user, &10_000_000_000_000);

    // Deploy the vault
    let contract_id = env.register_contract(None, Vault);
    let contract = contract_id.address();

    Vault::initialize(&env, token.address(), admin.clone(), pauser.clone());

    TestSetup {
        env,
        contract,
        token: token.address(),
        admin,
        pauser,
        user,
    }
}

fn vault(env: &Env, contract: &Address) -> Vault {
    Vault::from_contract(contract.clone())
}

#[test]
fn deposit_mints_shares_one_to_one_on_first_deposit() {
    let s = setup();
    let v = vault(&s.env, &s.contract);

    let shares = v.deposit(&s.env, s.user.clone(), 1_000_000, s.user.clone());
    assert_eq!(shares, 1_000_000);
    assert_eq!(v.balance_of(&s.env, s.user.clone()), 1_000_000);
    assert_eq!(v.total_assets(&s.env), 1_000_000);
}

#[test]
fn deposit_then_withdraw_round_trips() {
    let s = setup();
    let v = vault(&s.env, &s.contract);

    v.deposit(&s.env, s.user.clone(), 5_000_000, s.user.clone());
    let burned = v.withdraw(&s.env, s.user.clone(), 2_000_000, s.user.clone());
    assert_eq!(burned, 2_000_000);
    assert_eq!(v.balance_of(&s.env, s.user.clone()), 3_000_000);
    assert_eq!(v.total_assets(&s.env), 3_000_000);
}

#[test]
fn redeem_returns_underlying_assets() {
    let s = setup();
    let v = vault(&s.env, &s.contract);

    v.deposit(&s.env, s.user.clone(), 4_000_000, s.user.clone());
    let assets = v.redeem(&s.env, s.user.clone(), 4_000_000, s.user.clone());
    assert_eq!(assets, 4_000_000);
    assert_eq!(v.balance_of(&s.env, s.user.clone()), 0);
}

#[test]
fn zero_amount_deposit_rejected() {
    let s = setup();
    let v = vault(&s.env, &s.contract);
    let res = v.try_deposit(&s.env, s.user.clone(), 0, s.user.clone());
    assert_eq!(res, Err(Ok(VaultError::ZeroAssets)));
}

#[test]
fn deposit_cap_enforced_exactly_at_boundary() {
    let s = setup();
    let v = vault(&s.env, &s.contract);
    v.set_deposit_cap(&s.env, s.admin.clone(), 1_000_000);

    // Exact cap is allowed
    let shares = v.deposit(&s.env, s.user.clone(), 1_000_000, s.user.clone());
    assert_eq!(shares, 1_000_000);

    // One more over the cap is rejected
    let res = v.try_deposit(&s.env, s.user.clone(), 1, s.user.clone());
    assert_eq!(res, Err(Ok(VaultError::DepositCapExceeded)));
}

#[test]
fn pause_blocks_deposits() {
    let s = setup();
    let v = vault(&s.env, &s.contract);
    v.pause(&s.env, s.pauser.clone());

    let res = v.try_deposit(&s.env, s.user.clone(), 1_000_000, s.user.clone());
    assert_eq!(res, Err(Ok(VaultError::Paused)));

    v.unpause(&s.env, s.pauser.clone());
    let shares = v.deposit(&s.env, s.user.clone(), 1_000_000, s.user.clone());
    assert_eq!(shares, 1_000_000);
}

#[test]
fn withdrawal_rate_limit_blocks_excess_within_same_ledger() {
    let s = setup();
    let v = vault(&s.env, &s.contract);
    v.set_withdrawal_limit(&s.env, s.admin.clone(), 1_000_000);

    v.deposit(&s.env, s.user.clone(), 5_000_000, s.user.clone());
    v.withdraw(&s.env, s.user.clone(), 1_000_000, s.user.clone());

    // Second withdrawal in same ledger exceeds the limit
    let res = v.try_withdraw(&s.env, s.user.clone(), 1, s.user.clone());
    assert_eq!(res, Err(Ok(VaultError::WithdrawalLimitExceeded)));

    // Advancing the ledger resets the cumulative counter
    s.env.ledger().set_sequence(100);
    let burned = v.withdraw(&s.env, s.user.clone(), 500_000, s.user.clone());
    assert_eq!(burned, 500_000);
}

#[test]
fn emergency_withdraw_refuses_vault_asset() {
    let s = setup();
    let v = vault(&s.env, &s.contract);
    v.deposit(&s.env, s.user.clone(), 1_000_000, s.user.clone());

    let res = v.try_emergency_withdraw(
        &s.env,
        s.admin.clone(),
        s.token.clone(),
        s.user.clone(),
    );
    assert_eq!(res, Err(Ok(VaultError::CannotRescueVaultAsset)));
}

#[test]
fn emergency_withdraw_rescues_other_token() {
    let s = setup();
    let v = vault(&s.env, &s.contract);

    // A separate token the contract happens to hold
    let other = s.env.register_stellar_asset_contract_v2(s.admin.clone());
    let other_admin = StellarAssetClient::new(&s.env, &other.address());
    other_admin.mint(&s.contract, &777);

    let rescued = v.emergency_withdraw(&s.env, s.admin.clone(), other.address(), s.user.clone());
    assert_eq!(rescued, 777);
}

#[test]
fn non_admin_cannot_set_deposit_cap() {
    let s = setup();
    let v = vault(&s.env, &s.contract);
    let res = v.try_set_deposit_cap(&s.env, s.user.clone(), 5_000_000);
    assert_eq!(res, Err(Ok(VaultError::NotAuthorized)));
}
