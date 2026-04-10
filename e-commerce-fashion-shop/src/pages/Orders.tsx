import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserOrders } from "../api/ordersApi";
import type { Order } from "../api/ordersApi";
import Container from "../components/Container";
import { Package, Calendar, DollarSign, Eye } from "lucide-react";

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadOrders();
    }, [page]);

    const loadOrders = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await getUserOrders(token, {
                page,
                limit,
                sort: "id,-createdAt",
            });
            setOrders(data.data);
            setTotal(data.total);
        } catch (err) {
            console.error("Tải đơn hàng thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
            processing: { label: "Đang xử lý", className: "bg-blue-100 text-blue-800 border-blue-200" },
            completed: { label: "Hoàn tất", className: "bg-green-100 text-green-800 border-green-200" },
            cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200" },
        };

        const config = statusConfig[status] || { label: status, className: "bg-neutral-100 text-neutral-800 border-neutral-200" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            unpaid: { label: "Chưa thanh toán", className: "text-orange-600" },
            paid: { label: "Đã thanh toán", className: "text-green-600" },
            failed: { label: "Thất bại", className: "text-red-600" },
            refunded: { label: "Đã hoàn tiền", className: "text-neutral-600" },
        };

        const config = statusConfig[status] || { label: status, className: "text-neutral-600" };
        return <span className={`text-sm font-medium ${config.className}`}>{config.label}</span>;
    };

    if (loading) {
        return (
            <main className="py-12 min-h-screen bg-neutral-50">
                <Container>
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
                        <p className="mt-4 text-neutral-600">Đang tải đơn hàng...</p>
                    </div>
                </Container>
            </main>
        );
    }

    if (!localStorage.getItem("token")) {
        return (
            <main className="py-12 min-h-screen bg-neutral-50">
                <Container>
                    <div className="text-center py-20">
                        <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Vui lòng đăng nhập</h2>
                        <p className="text-neutral-600 mb-6">Bạn cần đăng nhập để xem đơn hàng</p>
                        <Link to="/login" className="btn-primary inline-block">
                            Đăng nhập
                        </Link>
                    </div>
                </Container>
            </main>
        );
    }

    return (
        <main className="py-12 min-h-screen bg-neutral-50">
            <Container>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Đơn hàng của tôi</h1>
                    <p className="text-neutral-600">Theo dõi và quản lý đơn hàng</p>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
                        <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Chưa có đơn hàng</h2>
                        <p className="text-neutral-600 mb-6">Bạn chưa có đơn hàng nào. Bắt đầu mua sắm ngay!</p>
                        <Link to="/shop" className="btn-primary inline-block">
                            Mua sắm ngay
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-neutral-600">
                                                <Package className="h-5 w-5" />
                                                <span className="font-semibold text-neutral-900">Đơn #{order.id}</span>
                                            </div>
                                            {getStatusBadge(order.orderStatus)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="font-semibold text-neutral-900">
                                                    {parseFloat(order.totalAmount).toLocaleString("vi-VN")}₫
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-neutral-100 pt-4 mb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-neutral-600">Phương thức thanh toán:</span>
                                                <p className="font-medium text-neutral-900 mt-1">
                                                    {order.paymentMethod === "vnpay" ? "VNPay" : "Thanh toán khi nhận hàng"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-neutral-600">Trạng thái thanh toán:</span>
                                                <p className="mt-1">{getPaymentStatusBadge(order.paymentStatus)}</p>
                                            </div>
                                            <div>
                                                <span className="text-neutral-600">Địa chỉ giao hàng:</span>
                                                <p className="font-medium text-neutral-900 mt-1">{order.shippingAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-neutral-100 pt-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-neutral-600 mb-2">Sản phẩm ({order.items.length})</p>
                                                <div className="flex gap-2">
                                                    {order.items.slice(0, 3).map((item) => (
                                                        <img
                                                            key={item.id}
                                                            src={item.variant.imageUrl || item.variant.product.mainImageUrl}
                                                            alt={item.variant.product.name}
                                                            className="h-12 w-12 rounded-lg object-cover border border-neutral-200"
                                                        />
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <div className="h-12 w-12 rounded-lg border border-neutral-200 bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600">
                                                            +{order.items.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Link
                                                to={`/orders/${order.id}`}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Xem chi tiết
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {total > limit && (
                    <div className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="text-sm text-neutral-600">
                            Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong tổng số {total} đơn hàng
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(total / limit)}
                                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </Container>
        </main>
    );
}
