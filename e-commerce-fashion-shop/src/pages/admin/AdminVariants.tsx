import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getProducts } from "../../api/productsApi";
import { createVariant, updateVariant, deleteVariant } from "../../api/admin/variantsApi";
import { uploadFile } from "../../api/uploadApi";
import { getColors } from "../../api/admin/colorsApi";
import { getSizes } from "../../api/admin/sizesApi";
import type { ProductVariant } from "../../types/product";
import type { Product } from "../../types/product";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminVariants() {
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        productId: "",
        sizeId: "",
        colorId: "",
        sku: "",
        price: "",
        stock: "",
        imageUrl: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const [productsRes, colorsRes, sizesRes] = await Promise.all([
                getProducts({ page: 1, limit: 100 }),
                getColors(token),
                getSizes(token),
            ]);
            setProducts(productsRes.data);
            setColors(colorsRes);
            setSizes(sizesRes);
            // Load variants from products
            const allVariants: ProductVariant[] = [];
            productsRes.data.forEach((product) => {
                if (product.variants) {
                    allVariants.push(...product.variants);
                }
            });
            setVariants(allVariants);
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
                productId: parseInt(formData.productId),
                sizeId: parseInt(formData.sizeId),
                colorId: parseInt(formData.colorId),
                sku: formData.sku,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                imageUrl: formData.imageUrl,
            };

            if (editingVariant) {
                await updateVariant(token, { id: editingVariant.id, ...payload });
            } else {
                await createVariant(token, payload);
            }

            setShowModal(false);
            resetForm();
            loadData();
            toast("Thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const handleImageUpload = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        if (!imageFile) {
            toast("Vui long chon anh truoc khi upload.", "error");
            return;
        }
        setIsUploading(true);
        try {
            const { url } = await uploadFile(token, imageFile);
            setFormData((prev) => ({ ...prev, imageUrl: url }));
            setImageFile(null);
            toast("Upload ảnh thành công!", "success");
        } catch (err: any) {
            toast(err.message || "Upload ảnh thất bại.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (variant: ProductVariant) => {
        setEditingVariant(variant);
        setFormData({
            productId: "",
            sizeId: variant.size?.id.toString() || "",
            colorId: variant.color?.id.toString() || "",
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock.toString(),
            imageUrl: variant.imageUrl,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa biến thể này?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await deleteVariant(token, id);
            loadData();
            toast("Đã xóa thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const resetForm = () => {
        setFormData({
            productId: "",
            sizeId: "",
            colorId: "",
            sku: "",
            price: "",
            stock: "",
            imageUrl: "",
        });
        setImageFile(null);
        setEditingVariant(null);
    };

    return (
        <AdminLayout>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Quản lý biến thể</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Thêm biến thể
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
                                    <th className="px-6 py-3 text-left">Mã SKU</th>
                                    <th className="px-6 py-3 text-left">Giá</th>
                                    <th className="px-6 py-3 text-left">Tồn kho</th>
                                    <th className="px-6 py-3 text-left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map((variant) => (
                                    <tr key={variant.id} className="border-t">
                                        <td className="px-6 py-4">{variant.id}</td>
                                        <td className="px-6 py-4">{variant.sku}</td>
                                        <td className="px-6 py-4">{parseFloat(variant.price).toLocaleString()}đ</td>
                                        <td className="px-6 py-4">{variant.stock}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(variant)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(variant.id)}
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
                                {editingVariant ? "Sửa biến thể" : "Thêm biến thể"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.productId}
                                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                    required={!editingVariant}
                                >
                                    <option value="">Chọn sản phẩm</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.sizeId}
                                    onChange={(e) => setFormData({ ...formData, sizeId: e.target.value })}
                                    required
                                >
                                    <option value="">Chọn kích thước</option>
                                    {sizes.map((size) => (
                                        <option key={size.id} value={size.id}>
                                            {size.size}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.colorId}
                                    onChange={(e) => setFormData({ ...formData, colorId: e.target.value })}
                                    required
                                >
                                    <option value="">Chọn màu</option>
                                    {colors.map((color) => (
                                        <option key={color.id} value={color.id}>
                                            {color.color}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Mã SKU"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
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
                                    placeholder="Tồn kho"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    required
                                />
                                <input
                                    type="url"
                                    placeholder="URL hình ảnh"
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    required
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full border px-3 py-2 rounded"
                                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleImageUpload}
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
                                        {editingVariant ? "Cập nhật" : "Tạo mới"}
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

