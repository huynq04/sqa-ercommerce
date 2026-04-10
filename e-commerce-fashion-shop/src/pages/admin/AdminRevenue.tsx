import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import {
	getRevenueByMonth,
	getRevenueStats,
	type MonthlyRevenue,
	type RevenueStats,
} from "../../api/admin/analyticsApi";

const initialRange = { startDate: "", endDate: "" };

export default function AdminRevenue() {
	const [stats, setStats] = useState<RevenueStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [dateRange, setDateRange] = useState(initialRange);
	const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadData = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		setLoading(true);
		try {
			const params = {
				...(dateRange.startDate && { startDate: dateRange.startDate }),
				...(dateRange.endDate && { endDate: dateRange.endDate }),
			};
			const [data, monthly] = await Promise.all([
				getRevenueStats(token, params),
				getRevenueByMonth(token, params),
			]);
			setStats(data);
			setMonthlyRevenue(monthly);
		} catch (err) {
			console.error("Tải thống kê doanh thu thất bại:", err);
			setStats(null);
			setMonthlyRevenue([]);
		} finally {
			setLoading(false);
		}
	};

	const statCards = [
		{
			icon: DollarSign,
			label: "Tổng doanh thu",
			value: stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()}₫` : "0₫",
			color: "text-green-600",
		},
		{
			icon: ShoppingCart,
			label: "Tổng đơn hàng",
			value: stats?.totalOrders ?? 0,
			color: "text-blue-600",
		},
		{
			icon: TrendingUp,
			label: "Giá trị đơn trung bình",
			value: stats?.averageOrderValue ? `${stats.averageOrderValue.toLocaleString()}₫` : "0₫",
			color: "text-purple-600",
		},
		{
			icon: Package,
			label: "Sản phẩm đã bán",
			value: stats?.productsSold ?? 0,
			color: "text-orange-600",
		},
	];

	return (
		<AdminLayout>
			<div>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold">Thống kê doanh thu</h1>
					<div className="flex gap-2">
						<input
							type="date"
							className="border px-3 py-2 rounded"
							value={dateRange.startDate}
							onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
						/>
						<input
							type="date"
							className="border px-3 py-2 rounded"
							value={dateRange.endDate}
							onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
						/>
						<button
							onClick={loadData}
							className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
						>
							Lọc
						</button>
					</div>
				</div>

				{loading ? (
					<div className="text-center py-12">??ang t???i...</div>
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{statCards.map((stat, idx) => {
								const Icon = stat.icon;
								return (
									<div key={idx} className="bg-white p-6 rounded-lg shadow">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-neutral-600 text-sm">{stat.label}</p>
												<p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
											</div>
											<Icon className={stat.color} size={32} />
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-8 bg-white p-6 rounded-lg shadow">
							<h2 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h2>
							{monthlyRevenue.length === 0 ? (
								<p className="text-sm text-neutral-500">Không có dữ liệu.</p>
							) : (
								<MonthlyRevenueChart data={monthlyRevenue} />
							)}
						</div>
					</>
				)}
			</div>
		</AdminLayout>
	);
}


function MonthlyRevenueChart({ data }: { data: MonthlyRevenue[] }) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const width = 1000;
	const height = 260;
	const padding = 40;
	const maxRevenue = Math.max(...data.map((item) => item.revenue), 0);
	const usableWidth = width - padding * 2;
	const usableHeight = height - padding * 2;
	const pointCount = data.length;
	const xStep = pointCount > 1 ? usableWidth / (pointCount - 1) : 0;
	const yScale = usableHeight / (maxRevenue || 1);

	const points = data.map((item, index) => {
		const x = padding + index * xStep;
		const y = height - padding - item.revenue * yScale;
		return { x, y };
	});

	const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
	const yTicks = 4;
	const tooltipIndex = hoveredIndex ?? -1;
	const tooltipPoint = tooltipIndex >= 0 ? points[tooltipIndex] : null;
	const tooltipData = tooltipIndex >= 0 ? data[tooltipIndex] : null;
	const tooltipLabel =
		tooltipData ? `${tooltipData.month}: ${Math.round(tooltipData.revenue).toLocaleString()}` : "";
	const tooltipWidth = Math.max(90, tooltipLabel.length * 7);
	const tooltipX = tooltipPoint ? Math.min(Math.max(tooltipPoint.x - tooltipWidth / 2, 4), width - tooltipWidth - 4) : 0;
	const tooltipY = tooltipPoint ? Math.max(tooltipPoint.y - 38, 4) : 0;

	return (
		<div className="w-full">
			<svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
				<line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
				<line
					x1={padding}
					y1={height - padding}
					x2={width - padding}
					y2={height - padding}
					stroke="#e5e7eb"
				/>

				{Array.from({ length: yTicks + 1 }).map((_, idx) => {
					const value = maxRevenue * (1 - idx / yTicks);
					const y = padding + usableHeight * (idx / yTicks);
					return (
						<g key={`y-${idx}`}>
							<line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f3f4f6" />
							<text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
								{Math.round(value).toLocaleString()}
							</text>
						</g>
					);
				})}

				<polyline fill="none" stroke="#2563eb" strokeWidth="2" points={linePoints} />

				{points.map((point, index) => (
					<g key={`p-${index}`}>
						<circle
							cx={point.x}
							cy={point.y}
							r={8}
							fill="transparent"
							onMouseEnter={() => setHoveredIndex(index)}
							onMouseLeave={() => setHoveredIndex(null)}
						/>
						<circle cx={point.x} cy={point.y} r={3} fill="#2563eb" />
					</g>
				))}

				{tooltipPoint && tooltipData && (
					<g>
						<rect
							x={tooltipX}
							y={tooltipY}
							width={tooltipWidth}
							height={26}
							rx={6}
							fill="#111827"
							opacity={0.9}
						/>
						<text x={tooltipX + 8} y={tooltipY + 17} fontSize="11" fill="#f9fafb">
							{tooltipLabel}
						</text>
					</g>
				)}

				{data.map((item, index) => {
					const [year, month] = item.month.split("-");
					const label = `${month}/${year}`;
					const showLabel = pointCount <= 8 || index % 2 === 0;
					if (!showLabel) return null;
					const x = padding + index * xStep;
					return (
						<text
							key={`x-${item.month}`}
							x={x}
							y={height - padding + 16}
							textAnchor="middle"
							fontSize="10"
							fill="#6b7280"
						>
							{label}
						</text>
					);
				})}
			</svg>
		</div>
	);
}
