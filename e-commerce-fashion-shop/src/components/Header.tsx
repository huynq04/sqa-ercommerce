import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Search, Menu, X, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Container from './Container'
import logoShop from '../assets/banners/logo-shop-quan-ao.jpg'

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [user, setUser] = useState<any>(null)
	const [profileOpen, setProfileOpen] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()
	const profileRef = useRef<HTMLDivElement | null>(null)

	// ⭐ ADD SEARCH KEYWORD STATE
	const [keyword, setKeyword] = useState("")

	// Helper: nav highlight
	const isNavActive = (path: string, category?: string) => {
		const currentPath = location.pathname
		const searchParams = new URLSearchParams(location.search)
		const currentCategory = searchParams.get('category')

		if (path === '/shop') {
			if (category) {
				return currentPath === '/shop' && currentCategory === category
			} else {
				return currentPath === '/shop' && (currentCategory === null || (currentCategory !== 'men' && currentCategory !== 'women'))
			}
		}
		return currentPath === path
	}

	const loadUser = () => {
		const token = localStorage.getItem('token')
		if (!token) {
			setUser(null)
			return
		}

		fetch('http://localhost:3000/api/v1/auth/profile', {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then((res) => res.json())
			.then((data) => setUser(data))
			.catch(() => setUser(null))
	}

	useEffect(() => {
		const handleAuthChanged = () => loadUser()

		loadUser()
		window.addEventListener('storage', handleAuthChanged)
		window.addEventListener('auth-changed', handleAuthChanged as EventListener)

		const handleClickOutside = (event: MouseEvent) => {
			if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
				setProfileOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)

		return () => {
			window.removeEventListener('storage', handleAuthChanged)
			window.removeEventListener('auth-changed', handleAuthChanged as EventListener)
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const handleLogout = () => {
		setProfileOpen(false)
		localStorage.removeItem('token')
		setUser(null)
		window.dispatchEvent(new Event('storage'))
		window.dispatchEvent(new Event('auth-changed'))
		navigate('/')
	}

	// ⭐ ADD SEARCH HANDLER
	const handleSearch = () => {
		if (!keyword.trim()) return
		navigate(`/shop?q=${encodeURIComponent(keyword)}`)
	}

	return (
		<header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
			<div className="bg-neutral-900 py-2">
				<Container>
					<div className="h-4" />
				</Container>
			</div>

			<div className="bg-white">
				<Container>
					<div className="flex items-center gap-4 lg:gap-8 py-4">
						<Link to="/" className="flex-shrink-0 block">
							<img
								src={logoShop}
								alt="Cửa hàng thời trang"
								className="h-12 w-auto object-contain"
							/>
						</Link>

						{/* ⭐ UPDATED SEARCH BAR */}
						<div className="hidden md:flex flex-1 max-w-2xl">
							<div className="relative w-full">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />

								<input
									type="text"
									placeholder="Tìm sản phẩm..."
									value={keyword}
									onChange={(e) => setKeyword(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
									className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
								/>

								<button
									onClick={handleSearch}
									className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-neutral-900 text-white rounded-md text-sm"
								>
									Tìm
								</button>
							</div>
						</div>

						<div className="flex items-center gap-4 ml-auto">
							<button className="md:hidden p-2 text-neutral-700 hover:text-neutral-900">
								<Search className="h-5 w-5" />
							</button>

							<div className="relative" ref={profileRef}>
								<button
									className="p-2 rounded-full border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 transition-colors"
									onClick={() => setProfileOpen((prev) => !prev)}
								>
									<User className="h-5 w-5" />
								</button>
								{profileOpen && (
									<div className="absolute right-0 mt-2 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg py-2 text-sm z-50">
										{user ? (
											<>
												<div className="px-4 pb-2 text-xs uppercase text-neutral-500">
													Xin chào, {user?.name || user?.email}
												</div>
												<button className="w-full text-left px-4 py-2 hover:bg-neutral-50" onClick={() => { setProfileOpen(false); navigate('/profile') }}>
													Thông tin cá nhân
												</button>
							<button className="w-full text-left px-4 py-2 hover:bg-neutral-50" onClick={() => { setProfileOpen(false); navigate('/vouchers') }}>
								Voucher của tôi
							</button>
												<button className="w-full text-left px-4 py-2 hover:bg-neutral-50" onClick={() => { setProfileOpen(false); navigate('/orders') }}>
													Đơn hàng của tôi
												</button>
												{user?.role === 'admin' && (
													<button
														className="w-full text-left px-4 py-2 hover:bg-neutral-50"
														onClick={() => {
															setProfileOpen(false)
															navigate('/admin')
														}}
													>
														Bảng quản trị
													</button>
												)}
												{user?.role === 'staff' && (
													<button
														className="w-full text-left px-4 py-2 hover:bg-neutral-50"
														onClick={() => {
															setProfileOpen(false)
															navigate('/staff/fulfillment')
														}}
													>
														Trang nhân viên
													</button>
												)}
												<button className="w-full text-left px-4 py-2 text-red-600 hover:bg-neutral-50" onClick={handleLogout}>
													Đăng xuất
												</button>
											</>
										) : (
											<button className="w-full text-left px-4 py-2 hover:bg-neutral-50" onClick={() => { setProfileOpen(false); navigate('/login') }}>
												Đăng nhập
											</button>
										)}
									</div>
								)}
							</div>

							<Link to="/cart" className="relative inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors">
								<ShoppingCart className="h-5 w-5" />
								<span className="hidden sm:inline">Giỏ hàng</span>
							</Link>

							<button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-neutral-700 hover:text-neutral-900">
								{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
							</button>
						</div>
					</div>

					<nav className="hidden md:flex items-center gap-8 pb-4 border-t border-neutral-100 pt-4">
						<Link
							to="/shop"
							className={isNavActive('/shop')
								? 'text-neutral-900 border-b-2 border-neutral-900 pb-1 font-medium'
								: 'text-neutral-600 hover:text-neutral-900 transition-colors'
							}
						>
							Cửa hàng
						</Link>
						<Link
							to="/category/1"
							className={isNavActive('/shop', 'men')
								? 'text-neutral-900 border-b-2 border-neutral-900 pb-1 font-medium'
								: 'text-neutral-600 hover:text-neutral-900 transition-colors'
							}
						>
							Nam
						</Link>
						<Link
							to="/category/2"
							className={isNavActive('/shop', 'women')
								? 'text-neutral-900 border-b-2 border-neutral-900 pb-1 font-medium'
								: 'text-neutral-600 hover:text-neutral-900 transition-colors'
							}
						>
							Nữ
						</Link>
						<Link
							to="/about"
							className={isNavActive('/about')
								? 'text-neutral-900 border-b-2 border-neutral-900 pb-1 font-medium'
								: 'text-neutral-600 hover:text-neutral-900 transition-colors'
							}
						>
							Về chúng tôi
						</Link>
						<Link
							to="/contact"
							className={isNavActive('/contact')
								? 'text-neutral-900 border-b-2 border-neutral-900 pb-1 font-medium'
								: 'text-neutral-600 hover:text-neutral-900 transition-colors'
							}
						>
							Liên hệ
						</Link>
					</nav>
				</Container>
			</div>

			{mobileMenuOpen && (
				<div className="md:hidden border-t border-neutral-200 bg-white">
					<Container>
						<div className="py-4 space-y-4">
							<Link
								to="/shop"
								onClick={() => setMobileMenuOpen(false)}
								className={`block py-2 transition-colors ${
									isNavActive('/shop')
										? 'text-neutral-900 font-medium'
										: 'text-neutral-600 hover:text-neutral-900'
								}`}
							>
								Cửa hàng
							</Link>
							<Link
								to="/shop?category=men"
								onClick={() => setMobileMenuOpen(false)}
								className={`block py-2 transition-colors ${
									isNavActive('/shop', 'men')
										? 'text-neutral-900 font-medium'
										: 'text-neutral-600 hover:text-neutral-900'
								}`}
							>
								Nam
							</Link>
							<Link
								to="/shop?category=women"
								onClick={() => setMobileMenuOpen(false)}
								className={`block py-2 transition-colors ${
									isNavActive('/shop', 'women')
										? 'text-neutral-900 font-medium'
										: 'text-neutral-600 hover:text-neutral-900'
								}`}
							>
								Nữ
							</Link>
							<Link
								to="/about"
								onClick={() => setMobileMenuOpen(false)}
								className={`block py-2 transition-colors ${
									isNavActive('/about')
										? 'text-neutral-900 font-medium'
										: 'text-neutral-600 hover:text-neutral-900'
								}`}
							>
								Về chúng tôi
							</Link>
							<Link
								to="/contact"
								onClick={() => setMobileMenuOpen(false)}
								className={`block py-2 transition-colors ${
									isNavActive('/contact')
										? 'text-neutral-900 font-medium'
										: 'text-neutral-600 hover:text-neutral-900'
								}`}
							>
								Liên hệ
							</Link>
						</div>
					</Container>
				</div>
			)}
		</header>
	)
}
