import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { TrendingUp } from "lucide-react";
import { getBestSellingProducts, type BestSellingProduct } from "../../api/admin/analyticsApi";

const initialRange = { startDate: "", endDate: "" };

export default function AdminBestSelling() {
	const [products, setProducts] = useState<BestSellingProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [dateRange, setDateRange] = useState(initialRange);

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadData = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		setLoading(true);
		try {
			const data = await getBestSellingProducts(token, {
				limit: 20,
				...(dateRange.startDate && { startDate: dateRange.startDate }),
				...(dateRange.endDate && { endDate: dateRange.endDate }),
			});
			setProducts(data);
		} catch (err) {
			console.error("Tải danh sách bán chạy thất bại:", err);
			setProducts([]);
		} finally {
			setLoading(false);
		}
	};

	const handleFilter = () => {
		loadData();
	};

	return (
		<AdminLayout>
			<div>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold">Sản phẩm bán chạy</h1>
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
							onClick={handleFilter}
							className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
						>
							Lọc
						</button>
					</div>
				</div>

				{loading ? (
					<div className="text-center py-12">Đang tải...</div>
				) : products.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-8 text-center text-neutral-500">
						Không có dữ liệu trong khoảng thời gian đã chọn.
					</div>
				) : (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						<table className="w-full">
							<thead className="bg-neutral-100">
								<tr>
									<th className="px-6 py-3 text-left">Hạng</th>
									<th className="px-6 py-3 text-left">Sản phẩm</th>
									<th className="px-6 py-3 text-left">Hình ảnh</th>
									<th className="px-6 py-3 text-left">Số lượng bán</th>
									<th className="px-6 py-3 text-left">Doanh thu</th>
								</tr>
							</thead>
							<tbody>
								{products.map((product, index) => (
									<tr key={product.productId} className="border-t">
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
												{index < 3 && <TrendingUp className="text-green-600" size={20} />}
											</div>
										</td>
										<td className="px-6 py-4 font-medium">{product.name}</td>
										<td className="px-6 py-4">
											<img
												src={product.imageUrl}
												alt={product.name}
												className="w-16 h-16 object-cover rounded"
											/>
										</td>
										<td className="px-6 py-4">
											<span className="font-semibold text-blue-600">{product.totalSold}</span> sản phẩm
										</td>
										<td className="px-6 py-4">
											<span className="font-semibold text-green-600">
												{product.revenue.toLocaleString()}₫
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</AdminLayout>
	);
}
