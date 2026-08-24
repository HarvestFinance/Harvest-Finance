import { render, screen } from '@testing-library/react'
import { Can } from '@/components/auth/Can'
import { useAuthStore } from '@/lib/stores/auth-store'

describe('Can role gate', () => {
  afterEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  it('renders children for matching roles', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Ada', email: 'ada@example.com', role: 'admin' },
      isAuthenticated: true,
    })

    render(
      <Can role="admin">
        <p>Admin tools</p>
      </Can>,
    )

    expect(screen.getByText('Admin tools')).toBeInTheDocument()
  })

  it('renders fallback when the role does not match', () => {
    useAuthStore.setState({
      user: { id: '2', name: 'Farmer', email: 'farmer@example.com', role: 'farmer' },
      isAuthenticated: true,
    })

    render(
      <Can role="admin" fallback={<p>No access</p>}>
        <p>Admin tools</p>
      </Can>,
    )

    expect(screen.getByText('No access')).toBeInTheDocument()
    expect(screen.queryByText('Admin tools')).not.toBeInTheDocument()
  })
})
