import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DepositModal } from '@/features/vault/components/DepositModal';

expect.extend(toHaveNoViolations);

const mockVault = {
  id: 'vault-1',
  name: 'Test Vault',
  asset: 'USDC',
  walletBalance: '1000',
  tvl: 50000,
  balance: 500,
  apy: 5.5,
  cropCycle: { yieldRate: 0.05 },
  totalAssets: 100000,
  totalShares: 1000,
};

describe('DepositModal accessibility', () => {
  it('has no detectable a11y violations when open', async () => {
    const { container } = render(
      <DepositModal isOpen={true} onClose={jest.fn()} vault={mockVault} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
