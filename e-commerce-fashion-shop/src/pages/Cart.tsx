import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, removeCartItem, updateCartItem, clearCart } from "../api/cartApi";
import Container from "../components/Container";
import { toast } from "../utils/toast";

export default function Cart() {
	const [cart, setCart] = useState<any>(null);
	const navigate = useNavigate();
	
	const loadCart = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		setCart(await getCart(token));
	};

	useEffect(() => {
		loadCart();
	}, []);

	// Calculate total price automatically from cart items
	const totalPrice = useMemo(() => {
		if (!cart?.items) return 0;
		return cart.items.reduce(
			(sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
			0
		);
	}, [cart?.items]);

	if (!cart) return <div className="py-20 text-center">Đang tải...</div>;

	const handleCheckout = () => {
		const token = localStorage.getItem("token");
		if (!token) {
			toast("Bạn chưa đăng nhập!");
			navigate("/login");
			return;
		}
		if (!cart.items.length) {
			toast("Giỏ hàng trống.");
			return;
		}
		navigate("/checkout");
	};

	return (
		<main className="py-12">
			<Container>
				<h1 className="heading-3">Giỏ hàng</h1>

				<div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-4">
						{cart.items.length === 0 && (
							<p className="text-neutral-500">Giỏ hàng trống.</p>
						)}

						{cart.items.map((item: any) => (
							<div key={item.id} className="card flex items-center gap-5">
								<img
									src={item.variant.product.mainImageUrl}
									className="h-24 w-24 rounded-lg object-cover"
								/>
								<div className="flex-1">
									<p className="font-medium">{item.variant.product.name}</p>
									{(item.variant.color || item.variant.size) && (
										<p className="mt-1 text-sm text-neutral-600">
											{item.variant.color?.color ? `Màu sắc: ${item.variant.color.color}` : ""}
											{item.variant.color?.color && item.variant.size?.size ? " | " : ""}
											{item.variant.size?.size ? `Kích cỡ: ${item.variant.size.size}` : ""}
										</p>
									)}
									<p className="font-semibold mt-1">
										{Number(item.price).toLocaleString()}
									</p>

									<input
										type="number"
										min={1}
										value={item.quantity}
										onChange={async (e) => {
											const token = localStorage.getItem("token");
											const quantity = Number(e.target.value);
											if (quantity < 1) return;

											try {
												const updated = await updateCartItem(token!, item.id, quantity);
												// Update cart state - totalPrice will be calculated automatically
												setCart(updated);
											} catch (error) {
												console.error("Cập nhật sản phẩm trong giỏ thất bại:", error);
												toast("Cập nhật số lượng thất bại. Vui lòng thử lại.");
											}
										}}
										className="mt-2 w-16 border rounded px-2"
									/>
								</div>

								<button
									className="text-red-500 hover:text-red-700 transition-colors"
									onClick={async () => {
										const token = localStorage.getItem("token");
										if (!token) return;
										
										try {
											await removeCartItem(token, item.id);
											// Update cart state locally - remove item from items array
											setCart((prevCart: any) => ({
												...prevCart,
												items: prevCart.items.filter((it: any) => it.id !== item.id),
											}));
										} catch (error) {
											console.error("Xóa sản phẩm khỏi giỏ thất bại:", error);
											toast("Xóa sản phẩm thất bại. Vui lòng thử lại.");
										}
									}}
								>
									Xóa
								</button>
							</div>
						))}
					</div>

					<div className="card h-fit">
						<h2 className="heading-4">Tổng tiền</h2>
						<p className="mt-4 font-bold text-lg text-neutral-900">
							Tổng: {totalPrice.toLocaleString()}₫
						</p>

						<button className="btn-primary mt-6 w-full" onClick={handleCheckout}>
							Thanh toán
						</button>

						<button
							className="btn-secondary mt-4 w-full"
							onClick={async () => {
								if (!window.confirm("Xóa toàn bộ giỏ hàng?")) return;
								const token = localStorage.getItem("token");
								if (!token) return;
								
								try {
									await clearCart(token);
									// Update cart state locally - clear items array
									setCart((prevCart: any) => ({
										...prevCart,
										items: [],
									}));
								} catch (error) {
									console.error("Xóa giỏ hàng thất bại:", error);
									toast("Xóa giỏ hàng thất bại. Vui lòng thử lại.");
								}
							}}
						>
							Xóa toàn bộ
						</button>
					</div>
				</div>
			</Container>
		</main>
	);
}
