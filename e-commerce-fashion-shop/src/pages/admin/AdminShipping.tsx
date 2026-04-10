import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getShippings, updateShipping } from "../../api/admin/shippingApi";
import { Edit } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminShipping() {
    const [shippings, setShippings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingShipping, setEditingShipping] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        trackingNumber: "",
        status: "",
        estimatedDelivery: "",
        actualDelivery: "",
    });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const data = await getShippings(token, { page, limit: 10, sort: "id,-createdAt" });
            setShippings(data.data);
            setTotal(data.total);
        } catch (err) {
            console.error("Tải danh sách giao hàng thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await updateShipping(token, {
                id: editingShipping.id,
                trackingNumber: formData.trackingNumber,
                status: formData.status,
                estimatedDelivery: formData.estimatedDelivery || undefined,
                actualDelivery: formData.actualDelivery || undefined,
            });

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const handleEdit = (shipping: any) => {
        setEditingShipping(shipping);
        setFormData({
            trackingNumber: shipping.trackingNumber || "",
            status: shipping.status,
            estimatedDelivery: shipping.estimatedDelivery ? shipping.estimatedDelivery.split("T")[0] : "",
            actualDelivery: shipping.actualDelivery ? shipping.actualDelivery.split("T")[0] : "",
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            trackingNumber: "",
            status: "",
            estimatedDelivery: "",
            actualDelivery: "",
        });
        setEditingShipping(null);
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            shipped: "bg-blue-100 text-blue-800",
            delivered: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };
        const labels: Record<string, string> = {
            pending: "Đang chờ",
            shipped: "Đã gửi",
            delivered: "Đã giao",
            cancelled: "Đã hủy",
        };
        return (
            <span className={`px-2 py-1 rounded text-sm ${colors[status] || "bg-neutral-100 text-neutral-800"}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div>
                <h1 className="text-3xl font-bold mb-6">Quản lý giao hàng</h1>

                {loading ? (
                    <div className="text-center py-12">Đang tải...</div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left">ID</th>
                                        <th className="px-6 py-3 text-left">Đơn hàng</th>
                                        <th className="px-6 py-3 text-left">Khách hàng</th>
                                        <th className="px-6 py-3 text-left">Địa chỉ</th>
                                        <th className="px-6 py-3 text-left">Mã vận đơn</th>
                                        <th className="px-6 py-3 text-left">Trạng thái</th>
                                        <th className="px-6 py-3 text-left">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shippings.map((shipping) => (
                                        <tr key={shipping.id} className="border-t">
                                            <td className="px-6 py-4">{shipping.id}</td>
                                            <td className="px-6 py-4">#{shipping.orderId}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium">{shipping.order?.user?.name}</div>
                                                    <div className="text-sm text-neutral-600">{shipping.order?.user?.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{shipping.shippingAddress}</td>
                                            <td className="px-6 py-4">{shipping.trackingNumber || "Chưa có"}</td>
                                            <td className="px-6 py-4">{getStatusBadge(shipping.status)}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleEdit(shipping)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                            <div className="text-neutral-600">
                                Trang {page} / {Math.ceil(total / 10)}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border rounded disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= Math.ceil(total / 10)}
                                    className="px-4 py-2 border rounded disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md border border-neutral-200 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-4">Cập nhật giao hàng</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Mã vận đơn"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.trackingNumber}
                                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                                />
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    required
                                >
                                    <option value="pending">Đang chờ</option>
                                    <option value="shipped">Đã gửi</option>
                                    <option value="delivered">Đã giao</option>
                                    <option value="cancelled">Đã hủy</option>
                                </select>
                                <input
                                    type="date"
                                    placeholder="Ngày dự kiến giao"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.estimatedDelivery}
                                    onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                                />
                                <input
                                    type="date"
                                    placeholder="Ngày giao thực tế"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.actualDelivery}
                                    onChange={(e) => setFormData({ ...formData, actualDelivery: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        Cập nhật
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 bg-neutral-200 text-neutral-800 py-2 rounded hover:bg-neutral-300"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

