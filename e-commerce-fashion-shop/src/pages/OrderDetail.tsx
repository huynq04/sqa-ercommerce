import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserOrder } from "../api/ordersApi";
import type { Order } from "../api/ordersApi";
import Container from "../components/Container";
import { Package, CreditCard, Truck, ArrowLeft } from "lucide-react";

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await getUserOrder(token, parseInt(id!));
            setOrder(data);
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
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            unpaid: { label: "Chưa thanh toán", className: "bg-orange-100 text-orange-800 border-orange-200" },
            paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800 border-green-200" },
            failed: { label: "Thanh toán thất bại", className: "bg-red-100 text-red-800 border-red-200" },
            refunded: { label: "Đã hoàn tiền", className: "bg-neutral-100 text-neutral-800 border-neutral-200" },
        };

        const config = statusConfig[status] || { label: status, className: "bg-neutral-100 text-neutral-800 border-neutral-200" };
        return (
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const getShipmentStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            not_shipped: { label: "Chưa giao", className: "bg-neutral-100 text-neutral-800 border-neutral-200" },
            shipped: { label: "Đang giao", className: "bg-blue-100 text-blue-800 border-blue-200" },
            delivered: { label: "Đã giao", className: "bg-green-100 text-green-800 border-green-200" },
            cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200" },
        };

        const config = statusConfig[status] || { label: status, className: "bg-neutral-100 text-neutral-800 border-neutral-200" };
        return (
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${config.className}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <main className="py-12 min-h-screen bg-neutral-50">
                <Container>
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
                        <p className="mt-4 text-neutral-600">Đang tải chi tiết đơn hàng...</p>
                    </div>
                </Container>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="py-12 min-h-screen bg-neutral-50">
                <Container>
                    <div className="text-center py-20">
                        <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Không tìm thấy đơn hàng</h2>
                        <p className="text-neutral-600 mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền xem.</p>
                        <Link to="/orders" className="btn-primary inline-block">
                            Về danh sách đơn
                        </Link>
                    </div>
                </Container>
            </main>
        );
    }

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <main className="py-12 min-h-screen bg-neutral-50">
            <Container>
                <Link
                    to="/orders"
                    className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Về danh sách đơn</span>
                </Link>

                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Đơn hàng #{order.id}</h1>
                            <p className="text-neutral-600">
                                Đặt ngày {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                        {getStatusBadge(order.orderStatus)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Sản phẩm đã đặt</h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                                    >
                                        <img
                                            src={item.variant.imageUrl || item.variant.product.mainImageUrl}
                                            alt={item.variant.product.name}
                                            className="h-24 w-24 rounded-lg object-cover border border-neutral-200"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-neutral-900 mb-1">
                                                {item.variant.product.name}
                                            </h3>
                                            <p className="text-sm text-neutral-600 mb-2">
                                                {item.variant.product.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-neutral-600">
                                                <span>SKU: {item.variant.sku}</span>
                                                <span>Số lượng: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-neutral-900">
                                                {parseFloat(item.price).toLocaleString("vi-VN")}₫
                                            </p>
                                            <p className="text-sm text-neutral-600 mt-1">
                                                Tổng: {(parseFloat(item.price) * item.quantity).toLocaleString("vi-VN")}₫
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Truck className="h-5 w-5 text-neutral-600" />
                                <h2 className="text-xl font-semibold text-neutral-900">Thông tin giao hàng</h2>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-neutral-600">Địa chỉ giao hàng:</span>
                                    <p className="font-medium text-neutral-900 mt-1">{order.shippingAddress}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-neutral-600">Trạng thái giao hàng:</span>
                                    <div className="mt-1">{getShipmentStatusBadge(order.shipmentStatus)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Tóm tắt đơn hàng</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-600">Số lượng:</span>
                                    <span className="font-medium text-neutral-900">{totalItems} sản phẩm</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-600">Tạm tính:</span>
                                    <span className="font-medium text-neutral-900">
                                        {parseFloat(order.totalAmount).toLocaleString("vi-VN")}₫
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-600">Vận chuyển:</span>
                                    <span className="font-medium text-neutral-900">Miễn phí</span>
                                </div>
                                <div className="border-t border-neutral-200 pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-neutral-900">Tổng cộng:</span>
                                        <span className="text-xl font-bold text-neutral-900">
                                            {parseFloat(order.totalAmount).toLocaleString("vi-VN")}₫
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="h-5 w-5 text-neutral-600" />
                            <h2 className="text-xl font-semibold text-neutral-900">Thanh toán</h2>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-neutral-600">Phương thức:</span>
                                    <p className="font-medium text-neutral-900 mt-1">
                                        {order.paymentMethod === "vnpay" ? "VNPay" : "Thanh toán khi nhận hàng"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-neutral-600">Trạng thái:</span>
                                    <div className="mt-1">{getPaymentStatusBadge(order.paymentStatus)}</div>
                                </div>
                                {order.vnpTxnRef && (
                                    <div>
                                        <span className="text-sm text-neutral-600">Mã giao dịch:</span>
                                        <p className="font-medium text-neutral-900 mt-1">{order.vnpTxnRef}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
