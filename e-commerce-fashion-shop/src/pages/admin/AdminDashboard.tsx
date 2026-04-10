import { useEffect, useState } from "react";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";

import { getProfile } from "../../api/authApi";
import { getOrders } from "../../api/admin/ordersApi";
import { getUsers } from "../../api/admin/usersApi";
import { getProducts } from "../../api/productsApi";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        const loadStats = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const profile = await getProfile(token);
                setUserRole(profile.role);

                const [productsRes, ordersRes, usersRes] = await Promise.all([
                    getProducts({ page: 1, limit: 1 }),
                    getOrders(token, { page: 1, limit: 1 }),
                    getUsers(token, { page: 1, limit: 1 }),
                ]);

                const totalRevenue = ordersRes.data.reduce((sum, order) => {
                    return sum + parseFloat(order.totalAmount);
                }, 0);

                setStats({
                    totalProducts: productsRes.total,
                    totalOrders: ordersRes.total,
                    totalRevenue,
                    totalUsers: usersRes.total,
                });
            } catch (err) {
                console.error("Tải số liệu thất bại:", err);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const statCards = [
        { icon: Package, label: "Tổng sản phẩm", value: stats.totalProducts },
        { icon: ShoppingCart, label: "Tổng đơn hàng", value: stats.totalOrders },
        ...(userRole === "admin" ? [{ icon: DollarSign, label: "Doanh thu", value: `${stats.totalRevenue.toLocaleString()} đ` }] : []),
        { icon: Users, label: "Người dùng", value: stats.totalUsers },
    ];

    return (
        <AdminLayout>
            <div>
                <h1 className="text-3xl font-bold mb-8">Bảng điều khiển</h1>

                {loading ? (
                    <div className="text-center py-12">Đang tải...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="bg-white p-6 rounded-lg shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-neutral-600 text-sm">{stat.label}</p>
                                            <p className="text-2xl font-bold mt-2">{stat.value}</p>
                                        </div>
                                        <Icon className="text-blue-600" size={32} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
