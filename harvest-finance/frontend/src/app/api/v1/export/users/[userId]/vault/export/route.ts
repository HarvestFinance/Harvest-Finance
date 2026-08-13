import { NextRequest, NextResponse } from 'next/server';

const mockVaults = [
  { id: 'vault-1', name: 'Early Season Maize', asset: 'USDC', balance: 500, targetAmount: 2000, apy: 15, status: 'ACTIVE' },
  { id: 'vault-2', name: 'Sorghum Staking', asset: 'HARV', balance: 1200, targetAmount: 3000, apy: 8, status: 'ACTIVE' },
  { id: 'vault-3', name: 'Cassava Yield Farm', asset: 'DAI', balance: 0, targetAmount: 5000, apy: 12, status: 'ACTIVE' },
];

export async function GET(request: NextRequest) {
  const jsonContent = JSON.stringify(mockVaults, null, 2);
  const buffer = Buffer.from(jsonContent, 'utf-8');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="vault_report_${Date.now()}.xlsx"`,
    },
  });
}
