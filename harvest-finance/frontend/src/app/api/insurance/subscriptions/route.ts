import { NextRequest, NextResponse } from 'next/server';
import type { InsuranceSubscription, SubscriptionStatus } from '@/lib/api/insurance-client';

const mockSubscriptions: InsuranceSubscription[] = [
  {
    id: 'sub-1',
    planId: 'plan-2',
    plan: {
      id: 'plan-2',
      name: 'Weather Index Insurance',
      description: 'Covers losses based on weather index thresholds (rainfall, temperature).',
      planType: 'WEATHER_INDEX',
      applicableRiskLevels: 'LOW,MEDIUM,HIGH',
      premiumRate: 0.018,
      coverageMultiplier: 2.0,
      providerName: 'ClimateCover Ltd',
      providerContact: 'info@climatecover.com',
    },
    cropType: 'Maize',
    insuredValue: 5000,
    monthlyPremium: 75,
    status: 'ACTIVE',
    coverageStart: '2024-03-01T00:00:00.000Z',
    coverageEnd: '2024-09-01T00:00:00.000Z',
    farmVaultId: 'vault-1',
    createdAt: '2024-03-01T00:00:00.000Z',
  },
];

export async function GET(_request: NextRequest) {
  return NextResponse.json(mockSubscriptions, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      planId: string;
      cropType: string;
      insuredValue: number;
      farmVaultId?: string;
    };

    const planMap: Record<string, Record<string, unknown>> = {
      'plan-1': {
        id: 'plan-1',
        name: 'Crop Yield Protection',
        description: 'Protects against yield shortfalls due to adverse weather conditions.',
        planType: 'CROP_YIELD',
        applicableRiskLevels: 'LOW,MEDIUM',
        premiumRate: 0.025,
        coverageMultiplier: 1.5,
        providerName: 'AgriShield Insurance',
        providerContact: 'support@agrishield.com',
      },
      'plan-2': {
        id: 'plan-2',
        name: 'Weather Index Insurance',
        description: 'Covers losses based on weather index thresholds.',
        planType: 'WEATHER_INDEX',
        applicableRiskLevels: 'LOW,MEDIUM,HIGH',
        premiumRate: 0.018,
        coverageMultiplier: 2.0,
        providerName: 'ClimateCover Ltd',
        providerContact: 'info@climatecover.com',
      },
      'plan-3': {
        id: 'plan-3',
        name: 'Market Price Protection',
        description: 'Insures against price drops below agreed floor prices.',
        planType: 'MARKET_PRICE',
        applicableRiskLevels: 'MEDIUM,HIGH',
        premiumRate: 0.035,
        coverageMultiplier: 1.2,
        providerName: 'HarvestGuard Insurance',
        providerContact: 'claims@harvestguard.com',
      },
      'plan-4': {
        id: 'plan-4',
        name: 'Comprehensive Coverage',
        description: 'All-in-one protection combining yield, weather, and market price coverage.',
        planType: 'COMPREHENSIVE',
        applicableRiskLevels: 'LOW,MEDIUM,HIGH,VERY_HIGH',
        premiumRate: 0.045,
        coverageMultiplier: 2.5,
        providerName: 'FullSpectrum Insurance',
        providerContact: 'help@fullspectrum.com',
      },
    };

    const plan = planMap[body.planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const newSubscription: InsuranceSubscription = {
      id: `sub-${Date.now()}`,
      planId: body.planId,
      plan,
      cropType: body.cropType,
      insuredValue: body.insuredValue,
      monthlyPremium: Number(((body.insuredValue * plan.premiumRate) / 12).toFixed(2)),
      status: 'PENDING' as SubscriptionStatus,
      coverageStart: new Date().toISOString(),
      coverageEnd: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      farmVaultId: body.farmVaultId || null,
      createdAt: new Date().toISOString(),
    };

    mockSubscriptions.push(newSubscription);

    return NextResponse.json(newSubscription, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 400 });
  }
}
