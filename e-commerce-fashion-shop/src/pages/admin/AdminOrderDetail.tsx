import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { getOrder, updateOrder } from "../../api/admin/ordersApi";
import type { Order, UpdateOrderPayload } from "../../api/admin/ordersApi";
import { Edit, Save, X, Package, User, MapPin, CreditCard } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminOrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<UpdateOrderPayload>({
        orderStatus: undefined,
        paymentStatus: undefined,
        shipmentStatus: undefined,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const data = await getOrder(token, parseInt(id!));
            setOrder(data);
            setFormData({
                orderStatus: data.orderStatus as any,
                paymentStatus: data.paymentStatus as any,
                shipmentStatus: data.shipmentStatus as any,
            });
        } catch (err) {
            console.error("Tải đơn hàng thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        if (!token || !id) return;

        setSaving(true);
        try {
            const updated = await updateOrder(token, parseInt(id), formData);
            setOrder(updated);
            setEditing(false);
            toast("Cập nhật đơn hàng thành công!");
        } catch (err: any) {
            toast(err.message || "Đã xảy ra lỗi!");
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string, type: "order" | "payment" | "shipment") => {
        const statusConfig: Record<string, Record<string, { label: string; className: string }>> = {
            order: {
                pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
                processing: { label: "Đang xử lý", className: "bg-blue-100 text-blue-800 border-blue-200" },
                completed: { label: "Hoàn tất", className: "bg-green-100 text-green-800 border-green-200" },
                cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200" },
            },
            payment: {
                unpaid: { label: "Chưa thanh toán", className: "bg-orange-100 text-orange-800 border-orange-200" },
                paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800 border-green-200" },
                failed: { label: "Thất bại", className: "bg-red-100 text-red-800 border-red-200" },
                refunded: { label: "Đã hoàn tiền", className: "bg-neutral-100 text-neutral-800 border-neutral-200" },
            },
            shipment: {
                ready_to_pick: {
                    label: "Chưa giao hàng",
                    className: "bg-neutral-100 text-neutral-800 border-neutral-200",
                },

                picking: {
                    label: "Đang lấy hàng",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                cancel: {
                    label: "Đã hủy",
                    className: "bg-red-100 text-red-800 border-red-200",
                },

                money_collect_picking: {
                    label: "Đang lấy hàng (COD)",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                picked: {
                    label: "Đã lấy hàng",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                storing: {
                    label: "Đang lưu kho",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                transporting: {
                    label: "Đang vận chuyển",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                sorting: {
                    label: "Đang phân loại",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                delivering: {
                    label: "Đang giao",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                money_collect_delivering: {
                    label: "Đang giao (COD)",
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                },

                delivered: {
                    label: "Đã giao",
                    className: "bg-green-100 text-green-800 border-green-200",
                },

                delivery_fail: {
                    label: "Giao thất bại",
                    className: "bg-red-100 text-red-800 border-red-200",
                },

                waiting_to_return: {
                    label: "Chờ hoàn hàng",
                    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                },

                return: {
                    label: "Hoàn hàng",
                    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                },

                return_transporting: {
                    label: "Hoàn hàng (vận chuyển)",
                    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                },

                return_sorting: {
                    label: "Hoàn hàng (phân loại)",
                    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                },

                returning: {
                    label: "Đang hoàn hàng",
                    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                },

                return_fail: {
                    label: "Hoàn hàng thất bại",
                    className: "bg-red-100 text-red-800 border-red-200",
                },

                returned: {
                    label: "Đã hoàn hàng",
                    className: "bg-purple-100 text-purple-800 border-purple-200",
                },
            },

        };

        const config = statusConfig[type]?.[status] || { label: status, className: "bg-neutral-100 text-neutral-800 border-neutral-200" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
                    <p className="mt-4 text-neutral-600">Đang tải...</p>
                </div>
            </AdminLayout>
        );
    }

    if (!order) {
        return (
            <AdminLayout>
                <div className="text-center py-20">
                    <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Không tìm thấy đơn hàng</h2>
                    <button onClick={() => navigate("/admin/orders")} className="btn-primary mt-4">
                        Quay lại danh sách
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-6">
                <button
                    onClick={() => navigate("/admin/orders")}
                    className="text-neutral-600 hover:text-neutral-900 mb-4 inline-flex items-center gap-2"
                >
                    <X className="h-4 w-4" />
                    <span>Quay lại</span>
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Đơn #{order.id}</h1>
                        <p className="text-neutral-600">
                            Tạo lúc {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Chỉnh sửa
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    setFormData({
                                        orderStatus: order.orderStatus as any,
                                        paymentStatus: order.paymentStatus as any,
                                        shipmentStatus: order.shipmentStatus as any,
                                    });
                                }}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    )}
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
                                            <span>Mã SKU: {item.variant.sku}</span>
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

                    {/* Customer Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <User className="h-5 w-5 text-neutral-600" />
                            <h2 className="text-xl font-semibold text-neutral-900">Thông tin khách hàng</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-neutral-600">Tên:</span>
                                <p className="font-medium text-neutral-900 mt-1">{order.user.name}</p>
                            </div>
                            <div>
                                <span className="text-sm text-neutral-600">Địa chỉ email:</span>
                                <p className="font-medium text-neutral-900 mt-1">{order.user.email}</p>
                            </div>
                            <div>
                                <span className="text-sm text-neutral-600">Số điện thoại:</span>
                                <p className="font-medium text-neutral-900 mt-1">{order.user.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <MapPin className="h-5 w-5 text-neutral-600" />
                            <h2 className="text-xl font-semibold text-neutral-900">Thông tin giao hàng</h2>
                        </div>
                        <div>
                            <span className="text-sm text-neutral-600">Địa chỉ giao hàng:</span>
                            <p className="font-medium text-neutral-900 mt-1">{order.shippingAddress}</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Trạng thái đơn hàng</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Trạng thái đơn hàng
                                </label>
                                {editing ? (
                                    <select
                                        value={formData.orderStatus || ""}
                                        onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                    >
                                        <option value="pending">Đang chờ</option>
                                        <option value="processing">Đang xử lý</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                ) : (
                                    <div className="mt-1">{getStatusBadge(order.orderStatus, "order")}</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Trạng thái thanh toán
                                </label>
                                {editing ? (
                                    <select
                                        value={formData.paymentStatus || ""}
                                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                    >
                                        <option value="unpaid">Chưa thanh toán</option>
                                        <option value="paid">Đã thanh toán</option>
                                        <option value="failed">Thất bại</option>
                                        <option value="refunded">Đã hoàn tiền</option>
                                    </select>
                                ) : (
                                    <div className="mt-1">{getStatusBadge(order.paymentStatus, "payment")}</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Trạng thái vận chuyển
                                </label>
                                {editing ? (
                                    <select
                                        value={formData.shipmentStatus || ""}
                                        onChange={(e) => setFormData({ ...formData, shipmentStatus: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                    >
                                        <option value="not_shipped">Chưa giao hàng</option>
                                        <option value="shipped">Đang giao hàng</option>
                                        <option value="delivered">Đã giao hàng</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                ) : (
                                    <div className="mt-1">{getStatusBadge(order.shipmentStatus, "shipment")}</div>
                                )}
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
                            {order.vnpTxnRef && (
                                <div>
                                    <span className="text-sm text-neutral-600">Mã giao dịch:</span>
                                    <p className="font-medium text-neutral-900 mt-1">{order.vnpTxnRef}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Tóm tắt đơn hàng</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-600">Tổng tiền:</span>
                                <span className="font-semibold text-lg text-neutral-900">
                                    {parseFloat(order.totalAmount).toLocaleString("vi-VN")}₫
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

