import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from '../database/entities/deposit.entity';
import { Vault } from '../database/entities/vault.entity';
import { Reward } from '../database/entities/reward.entity';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit, Vault, Reward]),
    AuthModule,
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
