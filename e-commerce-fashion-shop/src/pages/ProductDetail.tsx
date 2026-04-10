// src/pages/ProductDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Container from "../components/Container";
import type { Product } from "../types/product";
import { getProductReviews, type Review } from "../api/reviewsApi";

export default function ProductDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [product, setProduct] = useState<Product | null>(null);
	const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
	const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
	const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [quantity, setQuantity] = useState<number>(1);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [actionMessageTone, setActionMessageTone] = useState<"success" | "error" | "info">("info");
	const [reviews, setReviews] = useState<Review[]>([]);
	const [reviewsTotal, setReviewsTotal] = useState(0);
	const [reviewsLoading, setReviewsLoading] = useState(false);
	const [reviewsError, setReviewsError] = useState<string | null>(null);
	const [openReplies, setOpenReplies] = useState<Record<number, boolean>>({});

	useEffect(() => {
		const token = localStorage.getItem("token");
		fetch(`http://localhost:3000/api/v1/products/${id}`, {
			headers: token
				? {
						Authorization: `Bearer ${token}`,
					}
				: undefined,
		})
			.then((res) => res.json())
			.then((data) => {
				setProduct(data);
				setSelectedVariant(null);
				setSelectedColorId(null);
				setSelectedSizeId(null);
				setSelectedImage(null);
				setQuantity(1);
				setActionMessage(null);
			})
			.catch((err) => console.error("Tải sản phẩm thất bại:", err));
	}, [id]);

	useEffect(() => {
		if (!id) return;
		const loadReviews = async () => {
			try {
				setReviewsLoading(true);
				setReviewsError(null);
				const token = localStorage.getItem("token");
				const res = await getProductReviews(Number(id), { page: 1, limit: 20, sort: "-createdAt" }, token);
				setReviews(res.data);
				setReviewsTotal(res.total);
			} catch (err: any) {
				console.error("Tải đánh giá thất bại", err);
				setReviewsError("Không tải được đánh giá.");
			} finally {
				setReviewsLoading(false);
			}
		};
		loadReviews();
	}, [id]);

	const variants = product?.variants ?? [];
	const uniqueColors = Array.from(
		new Map(variants.filter((v) => v.color).map((v) => [v.color?.id, v.color])).values(),
	);
	const uniqueSizes = Array.from(
		new Map(variants.filter((v) => v.size).map((v) => [v.size?.id, v.size])).values(),
	);

	const isColorAvailable = (colorId: number) => {
		if (!selectedSizeId) return variants.some((v) => v.color?.id === colorId);
		return variants.some((v) => v.color?.id === colorId && v.size?.id === selectedSizeId);
	};

	const isSizeAvailable = (sizeId: number) => {
		if (!selectedColorId) return variants.some((v) => v.size?.id === sizeId);
		return variants.some((v) => v.size?.id === sizeId && v.color?.id === selectedColorId);
	};

	const findVariantId = (colorId: number | null, sizeId: number | null) => {
		if (!colorId || !sizeId) return null;
		const match = variants.find((v) => v.color?.id === colorId && v.size?.id === sizeId);
		return match?.id ?? null;
	};

	const activeVariant = variants.find((v) => v.id === selectedVariant);
	const rawStock = Number(activeVariant?.stock ?? product?.stock ?? 0);
	const availableStock = Math.max(0, Number.isFinite(rawStock) ? rawStock : 0);
	const outOfStock = availableStock <= 0;
	const canPurchase =
		Boolean(selectedVariant) && !outOfStock && quantity > 0 && quantity <= availableStock;

	useEffect(() => {
		if (outOfStock) return;
		if (quantity > availableStock) {
			setQuantity(availableStock);
		}
	}, [availableStock, outOfStock, quantity]);
	if (!product) return <div className="py-20 text-center">Dang tai...</div>;


	const price = Number(activeVariant?.price ?? product.price);
	const discount = Number(product.discount);
	const finalPrice = price.toLocaleString("vi-VN") + "d";
	const originalPrice =
		discount > 0 ? (price / (1 - discount / 100)).toLocaleString("vi-VN") + "d" : null;

	const mainImage =
		selectedImage ||
		product.images?.find((img) => img.isMain)?.imageUrl ||
		product.mainImageUrl ||
		product.images?.[0]?.imageUrl ||
		"/placeholder.png";

	const handleBuyNow = () => {
		if (!selectedVariant) {
			setActionMessage("Vui lòng chọn màu / kích thước.");
			setActionMessageTone("error");
			return;
		}
		if (outOfStock || quantity <= 0 || quantity > availableStock) {
			setActionMessage("San phẩm đã hết hàng.");
			setActionMessageTone("error");
			return;
		}
		const token = localStorage.getItem("token");
		if (!token) {
			setActionMessage("Bạn cần đăng nhập.");
			setActionMessageTone("error");
			navigate("/login");
			return;
		}

		const buyNowPayload = {
			variantId: selectedVariant,
			quantity: quantity || 1,
			price: Number(activeVariant?.price ?? product.price),
			productName: product.name,
			imageUrl:
				activeVariant?.imageUrl ||
				product.mainImageUrl ||
				product.images?.[0]?.imageUrl ||
				"/placeholder.png",
			weight: 200,
		};

		sessionStorage.setItem("buyNowItem", JSON.stringify(buyNowPayload));
		navigate("/checkout?mode=buy-now");
	};

	return (
		<main className="py-10">
			<Container>
				<Breadcrumbs
					items={[
						{ label: "Trang chủ", to: "/" },
						{ label: product.category?.name || "Danh mục", to: `/category/${product.categoryId}` },
						{ label: product.name },
					]}
				/>

				<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
					{/* IMAGE GALLERY */}
					<div>
						{/* Ảnh lớn */}
						<img
							src={mainImage}
							alt={product.name}
							className="w-full rounded-lg shadow-md object-cover aspect-[4/5]"
						/>

						{/* Thumbnails */}
						<div className="flex gap-3 mt-4">
							{/* Ảnh chính */}
							<img
								src={product.mainImageUrl}
								className={`w-20 h-20 rounded-md object-cover cursor-pointer border ${
									!selectedImage ? "border-neutral-900" : "border-neutral-300"
								}`}
								onClick={() => setSelectedImage(null)}
							/>

							{/* Ảnh phụ */}
							{product.images
								?.filter((img) => !img.isMain)
								.map((img) => (
									<img
										key={img.id}
										src={img.imageUrl}
										className={`w-20 h-20 rounded-md object-cover cursor-pointer border ${
											selectedImage === img.imageUrl ? "border-neutral-900" : "border-neutral-300"
										}`}
										onClick={() => setSelectedImage(img.imageUrl)}
									/>
								))}
						</div>
					</div>

					{/* PRODUCT INFO */}
					<div>
						<h1 className="heading-3">{product.name}</h1>

						<div className="mt-4 flex items-center gap-3">
							<span className="text-2xl font-bold text-neutral-900">{finalPrice}</span>
							{originalPrice && (
								<span className="text-lg text-neutral-500 line-through">{originalPrice}</span>
							)}
						</div>

						<p className="mt-6 body-text">{product.description}</p>

						{/* VARIANTS */}
						{variants.length > 0 && (
							<div className="mt-8 space-y-4">
								{/* Color */}
								<div>
									<h4 className="mb-2 font-medium">Màu sắc</h4>
									<div className="flex gap-2">
										{uniqueColors.map((color) => {
											if (!color) return null;
											const disabled = !isColorAvailable(color.id);
											const isSelected = selectedColorId === color.id;
											return (
												<button
													key={color.id}
													className={`px-3 py-1 rounded-md border ${
														isSelected ? "border-neutral-900" : "border-neutral-300"
													} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
													disabled={disabled}
													onClick={() => {
														const nextColorId = isSelected ? null : color.id;
														let nextSizeId = selectedSizeId;
														if (
															!isSelected &&
															nextSizeId &&
															!variants.some((v) => v.color?.id === nextColorId && v.size?.id === nextSizeId)
														) {
															nextSizeId = null;
														}
														setSelectedColorId(nextColorId);
														setSelectedSizeId(nextSizeId);
														setSelectedVariant(findVariantId(nextColorId, nextSizeId));
													}}
												>
													{color.color}
												</button>
											);
										})}
									</div>
								</div>

								{/* Size */}
								<div>
									<h4 className="mb-2 font-medium">Kích cỡ</h4>
									<div className="flex gap-2">
										{uniqueSizes.map((size) => {
											if (!size) return null;
											const disabled = !isSizeAvailable(size.id);
											const isSelected = selectedSizeId === size.id;
											return (
												<button
													key={size.id + "-size"}
													className={`px-3 py-1 rounded-md border ${
														isSelected ? "border-neutral-900" : "border-neutral-300"
													} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
													disabled={disabled}
													onClick={() => {
														const nextSizeId = isSelected ? null : size.id;
														let nextColorId = selectedColorId;
														if (
															!isSelected &&
															nextColorId &&
															!variants.some((v) => v.color?.id === nextColorId && v.size?.id === nextSizeId)
														) {
															nextColorId = null;
														}
														setSelectedSizeId(nextSizeId);
														setSelectedColorId(nextColorId);
														setSelectedVariant(findVariantId(nextColorId, nextSizeId));
													}}
												>
													{size.size}
												</button>
											);
										})}
									</div>
								</div>
							</div>
						)}

																	{/* QUANTITY */}
					<div className="mt-4">
						<label className="block text-sm text-neutral-700 mb-1">Số lượng</label>
						<input
							type="number"
							min={1}
							max={availableStock || 1}
							value={quantity}
							disabled={outOfStock}
							onChange={(e) => {
								const next = Number(e.target.value);
								if (!Number.isFinite(next)) return;
								const clamped = Math.max(1, Math.min(availableStock || 1, next));
								setQuantity(clamped);
							}}
							className="w-24 border rounded px-3 py-2"
						/>
					</div>

					{!outOfStock && (
						<div className="mt-4 text-sm text-neutral-600">
							{`Tồn kho: ${availableStock} sản phẩm`}
						</div>
					)}
					{outOfStock && (
						<div className="mt-2 text-sm text-red-600">
							Mẫu đã hết hàng hãy chọn mẫu khác
						</div>
					)}

										{/* ACTION BUTTONS */}
					<div className="mt-8 flex flex-col sm:flex-row gap-4">
						{/* Them vao gio */}
						<button
							className="btn-primary flex-1 px-8 py-3"
							disabled={!canPurchase}
							onClick={async () => {
								if (!selectedVariant) {
									setActionMessage("Vui lòng chon màu / kích thước.");
									setActionMessageTone("error");
									return;
								}
								if (outOfStock || quantity <= 0 || quantity > availableStock) {
									setActionMessage("Sản phẩm đã hết hàng.");
									setActionMessageTone("error");
									return;
								}
								const token = localStorage.getItem("token");
								if (!token) {
									setActionMessage("Bạn cần đăng nhập.");
									setActionMessageTone("error");
									return;
								}

								try {
									const res = await fetch("http://localhost:3000/api/v1/cart/add", {
										method: "POST",
										headers: {
											"Content-Type": "application/json",
											Authorization: `Bearer ${token}`,
										},
										body: JSON.stringify({
											variantId: selectedVariant,
											quantity,
										}),
									}).then((res) => res.json());

									console.log("Da them vao gio?:", res);
									setActionMessage("Đã thêm vào giỏ hàng!");
									setActionMessageTone("success");
								} catch (error) {
									console.error(error);
									setActionMessage("Thêm vào giỏ thất bại.");
									setActionMessageTone("error");
								}
							}}
						>
							Thêm vào giỏ hàng
						</button>

						{/* Buy Now */}
						<button
							className="btn-secondary px-8 py-3"
							disabled={!canPurchase}
							onClick={handleBuyNow}
						>
							Mua ngay
						</button>
					</div>
					{actionMessage && (
						<p
							className={`mt-3 text-sm ${
								actionMessageTone === "success"
									? "text-green-600"
									: actionMessageTone === "error"
										? "text-red-600"
										: "text-neutral-600"
							}`}
						>
							{actionMessage}
						</p>
					)}
				</div>
			</div>
		</Container>

			{/* REVIEWS */}
			<Container>
				<div className="mt-12 card">
					<div className="flex items-center justify-between mb-4">
						<h2 className="heading-4">Đánh giá sản phẩm</h2>
						{reviewsTotal > 0 && <span className="text-sm text-neutral-500">{reviewsTotal} đánh giá</span>}
					</div>
					{reviewsLoading ? (
						<p className="text-neutral-600">Đang tải đánh giá...</p>
					) : reviewsError ? (
						<p className="text-error-600">{reviewsError}</p>
					) : reviews.length === 0 ? (
						<p className="text-neutral-600">Chưa có đánh giá nào.</p>
					) : (
						<div className="space-y-4">
							{reviews.map((review) => (
								<div key={review.id} className="border border-neutral-200 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold text-neutral-900">{review.user?.name || "Khách hàng"}</p>
											<p className="text-xs text-neutral-500">
												{review.createdAt ? new Date(review.createdAt).toLocaleDateString("vi-VN") : ""}
											</p>
										</div>
										<div className="text-sm font-semibold text-amber-600">
											{review.rating} / 5 ★
										</div>
									</div>
									<p className="mt-2 text-sm text-neutral-800">{review.comment}</p>
									{(review.sellerReply ?? review.reply) && (
										<div className="mt-3">
											<button
												className="text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
												onClick={() =>
													setOpenReplies((prev) => ({
														...prev,
														[review.id]: !prev[review.id],
													}))
												}
											>
												{openReplies[review.id] ? "Ẩn phản hồi của shop" : "Xem phản hồi của shop"}
											</button>
											{openReplies[review.id] && (
												<div className="mt-2 text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
													<p className="text-xs text-neutral-500">
														Phản hồi từ cửa hàng
														{review.sellerRepliedAt
															? ` • ${new Date(review.sellerRepliedAt).toLocaleDateString("vi-VN")}`
															: ""}
													</p>
													<p>{review.sellerReply ?? review.reply}</p>
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</Container>
		</main>
	);
}



















