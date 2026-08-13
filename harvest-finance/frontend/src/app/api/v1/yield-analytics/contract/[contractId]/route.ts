import { NextRequest, NextResponse } from 'next/server';
import { generateYieldAnalytics } from '@/lib/api/yield-analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string } },
) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  const items = generateYieldAnalytics(days, params.contractId);
  const currentApy = 0.8 + Math.random() * 0.4;

  return NextResponse.json(
    { items, contractId: params.contractId, currentApy: Number(currentApy.toFixed(4)) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
