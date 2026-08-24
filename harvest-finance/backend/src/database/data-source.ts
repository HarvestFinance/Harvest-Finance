import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

import { User } from './entities/user.entity';
import { UserOAuthLink } from './entities/user-oauth-link.entity';
import { Session } from './entities/session.entity';
import { Order } from './entities/order.entity';
import { Transaction } from './entities/transaction.entity';
import { Verification } from './entities/verification.entity';
import { CreditScore } from './entities/credit-score.entity';
import { Deposit } from './entities/deposit.entity';
import { SorobanEvent } from './entities/soroban-event.entity';
import { Vault } from './entities/vault.entity';
import { VaultDeposit } from './entities/vault-deposit.entity';
import { Strategy } from './entities/strategy.entity';
import { VaultApyHistory } from './entities/vault-apy-history.entity';
import { VaultScoreHistory } from './entities/vault-score-history.entity';
import { VaultApproval } from './entities/vault-approval.entity';
import { Withdrawal } from './entities/withdrawal.entity';
import { Achievement } from './entities/achievement.entity';
import { Reward } from './entities/reward.entity';
import { Notification } from './entities/notification.entity';
import { FarmVault } from './entities/farm-vault.entity';
import { CropCycle } from './entities/crop-cycle.entity';
import { InsurancePlan } from './entities/insurance-plan.entity';
import { InsuranceSubscription } from './entities/insurance-subscription.entity';
import { YieldAnalytics } from './entities/yield-analytics.entity';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityComment } from './entities/community-comment.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { CommunityGroup } from './entities/community-group.entity';
import { GroupMembership } from './entities/group-membership.entity';
import { CoopListing } from './entities/coop-listing.entity';
import { CoopOrder } from './entities/coop-order.entity';
import { CoopReview } from './entities/coop-review.entity';
import { VaultReservation } from '../vaults/entities/vault-reservation.entity';
import { IndexerState } from './entities/indexer-state.entity';

import { CreateInitialSchema1700000000000 } from './migrations/1700000000000-CreateInitialSchema';
import { CreateVaultsAndDeposits1700000000001 } from './migrations/1700000000001-CreateVaultsAndDeposits';
import { CreateAchievements1700000000004 } from './migrations/1700000000004-CreateAchievements';
import { CreateRewards1700000000005 } from './migrations/1700000000005-CreateRewards';
import { CreateNotifications1700000000006 } from './migrations/1700000000006-CreateNotifications';
import { CreateWithdrawals1700000000007 } from './migrations/1700000000007-CreateWithdrawals';
import { CreateFarmVaults1700000000008 } from './migrations/1700000000008-CreateFarmVaults';
import { CreateAiQueryHistory1700000000009 } from './migrations/1700000000009-CreateAiQueryHistory';
import { CreateInsurance1700000000009 } from './migrations/1700000000009-CreateInsurance';
import { AddInsuranceNotificationType1700000000010 } from './migrations/1700000000010-AddInsuranceNotificationType';
import { CreateSorobanEvents1700000000011 } from './migrations/1700000000011-CreateSorobanEvents';
import { CreateCommunityAndMarketplace1700000000012 } from './migrations/1700000000012-CreateCommunityAndMarketplace';
import { CreateYieldAnalytics1700000000012 } from './migrations/1700000000012-CreateYieldAnalytics';
import { AddSorobanEventQueryIndexes1700000000013 } from './migrations/1700000000013-AddSorobanEventQueryIndexes';
import { CreateInsuranceClaims1700000000013 } from './migrations/1700000000013-CreateInsuranceClaims';
import { AddMultiSignatureToVaults1700000000014 } from './migrations/1700000000014-AddMultiSignatureToVaults';
import { CreateVaultApprovals1700000000015 } from './migrations/1700000000015-CreateVaultApprovals';
import { CreateDepositEvents1700000000016 } from './migrations/1700000000016-CreateDepositEvents';
import { AddSolanaAddressToUsers1700000000017 } from './migrations/1700000000017-AddSolanaAddressToUsers';
import { CreateStrategyAndApyHistory1700000000017 } from './migrations/1700000000017-CreateStrategyAndApyHistory';
import { AddSuspendedVaultStatusAndStellarAccount1700000000018 } from './migrations/1700000000018-AddSuspendedVaultStatusAndStellarAccount';
import { CreateVaultReservations1700000000018 } from './migrations/1700000000018-CreateVaultReservations';
import { CreateVaultScoreHistory1700000000018 } from './migrations/1700000000018-CreateVaultScoreHistory';
import { AddVaultFees1700000000019 } from './migrations/1700000000019-AddVaultFees';
import { CreateIndexerState1700000000019 } from './migrations/1700000000019-CreateIndexerState';
import { AddUserLoginLockout1700000000020 } from './migrations/1700000000020-AddUserLoginLockout';
import { AddContractVersionToSorobanEvents1700000000021 } from './migrations/1700000000021-AddContractVersionToSorobanEvents';
import { CreateCustodialWallets1700000000021 } from './migrations/1700000000021-CreateCustodialWallets';
import { AddDepositorConcentrationThreshold1700000000022 } from './migrations/1700000000022-AddDepositorConcentrationThreshold';
import { AddPhoneAndNotificationPreferencesToUsers1700000000022 } from './migrations/1700000000022-AddPhoneAndNotificationPreferencesToUsers';
import { AddRefreshTokenRotation1700000000022 } from './migrations/1700000000022-AddRefreshTokenRotation';
import { CreateSessionsAndOAuthLinks1700000000022 } from './migrations/1700000000022-CreateSessionsAndOAuthLinks';
import { AddEmailVerificationToUsers1700000000023 } from './migrations/1700000000023-AddEmailVerificationToUsers';
import { AddPerformanceIndexes1700000000024 } from './migrations/1700000000024-AddPerformanceIndexes';

// Load environment variables
config();

/**
 * TypeORM Data Source Configuration
 *
 * This is the main data source for the application.
 * Used by TypeORM for database operations.
 *
 * For CLI commands (migrations, seeds), use this file directly.
 * For NestJS applications, use AppModule configuration.
 */
const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'harvest_finance',

  // ── Connection pool settings ────────────────────────────────────────────────
  // Tuned for production workloads; override via environment variables so each
  // environment (dev / staging / prod) can scale independently.
  extra: {
    // Maximum number of clients in the pool. Default: 10.
    // Set DB_POOL_MAX to at least (2 * CPU cores) on the DB host. Typical
    // production starting point is 20–50 depending on available connections.
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    // Minimum number of idle connections kept warm.
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    // How long (ms) a client can sit idle in the pool before being released.
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    // How long (ms) to wait for a new connection before throwing an error.
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
    // Maximum lifetime of a pooled connection (ms). Rotates stale connections.
    maxLifetimeSeconds: parseInt(process.env.DB_POOL_MAX_LIFETIME_S || '1800', 10),
    // Allow TypeORM to retry a failed query once (transient network blip).
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT_MS || '30000', 10),
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '30000', 10),
  },

  entities: [
    User,
    UserOAuthLink,
    Session,
    Order,
    Transaction,
    Verification,
    CreditScore,
    Vault,
    VaultDeposit,
    Strategy,
    VaultApyHistory,
    VaultScoreHistory,
    VaultApproval,
    VaultReservation,
    Deposit,
    SorobanEvent,
    IndexerState,
    YieldAnalytics,
    CommunityPost,
    CommunityComment,
    PostReaction,
    CommunityGroup,
    GroupMembership,
    CoopListing,
    CoopOrder,
    CoopReview,
  ],

  migrations: [
    CreateInitialSchema1700000000000,
    CreateVaultsAndDeposits1700000000001,
    CreateAchievements1700000000004,
    CreateRewards1700000000005,
    CreateNotifications1700000000006,
    CreateWithdrawals1700000000007,
    CreateFarmVaults1700000000008,
    CreateAiQueryHistory1700000000009,
    CreateInsurance1700000000009,
    AddInsuranceNotificationType1700000000010,
    CreateSorobanEvents1700000000011,
    CreateCommunityAndMarketplace1700000000012,
    CreateYieldAnalytics1700000000012,
    AddSorobanEventQueryIndexes1700000000013,
    CreateInsuranceClaims1700000000013,
    AddMultiSignatureToVaults1700000000014,
    CreateVaultApprovals1700000000015,
    CreateDepositEvents1700000000016,
    AddSolanaAddressToUsers1700000000017,
    CreateStrategyAndApyHistory1700000000017,
    AddSuspendedVaultStatusAndStellarAccount1700000000018,
    CreateVaultReservations1700000000018,
    CreateVaultScoreHistory1700000000018,
    AddVaultFees1700000000019,
    CreateIndexerState1700000000019,
    AddUserLoginLockout1700000000020,
    AddContractVersionToSorobanEvents1700000000021,
    CreateCustodialWallets1700000000021,
    AddDepositorConcentrationThreshold1700000000022,
    AddPhoneAndNotificationPreferencesToUsers1700000000022,
    CreateSessionsAndOAuthLinks1700000000022,
    AddRefreshTokenRotation1700000000022,
    AddEmailVerificationToUsers1700000000023,
    AddPerformanceIndexes1700000000024,
  ],

  // synchronize must remain false in all non-test environments.
  // Use `npm run migration:run` to apply schema changes safely.
  synchronize: process.env.NODE_ENV === 'test',
  migrationsRun: false,
  logging: process.env.NODE_ENV === 'development',
};

/**
 * AppDataSource - Singleton data source instance
 *
 * Export this to use in CLI commands, migrations, and seeds.
 */
export const AppDataSource = new DataSource(options);

/**
 * Get database configuration
 */
export function getDatabaseConfig(): DataSourceOptions {
  return options;
}