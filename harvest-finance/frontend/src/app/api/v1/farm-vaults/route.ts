import { NextRequest, NextResponse } from 'next/server';

export interface FarmVault {
  id: string;
  name: string;
  asset: string;
  balance: number;
  targetAmount: number;
  startDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  cropCycle: {
    name: string;
    durationDays: number;
    yieldRate: number;
    icon: string;
  };
  projections: {
    daysElapsed: number;
    daysRemaining: number;
    progressPercentage: number;
    currentGrowth: number;
    totalProjectedGrowth: number;
    estimatedTotalAtMaturity: number;
    milestones: {
      name: string;
      target: number;
      achieved: boolean;
    }[];
  };
  apy?: number;
  tvl?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  strategyType?: 'Audited' | 'Community' | 'Experimental';
  sharePrice?: string;
  deposits?: VaultTransaction[];
  withdrawals?: VaultTransaction[];
  rewards?: VaultTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface VaultTransaction {
  id: string;
  vaultId: string;
  type: 'deposit' | 'withdrawal' | 'reward';
  amount: string;
  token: string;
  txHash: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

const mockVaults: FarmVault[] = [
  {
    id: 'vault-1',
    name: 'Early Season Maize',
    asset: 'USDC',
    balance: 500,
    targetAmount: 2000,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    cropCycle: {
      name: 'Maize - Rainy Season',
      durationDays: 120,
      yieldRate: 15,
      icon: 'Sprout',
    },
    projections: {
      daysElapsed: 30,
      daysRemaining: 90,
      progressPercentage: 25,
      currentGrowth: 18.75,
      totalProjectedGrowth: 75,
      estimatedTotalAtMaturity: 575,
      milestones: [
        { name: 'Seed Funding', target: 25, achieved: true },
        { name: 'Early Growth', target: 50, achieved: false },
        { name: 'Mid-Season Bloom', target: 75, achieved: false },
        { name: 'Harvest Ready', target: 100, achieved: false },
      ],
    },
    apy: 12.5,
    tvl: 1200000,
    riskLevel: 'Low',
    strategyType: 'Audited',
    sharePrice: '1.05',
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-03-31T00:00:00.000Z',
  },
  {
    id: 'vault-2',
    name: 'Sorghum Staking',
    asset: 'HARV',
    balance: 1200,
    targetAmount: 3000,
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    cropCycle: {
      name: 'Sorghum - Dry Season',
      durationDays: 90,
      yieldRate: 8,
      icon: 'Sprout',
    },
    projections: {
      daysElapsed: 45,
      daysRemaining: 45,
      progressPercentage: 50,
      currentGrowth: 50,
      totalProjectedGrowth: 100,
      estimatedTotalAtMaturity: 2400,
      milestones: [
        { name: 'Seed Funding', target: 25, achieved: true },
        { name: 'Early Growth', target: 50, achieved: true },
        { name: 'Mid-Season Bloom', target: 75, achieved: false },
        { name: 'Harvest Ready', target: 100, achieved: false },
      ],
    },
    apy: 18.3,
    tvl: 850000,
    riskLevel: 'Medium',
    strategyType: 'Community',
    sharePrice: '0.98',
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-03-30T00:00:00.000Z',
  },
  {
    id: 'vault-3',
    name: 'Cassava Yield Farm',
    asset: 'DAI',
    balance: 0,
    targetAmount: 5000,
    startDate: new Date().toISOString(),
    status: 'ACTIVE',
    cropCycle: {
      name: 'Cassava - Rainy Season',
      durationDays: 180,
      yieldRate: 12,
      icon: 'Sprout',
    },
    projections: {
      daysElapsed: 0,
      daysRemaining: 180,
      progressPercentage: 0,
      currentGrowth: 0,
      totalProjectedGrowth: 6000,
      estimatedTotalAtMaturity: 6000,
      milestones: [
        { name: 'Seed Funding', target: 25, achieved: false },
        { name: 'Early Growth', target: 50, achieved: false },
        { name: 'Mid-Season Bloom', target: 75, achieved: false },
        { name: 'Harvest Ready', target: 100, achieved: false },
      ],
    },
    apy: 9.7,
    tvl: 500000,
    riskLevel: 'Medium',
    strategyType: 'Experimental',
    sharePrice: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = JSON.parse(
        Buffer.from(authHeader.substring(7), 'base64').toString('utf8'),
      );
      return payload.userId || null;
    } catch {
      return null;
    }
  }
  return 'user-1';
}

export async function GET(request: NextRequest) {
  await getUserId(request);

  return NextResponse.json(mockVaults, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = getUserId(request);

    const newVault: FarmVault = {
      id: `vault-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };

    mockVaults.push(newVault);

    return NextResponse.json(newVault, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create vault' },
      { status: 400 },
    );
  }
}

export async function GET_SINGLE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const vault = mockVaults.find((v) => v.id === params.id);
  if (!vault) {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
  }
  return NextResponse.json(vault);
}
