import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Container from "../components/Container";
import { checkOrderItemReview, createReview, type Review } from "../api/reviewsApi";
import { createReturnRequest, getUserReturnRequests } from "../api/returnsApi";
import { uploadFile } from "../api/uploadApi";
import { toast } from "../utils/toast";

type ReviewStatus = Record<number, { checked: boolean; hasReview: boolean; canComment?: boolean; data?: Review | null }>;
type ReturnStatus = Record<number, { hasRequest: boolean; status?: string }>;

export default function OrderDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [order, setOrder] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [reviewStatus, setReviewStatus] = useState<ReviewStatus>({});
	const [reviewModal, setReviewModal] = useState<{ orderItemId: number; productName: string } | null>(null);
	const [reviewForm, setReviewForm] = useState<{ rating: number; comment: string }>({ rating: 5, comment: "" });
	const [reviewSubmitting, setReviewSubmitting] = useState(false);
	const [reviewError, setReviewError] = useState<string | null>(null);
	const [checkingReviews, setCheckingReviews] = useState(false);

	const [returnStatus, setReturnStatus] = useState<ReturnStatus>({});
	const [returnModal, setReturnModal] = useState<{ orderItemId: number; productName: string } | null>(null);
	const [returnForm, setReturnForm] = useState<{ reason: string; files: File[] }>({ reason: "", files: [] });
	const [returnSubmitting, setReturnSubmitting] = useState(false);
	const [returnError, setReturnError] = useState<string | null>(null);

	const canReview = Boolean(
		order?.shipmentStatus === "delivered" || order?.orderStatus?.toLowerCase() === "completed",
	);
	const canReturn = canReview;

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}
		if (!id) {
			setError("Không tìm thấy đơn hàng.");
			setLoading(false);
			return;
		}

		const load = async () => {
			try {
				setLoading(true);
				const res = await fetch(`http://localhost:3000/api/v1/orders/${id}`, {
					headers: { Authorization: `Bearer ${token}` },
				}).then((r) => r.json());
				setOrder(res);
			} catch (err) {
				console.error(err);
				setError("Không thể tải thông tin đơn hàng.");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [id, navigate]);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) return;
		if (!order?.items?.length) return;

		const checkStatus = async () => {
			setCheckingReviews(true);
			try {
				const results = await Promise.all(
					order.items.map(async (item: any) => {
						try {
							const review = await checkOrderItemReview(token, item.id);
							const normalized = (review as any)?.data ?? review;
							const reviewId = (normalized as any)?.reviewId ?? (normalized as any)?.id;
							const canComment = (normalized as any)?.canComment ?? (normalized as any)?.canReview ?? undefined;
							return {
								id: item.id,
								reviewed: Boolean(reviewId === undefined ? (normalized as any)?.id : reviewId),
								canComment,
								data: normalized,
							};
						} catch (err) {
							console.error("Kiểm tra đánh giá thất bại", err);
							return { id: item.id, reviewed: false, canComment: undefined, data: null };
						}
					}),
				);

				setReviewStatus((prev) => {
					const next: ReviewStatus = { ...prev };
					results.forEach((res) => {
						next[res.id] = { checked: true, hasReview: res.reviewed, canComment: res.canComment, data: res.data };
					});
					return next;
				});
			} catch (err) {
				console.error("Kiểm tra trạng thái đánh giá thất bại", err);
			} finally {
				setCheckingReviews(false);
			}
		};

		checkStatus();
	}, [order]);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) return;
		if (!order?.items?.length) return;

		const loadReturns = async () => {
			try {
				const res = await getUserReturnRequests(token);
				const map: ReturnStatus = {};
				res.forEach((req) => {
					map[req.orderItemId] = { hasRequest: true, status: req.status };
				});
				setReturnStatus(map);
			} catch (err) {
				console.error("Tải yêu cầu đổi trả thất bại", err);
			}
		};

		loadReturns();
	}, [order]);

	const openReviewModal = (item: any) => {
		if (!canReview) {
			toast("Chỉ đánh giá khi đơn đã giao thành công.");
			return;
		}
		setReviewModal({ orderItemId: item.id, productName: item.variant?.product?.name || "Sản phẩm" });
		setReviewForm({ rating: 5, comment: "" });
		setReviewError(null);
	};

	const closeReviewModal = () => {
		setReviewModal(null);
		setReviewError(null);
	};

	const openReturnModal = (item: any) => {
		if (!canReturn) {
			toast("Chỉ đổi trả khi đơn đã giao thành công.");
			return;
		}
		setReturnModal({ orderItemId: item.id, productName: item.variant?.product?.name || "Sản phẩm" });
		setReturnForm({ reason: "", files: [] });
		setReturnError(null);
	};

	const closeReturnModal = () => {
		setReturnModal(null);
		setReturnError(null);
	};

	const submitReview = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!reviewModal) return;
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}
		setReviewSubmitting(true);
		try {
			await createReview(token, {
				orderItemId: reviewModal.orderItemId,
				rating: Number(reviewForm.rating),
				comment: reviewForm.comment.trim(),
			});
			setReviewStatus((prev) => ({
				...prev,
				[reviewModal.orderItemId]: {
					checked: true,
					hasReview: true,
					canComment: false,
					data: {
						...(prev[reviewModal.orderItemId]?.data || {}),
						id: prev[reviewModal.orderItemId]?.data?.id ?? reviewModal.orderItemId,
						rating: reviewForm.rating,
						comment: reviewForm.comment,
					} as Review,
				},
			}));
			closeReviewModal();
			toast("Đánh giá thành công!");
		} catch (err: any) {
			console.error(err);
			setReviewError(err?.message || "Gửi đánh giá thất bại.");
		} finally {
			setReviewSubmitting(false);
		}
	};

	const submitReturn = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!returnModal) return;
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}
		if (!returnForm.reason.trim()) {
			setReturnError("Vui lòng nhập lý do đổi trả.");
			return;
		}

		setReturnSubmitting(true);
		setReturnError(null);
		try {
			const uploaded: string[] = [];
			for (const file of returnForm.files) {
				const res = await uploadFile(token, file);
				uploaded.push(res.url);
			}

			const res = await createReturnRequest(token, {
				orderItemId: returnModal.orderItemId,
				reason: returnForm.reason.trim(),
				images: uploaded,
			});

			setReturnStatus((prev) => ({
				...prev,
				[returnModal.orderItemId]: { hasRequest: true, status: (res as any)?.status || "pending" },
			}));
			closeReturnModal();
			toast("Gửi yêu cầu đổi trả thành công!");
		} catch (err: any) {
			console.error(err);
			setReturnError(err?.message || "Gửi yêu cầu đổi trả thất bại.");
		} finally {
			setReturnSubmitting(false);
		}
	};

	if (loading) return <div className="py-20 text-center">Đang tải đơn hàng...</div>;
	if (error)
		return (
			<main className="py-12">
				<Container>
					<h1 className="heading-3 mb-4">Chi tiết đơn hàng</h1>
					<p className="text-neutral-600">{error}</p>
				</Container>
			</main>
		);
	if (!order)
		return (
			<main className="py-12">
				<Container>
					<h1 className="heading-3 mb-4">Chi tiết đơn hàng</h1>
					<p className="text-neutral-600">Không có dữ liệu đơn hàng.</p>
				</Container>
			</main>
		);

	return (
		<main className="py-12">
			<Container>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="heading-3">Đơn hàng #{order.id}</h1>
						<p className="text-neutral-600">Trạng thái: {order.orderStatus}</p>
					</div>
					<button className="btn-secondary" onClick={() => navigate(-1)}>
						← Quay lại
					</button>
				</div>

				<div className="space-y-4 card">
					<h2 className="heading-4">Thông tin đơn hàng</h2>
					<p>
						<strong>Tổng tiền:</strong> {Number(order.totalAmount).toLocaleString()}đ
					</p>
					<p>
						<strong>Phương thức thanh toán:</strong> {order.paymentMethod?.toUpperCase()}
					</p>
					<p>
						<strong>Địa chỉ giao hàng:</strong> {order.shippingAddress}
					</p>
					<div>
						<strong>Sản phẩm:</strong>
						<div className="mt-3 space-y-3">
							{order.items?.map((item: any) => {
								const status = reviewStatus[item.id];
								const reviewed = status?.hasReview;
								const canCommentFlag = status?.canComment;
								const returnReq = returnStatus[item.id];
								const exchangeStatus = item.exchange?.status ? String(item.exchange.status).toUpperCase() : "";
								const exchangeMessage =
									exchangeStatus === "RECEIVED"
										? "Sản phẩm đang tạm hết hàng. Vui lòng đợi 1-2 ngày."
										: exchangeStatus === "SHIPPING_NEW"
											? "Đơn hàng đang được giao vui lòng chú ý điện thoại."
											:exchangeStatus === "COMPLETED"? "Đổi hàng thành công" :null;
								const returnDisabled =
									!canReturn || (returnReq?.hasRequest && returnReq.status !== "rejected") || returnSubmitting;
								const returnLabel = returnReq?.hasRequest
									? returnReq.status === "approved"
										? "Đã duyệt, chờ hàng"
										: returnReq.status === "completed"
											? "Đã hoàn tất"
											: returnReq.status === "rejected"
												? "Bị từ chối - gửi lại"
												: "Đã gửi yêu cầu"
									: "Đổi hàng";
								return (
									<div
										key={item.id}
										className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border border-neutral-200 rounded-lg p-3"
									>
										<div>
											<p className="text-sm font-medium text-neutral-800">
												{item.variant?.product?.name} x {item.quantity}
											</p>
											<p className="text-xs text-neutral-500">Mã SKU: {item.variant?.sku || "Không có"}</p>
											{exchangeMessage && (
												<p className="text-xs text-amber-700 mt-1">{exchangeMessage}</p>
											)}
										</div>
										<div className="flex flex-wrap gap-2">
											<button
												className={`px-3 py-2 text-sm rounded-md ${
													reviewed || !canReview || checkingReviews || canCommentFlag === false
														? "bg-neutral-100 text-neutral-500 cursor-not-allowed"
														: "bg-neutral-900 text-white hover:bg-neutral-800"
												}`}
												onClick={() => openReviewModal(item)}
												disabled={reviewed || !canReview || checkingReviews || canCommentFlag === false}
											>
												{reviewed
													? "Đã đánh giá"
													: checkingReviews
														? "Đang kiểm tra..."
														: canCommentFlag === false
															? "Không thể đánh giá"
															: canReview
																? "Đánh giá"
																: "Chờ giao xong"}
											</button>
											<button
												className={`px-3 py-2 text-sm rounded-md ${
													returnDisabled
														? "bg-neutral-100 text-neutral-500 cursor-not-allowed"
														: "bg-neutral-50 border border-neutral-300 hover:bg-neutral-100"
												}`}
												onClick={() => openReturnModal(item)}
												disabled={returnDisabled}
											>
												{returnLabel}
											</button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</Container>

			{reviewModal && (
				<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
						<div className="flex items-start justify-between mb-4">
							<div>
								<p className="text-xs text-neutral-500">Đánh giá sản phẩm</p>
								<h3 className="text-lg font-semibold text-neutral-900">{reviewModal.productName}</h3>
							</div>
							<button className="text-neutral-500 hover:text-neutral-800" onClick={closeReviewModal}>
								&times;
							</button>
						</div>

						<form className="space-y-4" onSubmit={submitReview}>
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-1">Số sao (1-5)</label>
								<input
									type="number"
									min={1}
									max={5}
									className="input"
									value={reviewForm.rating}
									onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-1">Nhận xét</label>
								<textarea
									className="input min-h-[120px]"
									placeholder="Bạn thấy sản phẩm thế nào?"
									value={reviewForm.comment}
									onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
									required
								/>
							</div>

							{reviewError && <p className="text-sm text-error-600">{reviewError}</p>}

							<div className="flex justify-end gap-3">
								<button type="button" className="btn-secondary" onClick={closeReviewModal} disabled={reviewSubmitting}>
									Hủy
								</button>
								<button type="submit" className="btn-primary" disabled={reviewSubmitting}>
									{reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{returnModal && (
				<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
						<div className="flex items-start justify-between mb-4">
							<div>
								<p className="text-xs text-neutral-500">Yêu cầu đổi hàng</p>
								<h3 className="text-lg font-semibold text-neutral-900">{returnModal.productName}</h3>
							</div>
							<button className="text-neutral-500 hover:text-neutral-800" onClick={closeReturnModal}>
								&times;
							</button>
						</div>

						<form className="space-y-4" onSubmit={submitReturn}>
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-1">Lý do</label>
								<textarea
									className="input min-h-[120px]"
									placeholder="Mô tả lỗi / yêu cầu đổi kích thước / màu..."
									value={returnForm.reason}
									onChange={(e) => setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-1">Hình ảnh minh họa</label>
								<div className="border border-dashed border-neutral-300 rounded-lg p-4 bg-neutral-50">
									<label className="flex flex-col gap-2 text-sm text-neutral-700 cursor-pointer">
										<span className="inline-flex items-center justify-center px-3 py-2 bg-white border border-neutral-300 rounded-md hover:bg-neutral-100">
											Chọn ảnh
										</span>
										<input
											type="file"
											multiple
											accept="image/*"
											className="hidden"
											onChange={(e) =>
												setReturnForm((prev) => ({ ...prev, files: Array.from(e.target.files || []) }))
											}
										/>
										{returnForm.files.length > 0 ? (
											<ul className="text-xs text-neutral-600 list-disc pl-5 space-y-1">
												{returnForm.files.map((file) => (
													<li key={file.name}>{file.name}</li>
												))}
											</ul>
										) : (
											<p className="text-xs text-neutral-500">Chọn vài ảnh rõ ràng để nhân viên duyệt nhanh.</p>
										)}
									</label>
								</div>
							</div>

							{returnError && <p className="text-sm text-error-600">{returnError}</p>}

							<div className="flex justify-end gap-3">
								<button type="button" className="btn-secondary" onClick={closeReturnModal} disabled={returnSubmitting}>
									Hủy
								</button>
								<button type="submit" className="btn-primary" disabled={returnSubmitting}>
									{returnSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
}
