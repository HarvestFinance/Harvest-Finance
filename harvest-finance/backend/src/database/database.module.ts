import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  User,
  UserOAuthLink,
  Order,
  Transaction,
  Verification,
  CreditScore,
  Vault,
  VaultDeposit,
} from './entities';
import { ReadReplicaService } from './read-replica.service';

/**
 * Database Module
 *
 * Central module for all database entities.
 * Import this module to use TypeORM repositories.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      UserOAuthLink,
      Order,
      Transaction,
      Verification,
      CreditScore,
      Vault,
      VaultDeposit,
    ]),
  ],
  providers: [
    {
      provide: ReadReplicaService,
      useFactory: (configService: any, dataSource: DataSource) =>
        new ReadReplicaService(configService, dataSource),
      inject: ['ConfigService', DataSource],
    },
  ],
  exports: [TypeOrmModule, ReadReplicaService],
})
export class DatabaseModule {}
