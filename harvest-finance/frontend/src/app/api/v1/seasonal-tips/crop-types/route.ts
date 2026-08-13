import { NextResponse } from 'next/server';
import type { CropType } from '@/lib/api/seasonal-tips';

export async function GET() {
  const cropTypes: CropType[] = ['WHEAT', 'CORN', 'RICE', 'SOYBEAN', 'TOMATO', 'POTATO', 'COTTON', 'BARLEY', 'GENERAL'];
  return NextResponse.json(cropTypes);
}
