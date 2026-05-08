/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPage from './LoginPage'

const navigateMock = vi.fn()
const loginMock = vi.fn()
let mockedLocationState: { verified?: boolean; resetSuccess?: boolean } | null = null

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: mockedLocationState }),
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }
})

vi.mock('../api/authApi', () => ({
  login: (payload: { email: string; password: string }) => loginMock(payload),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks and storage before each test case.
    vi.clearAllMocks()
    mockedLocationState = null
    localStorage.clear()
    sessionStorage.clear()

    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        reload: vi.fn(),
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  // Test Case ID: TC_FE_LOGIN_PAGE_001
  it('renders login form with email and password inputs', () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText('ban@email.com')).toBeTruthy()
    expect(document.querySelector('input[type="password"]')).toBeTruthy()
    expect(document.querySelector('button[type="submit"]')).toBeTruthy()
  })

  // Test Case ID: TC_FE_LOGIN_PAGE_002
  it('on success stores token, navigates home and reloads page', async () => {
    loginMock.mockResolvedValue({ access_token: 'jwt-token-123' })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('ban@email.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(document.querySelector('input[type="password"]') as Element, {
      target: { value: '123456' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: '123456',
      })
    })

    expect(localStorage.getItem('token')).toBe('jwt-token-123')
    expect(navigateMock).toHaveBeenCalledWith('/')
    expect(window.location.reload).toHaveBeenCalled()
  })

  // Test Case ID: TC_FE_LOGIN_PAGE_003
  it('for 403 unverified error navigates to verify-otp and stores otp session', async () => {
    const err = new Error('tai khoan chua xac thuc') as Error & { status?: number }
    err.status = 403
    loginMock.mockRejectedValue(err)

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('ban@email.com'), {
      target: { value: 'needverify@example.com' },
    })
    fireEvent.change(document.querySelector('input[type="password"]') as Element, {
      target: { value: '123456' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/verify-otp', {
        state: { email: 'needverify@example.com', mode: 'verify' },
      })
    })

    expect(sessionStorage.getItem('otpEmail')).toBe('needverify@example.com')
    expect(sessionStorage.getItem('otpMode')).toBe('verify')
  })

  // Test Case ID: TC_FE_LOGIN_PAGE_004
  it('shows generic error from login failure', async () => {
    loginMock.mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('ban@email.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(document.querySelector('input[type="password"]') as Element, {
      target: { value: 'wrong' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Invalid credentials')).toBeTruthy()
  })

  // Test Case ID: TC_FE_LOGIN_PAGE_005
  it('navigates with replace when location.state.verified is true', async () => {
    mockedLocationState = { verified: true }

    render(<LoginPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  // Test Case ID: TC_FE_LOGIN_PAGE_006
  it('navigates with replace when location.state.resetSuccess is true', async () => {
    mockedLocationState = { resetSuccess: true }

    render(<LoginPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})
