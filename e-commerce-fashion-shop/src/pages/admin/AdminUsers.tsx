import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getUsers, updateUser, deleteUser } from "../../api/admin/usersApi";
import { getProfile } from "../../api/authApi";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        role: "user",
        isVerified: false,
    });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        loadRole();
    }, []);

    useEffect(() => {
        loadData();
    }, [page]);

    const loadRole = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const profile = await getProfile(token);
            setUserRole(profile.role);
        } catch (err) {
            console.error("Tải hồ sơ người dùng thất bại:", err);
        }
    };

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const data = await getUsers(token, { page, limit: 10, sort: "id,-createdAt" });
            setUsers(data.data);
            setTotal(data.total);
        } catch (err) {
            console.error("Tải danh sách người dùng thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const payload: any = {
                id: editingUser.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                isVerified: formData.isVerified,
            };
            if (userRole === "admin") {
                payload.role = formData.role;
            }
            await updateUser(token, payload);

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address || "",
            role: userRole === "admin" ? user.role : "user",
            isVerified: user.isVerified,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await deleteUser(token, id);
            loadData();
            toast("Đã xóa thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            role: "user",
            isVerified: false,
        });
        setEditingUser(null);
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: "bg-purple-100 text-purple-800",
            staff: "bg-blue-100 text-blue-800",
            user: "bg-neutral-100 text-neutral-800",
        };
        const labels: Record<string, string> = {
            admin: "Quản trị",
            staff: "Nhân viên",
            user: "Người dùng",
        };
        return (
            <span className={`px-2 py-1 rounded text-sm ${colors[role] || "bg-neutral-100 text-neutral-800"}`}>
                {labels[role] || role}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div>
                <h1 className="text-3xl font-bold mb-6">Quản lý người dùng</h1>

                {loading ? (
                    <div className="text-center py-12">Đang tải...</div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left">ID</th>
                                        <th className="px-6 py-3 text-left">Tên</th>
                                        <th className="px-6 py-3 text-left">Địa chỉ email</th>
                                        <th className="px-6 py-3 text-left">Số điện thoại</th>
                                        <th className="px-6 py-3 text-left">Vai trò</th>
                                        <th className="px-6 py-3 text-left">Xác thực</th>
                                        <th className="px-6 py-3 text-left">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t">
                                            <td className="px-6 py-4">{user.id}</td>
                                            <td className="px-6 py-4 font-medium">{user.name}</td>
                                            <td className="px-6 py-4">{user.email}</td>
                                            <td className="px-6 py-4">{user.phone}</td>
                                            <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                            <td className="px-6 py-4">
                                                {user.isVerified ? (
                                                    <span className="text-green-600">Đã xác thực</span>
                                                ) : (
                                                    <span className="text-red-600">Chưa xác thực</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
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
                            <h2 className="text-2xl font-bold mb-4">Sửa người dùng</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Tên"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Địa chỉ email"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Số điện thoại"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Địa chỉ"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                                {userRole === "admin" ? (
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                >
                                    <option value="user">Người dùng</option>
                                    <option value="staff">Nhân viên</option>
                                    <option value="admin">Quản trị</option>
                                </select>
                            ) : (
                                <div className="w-full border px-3 py-2 rounded bg-neutral-50 text-neutral-600 text-sm">
                                    Vai trò: Người dùng
                                </div>
                            )}
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isVerified}
                                        onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                                    />
                                    <span>Đã xác thực</span>
                                </label>
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

