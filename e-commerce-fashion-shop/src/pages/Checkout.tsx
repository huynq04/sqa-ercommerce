import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Container from "../components/Container";
import { getCart } from "../api/cartApi";
import { buyNow, checkoutFromCart } from "../api/ordersApi";
import { applyDiscount } from "../api/discountsApi";
import { toast } from "../utils/toast";
import {
	calculateShippingFee,
	fetchDistricts,
	fetchProvinces,
	fetchWards,
	type District,
	type Province,
	type ShippingFeeQuote,
	type Ward,
} from "../api/shippingApi";

type PaymentMethod = "cod" | "vnpay";
type BuyNowSession = {
	variantId: number;
	quantity: number;
	price: number;
	productName: string;
	imageUrl?: string;
	weight?: number;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
	style: "currency",
	currency: "VND",
});

const formatCurrency = (value: number) => currencyFormatter.format(Number(value) || 0);
const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 11);
const isPhoneValid = (value: string) => /^0\d{9,10}$/.test(value);

export default function Checkout() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const isBuyNowMode = searchParams.get("mode") === "buy-now";
	const [cart, setCart] = useState<any | null>(null);
	const [loadingCart, setLoadingCart] = useState(true);
	const [buyNowItem, setBuyNowItem] = useState<BuyNowSession | null>(null);

	const [provinces, setProvinces] = useState<Province[]>([]);
	const [districts, setDistricts] = useState<District[]>([]);
	const [wards, setWards] = useState<Ward[]>([]);
	const [provinceId, setProvinceId] = useState<string>("");
	const [districtId, setDistrictId] = useState<string>("");
	const [wardCode, setWardCode] = useState<string>("");

	const [form, setForm] = useState({
		fullName: "",
		phone: "",
		street: "",
	});

	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
	const [shippingFee, setShippingFee] = useState<number | null>(null);
	const [calculatingFee, setCalculatingFee] = useState(false);
	const [shippingError, setShippingError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [discountCode, setDiscountCode] = useState("");
	const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
	const [discountPercent, setDiscountPercent] = useState<number | null>(null);
	const [discountAmount, setDiscountAmount] = useState(0);
	const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
	const [voucherError, setVoucherError] = useState<string | null>(null);
	const [validatingDiscount, setValidatingDiscount] = useState(false);

	useEffect(() => {
		if (!isBuyNowMode) {
			sessionStorage.removeItem("buyNowItem");
			setBuyNowItem(null);
			return;
		}
		const stored = sessionStorage.getItem("buyNowItem");
		if (!stored) {
			setBuyNowItem(null);
			return;
		}
		try {
			setBuyNowItem(JSON.parse(stored));
		} catch {
			setBuyNowItem(null);
		}
	}, [isBuyNowMode]);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}

		if (isBuyNowMode) {
			setLoadingCart(false);
			setCart(null);
			return;
		}

		setLoadingCart(true);

		getCart(token)
			.then((data) => setCart(data))
			.catch((err: unknown) => {
				console.error(err);
				toast("Không tải được giỏ hàng. Vui lòng thử lại.");
			})
			.finally(() => setLoadingCart(false));
	}, [navigate, isBuyNowMode]);

	useEffect(() => {
		fetchProvinces()
			.then(setProvinces)
			.catch((err: unknown) => {
				console.error(err);
				toast("Không tải được danh sách tỉnh/thành.");
			});
	}, []);

	useEffect(() => {
		if (!provinceId) {
			setDistricts([]);
			setDistrictId("");
			return;
		}
		setDistricts([]);
		setDistrictId("");
		setWardCode("");
		setWards([]);
		fetchDistricts(Number(provinceId))
			.then(setDistricts)
			.catch((err: unknown) => {
				console.error(err);
				toast("Không tải được danh sách quận/huyện.");
			});
	}, [provinceId]);

	useEffect(() => {
		if (!districtId) {
			setWardCode("");
			setWards([]);
			return;
		}
		setWardCode("");
		setWards([]);
		fetchWards(Number(districtId))
			.then(setWards)
			.catch((err: unknown) => {
				console.error(err);
				toast("Không tải được danh sách phường/xã.");
			});
	}, [districtId]);

	const totalWeight = useMemo(() => {
		if (isBuyNowMode && buyNowItem) {
			const base = buyNowItem.weight ?? 200;
			return base * buyNowItem.quantity;
		}
		if (!cart?.items?.length) return 0;
		const baseWeight = 200;
		return cart.items.reduce((sum: number, item: any) => sum + baseWeight * item.quantity, 0) || baseWeight;
	}, [cart, isBuyNowMode, buyNowItem]);

	const orderItems = useMemo(() => {
		if (isBuyNowMode && buyNowItem) {
			return [
				{
					id: buyNowItem.variantId,
					quantity: buyNowItem.quantity,
					price: buyNowItem.price,
					variant: {
						product: {
							name: buyNowItem.productName,
							mainImageUrl: buyNowItem.imageUrl,
						},
					},
				},
			];
		}
		return cart?.items ?? [];
	}, [isBuyNowMode, buyNowItem, cart]);

	useEffect(() => {
		if (!orderItems.length || !districtId || !wardCode) {
			setShippingFee(null);
			setShippingError(null);
			return;
		}

		let cancelled = false;
		setCalculatingFee(true);
		setShippingError(null);

		calculateShippingFee({
			toDistrictId: Number(districtId),
			toWardCode: wardCode,
			weight: totalWeight || 200,
			insuranceValue:
				Number(
					isBuyNowMode && buyNowItem
						? buyNowItem.price * buyNowItem.quantity
						: cart?.totalPrice,
				) || undefined,
		})
			.then((quote: ShippingFeeQuote) => {
				if (cancelled) return;
				setShippingFee(Number(quote.total) || 0);
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				console.error(err);
				setShippingFee(null);
				setShippingError("Không tính được phí vận chuyển. Vui lòng thử lại.");
			})
			.finally(() => {
				if (cancelled) return;
				setCalculatingFee(false);
			});

		return () => {
			cancelled = true;
		};
	}, [orderItems.length, cart, districtId, wardCode, totalWeight]);

	const subtotal =
		isBuyNowMode && buyNowItem
			? buyNowItem.price * buyNowItem.quantity
			: Number(cart?.totalPrice || 0);
	const discountedSubtotal = Math.max(
		subtotal - (appliedDiscountCode ? discountAmount : 0),
		0,
	);
	const total =
		shippingFee !== null ? discountedSubtotal + shippingFee : discountedSubtotal;

	useEffect(() => {
		setAppliedDiscountCode(null);
		setDiscountPercent(null);
		setDiscountAmount(0);
		setVoucherMessage(null);
		setVoucherError(null);
	}, [subtotal]);

	const cartIsEmpty = isBuyNowMode ? !buyNowItem : !cart?.items?.length;
	const phoneError =
		form.phone && !isPhoneValid(form.phone)
			? "Số điện thoại không hợp lệ"
			: null;
	const isPhoneOk = Boolean(form.phone) && !phoneError;
	const canPlaceOrder =
		!cartIsEmpty &&
		Boolean(form.fullName && form.street && wardCode) &&
		isPhoneOk &&
		shippingFee !== null &&
		!isSubmitting;

	const selectedProvince = provinces.find((p) => String(p.ProvinceID) === provinceId);
	const selectedDistrict = districts.find((d) => String(d.DistrictID) === districtId);
	const selectedWard = wards.find((w) => w.WardCode === wardCode);

	const handleApplyVoucher = async () => {
		const trimmed = discountCode.trim();
		if (!trimmed) {
			setVoucherError("Vui lòng nhập mã ưu đãi hợp lệ.");
			setVoucherMessage(null);
			setAppliedDiscountCode(null);
			setDiscountPercent(null);
			setDiscountAmount(0);
			return;
		}
		try {
			setValidatingDiscount(true);
			setVoucherError(null);
			const response = await applyDiscount(trimmed, subtotal);
			const percent = Number(response.discountPercent) || 0;
			setAppliedDiscountCode(response.code);
			setDiscountPercent(percent);
			setDiscountAmount(response.discountAmount || 0);
			setVoucherMessage(
				`Đã áp dụng mã ${response.code} (-${percent}%). Ưu đãi chỉ áp dụng cho sản phẩm.`
			);
		} catch (error: any) {
			console.error(error);
			setAppliedDiscountCode(null);
			setDiscountPercent(null);
			setDiscountAmount(0);
			let message = error?.message || "Không xác thực được mã. Vui lòng thử lại.";
			try {
				const parsed = JSON.parse(message);
				message = parsed?.message || parsed?.error || message;
			} catch {
				// ignore parse errors
			}
			setVoucherMessage(null);
			setVoucherError(message);
		} finally {
			setValidatingDiscount(false);
		}
	};

	const handleRemoveVoucher = () => {
		setDiscountCode("");
		setAppliedDiscountCode(null);
		setDiscountPercent(null);
		setDiscountAmount(0);
		setVoucherMessage(null);
		setVoucherError(null);
	};

	const handlePlaceOrder = async () => {
		if (phoneError) {
			toast(phoneError);
			return;
		}
		if (!canPlaceOrder) {
			toast("Vui lòng điền đủ thông tin và chờ tính phí vận chuyển.");
			return;
		}
		if (isBuyNowMode && !buyNowItem) {
			toast("Sản phẩm bạn chọn không còn khả dụng. Vui lòng thử lại.");
			return;
		}

		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}

		const shippingAddress = [
			`${form.fullName} - ${form.phone}`,
			form.street,
			selectedWard?.WardName,
			selectedDistrict?.DistrictName,
			selectedProvince?.ProvinceName,
		]
			.filter(Boolean)
			.join(", ");

		const normalizedShippingFee = shippingFee ?? 0;

		try {
			setIsSubmitting(true);

			const commonPayload = {
				paymentMethod,
				shippingAddress,
				shippingFee: normalizedShippingFee,
				...(appliedDiscountCode ? { discountCode: appliedDiscountCode } : {}),
			};

		const response = isBuyNowMode && buyNowItem
			? await buyNow(token, {
					variantId: buyNowItem.variantId,
					quantity: buyNowItem.quantity,
					...commonPayload,
			  })
			: await checkoutFromCart(token, commonPayload);

		const orderPayload = response.order ?? response;
		const clientTotals = {
			originalSubtotal: subtotal,
			discountAmount: appliedDiscountCode ? discountAmount : 0,
			discountedSubtotal,
			shippingFee: normalizedShippingFee,
			total,
		};
		const checkoutSnapshot = {
			...clientTotals,
			createdAt: Date.now(),
		};

		if (paymentMethod === "vnpay" && response.payUrl) {
			const storedTotals = {
				...clientTotals,
				orderId: orderPayload?.id ?? null,
				createdAt: Date.now(),
			};
			localStorage.setItem("orderTotals", JSON.stringify(storedTotals));
			sessionStorage.setItem("orderTotals", JSON.stringify(storedTotals));
			localStorage.setItem("checkoutTotals", JSON.stringify(checkoutSnapshot));
			sessionStorage.removeItem("buyNowItem");
			window.location.href = response.payUrl;
			return;
		}

		sessionStorage.removeItem("buyNowItem");
		localStorage.setItem("checkoutTotals", JSON.stringify(checkoutSnapshot));
			const orderId = orderPayload?.id;
			const url = orderId ? `/order-success?orderId=${orderId}` : "/order-success";
			navigate(url, {
				state: {
					order: orderPayload ?? null,
					clientTotals,
				},
			});
		} catch (err: any) {
			console.error(err);
			const message = err?.message || "Thanh toán thất bại. Vui lòng thử lại.";
			toast(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loadingCart) {
		return <div className="py-20 text-center">Đang tải giỏ hàng...</div>;
	}

	if (isBuyNowMode && !buyNowItem) {
		return (
			<main className="py-12">
				<Container>
					<h1 className="heading-3 mb-4">Sản phẩm không khả dụng</h1>
					<p className="mb-6 text-neutral-600">Lựa chọn mua ngay đã hết hạn. Vui lòng quay lại và thử lại.</p>
					<button className="btn-primary" onClick={() => navigate(-1)}>
						Quay lại
					</button>
				</Container>
			</main>
		);
	}

	if (cartIsEmpty) {
		return (
			<main className="py-12">
				<Container>
					<h1 className="heading-3 mb-4">Giỏ hàng trống</h1>
					<p className="mb-6 text-neutral-600">Hãy thêm sản phẩm vào giỏ trước khi thanh toán.</p>
					<button className="btn-primary" onClick={() => navigate("/shop")}>
						Về trang mua sắm
					</button>
				</Container>
			</main>
		);
	}

	return (
		<main className="py-12">
			<Container>
				<h1 className="heading-3">Thanh toán</h1>
				<div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
					<form
						className="lg:col-span-2 space-y-6"
						onSubmit={(e) => {
							e.preventDefault();
							handlePlaceOrder();
						}}
					>
						<div className="card space-y-5 p-6">
							<h2 className="heading-4">Thông tin giao hàng</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
								<input
									className="input"
									placeholder="Họ và tên"
									value={form.fullName}
									onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
									required
								/>
								<div>
									<input
										className={phoneError ? "input border-red-500 focus:border-red-500" : "input"}
										placeholder="Số điện thoại"
										value={form.phone}
										onChange={(e) =>
											setForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value) }))
										}
										inputMode="numeric"
										required
									/>
									{phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
								<select
									className="input"
									value={provinceId}
									onChange={(e) => setProvinceId(e.target.value)}
									required
								>
									<option value="">Chọn tỉnh/thành</option>
									{provinces.map((province) => (
										<option key={province.ProvinceID} value={province.ProvinceID}>
											{province.ProvinceName}
										</option>
									))}
								</select>
								<select
									className="input"
									value={districtId}
									onChange={(e) => setDistrictId(e.target.value)}
									disabled={!provinceId}
									required
								>
									<option value="">Chọn quận/huyện</option>
									{districts.map((district) => (
										<option key={district.DistrictID} value={district.DistrictID}>
											{district.DistrictName}
										</option>
									))}
								</select>
								<select
									className="input"
									value={wardCode}
									onChange={(e) => setWardCode(e.target.value)}
									disabled={!districtId}
									required
								>
									<option value="">Chọn phường/xã</option>
									{wards.map((ward) => (
										<option key={ward.WardCode} value={ward.WardCode}>
											{ward.WardName}
										</option>
									))}
								</select>
							</div>
							<input
								className="input"
								placeholder="Địa chỉ chi tiết"
								value={form.street}
								onChange={(e) => setForm((prev) => ({ ...prev, street: e.target.value }))}
								required
							/>
							{shippingError && <p className="text-sm text-red-600">{shippingError}</p>}
						</div>

						<div className="card space-y-4 p-6">
							<h2 className="heading-4">Phương thức thanh toán</h2>
							<label className="flex items-center gap-3 rounded border border-neutral-200 px-4 py-3 text-sm font-medium">
								<input
									type="radio"
									name="payment"
									value="cod"
									checked={paymentMethod === "cod"}
									onChange={() => setPaymentMethod("cod")}
								/>
								<span>Thanh toán khi nhận hàng</span>
							</label>
							<label className="flex items-center gap-3 rounded border border-neutral-200 px-4 py-3 text-sm font-medium">
								<input
									type="radio"
									name="payment"
									value="vnpay"
									checked={paymentMethod === "vnpay"}
									onChange={() => setPaymentMethod("vnpay")}
								/>
								<span>VNPay</span>
							</label>
						</div>
					</form>

					<aside className="card h-fit">
						<h2 className="heading-4">Tóm tắt đơn hàng</h2>
						<div className="mt-4 space-y-3 max-h-[220px] overflow-auto pr-1">
							{orderItems.map((item: any) => (
								<div key={item.id} className="flex justify-between text-sm">
									<span className="text-neutral-600">
										{item.variant?.product?.name || "Sản phẩm"} x {item.quantity}
									</span>
									<span className="font-semibold">{formatCurrency(Number(item.price) * item.quantity)}</span>
								</div>
							))}
						</div>

						<div className="mt-6 space-y-3 text-sm">
							<div className="flex items-center justify-between">
								<span>Tạm tính</span>
								<span className="font-semibold">{formatCurrency(subtotal)}</span>
							</div>
							{discountAmount > 0 && (
								<div className="flex items-center justify-between text-green-600">
									<span>
										Giảm giá{appliedDiscountCode ? ` (${appliedDiscountCode})` : ""}
									</span>
									<span>-{formatCurrency(discountAmount)}</span>
								</div>
							)}
							<div className="flex items-center justify-between">
								<span>Phí vận chuyển</span>
								<span className="font-semibold">
									{calculatingFee && wardCode ? "Đang tính..." : shippingFee !== null ? formatCurrency(shippingFee) : "--"}
								</span>
							</div>
							<div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
								<span>Tổng cộng</span>
								<span>{formatCurrency(total)}</span>
							</div>
						</div>

						<div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
							<p className="text-sm font-semibold mb-3">Mã voucher</p>
							<div className="flex flex-col sm:flex-row gap-3">
								<input
									className="input flex-1"
									placeholder="Nhập mã giảm giá"
									value={discountCode}
									onChange={(e) => {
										setDiscountCode(e.target.value);
										setVoucherError(null);
									}}
								/>
								<button
									type="button"
									onClick={handleApplyVoucher}
									className="btn-primary whitespace-nowrap disabled:opacity-60"
									disabled={validatingDiscount}
								>
									{validatingDiscount ? "Đang kiểm tra..." : "Áp dụng"}
								</button>
							</div>
							{voucherError && (
								<p className="mt-2 text-xs text-red-600">{voucherError}</p>
							)}
							{voucherMessage && (
								<p className="mt-2 text-xs text-neutral-600">
									{voucherMessage}
									{discountAmount > 0 && (
										<span> Giảm ngay {formatCurrency(discountAmount)}.</span>
									)}
								</p>
							)}
							{appliedDiscountCode && (
								<div className="mt-2 flex items-center justify-between text-xs text-green-600">
									<span>Đang sử dụng: {appliedDiscountCode}</span>
									<button
										type="button"
										onClick={handleRemoveVoucher}
										className="text-red-500 hover:underline"
									>
										Gỡ mã
									</button>
								</div>
							)}
							{!appliedDiscountCode && (
								<p className="mt-2 text-xs text-neutral-500">
									Nhập mã ưu đãi nếu bạn có để được giảm thêm.
								</p>
							)}
						</div>

						<button
							className="btn-primary mt-6 w-full disabled:opacity-60"
							onClick={handlePlaceOrder}
							disabled={!canPlaceOrder}
						>
							{isSubmitting ? "Đang đặt hàng..." : paymentMethod === "vnpay" ? "Thanh toán VNPay" : "Đặt hàng"}
						</button>
					</aside>
				</div>
			</Container>
		</main>
	);
}
