import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import About from './pages/About'
import Contact from './pages/Contact'
import CategoryPage from "./pages/CategoryPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import OtpVerifyPage from "./pages/OtpVerifyPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import VouchersPage from "./pages/VouchersPage.tsx";
import OrderSuccess from "./pages/OrderSuccess.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import MyOrdersPage from "./pages/MyOrdersPage.tsx";
import OrderDetailPage from "./pages/OrderDetailPage.tsx";
import OrderTrackingPage from "./pages/OrderTrackingPage.tsx";
import AdminProducts from "./pages/admin/AdminProducts.tsx";
import AdminVariants from "./pages/admin/AdminVariants.tsx";
import AdminColors from "./pages/admin/AdminColors.tsx";
import AdminSizes from "./pages/admin/AdminSizes.tsx";
import AdminImages from "./pages/admin/AdminImages.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import AdminDiscounts from "./pages/admin/AdminDiscounts.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminInventory from "./pages/admin/AdminInventory.tsx";
import AdminShipping from "./pages/admin/AdminShipping.tsx";
import AdminBestSelling from "./pages/admin/AdminBestSelling.tsx";
import AdminProductSales from "./pages/admin/AdminProductSales.tsx";
import AdminRevenue from "./pages/admin/AdminRevenue.tsx";
import ProductManage from "./pages/admin/ProductManage.tsx";
import StaffFulfillment from "./pages/StaffFulfillment.tsx";
import ChatbotWidget from "./components/ChatbotWidget.tsx";
import ToastHost from "./components/ToastHost.tsx";
import AdminStaffUsers from "./pages/admin/AdminStaffUsers.tsx";

function App() {
	return (
		<>
		<Routes>
			{/* Public routes with Header/Footer */}
			<Route path="/" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><Home /></div>
					<Footer />
				</div>
			} />
			<Route path="/shop" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><Shop /></div>
					<Footer />
				</div>
			} />
			<Route path="/product/:id" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><ProductDetail /></div>
					<Footer />
				</div>
			} />
			<Route path="/cart" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><Cart /></div>
					<Footer />
				</div>
			} />
			<Route path="/checkout" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><Checkout /></div>
					<Footer />
				</div>
			} />
			<Route path="/about" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><About /></div>
					<Footer />
				</div>
			} />
			<Route path="/contact" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><Contact /></div>
					<Footer />
				</div>
			} />
			<Route path="/category/:id" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><CategoryPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/login" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><LoginPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/forgot-password" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><ForgotPasswordPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/verify-otp" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><OtpVerifyPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/reset-password" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><ResetPasswordPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/register" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><RegisterPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/order-success" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><OrderSuccess /></div>
					<Footer />
				</div>
			} />
			<Route path="/profile" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><ProfilePage /></div>
					<Footer />
				</div>
			} />
			<Route path="/orders" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><MyOrdersPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/orders/:id" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><OrderDetailPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/orders/:id/tracking" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><OrderTrackingPage /></div>
					<Footer />
				</div>
			} />
			<Route path="/vouchers" element={
				<div className="min-h-full flex flex-col">
					<Header />
					<div className="flex-1"><VouchersPage /></div>
					<Footer />
				</div>
			} />
			{/* Admin/Staff routes without Header/Footer */}
			<Route path="/admin" element={<Navigate to="/admin/revenue" replace />} />
			<Route path="/admin/categories" element={<AdminCategories />} />
			<Route path="/admin/products" element={<AdminProducts />} />
			<Route path="/admin/users" element={<AdminUsers />} />
			<Route path="/admin/inventory" element={<AdminInventory />} />
			<Route path="/admin/discounts" element={<AdminDiscounts />} />
			<Route path="/admin/shipping" element={<AdminShipping />} />
			<Route path="/admin/best-selling" element={<AdminBestSelling />} />
			<Route path="/admin/product-sales" element={<AdminProductSales />} />
			<Route path="/admin/revenue" element={<AdminRevenue />} />
			<Route path="/admin/staff-users" element={<AdminStaffUsers />} />
			<Route path="/admin/products/:id/manage" element={<ProductManage />} />
			<Route path="/staff/fulfillment" element={<StaffFulfillment />} />
			<Route path="/staff/products/:id/manage" element={<ProductManage />} />
			<Route path="/staff/categories" element={<AdminCategories />} />
			<Route path="/staff/products" element={<AdminProducts />} />
			<Route path="/staff/discounts" element={<AdminDiscounts />} />
			<Route path="/staff/users" element={<AdminUsers />} />
			<Route path="/staff/colors" element={<AdminColors />} />
			<Route path="/staff/sizes" element={<AdminSizes />} />
			{/* Legacy routes - can be removed if not needed */}
			<Route path="/admin/variants" element={<AdminVariants />} />
			<Route path="/admin/colors" element={<AdminColors />} />
			<Route path="/admin/sizes" element={<AdminSizes />} />
			<Route path="/admin/images" element={<AdminImages />} />
			<Route path="/admin/orders" element={<AdminOrders />} />
		</Routes>
		<ToastHost />
		<ChatbotWidget />
		</>
	);
}

export default App
