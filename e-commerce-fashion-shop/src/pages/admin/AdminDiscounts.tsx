import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from "../../api/admin/discountsApi";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminDiscounts() {
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discountPercent: "",
        startDate: "",
        endDate: "",
        usageLimit: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getDiscounts();
            setDiscounts(data);
        } catch (err) {
            console.error("Tải mã giảm giá thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            if (editingDiscount) {
                await updateDiscount(token, editingDiscount.id, {
                    description: formData.description,
                    discountPercent: parseFloat(formData.discountPercent),
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    usageLimit: parseInt(formData.usageLimit),
                });
            } else {
                await createDiscount(token, {
                    code: formData.code,
                    description: formData.description,
                    discountPercent: parseFloat(formData.discountPercent),
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    usageLimit: parseInt(formData.usageLimit),
                });
            }

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const handleEdit = (discount: any) => {
        setEditingDiscount(discount);
        setFormData({
            code: discount.code,
            description: discount.description,
            discountPercent: discount.discountPercent,
            startDate: discount.startDate,
            endDate: discount.endDate,
            usageLimit: discount.usageLimit.toString(),
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await deleteDiscount(token, id);
            loadData();
            toast("Đã xóa thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const resetForm = () => {
        setFormData({
            code: "",
            description: "",
            discountPercent: "",
            startDate: "",
            endDate: "",
            usageLimit: "",
        });
        setEditingDiscount(null);
    };

    return (
        <AdminLayout>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Quản lý mã giảm giá</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Thêm mã giảm giá
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
                                    <th className="px-6 py-3 text-left">Mã</th>
                                    <th className="px-6 py-3 text-left">Mô tả</th>
                                    <th className="px-6 py-3 text-left">Giảm giá</th>
                                    <th className="px-6 py-3 text-left">Đã dùng</th>
                                    <th className="px-6 py-3 text-left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discounts.map((discount) => (
                                    <tr key={discount.id} className="border-t">
                                        <td className="px-6 py-4">{discount.id}</td>
                                        <td className="px-6 py-4 font-medium">{discount.code}</td>
                                        <td className="px-6 py-4">{discount.description}</td>
                                        <td className="px-6 py-4">{discount.discountPercent}%</td>
                                        <td className="px-6 py-4">
                                            {discount.usedCount} / {discount.usageLimit}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(discount)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(discount.id)}
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

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md border border-neutral-200 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingDiscount ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Mã giảm giá"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required={!editingDiscount}
                                    disabled={!!editingDiscount}
                                />
                                <textarea
                                    placeholder="Mô tả"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Phần trăm giảm giá"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.discountPercent}
                                    onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    placeholder="Ngày bắt đầu"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    placeholder="Ngày kết thúc"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Giới hạn sử dụng"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                    required
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        {editingDiscount ? "Cập nhật" : "Tạo mới"}
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

