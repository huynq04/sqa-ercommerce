import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getProducts } from "../../api/productsApi";
import { uploadImage, updateImage, deleteImage } from "../../api/admin/imagesApi";
import { uploadFile } from "../../api/uploadApi";
import type { Product } from "../../types/product";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "../../utils/toast";

export default function AdminImages() {
    const [products, setProducts] = useState<Product[]>([]);
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingImage, setEditingImage] = useState<any | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        productId: "",
        imageUrl: "",
        isMain: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const productsRes = await getProducts({ page: 1, limit: 100 });
            setProducts(productsRes.data);
            // Collect all images from products
            const allImages: any[] = [];
            productsRes.data.forEach((product) => {
                if (product.images) {
                    product.images.forEach((img) => {
                        allImages.push({ ...img, productId: product.id, productName: product.name });
                    });
                }
            });
            setImages(allImages);
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
            if (editingImage) {
                await updateImage(token, editingImage.id, {
                    imageUrl: formData.imageUrl,
                    isMain: formData.isMain,
                });
            } else {
                await uploadImage(token, {
                    productId: parseInt(formData.productId),
                    imageUrl: formData.imageUrl,
                    isMain: formData.isMain,
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

    const handleEdit = (image: any) => {
        setEditingImage(image);
        setFormData({
            productId: image.productId?.toString() || "",
            imageUrl: image.imageUrl,
            isMain: image.isMain,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa hình ảnh này?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await deleteImage(token, id);
            loadData();
            toast("Đã xóa thành công!");
        } catch (err: any) {
            toast(err.message || "Có lỗi xảy ra!");
        }
    };

    const resetForm = () => {
        setFormData({
            productId: "",
            imageUrl: "",
            isMain: false,
        });
        setImageFile(null);
        setEditingImage(null);
    };

    return (
        <AdminLayout>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Quản lý hình ảnh</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Thêm hình ảnh
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
                                    <th className="px-6 py-3 text-left">Sản phẩm</th>
                                    <th className="px-6 py-3 text-left">Hình ảnh</th>
                                    <th className="px-6 py-3 text-left">Ảnh chính</th>
                                    <th className="px-6 py-3 text-left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {images.map((image) => (
                                    <tr key={image.id} className="border-t">
                                        <td className="px-6 py-4">{image.id}</td>
                                        <td className="px-6 py-4">{image.productName || "Không có"}</td>
                                        <td className="px-6 py-4">
                                            <img src={image.imageUrl} alt="" className="w-16 h-16 object-cover rounded" />
                                        </td>
                                        <td className="px-6 py-4">{image.isMain ? "Có" : "Không"}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(image)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(image.id)}
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
                                {editingImage ? "Sửa hình ảnh" : "Thêm hình ảnh"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={formData.productId}
                                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                    required={!editingImage}
                                    disabled={!!editingImage}
                                >
                                    <option value="">Chọn sản phẩm</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
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
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isMain}
                                        onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                                    />
                                    <span>Ảnh chính</span>
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        {editingImage ? "Cập nhật" : "Tạo mới"}
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

