/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ForgotPasswordPage from './ForgotPasswordPage'

const navigateMock = vi.fn()
const forgotPasswordMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }
})

vi.mock('../api/authApi', () => ({
  forgotPassword: (email: string) => forgotPasswordMock(email),
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    // Reset mock va storage truoc moi testcase.
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  // Test Case ID: UT_FE_FORGOT_PAGE_001
  it('render day du form forgot password', () => {
    // Muc tieu: dam bao UI co input email va nut submit.
    render(<ForgotPasswordPage />)

    expect(screen.getByPlaceholderText('ban@email.com')).toBeTruthy()
    expect(document.querySelector('button[type="submit"]')).toBeTruthy()
  })

  // Test Case ID: UT_FE_FORGOT_PAGE_002
  it('submit thanh cong: goi API, luu session va dieu huong verify-otp mode reset', async () => {
    // Muc tieu: bao phu luong success trong handleSubmit.
    forgotPasswordMock.mockResolvedValue({ message: 'OTP sent' })

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByPlaceholderText('ban@email.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith('user@example.com')
    })

    // CheckStorage: thong tin email reset duoc luu lai cho buoc OTP.
    expect(sessionStorage.getItem('otpEmail')).toBe('user@example.com')
    expect(navigateMock).toHaveBeenCalledWith('/verify-otp', {
      state: { email: 'user@example.com', mode: 'reset' },
    })
  })

  // Test Case ID: UT_FE_FORGOT_PAGE_003
  it('hien thi message loi khi gui OTP that bai', async () => {
    // Muc tieu: bao phu branch catch va hien thi error.
    forgotPasswordMock.mockRejectedValue(new Error('Email khong ton tai'))

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByPlaceholderText('ban@email.com'), {
      target: { value: 'nope@example.com' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Email khong ton tai')).toBeTruthy()
  })

  // Test Case ID: UT_FE_FORGOT_PAGE_004
  it('hien thi loading text trong khi dang gui OTP', async () => {
    // Muc tieu: bao phu loading=true khi submit.
    forgotPasswordMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 50)),
    )

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByPlaceholderText('ban@email.com'), {
      target: { value: 'wait@example.com' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Đang gửi...')).toBeTruthy()
  })
})
