import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Package,
    Tag,
    FolderTree,
    Users,
    TrendingUp,
    DollarSign,
    LogOut,
    Truck,
    MessageSquare,
    RefreshCw,
} from "lucide-react";
import { getProfile } from "../../api/authApi";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        const loadUserRole = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const profile = await getProfile(token);
                setUserRole(profile.role);
            } catch (err) {
                console.error("Tải hồ sơ người dùng thất bại:", err);
                navigate("/login");
            }
        };

        loadUserRole();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    // Menu items for Staff
    const staffMenuItems = [
        { path: "/staff/categories", icon: FolderTree, label: "Danh mục" },
        { path: "/staff/products", icon: Package, label: "Sản phẩm" },
        { path: "/staff/discounts", icon: Tag, label: "Khuyến mãi" },
        { path: "/staff/users", icon: Users, label: "Người dùng" },
    ];

    // Menu items for Admin (only analytics)
    const adminMenuItems = [
        { path: "/admin/product-sales", icon: Package, label: "Sản phẩm" },
        { path: "/admin/best-selling", icon: TrendingUp, label: "Bán chạy" },
        { path: "/admin/revenue", icon: DollarSign, label: "Doanh thu" },
        { path: "/admin/staff-users", icon: Users, label: "Nhân viên" },
    ];

    const isAdmin = userRole === "admin";
    const menuItems = isAdmin ? adminMenuItems : staffMenuItems;

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-neutral-900 text-white min-h-screen">
                <div className="p-6">
                    <h1 className="text-2xl font-bold">
                        {isAdmin ? "Bảng quản trị" : "Bảng nhân viên"}
                    </h1>
                    <p className="text-sm text-neutral-400 mt-1">
                        {isAdmin ? "Quản trị viên" : "Nhân viên"}
                    </p>
                </div>
                {!isAdmin && (
                    <div className="px-4 pb-2">
                        <p className="text-xs uppercase tracking-wide text-neutral-400 mb-3">Thao tác</p>
                        <Link
                            to="/staff/fulfillment?tab=shipping"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-neutral-800"
                        >
                            <Truck size={20} />
                            <span>Tạo đơn giao hàng</span>
                        </Link>
                        <Link
                            to="/staff/fulfillment?tab=reviews"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-neutral-800"
                        >
                            <MessageSquare size={20} />
                            <span>Quản lý bình luận</span>
                        </Link>
                        <Link
                            to="/staff/fulfillment?tab=returns"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-neutral-800"
                        >
                            <RefreshCw size={20} />
                            <span>Quản lý đổi hàng</span>
                        </Link>
                    </div>
                )}
                <nav className="px-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                                    isActive ? "bg-blue-600" : "hover:bg-neutral-800"
                                }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="px-4 mt-8 space-y-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-800 w-full text-left"
                    >
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                    </button>
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-white/20 hover:bg-neutral-800 transition-colors"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-neutral-50">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
