import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoginPage from './page';

expect.extend(toHaveNoViolations);

jest.mock('@/lib/stores/auth-store');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('LoginPage accessibility', () => {
  it('has no detectable a11y violations on initial render', async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
