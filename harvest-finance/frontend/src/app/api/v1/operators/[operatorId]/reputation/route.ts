import { NextRequest, NextResponse } from 'next/server';
import type { OperatorReputation } from '@/types/operator';

const operatorNames: Record<string, string> = {
  'op-1': 'Greenfield Farms Cooperative',
  'op-2': 'Stellar Harvest Partners',
  'op-3': 'AgriVault Capital',
  'op-4': 'YieldLogic Operations',
  'op-5': 'Seasonal Growth LLC',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { operatorId: string } },
) {
  const { operatorId } = params;

  const reputation: OperatorReputation = {
    operatorId,
    operatorName: operatorNames[operatorId] || `Operator ${operatorId}`,
    overallScore: 87,
    components: {
      vaultPerformance: 92,
      operatorTenure: 78,
      governanceParticipation: 85,
      securityIncidents: 5,
    },
    vaultHistory: [
      {
        vaultId: 'vault-1',
        vaultName: 'Early Season Maize',
        asset: 'USDC',
        apy: '12.5%',
        tvl: '$1.2M',
        status: 'active',
        startDate: '2024-01-15T00:00:00.000Z',
      },
      {
        vaultId: 'vault-2',
        vaultName: 'Sorghum Staking',
        asset: 'HARV',
        apy: '18.3%',
        tvl: '$850K',
        status: 'active',
        startDate: '2024-02-20T00:00:00.000Z',
      },
    ],
    scoreHistory: [
      { date: '2024-01-01', score: 72 },
      { date: '2024-02-01', score: 78 },
      { date: '2024-03-01', score: 83 },
      { date: '2024-04-01', score: 87 },
    ],
  };

  return NextResponse.json(reputation, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
