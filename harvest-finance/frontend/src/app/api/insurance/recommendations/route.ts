import { NextRequest, NextResponse } from 'next/server';
import type {
  RiskAssessmentParams,
  RecommendationsResponse,
  InsurancePlan,
} from '@/lib/api/insurance-client';

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

function assessRisk(params: RiskAssessmentParams) {
  const factors: { name: string; score: number; description: string }[] = [
    {
      name: 'Weather Variability',
      score: Math.min(100, Math.max(0, params.droughtRiskIndex * 60 + params.floodRiskIndex * 40)),
      description: 'Assessed risk from unpredictable weather patterns.',
    },
    {
      name: 'Market Volatility',
      score: Math.min(100, params.marketVolatilityIndex * 100),
      description: 'Price risk based on market volatility index.',
    },
    {
      name: 'Soil Quality',
      score: 100 - params.soilQualityIndex * 100,
      description: 'Risk associated with current soil conditions.',
    },
    {
      name: 'Historical Yield',
      score: Math.min(100, 100 - (params.historicalYieldKgAcre / 5000) * 100),
      description: 'Risk derived from historical yield data.',
    },
  ];

  const overallScore = Math.round(factors.reduce((sum, f) => sum + f.score, 0) / factors.length);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  if (overallScore < 25) riskLevel = 'LOW';
  else if (overallScore < 50) riskLevel = 'MEDIUM';
  else if (overallScore < 75) riskLevel = 'HIGH';
  else riskLevel = 'VERY_HIGH';

  const estimatedAnnualLossUsd = Math.round(
    params.farmAreaAcres * params.marketPricePerKg * params.historicalYieldKgAcre * (overallScore / 300),
  );

  return {
    cropType: params.cropType,
    season: params.season,
    overallScore,
    riskLevel,
    factors,
    estimatedAnnualLossUsd,
    recommendedCoverage: Math.round(estimatedAnnualLossUsd * 1.5),
  };
}

function buildRecommendations(params: RiskAssessmentParams): RecommendationsResponse {
  const assessment = assessRisk(params);
  const recommendations = INSURANCE_PLANS
    .filter((plan) => plan.applicableRiskLevels.split(',').includes(assessment.riskLevel))
    .map((plan) => {
      const matchScore = Math.round(
        100 - Math.abs(plan.premiumRate * 100 - assessment.overallScore / 3),
      );
      const estimatedMonthlyPremium =
        (assessment.recommendedCoverage * plan.premiumRate) / 12;
      const estimatedAnnualPremium = estimatedMonthlyPremium * 12;
      const estimatedCoverage = assessment.recommendedCoverage * plan.coverageMultiplier;

      let rationale = '';
      if (plan.planType === 'CROP_YIELD') {
        rationale = `Low premium rate (${plan.premiumRate * 100}%) suitable for ${params.cropType} in ${params.season}.`;
      } else if (plan.planType === 'WEATHER_INDEX') {
        rationale = `Based on weather risk exposure in ${params.cropType} cultivation.`;
      } else if (plan.planType === 'MARKET_PRICE') {
        rationale = `Market volatility risk of ${params.marketVolatilityIndex} warrants price protection.`;
      } else {
        rationale = `Comprehensive coverage recommended given overall risk level: ${plan.premiumRate * 100}% premium.`;
      }

      return {
        plan,
        matchScore,
        estimatedMonthlyPremium: Number(estimatedMonthlyPremium.toFixed(2)),
        estimatedAnnualPremium: Number(estimatedAnnualPremium.toFixed(2)),
        estimatedCoverage: Math.round(estimatedCoverage),
        rationale,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return { assessment, recommendations };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params: RiskAssessmentParams = {
    cropType: searchParams.get('cropType') || 'WHEAT',
    season: searchParams.get('season') || 'SPRING',
    historicalYieldKgAcre: parseFloat(searchParams.get('historicalYieldKgAcre') || '3000'),
    farmAreaAcres: parseFloat(searchParams.get('farmAreaAcres') || '10'),
    marketPricePerKg: parseFloat(searchParams.get('marketPricePerKg') || '0.5'),
    soilQualityIndex: parseFloat(searchParams.get('soilQualityIndex') || '0.7'),
    droughtRiskIndex: parseFloat(searchParams.get('droughtRiskIndex') || '0.3'),
    floodRiskIndex: parseFloat(searchParams.get('floodRiskIndex') || '0.2'),
    marketVolatilityIndex: parseFloat(searchParams.get('marketVolatilityIndex') || '0.5'),
  };

  const result = buildRecommendations(params);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname.endsWith('/recommendations')) {
    try {
      const params = (await request.json()) as RiskAssessmentParams;
      const result = buildRecommendations(params);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
