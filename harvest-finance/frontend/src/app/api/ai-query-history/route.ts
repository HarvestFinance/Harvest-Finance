import { NextRequest, NextResponse } from 'next/server';
import type { QueryHistoryItem } from '@/lib/api/ai-query-history-client';

let mockHistory: QueryHistoryItem[] = [
  {
    id: 'hist-1',
    query: 'What crops are best for my current season?',
    response: 'For Summer, I recommend focusing on crops that thrive in this season. Consider tomatoes, corn, and peppers for optimal yield.',
    vaultContext: { currentSeason: 'Summer', progressPercent: 45 },
    seasonalData: { season: 'Summer', recommendations: ['Tomatoes', 'Corn', 'Peppers'] },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-2',
    query: 'How can I grow my vault faster?',
    response: 'Your current vault balance is $1,640.00. Great progress! You\'re 68% to your $2,420.00 goal. Keep up the consistent deposits.',
    vaultContext: { vaultBalance: 1640, vaultTarget: 2420, progressPercent: 68 },
    seasonalData: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-3',
    query: 'When should I harvest my rewards?',
    response: 'I\'m here to help with all aspects of your farming journey! Whether it\'s crop selection, vault strategies, seasonal planning, or milestone tracking.',
    vaultContext: null,
    seasonalData: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  let result = mockHistory;
  if (search) {
    const lowerSearch = search.toLowerCase();
    result = result.filter(
      (item) =>
        item.query.toLowerCase().includes(lowerSearch) ||
        item.response.toLowerCase().includes(lowerSearch),
    );
  }

  result = result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newItem: QueryHistoryItem = {
      id: `hist-${Date.now()}`,
      query: body.query,
      response: body.response || '',
      vaultContext: body.vaultContext || null,
      seasonalData: body.seasonalData || null,
      createdAt: new Date().toISOString(),
    };

    mockHistory.push(newItem);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save query history' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const parts = pathname.split('/');
  const id = parts[parts.length - 1];

  if (!id || id === 'ai-query-history') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const index = mockHistory.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  mockHistory.splice(index, 1);
  return NextResponse.json({ success: true });
}
