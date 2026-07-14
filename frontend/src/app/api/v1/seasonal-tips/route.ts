import { NextRequest, NextResponse } from 'next/server';
import type { SeasonalTip, Season, CropType, TipType, TipsQueryParams, SeasonalTipsResponse } from '@/lib/api/seasonal-tips';
import { getCurrentSeason } from '@/lib/api/seasonal-tips';

// Simple in-memory/mock dataset. Expand as needed.
function generateId() {
  return `tip-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const SAMPLE_TIPS: SeasonalTip[] = [
  {
    id: generateId(),
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
    id: generateId(),
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
    id: generateId(),
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

function parseQuery(qs: URLSearchParams): TipsQueryParams {
  const params: any = {};
  if (qs.has('cropType')) params.cropType = qs.get('cropType') as CropType;
  if (qs.has('season')) params.season = qs.get('season') as Season;
  if (qs.has('tipType')) params.tipType = qs.get('tipType') as TipType;
  if (qs.has('vaultMilestone')) params.vaultMilestone = qs.get('vaultMilestone');
  params.page = qs.has('page') ? parseInt(qs.get('page') || '1', 10) : 1;
  params.limit = qs.has('limit') ? parseInt(qs.get('limit') || '20', 10) : 20;
  return params;
}

export async function GET(request: NextRequest) {
  const params = parseQuery(request.nextUrl.searchParams);

  // default season to current if not provided
  if (!params.season) {
    params.season = getCurrentSeason();
  }

  // filter sample tips
  let filtered = SAMPLE_TIPS.filter((t) => t.isActive);
  if (params.season) filtered = filtered.filter((t) => t.season === params.season);
  if (params.cropType && params.cropType !== 'GENERAL') filtered = filtered.filter((t) => t.cropType === params.cropType || t.cropType === 'GENERAL');
  if (params.tipType) filtered = filtered.filter((t) => t.tipType === params.tipType);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const start = (page - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);

  const response: SeasonalTipsResponse = {
    data: pageItems,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    },
  };

  return NextResponse.json(response);
}
