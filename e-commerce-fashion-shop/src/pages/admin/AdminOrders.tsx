import { useEffect, useState } from "react";

import { getOrders, type Order } from "../../api/admin/ordersApi";
import AdminLayout from "./AdminLayout";

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const data = await getOrders(token, { page, limit: 10, sort: "id,-createdAt" });
            setOrders(data.data);
            setTotal(data.total);
        } catch (err) {
            console.error("Tải đơn hàng thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const statusLabel: Record<string, string> = {
        pending: "Đang xử lý",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return (
            <span className={`px-2 py-1 rounded text-sm ${colors[status] || "bg-neutral-100 text-neutral-800"}`}>
                {statusLabel[status] || status}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div>
                <h1 className="text-3xl font-bold mb-6">Quản lý đơn hàng</h1>

                {loading ? (
                    <div className="text-center py-12">Đang tải...</div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left">ID</th>
                                        <th className="px-6 py-3 text-left">Khách hàng</th>
                                        <th className="px-6 py-3 text-left">Tổng tiền</th>
                                        <th className="px-6 py-3 text-left">Trạng thái</th>
                                        <th className="px-6 py-3 text-left">Thanh toán</th>
                                        <th className="px-6 py-3 text-left">Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-t">
                                            <td className="px-6 py-4">{order.id}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium">{order.user.name}</div>
                                                    <div className="text-sm text-neutral-600">{order.user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {parseFloat(order.totalAmount).toLocaleString()} đ
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(order.orderStatus)}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm">{order.paymentMethod}</div>
                                                    <div className="text-sm text-neutral-600">{order.paymentStatus}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(order.createdAt).toLocaleDateString("vi-VN")}
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
            </div>
        </AdminLayout>
    );
}
