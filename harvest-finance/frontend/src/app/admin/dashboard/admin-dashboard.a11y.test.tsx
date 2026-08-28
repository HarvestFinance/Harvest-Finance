import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AdminDashboardPage from './page';

expect.extend(toHaveNoViolations);

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: '1', email: 'admin@test.com', role: 'admin' },
    token: 'test-token',
  }),
}));

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
}));

describe('AdminDashboardPage accessibility', () => {
  it('has no detectable a11y violations on initial render', async () => {
    const { container } = render(<AdminDashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
