import { NextResponse } from 'next/server';
import type { Season } from '@/lib/api/seasonal-tips';

export async function GET() {
  const seasons: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
  return NextResponse.json(seasons);
}
