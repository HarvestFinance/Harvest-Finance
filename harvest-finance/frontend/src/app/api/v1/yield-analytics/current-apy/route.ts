import { NextResponse } from 'next/server';
import { generateCurrentApys } from '@/lib/api/yield-analytics';

export async function GET() {
  const apys = generateCurrentApys();
  return NextResponse.json(apys, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
