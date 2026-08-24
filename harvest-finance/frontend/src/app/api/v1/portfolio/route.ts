import { NextResponse } from 'next/server'
import { MOCK_STATS, MOCK_TRANSACTIONS } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json({
    stats: MOCK_STATS,
    transactions: MOCK_TRANSACTIONS,
  })
}
