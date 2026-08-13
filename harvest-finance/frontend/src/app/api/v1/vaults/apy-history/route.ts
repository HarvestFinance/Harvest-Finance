import { NextRequest, NextResponse } from 'next/server';

interface ApyHistoryItem {
  date: string;
  apy: number;
  vaultId?: string;
}

function generateApyHistory(days: number, vaultId?: string): ApyHistoryItem[] {
  const items: ApyHistoryItem[] = [];
  const baseApy = vaultId ? parseFloat(vaultId.slice(-1)) * 2 + 5 : 10;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    items.push({
      date: date.toISOString().split('T')[0],
      apy: Number((baseApy + Math.sin(i / 3) * 1.5 + Math.random() * 0.5).toFixed(2)),
      vaultId,
    });
  }
  return items;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || '30d';
  const vaultId = searchParams.get('vaultId') || undefined;

  const dayMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    all: 365,
  };

  const days = dayMap[timeRange] || 30;
  const data = generateApyHistory(days, vaultId);

  return NextResponse.json(data);
}
