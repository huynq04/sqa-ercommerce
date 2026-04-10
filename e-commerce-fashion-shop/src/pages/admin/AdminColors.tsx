import { useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";

import { createColor, deleteColor, getColors, updateColor } from "../../api/admin/colorsApi";
import AdminLayout from "./AdminLayout";
import { toast } from "../../utils/toast";

export default function AdminColors() {
    const [colors, setColors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingColor, setEditingColor] = useState<any | null>(null);
    const [colorName, setColorName] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const data = await getColors(token);
            setColors(data);
        } catch (err) {
            console.error("Tải danh sách màu thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            if (editingColor) {
                await updateColor(token, { id: editingColor.id, color: colorName });
            } else {
                await createColor(token, { color: colorName });
            }

            setShowModal(false);
            setColorName("");
            setEditingColor(null);
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const handleEdit = (color: any) => {
        setEditingColor(color);
        setColorName(color.color);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xóa màu này?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await deleteColor(token, id);
            loadData();
            toast("Đã xóa thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    return (
        <AdminLayout>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Quản lý màu sắc</h1>
                    <button
                        onClick={() => {
                            setColorName("");
                            setEditingColor(null);
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Thêm màu
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">Đang tải...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-neutral-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">ID</th>
                                    <th className="px-6 py-3 text-left">Tên màu</th>
                                    <th className="px-6 py-3 text-left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {colors.map((color) => (
                                    <tr key={color.id} className="border-t">
                                        <td className="px-6 py-4">{color.id}</td>
                                        <td className="px-6 py-4">{color.color}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(color)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(color.id)}
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
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md border border-neutral-200 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingColor ? "Sửa màu" : "Thêm màu"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Tên màu"
                                    className="w-full border px-3 py-2 rounded"
                                    value={colorName}
                                    onChange={(e) => setColorName(e.target.value)}
                                    required
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        {editingColor ? "Cập nhật" : "Tạo mới"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setColorName("");
                                            setEditingColor(null);
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
