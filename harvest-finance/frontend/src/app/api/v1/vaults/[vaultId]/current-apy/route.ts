import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { apy: Number((8 + Math.random() * 12).toFixed(2)) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
