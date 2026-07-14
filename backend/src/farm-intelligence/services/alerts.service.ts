import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit, DepositStatus } from '../../database/entities/deposit.entity';
import { Vault } from '../../database/entities/vault.entity';
import { Alert } from '../dto/intelligence.dto';

const SAVINGS_THRESHOLDS = [50000, 10000, 5000, 1000];
const OVERSPEND_RATIO = 0.9;

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Deposit) private depositRepo: Repository<Deposit>,
    @InjectRepository(Vault) private vaultRepo: Repository<Vault>,
  ) {}

  async getAlerts(userId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    const result = await this.depositRepo
      .createQueryBuilder('deposit')
      .select('SUM(deposit.amount)', 'total')
      .where('deposit.userId = :userId', { userId })
      .andWhere('deposit.status = :status', { status: DepositStatus.CONFIRMED })
      .getRawOne<{ total: string | null }>();

    const totalSavings = result?.total ? parseFloat(result.total) : 0;

    for (const threshold of SAVINGS_THRESHOLDS) {
      if (totalSavings >= threshold) {
        alerts.push({
          type: 'SAVINGS_THRESHOLD',
          message: `Savings milestone reached: $${threshold.toLocaleString()}`,
          severity: 'info',
          triggeredAt: now,
        });
        break;
      }
    }

    if (totalSavings > 0 && totalSavings < 100) {
      alerts.push({
        type: 'LOW_BALANCE',
        message: 'Savings balance is below $100. Consider making a deposit.',
        severity: 'warning',
        triggeredAt: now,
      });
    }

    const vaults = await this.vaultRepo.find({ where: { ownerId: userId } });
    for (const vault of vaults) {
      const maxCap = Number(vault.maxCapacity);
      const used = Number(vault.totalDeposits);
      if (maxCap > 0 && used / maxCap >= OVERSPEND_RATIO) {
        const pct = Math.round((used / maxCap) * 100);
        alerts.push({
          type: 'OVERSPENDING',
          message: `Vault "${vault.vaultName}" is at ${pct}% capacity.`,
          severity: used >= maxCap ? 'critical' : 'warning',
          triggeredAt: now,
        });
      }
    }

    return alerts;
  }
}
