import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import type { Product, ProductVariant, ProductImage } from "../../types/product";
import { getProduct } from "../../api/productsApi";
import { getColors } from "../../api/admin/colorsApi";
import { getSizes } from "../../api/admin/sizesApi";
import { createVariant, updateVariant, deleteVariant } from "../../api/admin/variantsApi";
import { uploadImage, updateImage, deleteImage } from "../../api/admin/imagesApi";
import { uploadFile } from "../../api/uploadApi";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "../../utils/toast";

type TabKey = "variants" | "images";

export default function ProductManage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const productId = Number(id);
	const [product, setProduct] = useState<Product | null>(null);
	const [colors, setColors] = useState<any[]>([]);
	const [sizes, setSizes] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabKey>("variants");

	const [showVariantModal, setShowVariantModal] = useState(false);
	const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
	const [variantImageFile, setVariantImageFile] = useState<File | null>(null);
	const [isUploadingVariantImage, setIsUploadingVariantImage] = useState(false);
	const [variantForm, setVariantForm] = useState({
		sizeId: "",
		colorId: "",
		sku: "",
		price: "",
		stock: "",
		imageUrl: "",
	});

	const [showImageModal, setShowImageModal] = useState(false);
	const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
	const [extraImageFile, setExtraImageFile] = useState<File | null>(null);
	const [isUploadingExtraImage, setIsUploadingExtraImage] = useState(false);
	const [imageForm, setImageForm] = useState({
		imageUrl: "",
		isMain: false,
	});

	useEffect(() => {
		if (!productId) return;
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productId]);

	const loadData = async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}
		setLoading(true);
		try {
			const [productRes, colorsRes, sizesRes] = await Promise.all([
				getProduct(productId),
				getColors(token),
				getSizes(token),
			]);
			setProduct(productRes);
			setColors(colorsRes);
			setSizes(sizesRes);
		} catch (err) {
			console.error("Tải dữ liệu sản phẩm thất bại:", err);
			toast("Không thể tải dữ liệu sản phẩm.", "error");
		} finally {
			setLoading(false);
		}
	};

	const variants = useMemo(() => product?.variants ?? [], [product]);
	const images = useMemo(() => product?.images ?? [], [product]);

	const resetVariantForm = () => {
		setVariantForm({
			sizeId: "",
			colorId: "",
			sku: "",
			price: "",
			stock: "",
			imageUrl: "",
		});
		setVariantImageFile(null);
		setEditingVariant(null);
	};

	const resetImageForm = () => {
		setImageForm({
			imageUrl: "",
			isMain: false,
		});
		setExtraImageFile(null);
		setEditingImage(null);
	};

	const handleVariantSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = localStorage.getItem("token");
		if (!token) return;

		try {
			if (editingVariant) {
				await updateVariant(token, {
					id: editingVariant.id,
					sizeId: Number(variantForm.sizeId),
					colorId: Number(variantForm.colorId),
					sku: variantForm.sku,
					price: Number(variantForm.price),
					stock: Number(variantForm.stock),
					imageUrl: variantForm.imageUrl,
				});
			} else {
				await createVariant(token, {
					productId,
					sizeId: Number(variantForm.sizeId),
					colorId: Number(variantForm.colorId),
					sku: variantForm.sku,
					price: Number(variantForm.price),
					stock: Number(variantForm.stock),
					imageUrl: variantForm.imageUrl,
				});
			}
			setShowVariantModal(false);
			resetVariantForm();
			loadData();
			toast("Thành công!", "success");
		} catch (err: any) {
			toast(err.message || "Có lỗi xảy ra.", "error");
		}
	};

	const handleVariantImageUpload = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		if (!variantImageFile) {
			toast("Vui long chon anh truoc khi upload.", "error");
			return;
		}
		setIsUploadingVariantImage(true);
		try {
			const { url } = await uploadFile(token, variantImageFile);
			setVariantForm((prev) => ({ ...prev, imageUrl: url }));
			setVariantImageFile(null);
			toast("Upload ảnh thành công!", "success");
		} catch (err: any) {
			toast(err.message || "Upload ảnh thất bại.", "error");
		} finally {
			setIsUploadingVariantImage(false);
		}
	};

	const handleVariantEdit = (variant: ProductVariant) => {
		setEditingVariant(variant);
		setVariantForm({
			sizeId: variant.size?.id?.toString() ?? "",
			colorId: variant.color?.id?.toString() ?? "",
			sku: variant.sku ?? "",
			price: variant.price?.toString() ?? "",
			stock: variant.stock?.toString() ?? "",
			imageUrl: variant.imageUrl ?? "",
		});
		setShowVariantModal(true);
	};

	const handleVariantDelete = async (variantId: number) => {
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			await deleteVariant(token, variantId);
			loadData();
			toast("Đã xóa biến thể.", "success");
		} catch (err: any) {
			toast(err.message || "Có lỗi xảy ra.", "error");
		}
	};

	const handleImageSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = localStorage.getItem("token");
		if (!token) return;

		try {
			if (editingImage) {
				await updateImage(token, editingImage.id, {
					imageUrl: imageForm.imageUrl,
					isMain: imageForm.isMain,
				});
			} else {
				await uploadImage(token, {
					productId,
					imageUrl: imageForm.imageUrl,
					isMain: imageForm.isMain,
				});
			}
			setShowImageModal(false);
			resetImageForm();
			loadData();
			toast("Thành công!", "success");
		} catch (err: any) {
			toast(err.message || "Có lỗi xảy ra.", "error");
		}
	};

	const handleExtraImageUpload = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		if (!extraImageFile) {
			toast("Vui long chon anh truoc khi upload.", "error");
			return;
		}
		setIsUploadingExtraImage(true);
		try {
			const { url } = await uploadFile(token, extraImageFile);
			setImageForm((prev) => ({ ...prev, imageUrl: url }));
			setExtraImageFile(null);
			toast("Upload ảnh thành công!", "success");
		} catch (err: any) {
			toast(err.message || "Upload ảnh thất bại.", "error");
		} finally {
			setIsUploadingExtraImage(false);
		}
	};

	const handleImageEdit = (image: ProductImage) => {
		setEditingImage(image);
		setImageForm({
			imageUrl: image.imageUrl ?? "",
			isMain: Boolean(image.isMain),
		});
		setShowImageModal(true);
	};

	const handleImageDelete = async (imageId: number) => {
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			await deleteImage(token, imageId);
			loadData();
			toast("Đã xóa ảnh.", "success");
		} catch (err: any) {
			toast(err.message || "Có lỗi xảy ra.", "error");
		}
	};

	const pageTitle = product ? `Quản lý sản phẩm: ${product.name}` : "Quản lý sản phẩm";

	return (
		<AdminLayout>
			<div>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold">{pageTitle}</h1>
						<p className="text-sm text-neutral-500">ID: {productId || "-"}</p>
					</div>
					<button
						onClick={() => navigate(-1)}
						className="px-4 py-2 rounded border border-neutral-300 hover:bg-neutral-100"
					>
						Quay lại
					</button>
				</div>

				<div className="flex flex-wrap gap-2 mb-6">
					{([
						{ key: "variants", label: "Biến thể" },
						{ key: "images", label: "Ảnh phụ" },
					] as const).map((tab) => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
							className={`px-4 py-2 rounded ${
								activeTab === tab.key
									? "bg-blue-600 text-white"
									: "bg-white border border-neutral-300 hover:bg-neutral-100"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{loading ? (
					<div className="text-center py-12">Đang tải...</div>
				) : (
					<>
						{activeTab === "variants" && (
							<div className="bg-white rounded-lg shadow">
								<div className="flex items-center justify-between p-4 border-b">
									<h2 className="text-lg font-semibold">Biến thể</h2>
									<button
										onClick={() => {
											resetVariantForm();
											setShowVariantModal(true);
										}}
										className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
									>
										<Plus size={18} />
										Thêm biến thể
									</button>
								</div>
								<table className="w-full">
									<thead className="bg-neutral-50">
										<tr>
											<th className="px-4 py-3 text-left">Mã SKU</th>
											<th className="px-4 py-3 text-left">Màu</th>
											<th className="px-4 py-3 text-left">Kích thước</th>
											<th className="px-4 py-3 text-left">Giá</th>
											<th className="px-4 py-3 text-left">Kho</th>
											<th className="px-4 py-3 text-left">Ảnh</th>
											<th className="px-4 py-3 text-left">Thao tác</th>
										</tr>
									</thead>
									<tbody>
										{variants.length === 0 ? (
											<tr>
												<td className="px-4 py-4 text-neutral-500" colSpan={7}>
													Chưa có biến thể.
												</td>
											</tr>
										) : (
											variants.map((variant) => (
												<tr key={variant.id} className="border-t">
													<td className="px-4 py-3">{variant.sku}</td>
													<td className="px-4 py-3">{variant.color?.color}</td>
													<td className="px-4 py-3">{variant.size?.size}</td>
													<td className="px-4 py-3">{Number(variant.price).toLocaleString()}₫</td>
													<td className="px-4 py-3">{variant.stock}</td>
													<td className="px-4 py-3">
														{variant.imageUrl ? (
															<img
																src={variant.imageUrl}
																alt=""
																className="w-12 h-12 rounded object-cover"
															/>
														) : (
															<span className="text-neutral-500">-</span>
														)}
													</td>
													<td className="px-4 py-3">
														<div className="flex gap-2">
															<button
																onClick={() => handleVariantEdit(variant)}
																className="text-blue-600 hover:text-blue-800"
															>
																<Edit size={16} />
															</button>
															<button
																onClick={() => handleVariantDelete(variant.id)}
																className="text-red-600 hover:text-red-800"
															>
																<Trash2 size={16} />
															</button>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						)}

						{activeTab === "images" && (
							<div className="bg-white rounded-lg shadow">
								<div className="flex items-center justify-between p-4 border-b">
									<h2 className="text-lg font-semibold">Ảnh phụ</h2>
									<button
										onClick={() => {
											resetImageForm();
											setShowImageModal(true);
										}}
										className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
									>
										<Plus size={18} />
										Thêm ảnh
									</button>
								</div>
								<table className="w-full">
									<thead className="bg-neutral-50">
										<tr>
											<th className="px-4 py-3 text-left">Ảnh</th>
											<th className="px-4 py-3 text-left">Ảnh chính</th>
											<th className="px-4 py-3 text-left">Thao tác</th>
										</tr>
									</thead>
									<tbody>
										{images.length === 0 ? (
											<tr>
												<td className="px-4 py-4 text-neutral-500" colSpan={3}>
													Chưa có ảnh phụ.
												</td>
											</tr>
										) : (
											images.map((image) => (
												<tr key={image.id} className="border-t">
													<td className="px-4 py-3">
														<img
															src={image.imageUrl}
															alt=""
															className="w-16 h-16 rounded object-cover"
														/>
													</td>
													<td className="px-4 py-3">{image.isMain ? "Có" : "Không"}</td>
													<td className="px-4 py-3">
														<div className="flex gap-2">
															<button
																onClick={() => handleImageEdit(image)}
																className="text-blue-600 hover:text-blue-800"
															>
																<Edit size={16} />
															</button>
															<button
																onClick={() => handleImageDelete(image.id)}
																className="text-red-600 hover:text-red-800"
															>
																<Trash2 size={16} />
															</button>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						)}

					</>
				)}

				{/* Variant Modal */}
				{showVariantModal && (
					<div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
						<div className="bg-white rounded-lg p-6 w-full max-w-md border border-neutral-200 shadow-2xl">
							<h2 className="text-xl font-bold mb-4">
								{editingVariant ? "Sửa biến thể" : "Thêm biến thể"}
							</h2>
							<form onSubmit={handleVariantSubmit} className="space-y-3">
								<select
									className="w-full border px-3 py-2 rounded"
									value={variantForm.colorId}
									onChange={(e) => setVariantForm({ ...variantForm, colorId: e.target.value })}
									required
								>
									<option value="">Chọn màu</option>
									{colors.map((color) => (
										<option key={color.id} value={color.id}>
											{color.color}
										</option>
									))}
								</select>
								<select
									className="w-full border px-3 py-2 rounded"
									value={variantForm.sizeId}
									onChange={(e) => setVariantForm({ ...variantForm, sizeId: e.target.value })}
									required
								>
									<option value="">Chọn kích thước</option>
									{sizes.map((size) => (
										<option key={size.id} value={size.id}>
											{size.size}
										</option>
									))}
								</select>
								<input
									type="text"
									placeholder="Mã SKU"
									className="w-full border px-3 py-2 rounded"
									value={variantForm.sku}
									onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
									required
								/>
								<input
									type="number"
									placeholder="Giá"
									className="w-full border px-3 py-2 rounded"
									value={variantForm.price}
									onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
									required
								/>
								<input
									type="number"
									placeholder="Tồn kho"
									className="w-full border px-3 py-2 rounded"
									value={variantForm.stock}
									onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
									required
								/>
								<input
									type="url"
									placeholder="URL ảnh biến thể"
									className="w-full border px-3 py-2 rounded"
									value={variantForm.imageUrl}
									onChange={(e) => setVariantForm({ ...variantForm, imageUrl: e.target.value })}
								/>
					<div className="flex items-center gap-2">
						<input
							type="file"
							accept="image/*"
							className="w-full border px-3 py-2 rounded"
							onChange={(e) => setVariantImageFile(e.target.files?.[0] ?? null)}
						/>
						<button
							type="button"
							onClick={handleVariantImageUpload}
							disabled={isUploadingVariantImage}
							className="whitespace-nowrap bg-neutral-800 text-white px-3 py-2 rounded hover:bg-neutral-900 disabled:opacity-60"
						>
							{isUploadingVariantImage ? "Đang upload..." : "Upload ảnh"}
						</button>
					</div>
								<div className="flex gap-2 pt-2">
									<button
										type="submit"
										className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
									>
										{editingVariant ? "Cập nhật" : "Tạo mới"}
									</button>
									<button
										type="button"
										onClick={() => {
											setShowVariantModal(false);
											resetVariantForm();
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

				{/* Image Modal */}
				{showImageModal && (
					<div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
						<div className="bg-white rounded-lg p-6 w-full max-w-md border border-neutral-200 shadow-2xl">
							<h2 className="text-xl font-bold mb-4">
								{editingImage ? "Sửa ảnh" : "Thêm ảnh"}
							</h2>
							<form onSubmit={handleImageSubmit} className="space-y-3">
								<input
									type="url"
									placeholder="URL ảnh"
									className="w-full border px-3 py-2 rounded"
									value={imageForm.imageUrl}
									onChange={(e) => setImageForm({ ...imageForm, imageUrl: e.target.value })}
									required
								/>
					<div className="flex items-center gap-2">
						<input
							type="file"
							accept="image/*"
							className="w-full border px-3 py-2 rounded"
							onChange={(e) => setExtraImageFile(e.target.files?.[0] ?? null)}
						/>
						<button
							type="button"
							onClick={handleExtraImageUpload}
							disabled={isUploadingExtraImage}
							className="whitespace-nowrap bg-neutral-800 text-white px-3 py-2 rounded hover:bg-neutral-900 disabled:opacity-60"
						>
							{isUploadingExtraImage ? "Đang upload..." : "Upload ảnh"}
						</button>
					</div>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={imageForm.isMain}
										onChange={(e) => setImageForm({ ...imageForm, isMain: e.target.checked })}
									/>
									<span>Ảnh chính</span>
								</label>
								<div className="flex gap-2 pt-2">
									<button
										type="submit"
										className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
									>
										{editingImage ? "Cập nhật" : "Tạo mới"}
									</button>
									<button
										type="button"
										onClick={() => {
											setShowImageModal(false);
											resetImageForm();
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
