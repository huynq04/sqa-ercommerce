/* @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import OtpVerifyPage from './OtpVerifyPage'

const navigateMock = vi.fn()
const verifyOtpMock = vi.fn()
const forgotPasswordMock = vi.fn()
const toastMock = vi.fn()

let mockedLocationState: { email?: string; mode?: 'reset' | 'verify' } | null = null

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
  verifyOtp: (payload: { email: string; otp: string }) => verifyOtpMock(payload),
  forgotPassword: (email: string) => forgotPasswordMock(email),
}))

vi.mock('../utils/toast.ts', () => ({
  toast: (message: string) => toastMock(message),
}))

describe('OtpVerifyPage', () => {
  beforeEach(() => {
    // Reset mocks and storage before each test case.
    vi.clearAllMocks()
    mockedLocationState = null
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const fillOtpCode = (code: string) => {
    const inputs = document.querySelectorAll('input[inputmode="numeric"]')
    code.split('').forEach((digit, index) => {
      fireEvent.change(inputs[index] as Element, { target: { value: digit } })
    })
  }

  // Test Case ID: TC_FE_OTP_VERIFY_PAGE_001
  it('renders OTP UI with 6 digit inputs and confirm button disabled initially', () => {
    // Objective: Ensure basic OTP page elements are rendered.
    render(<OtpVerifyPage />)

    expect(screen.getByText('Nhập mã OTP')).toBeTruthy()
    expect(document.querySelectorAll('input[inputmode="numeric"]').length).toBe(6)
    expect(screen.getByRole('button', { name: 'Xác nhận OTP' }).hasAttribute('disabled')).toBe(true)
  })

  // Test Case ID: TC_FE_OTP_VERIFY_PAGE_002
  it('loads email and mode from navigation state and caches into sessionStorage', async () => {
    // Objective: Cover initialization useEffect with state payload.
    mockedLocationState = { email: 'verify@example.com', mode: 'verify' }

    render(<OtpVerifyPage />)

    expect(await screen.findByText('verify@example.com')).toBeTruthy()
    expect(sessionStorage.getItem('otpEmail')).toBe('verify@example.com')
    expect(sessionStorage.getItem('otpMode')).toBe('verify')
  })

  // Test Case ID: TC_FE_OTP_VERIFY_PAGE_003
  it('confirm in reset mode stores otp and navigates to reset-password', async () => {
    // Objective: Cover reset flow in handleConfirm.
    mockedLocationState = { email: 'reset@example.com', mode: 'reset' }

    render(<OtpVerifyPage />)
    fillOtpCode('123456')

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận OTP' }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/reset-password')
    })

    // CheckStorage: Reset flow should keep email and otp code for next step.
    expect(sessionStorage.getItem('otpEmail')).toBe('reset@example.com')
    expect(sessionStorage.getItem('otpCode')).toBe('123456')
  })

  // Test Case ID: TC_FE_OTP_VERIFY_PAGE_004
  it('confirm in verify mode calls API, clears otp markers and navigates login verified=true', async () => {
    // Objective: Cover verify flow success branch.
    mockedLocationState = { email: 'user@example.com', mode: 'verify' }
    verifyOtpMock.mockResolvedValue({ ok: true })

    render(<OtpVerifyPage />)
    fillOtpCode('654321')

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận OTP' }))

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        otp: '654321',
      })
    })

    expect(navigateMock).toHaveBeenCalledWith('/login', { state: { verified: true } })
    expect(sessionStorage.getItem('otpCode')).toBeNull()
    expect(sessionStorage.getItem('otpMode')).toBeNull()
  })

  // Test Case ID: TC_FE_OTP_VERIFY_PAGE_005
  it('shows error when verify OTP API fails', async () => {
    // Objective: Cover verify flow catch branch.
    mockedLocationState = { email: 'user@example.com', mode: 'verify' }
    verifyOtpMock.mockRejectedValue(new Error('OTP khong hop le'))

    render(<OtpVerifyPage />)
    fillOtpCode('111111')

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận OTP' }))

    expect(await screen.findByText('OTP khong hop le')).toBeTruthy()
  })

  // Test Case ID: TC_FE_OTP_VERIFY_PAGE_006
  it('shows resend wait error when timer has not reached zero', async () => {
    // Objective: Cover early return branch of handleResend when remaining > 0.
    render(<OtpVerifyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại mã' }))

    expect(await screen.findByText('Vui lòng đợi hết thời gian để gửi lại.')).toBeTruthy()
  })

  // Test Case ID: TC_FE_OTP_VERIFY_PAGE_007
  it('resend after cooldown calls API and toast message', async () => {
    // Objective: Cover resend success path after countdown reaches zero.
    vi.useFakeTimers()
    mockedLocationState = { email: 'resend@example.com', mode: 'reset' }
    forgotPasswordMock.mockResolvedValue({ message: 'sent' })

    render(<OtpVerifyPage />)

    await act(async () => {
      vi.advanceTimersByTime(300000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại mã' }))

    await Promise.resolve()
    expect(forgotPasswordMock).toHaveBeenCalledWith('resend@example.com')
    expect(toastMock).toHaveBeenCalledWith('Da gui lai ma OTP. Vui lòng kiểm tra email.')
  })
})
