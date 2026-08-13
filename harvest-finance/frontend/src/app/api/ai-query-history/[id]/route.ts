import { NextRequest, NextResponse } from 'next/server';

const mockHistory: Record<string, unknown>[] = [
  {
    id: 'hist-1',
    query: 'What crops are best for my current season?',
    response: 'For Summer, I recommend focusing on crops that thrive in this season. Consider tomatoes, corn, and peppers for optimal yield.',
    vaultContext: { currentSeason: 'Summer', progressPercent: 45 },
    seasonalData: { season: 'Summer' },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-2',
    query: 'How can I grow my vault faster?',
    response: 'Your current vault balance is $1,640.00. Great progress! You\'re 68% to your $2,420.00 goal.',
    vaultContext: { vaultBalance: 1640, vaultTarget: 2420, progressPercent: 68 },
    seasonalData: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const index = mockHistory.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  mockHistory.splice(index, 1);
  return NextResponse.json({ success: true });
}
