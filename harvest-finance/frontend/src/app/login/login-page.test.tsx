import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('@/lib/stores/auth-store');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const mockedAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('LoginPage', () => {
  it('shows validation errors and submits valid credentials', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockedAuthStore.mockReturnValue({
      login,
      isLoading: false,
      error: null,
      clearError: jest.fn(),
      isAuthenticated: false,
      hydrate: jest.fn(),
    } as any);
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'farmer@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('farmer@example.com', 'secret'));
  });

  it('renders store errors and toggles password visibility', () => {
    mockedAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: false,
      error: 'Invalid credentials',
      clearError: jest.fn(),
      isAuthenticated: false,
      hydrate: jest.fn(),
    } as any);
    render(<LoginPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    const password = screen.getByLabelText('Password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});