/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ResetPasswordPage from './ResetPasswordPage'

const navigateMock = vi.fn()
const resetPasswordMock = vi.fn()

let mockedLocationState: { email?: string; otp?: string } | null = null

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
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    resetPasswordMock(payload),
}))

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    // Reset mock va storage truoc moi testcase.
    vi.clearAllMocks()
    mockedLocationState = null
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  const fillPasswordForm = (newPassword: string, confirmPassword: string) => {
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(passwordInputs[0] as Element, { target: { value: newPassword } })
    fireEvent.change(passwordInputs[1] as Element, { target: { value: confirmPassword } })
  }

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_001
  it('render day du reset password form', () => {
    // Muc tieu: dam bao trang co input email va 2 input mat khau.
    sessionStorage.setItem('otpEmail', 'user@example.com')
    sessionStorage.setItem('otpCode', '123456')

    render(<ResetPasswordPage />)

    expect(screen.getAllByText('Đổi mật khẩu').length).toBeGreaterThan(0)
    expect(document.querySelector('input[type="email"]')).toBeTruthy()
    expect(document.querySelectorAll('input[type="password"]').length).toBe(2)
    expect(document.querySelector('button[type="submit"]')).toBeTruthy()
  })

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_002
  it('doc email va otp tu location.state', async () => {
    // Muc tieu: bao phu nhanh khoi tao state tu navigation.
    mockedLocationState = { email: 'state@example.com', otp: '777777' }

    render(<ResetPasswordPage />)

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    await waitFor(() => {
      expect(emailInput.value).toBe('state@example.com')
    })
  })

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_003
  it('hien thi loi khi thieu email hoac otp', async () => {
    // Muc tieu: cover validation !email || !otp.
    render(<ResetPasswordPage />)

    fillPasswordForm('12345', '12345')
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Thiếu email hoặc OTP. Vui lòng quay lại bước nhập mã.')).toBeTruthy()
  })

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_004
  it('hien thi loi khi mat khau moi duoi 5 ky tu', async () => {
    // Muc tieu: cover validation do dai mat khau.
    sessionStorage.setItem('otpEmail', 'user@example.com')
    sessionStorage.setItem('otpCode', '123456')

    render(<ResetPasswordPage />)

    fillPasswordForm('1234', '1234')
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Mật khẩu mới tối thiểu 5 ký tự.')).toBeTruthy()
  })

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_005
  it('hien thi loi khi xac nhan mat khau khong khop', async () => {
    // Muc tieu: cover validation mismatch.
    sessionStorage.setItem('otpEmail', 'user@example.com')
    sessionStorage.setItem('otpCode', '123456')

    render(<ResetPasswordPage />)

    fillPasswordForm('12345', '54321')
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Xác nhận mật khẩu không khớp.')).toBeTruthy()
  })

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_006
  it('submit thanh cong: goi API, xoa otp storage va dieu huong login', async () => {
    // Muc tieu: cover luong success trong handleSubmit.
    sessionStorage.setItem('otpEmail', 'user@example.com')
    sessionStorage.setItem('otpCode', '123456')
    resetPasswordMock.mockResolvedValue({ ok: true })

    render(<ResetPasswordPage />)

    fillPasswordForm('abcde', 'abcde')
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'abcde',
      })
    })

    // CheckStorage: otp info phai duoc clear sau khi doi mat khau thanh cong.
    expect(sessionStorage.getItem('otpEmail')).toBeNull()
    expect(sessionStorage.getItem('otpCode')).toBeNull()
    expect(navigateMock).toHaveBeenCalledWith('/login', { state: { resetSuccess: true } })
  })

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_007
  it('hien thi loi tu API khi reset password that bai', async () => {
    // Muc tieu: cover catch branch.
    sessionStorage.setItem('otpEmail', 'user@example.com')
    sessionStorage.setItem('otpCode', '123456')
    resetPasswordMock.mockRejectedValue(new Error('OTP khong hop le'))

    render(<ResetPasswordPage />)

    fillPasswordForm('abcde', 'abcde')
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('OTP khong hop le')).toBeTruthy()
  })

  // Test Case ID: TC_FE_RESET_PASSWORD_PAGE_008
  it('hien thi loading text trong luc dang submit', async () => {
    // Muc tieu: cover loading=true trong qua trinh goi API.
    sessionStorage.setItem('otpEmail', 'user@example.com')
    sessionStorage.setItem('otpCode', '123456')
    resetPasswordMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 50)),
    )

    render(<ResetPasswordPage />)

    fillPasswordForm('abcde', 'abcde')
    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Đang xử lý...')).toBeTruthy()
  })
})
