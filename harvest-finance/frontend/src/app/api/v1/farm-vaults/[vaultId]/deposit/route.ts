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
        { error: 'Invalid deposit amount' },
        { status: 400 },
      );
    }

    const depositResult = {
      vaultId: params.vaultId,
      amount: Number(amount),
      txHash: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      newBalance: Number(amount) * 1.02,
      sharesMinted: Number(amount) * 0.98,
    };

    return NextResponse.json(depositResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Deposit failed' },
      { status: 500 },
    );
  }
}
