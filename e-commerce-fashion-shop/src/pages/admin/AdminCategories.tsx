import { useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";

import { createCategory, deleteCategory, updateCategory } from "../../api/admin/categoriesApi";
import { getCategories } from "../../api/categoriesApi";
import type { Category } from "../../types/category";
import AdminLayout from "./AdminLayout";
import { toast } from "../../utils/toast";

export default function AdminCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        parentId: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getCategories({ page: 1, limit: 100 });
            setCategories(data.data);
        } catch (err) {
            console.error("Tải danh mục thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                parentId: formData.parentId ? parseInt(formData.parentId) : null,
            };

            if (editingCategory) {
                await updateCategory(token, { id: editingCategory.id, ...payload });
            } else {
                await createCategory(token, payload);
            }

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description,
            parentId: category.parent?.id?.toString() || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await deleteCategory(token, id);
            loadData();
            toast("Đã xóa thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            parentId: "",
        });
        setEditingCategory(null);
    };

    const getParentName = (category: Category) => {
        return category.parent ? category.parent.name : "Không có";
    };

    return (
        <AdminLayout>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Thêm danh mục
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
                                    <th className="px-6 py-3 text-left">Tên</th>
                                    <th className="px-6 py-3 text-left">Mô tả</th>
                                    <th className="px-6 py-3 text-left">Danh mục cha</th>
                                    <th className="px-6 py-3 text-left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id} className="border-t">
                                        <td className="px-6 py-4">{category.id}</td>
                                        <td className="px-6 py-4 font-medium">{category.name}</td>
                                        <td className="px-6 py-4">{category.description}</td>
                                        <td className="px-6 py-4">{getParentName(category)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
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
                                {editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Tên danh mục"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <textarea
                                    placeholder="Mô tả"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                >
                                    <option value="">Không có danh mục cha</option>
                                    {categories
                                        .filter((cat) => !cat.parent)
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        {editingCategory ? "Cập nhật" : "Tạo mới"}
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
