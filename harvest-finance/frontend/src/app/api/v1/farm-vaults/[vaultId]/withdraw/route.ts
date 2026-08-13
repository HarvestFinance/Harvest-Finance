import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { vaultId: string } },
) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 },
      );
    }

    const withdrawResult = {
      vaultId: params.vaultId,
      amount: Number(amount),
      txHash: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      newBalance: Math.max(0, 500 - Number(amount)),
      sharesBurned: Number(amount) * 0.96,
    };

    return NextResponse.json(withdrawResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Withdrawal failed' },
      { status: 500 },
    );
  }
}
