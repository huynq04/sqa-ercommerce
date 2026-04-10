import { useEffect, useMemo, useState } from "react";
import Container from "../components/Container";
import { getAllDiscounts, type Discount } from "../api/discountsApi";

type DiscountStatus = "active" | "upcoming" | "expired";

const formatDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString("vi-VN");
};

const getStatus = (discount: Discount): DiscountStatus => {
	const now = new Date();
	const start = new Date(discount.startDate);
	const end = new Date(discount.endDate);
	if (start > now) return "upcoming";
	if (end < now) return "expired";
	return "active";
};

const statusStyle: Record<DiscountStatus, string> = {
	active: "bg-emerald-100 text-emerald-700 border-emerald-200",
	upcoming: "bg-amber-100 text-amber-700 border-amber-200",
	expired: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const statusLabel: Record<DiscountStatus, string> = {
	active: "Đang hiệu lực",
	upcoming: "Sắp bắt đầu",
	expired: "Đã hết hạn",
};

export default function VouchersPage() {
	const [discounts, setDiscounts] = useState<Discount[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getAllDiscounts()
			.then((data) => setDiscounts(data))
			.catch((err: Error) => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	const summary = useMemo(() => {
		const active = discounts.filter((item) => getStatus(item) === "active").length;
		return { active, total: discounts.length };
	}, [discounts]);

	if (loading) {
		return <div className="py-20 text-center">Đang tải voucher...</div>;
	}

	if (error) {
		return (
			<main className="py-12">
				<Container>
					<div className="card p-6 text-center">
						<h1 className="heading-3 mb-2">Voucher của tôi</h1>
						<p className="text-neutral-600">{error}</p>
					</div>
				</Container>
			</main>
		);
	}

	return (
		<main className="py-12">
			<Container>
				<div className="flex flex-col gap-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h1 className="heading-3 mb-2">Voucher của tôi</h1>
							<p className="body-text">
								Tổng {summary.total} voucher, {summary.active} voucher đang hiệu lực.
							</p>
						</div>
					</div>

					{discounts.length === 0 ? (
						<div className="card p-6 text-center text-neutral-600">
							Chưa có voucher nào.
						</div>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{discounts.map((discount) => {
								const status = getStatus(discount);
								const remaining =
									discount.usageLimit > 0
										? Math.max(discount.usageLimit - discount.usedCount, 0)
										: null;
								return (
									<div key={discount.id} className="card p-6 flex flex-col gap-4">
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-xs uppercase tracking-wide text-neutral-500">
													Mã giảm giá
												</p>
												<p className="text-lg font-semibold text-neutral-900">
													{discount.code}
												</p>
											</div>
											<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[status]}`}>
												{statusLabel[status]}
											</span>
										</div>

										<div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
											<p className="text-sm text-neutral-600">Giảm giá</p>
											<p className="text-2xl font-semibold text-neutral-900">
												{Number(discount.discountPercent).toFixed(0)}%
											</p>
										</div>

										{discount.description && (
											<p className="text-sm text-neutral-600">{discount.description}</p>
										)}

										<div className="text-sm text-neutral-600">
											<p>Hiệu lực: {formatDate(discount.startDate)} - {formatDate(discount.endDate)}</p>
											{remaining !== null && (
												<p>Lượt dùng còn lại: {remaining}</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</Container>
		</main>
	);
}
