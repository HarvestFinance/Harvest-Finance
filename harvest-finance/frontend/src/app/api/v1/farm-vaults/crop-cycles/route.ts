import { NextRequest, NextResponse } from 'next/server';

const cropCycles = [
  {
    id: 'maize-1',
    name: 'Maize - Rainy Season',
    yieldRate: 15,
    durationDays: 120,
    description: 'Optimal for rainy season maize production across Nigeria.',
    icon: 'Sprout',
  },
  {
    id: 'rice-1',
    name: 'Rice - High Yield',
    yieldRate: 18,
    durationDays: 150,
    description: 'Special cycle for high-yield paddy rice.',
    icon: 'Wheat',
  },
  {
    id: 'coffee-1',
    name: 'Coffee - Long Cycle',
    yieldRate: 25,
    durationDays: 365,
    description: 'Full year cycle for high-altitude coffee beans.',
    icon: 'Coffee',
  },
  {
    id: 'cocoa-1',
    name: 'Cocoa - Seasonal',
    yieldRate: 22,
    durationDays: 180,
    description: 'Standard seasonal cycle for cocoa pods.',
    icon: 'Leaf',
  },
];

export async function GET(_request: NextRequest) {
  return NextResponse.json(cropCycles);
}
