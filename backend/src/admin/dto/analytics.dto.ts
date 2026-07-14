import { ApiProperty } from '@nestjs/swagger';

export class TimeSeriesPointDto {
  @ApiProperty({ example: '2024-01' })
  period: string;

  @ApiProperty({ example: 42 })
  value: number;
}

export class DepositWithdrawPointDto {
  @ApiProperty({ example: '2024-01' })
  period: string;

  @ApiProperty({ example: 15000.5 })
  deposits: number;

  @ApiProperty({ example: 4200.0 })
  withdrawals: number;
}

export class VaultDistributionDto {
  @ApiProperty({ example: 'CROP_PRODUCTION' })
  type: string;

  @ApiProperty({ example: 5 })
  count: number;

  @ApiProperty({ example: 250000 })
  totalDeposits: number;
}

export class PlatformAnalyticsDto {
  @ApiProperty({ type: [TimeSeriesPointDto] })
  userGrowth: TimeSeriesPointDto[];

  @ApiProperty({ type: [DepositWithdrawPointDto] })
  depositWithdrawTrends: DepositWithdrawPointDto[];

  @ApiProperty({ type: [VaultDistributionDto] })
  vaultDistribution: VaultDistributionDto[];

  @ApiProperty({ example: 1250000 })
  totalWithdrawals: number;
}
