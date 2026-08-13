import { NextRequest, NextResponse } from 'next/server';
import type { SeasonalTip } from '@/lib/api/seasonal-tips';

const SAMPLE_TIPS: SeasonalTip[] = [
  {
    id: 'tip-1',
    cropType: 'GENERAL',
    season: 'SPRING',
    tipType: 'PLANTING',
    title: 'Start early sowing',
    content: 'Begin preparing beds and start sowing early varieties for a head start.',
    metrics: null,
    vaultMilestone: 'seed_funding',
    priority: 1,
    isActive: true,
    iconName: 'sprout',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tip-2',
    cropType: 'TOMATO',
    season: 'SUMMER',
    tipType: 'WATERING',
    title: 'Water consistently',
    content: 'Tomatoes need consistent moisture; water deeply twice a week.',
    metrics: { recommendedLitersPerWeek: 20 },
    vaultMilestone: 'early_growth',
    priority: 2,
    isActive: true,
    iconName: 'droplets',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tip-3',
    cropType: 'GENERAL',
    season: 'AUTUMN',
    tipType: 'HARVEST',
    title: 'Prepare for harvest',
    content: 'Monitor crop maturity and schedule harvest windows to maximize quality.',
    metrics: null,
    vaultMilestone: 'harvest_ready',
    priority: 3,
    isActive: true,
    iconName: 'trophy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { milestone: string } },
) {
  const { searchParams } = new URL(request.url);
  const cropType = searchParams.get('cropType');
  const season = searchParams.get('season');

  let filtered = SAMPLE_TIPS.filter((t) => t.vaultMilestone === params.milestone);
  if (cropType) {
    filtered = filtered.filter((t) => t.cropType === cropType || t.cropType === 'GENERAL');
  }
  if (season) {
    filtered = filtered.filter((t) => t.season === season);
  }

  return NextResponse.json(filtered);
}
