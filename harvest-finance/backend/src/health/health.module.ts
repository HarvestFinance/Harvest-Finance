import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { StellarHealthIndicator } from './stellar.health';
import { StellarModule } from '../stellar/stellar.module';
import { SorobanHealthIndicator } from './soroban.health';
import { ChainAdapterHealthIndicator } from './chain-adapter.health';
import { MultiChainModule } from '../multi-chain/multi-chain.module';

@Module({
  imports: [TerminusModule, ConfigModule, StellarModule, MultiChainModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, StellarHealthIndicator, SorobanHealthIndicator, ChainAdapterHealthIndicator],
})
export class HealthModule {}
