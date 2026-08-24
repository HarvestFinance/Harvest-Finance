import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Deposit } from '../database/entities/deposit.entity';
import { User } from '../database/entities/user.entity';
import { SecurityEvent } from '../database/entities/security-event.entity';
import { Vault } from '../database/entities/vault.entity';
import { EthereumYieldAdapter } from './adapters/ethereum-yield.adapter';
import { PolygonYieldAdapter } from './adapters/polygon-yield.adapter';
import { SolanaYieldAdapter } from './adapters/solana-yield.adapter';
import { StellarYieldAdapter } from './adapters/stellar-yield.adapter';
import { ChainRegistryService } from './adapters/chain-registry.service';
import { CHAIN_ADAPTERS } from './interfaces/chain-adapter.interface';
import { MultiChainHealthController } from './multi-chain-health.controller';
import { MultiChainController } from './multi-chain.controller';
import { MultiChainService } from './multi-chain.service';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Deposit, Vault, User, SecurityEvent]),
    AuthModule,
  ],
  controllers: [MultiChainController, MultiChainHealthController, MigrationController],
  providers: [
    StellarYieldAdapter,
    SolanaYieldAdapter,
    PolygonYieldAdapter,
    EthereumYieldAdapter,
    {
      provide: CHAIN_ADAPTERS,
      useFactory: (
        stellar: StellarYieldAdapter,
        solana: SolanaYieldAdapter,
        polygon: PolygonYieldAdapter,
        ethereum: EthereumYieldAdapter,
      ) => [stellar, solana, polygon, ethereum],
      inject: [
        StellarYieldAdapter,
        SolanaYieldAdapter,
        PolygonYieldAdapter,
        EthereumYieldAdapter,
      ],
    },
    ChainRegistryService,
    MigrationService,
    MultiChainService,
  ],
  exports: [MultiChainService, ChainRegistryService],
})
export class MultiChainModule {}
