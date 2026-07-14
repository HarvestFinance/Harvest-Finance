import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsurancePlan } from '../database/entities/insurance-plan.entity';
import { InsuranceSubscription } from '../database/entities/insurance-subscription.entity';
import { FarmVault } from '../database/entities/farm-vault.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([InsurancePlan, InsuranceSubscription, FarmVault]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
