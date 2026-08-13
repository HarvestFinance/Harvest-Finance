import { NextRequest, NextResponse } from 'next/server';

const mockTransactions = [
  { id: '1', date: '2024-03-25T10:00:00Z', type: 'Deposit', vault: 'USDC Stable Yield', amount: '1,000.00', status: 'CONFIRMED' },
  { id: '2', date: '2024-03-24T15:30:00Z', type: 'Reward', vault: 'ETH Staking Vault', amount: '0.05', status: 'CLAIMED' },
  { id: '3', date: '2024-03-22T09:15:00Z', type: 'Withdraw', vault: 'USDC Stable Yield', amount: '200.00', status: 'CONFIRMED' },
  { id: '4', date: '2024-03-20T11:45:00Z', type: 'Deposit', vault: 'Harvest Liquidity', amount: '500.00', status: 'CONFIRMED' },
  { id: '5', date: '2024-03-18T14:20:00Z', type: 'Reward', vault: 'WBTC Auto-Compound', amount: '0.001', status: 'CLAIMED' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  if (format === 'csv') {
    const csvHeaders = 'ID,Date,Type,Vault,Amount,Status\n';
    const csvRows = mockTransactions
      .map((tx) => `${tx.id},${tx.date},${tx.type},${tx.vault},${tx.amount},${tx.status}`)
      .join('\n');
    const csvContent = csvHeaders + csvRows;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions_${Date.now()}.csv"`,
      },
    });
  }

  const jsonContent = JSON.stringify(mockTransactions, null, 2);
  const buffer = Buffer.from(jsonContent, 'utf-8');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="transactions_${Date.now()}.xlsx"`,
    },
  });
}
