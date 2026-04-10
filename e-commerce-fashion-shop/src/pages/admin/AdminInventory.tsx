import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getInventory, updateInventory } from "../../api/admin/inventoryApi";
import { Edit } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminInventory() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        quantity: "",
        location: "",
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
            const inventoryRes = await getInventory(token, { page, limit: 10 });
            setInventory(inventoryRes.data);
            setTotal(inventoryRes.total);
        } catch (err) {
            console.error("Tải dữ liệu thất bại:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await updateInventory(token, {
                id: editingItem.id,
                quantity: parseInt(formData.quantity),
                location: formData.location,
            });

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            quantity: item.quantity.toString(),
            location: item.location,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            quantity: "",
            location: "",
        });
        setEditingItem(null);
    };

    return (
        <AdminLayout>
            <div>
                <h1 className="text-3xl font-bold mb-6">Quản lý kho</h1>

                {loading ? (
                    <div className="text-center py-12">Đang tải...</div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left">ID</th>
                                        <th className="px-6 py-3 text-left">Sản phẩm</th>
                                        <th className="px-6 py-3 text-left">Mã SKU</th>
                                        <th className="px-6 py-3 text-left">Số lượng</th>
                                        <th className="px-6 py-3 text-left">Vị trí</th>
                                        <th className="px-6 py-3 text-left">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((item) => (
                                        <tr key={item.id} className="border-t">
                                            <td className="px-6 py-4">{item.id}</td>
                                            <td className="px-6 py-4">{item.product?.name || "Không có"}</td>
                                            <td className="px-6 py-4">{item.variant?.sku || "Không có"}</td>
                                            <td className="px-6 py-4">
                                                <span className={item.quantity < 10 ? "text-red-600 font-semibold" : ""}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{item.location}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleEdit(item)}
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
                            <h2 className="text-2xl font-bold mb-4">Cập nhật kho</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="number"
                                    placeholder="Số lượng"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Vị trí kho"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
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

