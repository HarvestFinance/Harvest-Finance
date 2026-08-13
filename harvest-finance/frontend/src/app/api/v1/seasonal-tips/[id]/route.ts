import { NextResponse } from 'next/server';
import type { SeasonalTip } from '@/lib/api/seasonal-tips';
import { getCurrentSeason } from '@/lib/api/seasonal-tips';

const SAMPLE_TIPS: SeasonalTip[] = [
  {
    id: 'tip-1',
    cropType: 'GENERAL',
    season: 'SPRING',
    tipType: 'PLANTING',
    title: 'Start early sowing',
    content: 'Begin preparing beds and start sowing early varieties for a head start.',
    metrics: null,
    vaultMilestone: null,
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
    vaultMilestone: null,
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
    vaultMilestone: null,
    priority: 3,
    isActive: true,
    iconName: 'trophy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const tip = SAMPLE_TIPS.find((t) => t.id === params.id);

  if (!tip) {
    return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
  }

  return NextResponse.json(tip);
}
