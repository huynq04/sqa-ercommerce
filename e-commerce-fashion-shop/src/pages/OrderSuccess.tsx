import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Container from "../components/Container";

export default function OrderSuccess() {
	const [params] = useSearchParams();
	const location = useLocation();

	const txnRef = params.get("vnp_TxnRef");
	const statusCode = params.get("vnp_ResponseCode");
	const manualStatus = params.get("status");
	const queryOrderId = params.get("orderId");
	const derivedOrderId = queryOrderId || (txnRef ? txnRef.split("_")[0] : null);
	const isVNPayFlow = Boolean(statusCode);
	const routeState = location.state as any;
	const [order, setOrder] = useState<any>(routeState?.order || null);
	const clientTotals = routeState?.clientTotals;
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const isSuccess = isVNPayFlow
		? statusCode === "00"
		: manualStatus !== null
			? manualStatus === "success"
			: Boolean(derivedOrderId || order);

	useEffect(() => {
		if (!isSuccess) return;
		const needsFetch = !order || !order.items || order.items.length === 0;
		if (!needsFetch) return;
		if (!derivedOrderId) return;

		const token = localStorage.getItem("token");
		if (!token) {
			setError("Vui lòng đăng nhập để xem chi tiết đơn hàng.");
			return;
		}

		setLoading(true);
		fetch(`http://localhost:3000/api/v1/orders/${derivedOrderId}`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => res.json())
			.then((data) => setOrder(data))
			.catch(() => setError("Không thể lấy thông tin đơn hàng."))
			.finally(() => setLoading(false));
	}, [derivedOrderId, isSuccess, order]);

	const persistedTotals = useMemo(() => {
		const parse = (raw: string | null) => {
			if (!raw) return null;
			try {
				return JSON.parse(raw);
			} catch {
				return null;
			}
		};
		const rawSession = sessionStorage.getItem("orderTotals");
		const rawLocal = localStorage.getItem("orderTotals");
		return {
			storedTotals: parse(rawSession) || parse(rawLocal),
			checkoutTotals: parse(localStorage.getItem("checkoutTotals")),
		};
	}, []);
	const storedTotals = persistedTotals.storedTotals;
	const checkoutTotals = persistedTotals.checkoutTotals;
	const storedTotalsUsable = Boolean(storedTotals && storedTotals.total != null);
	const checkoutTotalsUsable = Boolean(checkoutTotals && checkoutTotals.total != null);

	const failureMessage = isVNPayFlow
		? "Thanh toán không thành công. Vui lòng thử lại."
		: manualStatus === "failed"
			? "Thanh toán bị hủy hoặc chưa hoàn tất."
			: "Thanh toán không thành công. Vui lòng thử lại.";

	useEffect(() => {
		if (!order) return;
		if (storedTotalsUsable) {
			sessionStorage.removeItem("orderTotals");
			localStorage.removeItem("orderTotals");
		}
		if (checkoutTotalsUsable) {
			localStorage.removeItem("checkoutTotals");
		}
	}, [order, storedTotalsUsable, checkoutTotalsUsable]);

	if (!isSuccess) {
		return (
			<main className="min-h-screen bg-neutral-50 py-16">
				<Container>
					<div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg px-8 py-10 text-center border border-red-100">
						<h1 className="text-2xl font-semibold text-red-600 mb-3">Thanh toán thất bại</h1>
						<p className="mb-6 text-neutral-600">{failureMessage}</p>
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<a href="/cart" className="btn-primary px-6 py-3">Thử lại</a>
							<a href="/shop" className="btn-secondary px-6 py-3">Tiếp tục mua sắm</a>
						</div>
					</div>
				</Container>
			</main>
		);
	}

	if (loading) {
		return (
			<main className="min-h-screen flex items-center justify-center bg-neutral-50">
				<p className="text-neutral-600">Đang tải thông tin đơn hàng...</p>
			</main>
		);
	}

	if (!order) {
		return (
			<main className="min-h-screen bg-neutral-50 py-16">
				<Container>
					<div className="max-w-3xl mx-auto text-center bg-white rounded-2xl shadow-lg border border-neutral-100 px-8 py-10">
						<h1 className="text-2xl font-semibold mb-3">Không tìm được chi tiết đơn</h1>
						<p className="mb-6 text-neutral-600">{error || "Vui lòng thử lại sau."}</p>
						<a href="/shop" className="btn-primary px-6 py-3">Về trang mua sắm</a>
					</div>
				</Container>
			</main>
		);
	}

	const items = order.items || [];
	const subtotal = items.reduce((sum: number, item: any) => {
		const price = Number(item.price || item.variant?.price || 0);
		const quantity = Number(item.quantity || 0);
		return sum + price * quantity;
	}, 0);

	const resolveNumber = (...candidates: Array<number | string | null | undefined>) => {
		for (const value of candidates) {
			if (value === null || value === undefined || value === "") continue;
			const parsed = Number(value);
			if (!Number.isNaN(parsed)) return parsed;
		}
		return 0;
	};

	const discountAmount = resolveNumber(
		clientTotals?.discountAmount,
		storedTotalsUsable ? storedTotals?.discountAmount : null,
		checkoutTotalsUsable ? checkoutTotals?.discountAmount : null,
		(order as any)?.discountAmount,
		(order as any)?.discount_amount,
	);
	const shippingFee = resolveNumber(
		clientTotals?.shippingFee,
		storedTotalsUsable ? storedTotals?.shippingFee : null,
		checkoutTotalsUsable ? checkoutTotals?.shippingFee : null,
		(order as any)?.shippingFee,
		(order as any)?.shipping_fee,
	);
	const computedTotal = subtotal - discountAmount + shippingFee;
	const total = resolveNumber(
		clientTotals?.total,
		storedTotalsUsable ? storedTotals?.total : null,
		checkoutTotalsUsable ? checkoutTotals?.total : null,
		order.totalAmount,
		computedTotal,
	);
	const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "";
	const shouldDeriveTotals = discountAmount === 0 && shippingFee === 0;
	const derivedDiscount = shouldDeriveTotals && total < subtotal ? subtotal - total : 0;
	const derivedShipping = shouldDeriveTotals && total > subtotal ? total - subtotal : 0;
	const displayShipping = shippingFee || derivedShipping;
	const impliedDiscount = subtotal + displayShipping - total;
	const displayDiscount = impliedDiscount > 0 ? impliedDiscount : discountAmount || derivedDiscount;

	const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

	const parseShippingDetails = (address: string) => {
		if (!address) return { name: "", phone: "", address: "" };
		const match = address.match(/^\s*([^,-]+?)\s*-\s*([0-9][0-9\s]{7,14})\s*,\s*(.+)$/);
		if (!match) return { name: "", phone: "", address };
		const rawPhone = match[2].replace(/\s+/g, "");
		return { name: match[1].trim(), phone: rawPhone, address: match[3].trim() };
	};

	const parsedShipping = parseShippingDetails(order.shippingAddress || "");
	const customerName = order.user?.name || parsedShipping.name || "Khách hàng";
	const customerPhone = order.user?.phone || parsedShipping.phone || "Không có";
	const shippingAddress = parsedShipping.address || order.shippingAddress || "Không có";

	const maxRows = 10;
	const rows = Array.from({ length: Math.max(maxRows, items.length) });

	return (
		<main className="min-h-screen bg-neutral-100 py-10">
			<Container>
				<div className="max-w-5xl mx-auto">
					<div
						className="bg-white border border-neutral-400 shadow-sm rounded-lg p-8"
						style={{ fontFamily: "Times New Roman, serif" }}
					>
						<div className="flex items-start justify-between">
							<div>
								<h1 className="text-xl font-bold uppercase">TÊN CỬA HÀNG</h1>
								<div className="mt-2 space-y-1 text-sm">
									<div className="flex items-end gap-2">
										<span className="whitespace-nowrap">Địa chỉ: 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội</span>
										{/*<span className="flex-1 border-b border-dotted border-neutral-500"></span>*/}
									</div>
									<div className="flex items-end gap-2">
										<span className="whitespace-nowrap">ĐT: 0368895036</span>
										{/*<span className="flex-1 border-b border-dotted border-neutral-500"></span>*/}
									</div>
								</div>
							</div>
							<div className="text-right">
								<h2 className="text-2xl font-bold uppercase">HÓA ĐƠN BÁN HÀNG</h2>
								<p className="text-sm mt-2">Mặt hàng bán (Hoặc ngành nghề kinh doanh)</p>
							</div>
						</div>

						<div className="mt-6 space-y-1 text-sm">
							<p>
								Tên khách hàng: <span className="font-medium">{customerName}</span>
							</p>
							<p>
								Địa chỉ: <span className="font-medium">{shippingAddress}</span>
							</p>
							<p>
								Điện thoại: <span className="font-medium">{customerPhone}</span>
							</p>
						</div>

						<div className="mt-6 overflow-x-auto">
							<table className="w-full text-sm border border-neutral-500">
								<thead>
									<tr className="text-center uppercase">
										<th className="border border-neutral-500 py-2 px-2 w-16">STT</th>
										<th className="border border-neutral-500 py-2 px-2">TÊN HÀNG</th>
										<th className="border border-neutral-500 py-2 px-2 w-36">SỐ LƯỢNG</th>
										<th className="border border-neutral-500 py-2 px-2 w-36">ĐƠN GIÁ</th>
										<th className="border border-neutral-500 py-2 px-2 w-40">THÀNH TIỀN</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((_, index) => {
										const item = items[index];
										const price = item ? Number(item.price || item.variant?.price || 0) : 0;
										const quantity = item ? Number(item.quantity || 0) : 0;
										return (
											<tr key={item?.id || index} className="text-center">
												<td className="border border-neutral-500 py-2 px-2">{index + 1}</td>
												<td className="border border-neutral-500 py-2 px-2 text-left">
													{item ? item.variant?.product?.name || "Sản phẩm" : ""}
												</td>
												<td className="border border-neutral-500 py-2 px-2">{item ? quantity : ""}</td>
												<td className="border border-neutral-500 py-2 px-2">{item ? formatCurrency(price) : ""}</td>
												<td className="border border-neutral-500 py-2 px-2">
													{item ? formatCurrency(price * quantity) : ""}
												</td>
											</tr>
										);
									})}
									<tr className="text-center font-semibold uppercase">
										<td className="border border-neutral-500 py-2 px-2"></td>
										<td className="border border-neutral-500 py-2 px-2">CỘNG</td>
										<td className="border border-neutral-500 py-2 px-2"></td>
										<td className="border border-neutral-500 py-2 px-2"></td>
										<td className="border border-neutral-500 py-2 px-2">{formatCurrency(subtotal)}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="mt-6 space-y-2 text-sm">
							<div className="flex justify-between">
								<span>Giảm giá</span>
								<span>{formatCurrency(displayDiscount)}</span>
							</div>
							<div className="flex justify-between">
								<span>Phí vận chuyển</span>
								<span>{formatCurrency(displayShipping)}</span>
							</div>
							<div className="flex items-end gap-2">
								<span className="whitespace-nowrap font-semibold">Thành tiền:</span>
								<span className="flex-1 border-b border-dotted border-neutral-500"></span>
								<span className="font-semibold">{formatCurrency(total)}</span>
							</div>
						</div>

						{orderDate ? (
							<div className="mt-6 text-sm">
								Ngày đặt: <span className="font-medium">{orderDate}</span>
							</div>
						) : null}
					</div>

					<div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
						<a href="/orders" className="btn-secondary px-6 py-3">Xem đơn hàng</a>
						<a href="/shop" className="btn-primary px-6 py-3">Tiếp tục mua sắm</a>
					</div>
				</div>
			</Container>
		</main>
	);
}
