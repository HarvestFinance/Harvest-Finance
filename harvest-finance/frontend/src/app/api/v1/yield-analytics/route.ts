import { NextRequest, NextResponse } from 'next/server';
import {
  generateYieldAnalytics,
  generateCurrentApys,
} from '@/lib/api/yield-analytics';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || '30d';
  const days = parseInt(searchParams.get('days') || '30', 10);

  const dayMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    all: 365,
  };

  const resolvedDays = dayMap[timeRange] || days;
  const items = generateYieldAnalytics(resolvedDays);

  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
}
