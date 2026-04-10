import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { getCategories } from "../../api/categoriesApi";
import { createProduct, deleteProduct, updateProduct } from "../../api/admin/productsApi";
import { uploadFile } from "../../api/uploadApi";
import { getProducts } from "../../api/productsApi";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import AdminLayout from "./AdminLayout";
import { toast } from "../../utils/toast";

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        discount: "",
        categoryId: "",
        mainImageUrl: "",
    });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const [productsRes, categoriesRes] = await Promise.all([
                getProducts({ page: 1, limit: 100 }),
                getCategories({ page: 1, limit: 100 }),
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
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
            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                discount: parseFloat(formData.discount),
                categoryId: parseInt(formData.categoryId),
                mainImageUrl: formData.mainImageUrl,
            };

            if (editingProduct) {
                await updateProduct(token, { id: editingProduct.id, ...payload });
            } else {
                await createProduct(token, payload);
            }

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Đã xảy ra lỗi!");
        }
    };

    const handleMainImageUpload = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        if (!mainImageFile) {
            toast("Vui long chon anh truoc khi upload.", "error");
            return;
        }
        setIsUploading(true);
        try {
            const { url } = await uploadFile(token, mainImageFile);
            setFormData((prev) => ({ ...prev, mainImageUrl: url }));
            setMainImageFile(null);
            toast("Upload ảnh thành công!", "success");
        } catch (err: any) {
            toast(err.message || "Upload ảnh thất bại.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            discount: product.discount,
            categoryId: product.categoryId.toString(),
            mainImageUrl: product.mainImageUrl || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await deleteProduct(token, id);
            loadData();
            toast("Đã xóa thành công!");
        } catch (err: any) {
            toast(err.message || "Đã xảy ra lỗi!");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            price: "",
            discount: "",
            categoryId: "",
            mainImageUrl: "",
        });
        setMainImageFile(null);
        setEditingProduct(null);
    };

    const manageBasePath = location.pathname.startsWith("/admin") ? "/admin" : "/staff";

    return (
        <AdminLayout>
            <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => navigate(`${manageBasePath}/colors`)}
                            className="px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-100"
                        >
                            Quản lý màu sắc
                        </button>
                        <button
                            onClick={() => navigate(`${manageBasePath}/sizes`)}
                            className="px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-100"
                        >
							Quản lý kích thước
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            Thêm sản phẩm
                        </button>
                    </div>
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
                                    <th className="px-6 py-3 text-left">Giá</th>
                                    <th className="px-6 py-3 text-left">Giảm giá</th>
                                    <th className="px-6 py-3 text-left">Tồn kho</th>
                                    <th className="px-6 py-3 text-left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-t">
                                        <td className="px-6 py-4">{product.id}</td>
                                        <td className="px-6 py-4">{product.name}</td>
                                        <td className="px-6 py-4">{parseFloat(product.price).toLocaleString()} đ</td>
                                        <td className="px-6 py-4">{product.discount}%</td>
                                        <td className="px-6 py-4">{product.stock}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => navigate(`${manageBasePath}/products/${product.id}/manage`)}
                                                    className="px-3 py-1 rounded border border-neutral-300 text-sm hover:bg-neutral-100"
                                                >
                                                    Quản lý biến thể
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
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
                                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Tên sản phẩm"
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
                                <input
                                    type="number"
                                    placeholder="Giá"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Giảm giá (%)"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                    required
                                />
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="url"
                                    placeholder="URL ảnh chính"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.mainImageUrl}
                                    onChange={(e) => setFormData({ ...formData, mainImageUrl: e.target.value })}
                                    required
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full border px-3 py-2 rounded"
                                        onChange={(e) => setMainImageFile(e.target.files?.[0] ?? null)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleMainImageUpload}
                                        disabled={isUploading}
                                        className="whitespace-nowrap bg-neutral-800 text-white px-3 py-2 rounded hover:bg-neutral-900 disabled:opacity-60"
                                    >
                                        {isUploading ? "Đang upload..." : "Upload ảnh"}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        {editingProduct ? "Cập nhật" : "Tạo mới"}
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
