/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProfilePage from './ProfilePage'

const uploadFileMock = vi.fn()

vi.mock('../api/uploadApi', () => ({
  uploadFile: (token: string, file: File) => uploadFileMock(token, file),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
  }
})

describe('ProfilePage', () => {
  beforeEach(() => {
    // Reset mock va storage truoc moi testcase.
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
  })

  const mockProfile = {
    sub: 101,
    email: 'user@example.com',
    role: 'user',
    name: 'Nguyen Van A',
    phone: '0912345678',
    address: 'Ha Noi',
    avatarUrl: null,
  }

  // Test Case ID: TC_FE_PROFILE_PAGE_001
  it('hien thi loi khi chua dang nhap (khong co token)', async () => {
    // Muc tieu: cover branch token null trong useEffect.
    render(<ProfilePage />)

    expect(await screen.findByText('Vui lòng đăng nhập để xem hồ sơ.')).toBeTruthy()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  // Test Case ID: TC_FE_PROFILE_PAGE_002
  it('load profile thanh cong va hien thi thong tin co ban', async () => {
    // Muc tieu: cover branch fetch profile thanh cong.
    localStorage.setItem('token', 'jwt-token')
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    })

    render(<ProfilePage />)

    expect(await screen.findByText('Hồ sơ cá nhân')).toBeTruthy()
    expect(screen.getAllByText('Nguyen Van A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('user@example.com').length).toBeGreaterThan(0)
    expect(screen.getByText('Chỉnh sửa')).toBeTruthy()

    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/auth/profile', {
      headers: { Authorization: 'Bearer jwt-token' },
    })
  })

  // Test Case ID: TC_FE_PROFILE_PAGE_003
  it('hien thi loi khi tai profile that bai', async () => {
    // Muc tieu: cover branch res.ok = false khi fetch profile.
    localStorage.setItem('token', 'jwt-token')
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    })

    render(<ProfilePage />)

    expect(await screen.findByText('Không thể tải thông tin hồ sơ.')).toBeTruthy()
  })

  // Test Case ID: TC_FE_PROFILE_PAGE_004
  it('vao che do sua va co the huy', async () => {
    // Muc tieu: cover startEdit va cancelEdit.
    localStorage.setItem('token', 'jwt-token')
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile,
    })

    render(<ProfilePage />)

    fireEvent.click(await screen.findByText('Chỉnh sửa'))

    expect(screen.getByText('Lưu thay đổi')).toBeTruthy()
    expect(screen.getByText('Hủy')).toBeTruthy()

    fireEvent.click(screen.getByText('Hủy'))
    expect(await screen.findByText('Chỉnh sửa')).toBeTruthy()
  })

  // Test Case ID: TC_FE_PROFILE_PAGE_005
  it('save thanh cong: goi API update va hien thi thong bao success', async () => {
    // Muc tieu: cover handleSave success branch.
    localStorage.setItem('token', 'jwt-token')

    ;(globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Nguyen Van B',
          phone: '0999999999',
          address: 'Da Nang',
          avatarUrl: null,
        }),
      })

    render(<ProfilePage />)

    fireEvent.click(await screen.findByText('Chỉnh sửa'))

    const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement
    const phoneInput = document.querySelectorAll('input[type="text"]')[1] as HTMLInputElement
    const addressInput = document.querySelector('textarea') as HTMLTextAreaElement

    fireEvent.change(nameInput, { target: { value: 'Nguyen Van B' } })
    fireEvent.change(phoneInput, { target: { value: '0999999999' } })
    fireEvent.change(addressInput, { target: { value: 'Da Nang' } })

    fireEvent.click(screen.getByText('Lưu thay đổi'))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt-token',
        },
        body: JSON.stringify({
          name: 'Nguyen Van B',
          phone: '0999999999',
          address: 'Da Nang',
          avatarUrl: null,
        }),
      })
    })

    expect(await screen.findByText('Cập nhật hồ sơ thành công.')).toBeTruthy()
  })

  // Test Case ID: TC_FE_PROFILE_PAGE_006
  it('hien thi loi khi save that bai', async () => {
    // Muc tieu: cover catch branch trong handleSave.
    localStorage.setItem('token', 'jwt-token')

    ;(globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

    render(<ProfilePage />)

    fireEvent.click(await screen.findByText('Chỉnh sửa'))
    fireEvent.click(screen.getByText('Lưu thay đổi'))

    expect(await screen.findByText('Cập nhật hồ sơ thất bại.')).toBeTruthy()
  })

  // Test Case ID: TC_FE_PROFILE_PAGE_007
  it('save voi avatar moi se goi uploadFile truoc khi update', async () => {
    // Muc tieu: cover nhanh avatar upload trong handleSave.
    localStorage.setItem('token', 'jwt-token')

    ;(globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockProfile, avatarUrl: 'https://cdn.example.com/avatar.jpg' }),
      })

    uploadFileMock.mockResolvedValue({ url: 'https://cdn.example.com/avatar.jpg' })

    render(<ProfilePage />)

    fireEvent.click(await screen.findByText('Chỉnh sửa'))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText('Lưu thay đổi'))

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalledWith('jwt-token', file)
    })
  })
})
