/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RegisterPage from './RegisterPage'

const navigateMock = vi.fn()
const registerMock = vi.fn()

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
  register: (payload: {
    name: string
    email: string
    password: string
    phone: string
    address: string
  }) => registerMock(payload),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    // Reset mock va storage truoc moi testcase.
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  const fillRegisterForm = () => {
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyen Van A' },
    })
    fireEvent.change(screen.getByPlaceholderText('ban@email.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(document.querySelector('input[type="password"]') as Element, {
      target: { value: '123456' },
    })
    fireEvent.change(screen.getByPlaceholderText('0901234567'), {
      target: { value: '0912345678' },
    })
    fireEvent.change(screen.getByPlaceholderText('Nhập địa chỉ đầy đủ...'), {
      target: { value: 'Ha Noi' },
    })
  }

  // Test Case ID: TC_FE_REGISTER_PAGE_001
  it('render day du form register', () => {
    // Muc tieu: dam bao trang register co day du cac truong bat buoc.
    render(<RegisterPage />)

    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toBeTruthy()
    expect(screen.getByPlaceholderText('ban@email.com')).toBeTruthy()
    expect(document.querySelector('input[type="password"]')).toBeTruthy()
    expect(screen.getByPlaceholderText('0901234567')).toBeTruthy()
    expect(screen.getByPlaceholderText('Nhập địa chỉ đầy đủ...')).toBeTruthy()
    expect(document.querySelector('button[type="submit"]')).toBeTruthy()
  })

  // Test Case ID: TC_FE_REGISTER_PAGE_002
  it('register thanh cong: luu otp session va navigate verify-otp', async () => {
    // Muc tieu: bao phu luong thanh cong trong handleSubmit.
    registerMock.mockResolvedValue({ id: 1 })

    render(<RegisterPage />)
    fillRegisterForm()

    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'Nguyen Van A',
        email: 'user@example.com',
        password: '123456',
        phone: '0912345678',
        address: 'Ha Noi',
      })
    })

    // CheckStorage
    expect(sessionStorage.getItem('otpEmail')).toBe('user@example.com')
    expect(sessionStorage.getItem('otpMode')).toBe('verify')

    expect(navigateMock).toHaveBeenCalledWith('/verify-otp', {
      state: { email: 'user@example.com', mode: 'verify' },
    })
  })

  // Test Case ID: TC_FE_REGISTER_PAGE_003
  it('hien thi message loi khi register that bai', async () => {
    // Muc tieu: bao phu branch catch de hien thi error.
    registerMock.mockRejectedValue(new Error('Email da ton tai'))

    render(<RegisterPage />)
    fillRegisterForm()

    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Email da ton tai')).toBeTruthy()
  })

  // Test Case ID: TC_FE_REGISTER_PAGE_004
  it('hien thi trang thai loading trong luc submit', async () => {
    // Muc tieu: bao phu loading=true khi dang submit.
    registerMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 50)),
    )

    render(<RegisterPage />)
    fillRegisterForm()

    fireEvent.click(document.querySelector('button[type="submit"]') as Element)

    expect(await screen.findByText('Đang tạo tài khoản...')).toBeTruthy()
  })
})
