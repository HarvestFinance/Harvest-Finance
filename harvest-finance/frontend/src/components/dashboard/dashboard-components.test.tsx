import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VaultTable } from './VaultTable';
import { YieldChart } from '../YieldChart';
import { vaultApi } from '@/lib/api/vault-client';

jest.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div role="img" aria-label="APY chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div role="img" aria-label="APY chart">{children}</div>,
  Area: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

jest.mock('@/lib/api/vault-client', () => ({
  vaultApi: { getApyHistory: jest.fn() },
}));

const vaults = [
  { id: 'low', name: 'Low Risk', asset: 'USDC', apy: 4, tvl: 100, riskLevel: 'Low' as const, balance: '0', walletBalance: '50', seasonalTarget: 10 },
  { id: 'high', name: 'High Yield', asset: 'XLM', apy: 9, tvl: 200, riskLevel: 'High' as const, balance: '0', walletBalance: '50', seasonalTarget: 10 },
];

describe('VaultTable', () => {
  it('sorts vaults and routes deposit and withdrawal actions', () => {
    const onDeposit = jest.fn();
    const onWithdraw = jest.fn();
    render(<VaultTable vaults={vaults} onDeposit={onDeposit} onWithdraw={onWithdraw} />);

    expect(screen.getByText('High Yield')).toBeInTheDocument();
    fireEvent.click(screen.getByText('dashboard.vault_name'));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('High Yield');

    fireEvent.click(screen.getAllByRole('button', { name: 'common.deposit' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'common.withdraw' })[0]);
    expect(onDeposit).toHaveBeenCalledWith('high');
    expect(onWithdraw).toHaveBeenCalledWith('high');
  });

  it('renders an empty state', () => {
    render(<VaultTable vaults={[]} onDeposit={jest.fn()} onWithdraw={jest.fn()} />);
    expect(screen.getByText('dashboard.no_vaults_found')).toBeInTheDocument();
  });
});

describe('YieldChart', () => {
  it('renders loading, data, and API error states', async () => {
    const getApyHistory = vaultApi.getApyHistory as jest.Mock;
    getApyHistory.mockResolvedValueOnce([{ date: '2026-01-01', apy: 7.25 }]);
    const { rerender } = render(<YieldChart vaultId="vault-1" />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('img', { name: 'APY chart' })).toBeInTheDocument());

    getApyHistory.mockRejectedValueOnce(new Error('RPC unavailable'));
    rerender(<YieldChart vaultId="vault-2" />);
    await waitFor(() => expect(screen.getByText('RPC unavailable')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});