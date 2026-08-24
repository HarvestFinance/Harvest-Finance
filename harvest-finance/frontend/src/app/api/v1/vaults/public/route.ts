import { NextResponse } from 'next/server'
import { MOCK_PUBLIC_VAULTS } from '@/features/vault/mocks'

export async function GET() {
  return NextResponse.json(MOCK_PUBLIC_VAULTS)
}
