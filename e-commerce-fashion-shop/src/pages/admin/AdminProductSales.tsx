import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { TrendingUp } from "lucide-react";
import { getProductSales, type BestSellingProduct } from "../../api/admin/analyticsApi";

const initialRange = { startDate: "", endDate: "" };

export default function AdminProductSales() {
    const [products, setProducts] = useState<BestSellingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(initialRange);
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
    const [page, setPage] = useState(1);
    const pageSize = 8;

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        setLoading(true);
        try {
            const data = await getProductSales(token, {
                ...(dateRange.startDate && { startDate: dateRange.startDate }),
                ...(dateRange.endDate && { endDate: dateRange.endDate }),
            });
            setProducts(data);
            setPage(1);
        } catch (err) {
            console.error("Tải danh sách sản phẩm thất bại:", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        loadData();
    };

    const sortedProducts = [...products].sort((a, b) => {
        const primary = a.totalSold - b.totalSold;
        if (primary !== 0) return sortOrder === "asc" ? primary : -primary;
        const secondary = a.revenue - b.revenue;
        if (secondary !== 0) return sortOrder === "asc" ? secondary : -secondary;
        return String(a.name).localeCompare(String(b.name));
    });
    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
    const displayPage = Math.min(page, totalPages);
    const pageStart = (displayPage - 1) * pageSize;
    const pagedProducts = sortedProducts.slice(pageStart, pageStart + pageSize);

    return (
        <AdminLayout>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Sản phẩm</h1>
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
                        <button
                            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                            className="border px-4 py-2 rounded hover:bg-neutral-100"
                        >
                            Sắp xếp: {sortOrder === "desc" ? "Giảm dần" : "Tăng dần"}
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
                                    <th className="px-6 py-3 text-left">Hàng</th>
                                    <th className="px-6 py-3 text-left">Sản phẩm</th>
                                    <th className="px-6 py-3 text-left">Hình ảnh</th>
                                    <th className="px-6 py-3 text-left">Số lượng bán</th>
                                    <th className="px-6 py-3 text-left">Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedProducts.map((product, index) => (
                                    <tr key={product.productId} className="border-t">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-blue-600">#{pageStart + index + 1}</span>
                                                {pageStart + index < 3 && <TrendingUp className="text-green-600" size={20} />}
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
                                                {product.revenue.toLocaleString()}d
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t">
                                <span className="text-sm text-neutral-600">
                                    Trang {displayPage} / {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        className="btn-secondary px-4 py-2"
                                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                        disabled={displayPage === 1}
                                    >
                                        Trước
                                    </button>
                                    <button
                                        className="btn-secondary px-4 py-2"
                                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={displayPage >= totalPages}
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
