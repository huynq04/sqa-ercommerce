import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getUsers, updateUser, deleteUser, createStaffUser } from "../../api/admin/usersApi";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminStaffUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        role: "staff",
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
            const data = await getUsers(token, { page, limit: 10, sort: "id,-createdAt", role: "staff" });
            setUsers(data.data);
            setTotal(data.total);
        } catch (err) {
            console.error("Tải danh sách nhân viên thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            if (editingUser) {
                const payload: any = {
                    id: editingUser.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    role: "staff",
                };
                if (formData.password) {
                    payload.password = formData.password;
                }
                await updateUser(token, payload);
            } else {
                await createStaffUser(token, {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    address: formData.address,
                });
            }

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thanh cong!");
        } catch (err: any) {
            toast(err.message || "Co loi xay ra!");
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address || "",
            password: "",
            role: "staff",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xóa nhân viên này?")) return;

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
            password: "",
            role: "staff",
        });
        setEditingUser(null);
    };

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Quản lý nhân viên</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Thêm nhân viên
                    </button>
                </div>

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
                                        <th className="px-6 py-3 text-left">Email</th>
                                        <th className="px-6 py-3 text-left">Số điện thoại</th>
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

                {showModal && (
                    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md border border-neutral-200 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingUser ? "Sửa nhân viên" : "Thêm nhân viên"}
                            </h2>
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
                                    placeholder="Email"
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
                                {!editingUser && (
                                    <input
                                        type="password"
                                        placeholder="Mat khau"
                                        className="w-full border px-3 py-2 rounded"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        {editingUser ? "Cap nhat" : "Tao moi"}
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
