import { NextResponse } from 'next/server';
import type { InsurancePlan } from '@/lib/api/insurance-client';

const INSURANCE_PLANS: InsurancePlan[] = [
  {
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
  {
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
  {
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
  {
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
];

export async function GET() {
  return NextResponse.json(INSURANCE_PLANS, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
