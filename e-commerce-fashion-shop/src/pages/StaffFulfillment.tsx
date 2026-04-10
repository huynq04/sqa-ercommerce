import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import Container from "../components/Container";
import { getOrders, type Order } from "../api/admin/ordersApi";
import { getAdminReviews, replyReview, type AdminReview } from "../api/admin/reviewsApi";
import {
	approveReturnRequest,
	completeReturnRequest,
	getAdminReturns,
	receiveReturnRequest,
	rejectReturnRequest,
	type AdminReturnRequest,
} from "../api/admin/returnsApi";
import {
	createShippingOrder,
	cancelShippingOrder,
	fetchDistricts,
	fetchProvinces,
	fetchWards,
	type CreateShippingOrderPayload,
	type District,
	type Province,
	type Ward,
} from "../api/shippingApi";
import { toast } from "../utils/toast";
import {
	Package,
	Tag,
	FolderTree,
	Users,
	Truck,
	XCircle,
	MapPin,
	User,
	Phone,
	Calendar,
	FileText,
	CheckCircle2,
	AlertCircle,
	Loader2,
	X,
	Box,
	Ruler,
	Weight,
	DollarSign,
	Shield,
	MessageSquare,
	RefreshCw,
	Star,
} from "lucide-react";

type TabKey = "pending" | "shipping" | "cancelled";
type ReturnAction = "approve" | "reject" | "receive" | "complete";
type ReturnPhase = "pending" | "approved" | "receiving" | "completed" | "rejected" | "other";

const DEFAULT_DIMENSIONS = {
	weight: 200,
	length: 20,
	width: 15,
	height: 10,
};

type ParsedAddress = {
	street: string;
	ward?: string;
	district?: string;
	province?: string;
	phone?: string;
};

export default function StaffFulfillmentPage() {
    const location = useLocation();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabKey>("pending");
	const [sectionTab, setSectionTab] = useState<"shipping" | "reviews" | "returns">("shipping");
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [parsedAddress, setParsedAddress] = useState<ParsedAddress | null>(null);
	const [form, setForm] = useState<CreateShippingOrderPayload | null>(null);
	const [matchedNames, setMatchedNames] = useState<{
		province?: string;
		district?: string;
		ward?: string;
	}>({});
	const [provinceId, setProvinceId] = useState<number | null>(null);
	const [districtId, setDistrictId] = useState<number | null>(null);
	const [districtName, setDistrictName] = useState("");
	const [wardName, setWardName] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [cancellingCode, setCancellingCode] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [provinces, setProvinces] = useState<Province[]>([]);
	const [districtCache, setDistrictCache] = useState<Record<number, District[]>>({});
	const [wardCache, setWardCache] = useState<Record<number, Ward[]>>({});
	const [reviews, setReviews] = useState<AdminReview[]>([]);
	const [reviewsLoading, setReviewsLoading] = useState(false);
	const [reviewsError, setReviewsError] = useState<string | null>(null);
	const [reviewTotal, setReviewTotal] = useState(0);
	const [reviewSearchInput, setReviewSearchInput] = useState("");
	const [reviewSearch, setReviewSearch] = useState("");
	const [replyingReview, setReplyingReview] = useState<AdminReview | null>(null);
	const [replyMessage, setReplyMessage] = useState("");
	const [replySubmitting, setReplySubmitting] = useState(false);
	const [returns, setReturns] = useState<AdminReturnRequest[]>([]);
	const [returnsLoading, setReturnsLoading] = useState(false);
	const [returnsError, setReturnsError] = useState<string | null>(null);
	const [returnsTotal, setReturnsTotal] = useState(0);
	const [returnSearchInput, setReturnSearchInput] = useState("");
	const [returnSearch, setReturnSearch] = useState("");
	const [returnActionLoading, setReturnActionLoading] = useState<number | null>(null);
	const [returnStatusFilter, setReturnStatusFilter] = useState<ReturnPhase | "all">("all");

	useEffect(() => {
		loadOrders();
	}, []);
useEffect(() => {
		const params = new URLSearchParams(location.search);
		const tab = params.get("tab");
		if (tab === "shipping" || tab === "reviews" || tab === "returns") {
			setSectionTab(tab);
		}
	}, [location.search]);


	useEffect(() => {
		fetchProvinces()
			.then(setProvinces)
			.catch((err) => console.error("Tải danh sách tỉnh/thành thất bại.", err));
	}, []);

const normalizeText = (value?: string | null) =>
	value?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() ?? "";

const ADMIN_PREFIXES = [
	"xa",
	"phuong",
	"thi tran",
	"thi xa",
	"huyen",
	"quan",
	"thanh pho",
	"tp",
	"tinh",
];

const stripPrefixes = (value: string) => {
	let stripped = value;
	for (const prefix of ADMIN_PREFIXES) {
		if (stripped.startsWith(prefix + " ")) {
			stripped = stripped.slice(prefix.length + 1);
			break;
		}
	}
	return stripped;
};

const compareNames = (a: string, b: string) => {
	const normA = normalizeText(a);
	const normB = normalizeText(b);
	const stripA = stripPrefixes(normA);
	const stripB = stripPrefixes(normB);
	return (
		normA === normB ||
		normA === stripB ||
		stripA === normB ||
		stripA === stripB ||
		normA.includes(stripB) ||
		normB.includes(stripA) ||
		stripA.includes(stripB) ||
		stripB.includes(stripA)
	);
};

const isNameMatch = (keyword: string, target: string, extensions?: string[]) => {
	if (compareNames(keyword, target)) return true;
	if (extensions?.length) {
		return extensions.some((ext) => compareNames(keyword, ext));
	}
	return false;
};

	const parseShippingAddress = (raw: string): ParsedAddress => {
		const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
		const [contact, ...rest] = parts;
		const province = rest.pop();
		const district = rest.pop();
		const ward = rest.pop();
		const street = rest.join(", ");
		const phoneMatch = contact?.split("-").map((p) => p.trim());
		return {
			street: street || rest.join(", ") || raw,
			ward,
			district,
			province,
			phone: phoneMatch && phoneMatch.length > 1 ? phoneMatch[1] : undefined,
		};
	};

	const getDistrictsForProvince = async (provinceId: number) => {
		if (districtCache[provinceId]) return districtCache[provinceId];
		try {
			const list = await fetchDistricts(provinceId);
			setDistrictCache((prev) => ({ ...prev, [provinceId]: list }));
			return list;
		} catch (err) {
			console.error("Tải danh sách quận/huyện thất bại.", err);
			return [];
		}
	};

	const getWardsForDistrict = async (districtId: number) => {
		if (wardCache[districtId]) return wardCache[districtId];
		try {
			const list = await fetchWards(districtId);
			setWardCache((prev) => ({ ...prev, [districtId]: list }));
			return list;
		} catch (err) {
			console.error("Tải danh sách phường/xã thất bại.", err);
			return [];
		}
	};

	const ensureProvinceMatch = async (name?: string | null) => {
		const sourceName = name || form?.toProvinceName || parsedAddress?.province;
		if (!sourceName) return null;

		if (provinceId && form?.toProvinceName && isNameMatch(sourceName, form.toProvinceName)) {
			return provinceId;
		}

		let provinceList = provinces;
		if (!provinceList.length) {
			try {
				provinceList = await fetchProvinces();
				setProvinces(provinceList);
			} catch (err) {
				console.error("Tải danh sách tỉnh/thành thất bại.", err);
				return null;
			}
		}

		const match = provinceList.find((p) => isNameMatch(sourceName, p.ProvinceName, p.NameExtension));
		if (match) {
			setProvinceId(match.ProvinceID);
			setForm((prev) => (prev ? { ...prev, toProvinceName: match.ProvinceName } : prev));
			setMatchedNames((prev) => ({ ...prev, province: match.ProvinceName }));
			return match.ProvinceID;
		}
		return null;
	};

	const handleProvinceInputChange = async (value: string) => {
		setForm((prev) => (prev ? { ...prev, toProvinceName: value } : prev));
		setProvinceId(null);
		setDistrictId(null);
		setMatchedNames((prev) => ({ ...prev, province: undefined }));
		if (!value.trim()) return;
		await ensureProvinceMatch(value);
	};

	const handleDistrictInputChange = async (value: string) => {
		setDistrictName(value);
		setForm((prev) => (prev ? { ...prev, toDistrictId: 0 } : prev));
		setMatchedNames((prev) => ({ ...prev, district: undefined }));
		if (!value.trim()) {
			setDistrictId(null);
			setWardName("");
			setForm((prev) => (prev ? { ...prev, toWardCode: "" } : prev));
			return;
		}

		const provinceMatch = await ensureProvinceMatch();
		if (!provinceMatch) return;

		const districts = await getDistrictsForProvince(provinceMatch);
		const match = districts.find((d) => isNameMatch(value, d.DistrictName, d.NameExtension));

		if (match) {
			setDistrictId(match.DistrictID);
			setForm((prev) => (prev ? { ...prev, toDistrictId: match.DistrictID } : prev));
			setMatchedNames((prev) => ({ ...prev, district: match.DistrictName }));
			await handleWardInputChange(wardName, match.DistrictID, false);
		} else {
			setDistrictId(null);
		}
	};

	const handleWardInputChange = async (value: string, districtOverride?: number, updateInput = true) => {
		if (updateInput) setWardName(value);
		setForm((prev) => (prev ? { ...prev, toWardCode: "" } : prev));
		setMatchedNames((prev) => ({ ...prev, ward: undefined }));
		if (!value.trim()) return;
		const districtRef = districtOverride ?? districtId;
		if (!districtRef) return;

		const wards = await getWardsForDistrict(districtRef);
		const match = wards.find((w) => isNameMatch(value, w.WardName, w.NameExtension));

		if (match) {
			if (updateInput) setWardName(match.WardName);
			setForm((prev) => (prev ? { ...prev, toWardCode: match.WardCode } : prev));
			setMatchedNames((prev) => ({ ...prev, ward: match.WardName }));
		}
	};

	const loadOrders = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;

		setLoading(true);
		try {
			const res = await getOrders(token, { limit: 200, sort: "-createdAt" });
			setOrders(res.data);
		} catch (err) {
			console.error(err);
			setError("Không tải được danh sách đơn hàng.");
		} finally {
			setLoading(false);
		}
	};

	const loadReviews = useCallback(async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			setReviewsError("Vui lòng đăng nhập quản trị để tải đánh giá.");
			setReviews([]);
			return;
		}

		setReviewsLoading(true);
		setReviewsError(null);
		try {
			const res = await getAdminReviews(token, { limit: 50, sort: "-createdAt", q: reviewSearch || undefined });
			const list = Array.isArray(res.data) ? res.data : [];
			setReviews(list);
			setReviewTotal(typeof res.total === "number" ? res.total : list.length);
		} catch (err) {
			console.error(err);
			setReviewsError("Không tải được đánh giá.");
		} finally {
			setReviewsLoading(false);
		}
	}, [reviewSearch]);

	const extractReturnList = (payload: any): { list: AdminReturnRequest[]; total: number } => {
		if (!payload) return { list: [], total: 0 };
		if (Array.isArray(payload)) {
			return { list: payload, total: payload.length };
		}
		if (Array.isArray(payload.data)) {
			return { list: payload.data, total: typeof payload.total === "number" ? payload.total : payload.data.length };
		}
		if (Array.isArray(payload.data?.data)) {
			const list = payload.data.data;
			const total = payload.data.total ?? payload.total ?? list.length;
			return { list, total };
		}
		return { list: [], total: 0 };
	};

	const loadReturns = useCallback(async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			setReturnsError("Vui lòng đăng nhập quản trị để tải yêu cầu đổi trả.");
			setReturns([]);
			return;
		}

		setReturnsLoading(true);
		setReturnsError(null);
		try {
			const res = await getAdminReturns(token, {
				limit: 50,
				sort: "-createdAt",
				q: returnSearch || undefined,
			});
			const { list, total } = extractReturnList(res);
			setReturns(list);
			setReturnsTotal(total);
		} catch (err) {
			console.error(err);
			setReturnsError("Không tải được yêu cầu đổi trả.");
		} finally {
			setReturnsLoading(false);
		}
	}, [returnSearch]);

	useEffect(() => {
		if (sectionTab === "reviews") {
			loadReviews();
		}
	}, [sectionTab, loadReviews]);

	useEffect(() => {
		if (sectionTab === "returns") {
			loadReturns();
		}
	}, [sectionTab, loadReturns]);

	const openReplyModal = (review: AdminReview) => {
		setReplyingReview(review);
		setReplyMessage(review.reply || review.sellerReply || "");
	};

	const closeReplyModal = () => {
		setReplyingReview(null);
		setReplyMessage("");
		setReplySubmitting(false);
	};

	const handleSubmitReply = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!replyingReview) return;
		if (!replyMessage.trim()) {
			toast("Vui lòng nhập nội dung phản hồi trước khi gửi.");
			return;
		}

		const token = localStorage.getItem("token");
		if (!token) {
			toast("Vui lòng đăng nhập quản trị để phản hồi.");
			return;
		}

		setReplySubmitting(true);
		try {
			await replyReview(token, replyingReview.id, replyMessage.trim());
			await loadReviews();
			closeReplyModal();
		} catch (err) {
			console.error(err);
			toast("Gửi phản hồi thất bại. Vui lòng thử lại.");
		} finally {
			setReplySubmitting(false);
		}
	};

	const formatReturnStatus = (status?: string | null) => {
		if (!status) return "Không xác định";
		const normalized = status.toLowerCase();
		const labelMap: Record<string, string> = {
			pending: "Chờ duyệt",
			approved: "Đã duyệt",
			shipping_new: "Đã duyệt",
			receiving: "Hết hàng gửi",
			received: "Hết hàng gửi",
			completed: "Hoàn tất",
			rejected: "Từ chối",
		};
		return labelMap[normalized] || "Khác";
	};

	const getReturnStatusStyle = (status?: string | null) => {
		const normalized = status?.toLowerCase();
		if (normalized === "pending") return "bg-amber-50 text-amber-700 border border-amber-100";
		if (normalized === "approved" || normalized === "shipping_new")
			return "bg-blue-50 text-blue-700 border border-blue-100";
		if (normalized === "receiving" || normalized === "received")
			return "bg-purple-50 text-purple-700 border border-purple-100";
		if (normalized === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
		if (normalized === "rejected") return "bg-error-50 text-error-700 border border-error-100";
		return "bg-neutral-100 text-neutral-600 border border-neutral-200";
	};

	const getReturnPhase = (status?: string | null): ReturnPhase => {
		const normalized = status?.toLowerCase();
		if (normalized === "pending") return "pending";
		if (normalized === "approved" || normalized === "shipping_new") return "approved";
		if (normalized === "receiving" || normalized === "received") return "receiving";
		if (normalized === "completed") return "completed";
		if (normalized === "rejected") return "rejected";
		return "other";
	};

	const getReturnActions = (status?: string | null): ReturnAction[] => {
		const normalized = status?.toLowerCase();
		if (normalized === "pending") return ["approve", "reject"];
		if (normalized === "approved" || normalized === "shipping_new") return ["receive", "reject"];
		if (normalized === "receiving" || normalized === "received") return ["receive"];
		return [];
	};

	const baseReturnActionClass =
		"px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border";
	const getReturnActionClass = (action: ReturnAction) => {
		switch (action) {
			case "approve":
				return `${baseReturnActionClass} bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800`;
			case "reject":
				return `${baseReturnActionClass} bg-white text-error-600 border-error-300 hover:bg-error-50`;
			case "receive":
				return `${baseReturnActionClass} bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50`;
			case "complete":
				return `${baseReturnActionClass} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500`;
			default:
				return baseReturnActionClass;
		}
	};

	const actionLabels: Record<ReturnAction, string> = {
		approve: "Chấp nhận yêu cầu",
		reject: "Từ chối",
		receive: "Đã nhận được hàng",
		complete: "Hoàn tất đổi trả",
	};

	const handleReturnAction = async (request: AdminReturnRequest, action: ReturnAction) => {
		const token = localStorage.getItem("token");
		if (!token) {
			toast("Vui lòng đăng nhập quản trị để cập nhật đổi trả.");
			return;
		}

		setReturnActionLoading(request.id);
		try {
			if (action === "approve") {
				await approveReturnRequest(token, request.id);
			} else if (action === "reject") {
				const reason = window.prompt("Nhập lý do từ chối (không bắt buộc)")?.trim();
				await rejectReturnRequest(token, request.id, reason || undefined);
			} else if (action === "receive") {
				const res = await receiveReturnRequest(token, request.id);
				if (res?.message) {
					toast(res.message);
				}
			} else if (action === "complete") {
				await completeReturnRequest(token, request.id);
			}
			await loadReturns();
		} catch (err) {
			console.error(err);
			toast("Cập nhật yêu cầu đổi trả thất bại. Vui lòng thử lại.");
		} finally {
			setReturnActionLoading(null);
		}
	};

	const normalizeShipmentStatus = (status?: string | null) => status?.toLowerCase() ?? "";
	const isPendingShipmentStatus = (status?: string | null) => {
		const normalized = normalizeShipmentStatus(status);
		return normalized === "not_shipped" || normalized === "pending" || normalized === "ready_to_pick";
	};
	const isShippingShipmentStatus = (status?: string | null) => {
		const normalized = normalizeShipmentStatus(status);
		return normalized === "shipping" || normalized === "shipped" || normalized === "delivered";
	};
	const isCancelledShipmentStatus = (status?: string | null) => {
		const normalized = normalizeShipmentStatus(status);
		return normalized === "cancelled" || normalized === "returned";
	};

	const filteredOrders = useMemo(() => {
		if (activeTab === "pending") {
			return orders.filter((order) => {
				const isCancelled =
					order.orderStatus?.toLowerCase() === "cancelled" || isCancelledShipmentStatus(order.shipmentStatus);
				return (
					!isCancelled &&
					!order.ghnOrderCode &&
					(isPendingShipmentStatus(order.shipmentStatus) || !order.shipmentStatus)
				);
			});
		}
		if (activeTab === "shipping") {
			return orders.filter(
				(order) =>
					isShippingShipmentStatus(order.shipmentStatus) ||
					!!order.ghnOrderCode,
			);
		}
		return orders.filter(
			(order) =>
				order.orderStatus?.toLowerCase() === "cancelled" ||
				isCancelledShipmentStatus(order.shipmentStatus),
		);
	}, [orders, activeTab]);

	const isOrderCancelled = (order: Order) =>
		order.orderStatus?.toLowerCase() === "cancelled" || isCancelledShipmentStatus(order.shipmentStatus);

	const resolveAddressCodes = async (parsed: ParsedAddress) => {
		let provinceList = provinces.length ? provinces : null;
		if (!provinceList) {
			try {
				provinceList = await fetchProvinces();
				setProvinces(provinceList);
			} catch (err) {
				console.error("Tải danh sách tỉnh/thành thất bại.", err);
				return { provinceMatch: undefined, districtMatch: undefined, wardMatch: undefined };
			}
		}

		const provinceMatch = parsed.province
			? provinceList.find((p) => isNameMatch(parsed.province!, p.ProvinceName, p.NameExtension))
			: undefined;

		let districtMatch: District | undefined;
		if (provinceMatch && parsed.district) {
			const districts = await getDistrictsForProvince(provinceMatch.ProvinceID);
			districtMatch = districts.find((d) => isNameMatch(parsed.district!, d.DistrictName, d.NameExtension));
		}

		let wardMatch: Ward | undefined;
		if (districtMatch && parsed.ward) {
			const wards = await getWardsForDistrict(districtMatch.DistrictID);
			wardMatch = wards.find((w) => isNameMatch(parsed.ward!, w.WardName, w.NameExtension));
		}

		return { provinceMatch, districtMatch, wardMatch };
	};

	const openCreateForm = (order: Order) => {
		const parsed = parseShippingAddress(order.shippingAddress);
		const baseForm: CreateShippingOrderPayload = {
			orderId: order.id,
			toName: order.user?.name || "",
			toPhone: order.user?.phone || parsed.phone || "",
			toAddress: parsed.street || order.shippingAddress,
			toWardCode: "",
			toDistrictId: 0,
			toProvinceName: parsed.province || "",
			note: "",
			codAmount: Number(order.totalAmount) || 0,
			weight: DEFAULT_DIMENSIONS.weight,
			length: DEFAULT_DIMENSIONS.length,
			width: DEFAULT_DIMENSIONS.width,
			height: DEFAULT_DIMENSIONS.height,
			serviceId: 0,
			serviceTypeId: 2,
			insuranceValue: Number(order.totalAmount) || 0,
			pickStationId: null,
			deliverStationId: null,
			pickShift: [2],
			content: `Đơn #${order.id}`,
			returnPhone: "",
			returnAddress: "",
			returnDistrictId: null,
			returnWardCode: "",
			items:
				order.items?.map((item) => ({
					name: item.variant?.product?.name || "Sản phẩm",
					code: item.variant?.sku,
					quantity: item.quantity,
					price: Number(item.variant?.price || item.price || 0),
					weight: DEFAULT_DIMENSIONS.weight,
				})) || [],
		};

		setSelectedOrder(order);
		setParsedAddress(parsed);
		setForm(baseForm);
		setMatchedNames({});
		setProvinceId(null);
		setDistrictId(null);
		setDistrictName(parsed.district || "");
		setWardName(parsed.ward || "");
		setError(null);

		if (parsed.province || parsed.district || parsed.ward) {
			(resolveAddressCodes(parsed) as Promise<{
				provinceMatch?: Province;
				districtMatch?: District;
				wardMatch?: Ward;
			}>).then(({ provinceMatch, districtMatch, wardMatch }) => {
				if (provinceMatch || districtMatch || wardMatch) {
					setForm((prev) =>
						prev
							? {
									...prev,
									toProvinceName: provinceMatch?.ProvinceName || prev.toProvinceName,
									toDistrictId: districtMatch?.DistrictID ?? prev.toDistrictId,
									toWardCode: wardMatch?.WardCode ?? prev.toWardCode,
							  }
							: prev,
					);
					setProvinceId(provinceMatch?.ProvinceID ?? null);
					setDistrictId(districtMatch?.DistrictID ?? null);
					setMatchedNames({
						province: provinceMatch?.ProvinceName,
						district: districtMatch?.DistrictName,
						ward: wardMatch?.WardName,
					});
				}
			});
		}
	};

	const closeForm = () => {
		setSelectedOrder(null);
		setParsedAddress(null);
		setForm(null);
		setMatchedNames({});
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form) return;
		if (!form.toWardCode || !form.toDistrictId) {
			setError("Vui lòng điền đúng Mã phường và Mã quận/huyện.");
			return;
		}

		setSubmitting(true);
		try {
			await createShippingOrder({
				...form,
				toDistrictId: Number(form.toDistrictId),
				codAmount: Number(form.codAmount) || 0,
				weight: Number(form.weight) || DEFAULT_DIMENSIONS.weight,
				length: Number(form.length) || DEFAULT_DIMENSIONS.length,
				width: Number(form.width) || DEFAULT_DIMENSIONS.width,
				height: Number(form.height) || DEFAULT_DIMENSIONS.height,
				insuranceValue: Number(form.insuranceValue) || 0,
				pickStationId: form.pickStationId ? Number(form.pickStationId) : null,
				deliverStationId: form.deliverStationId ? Number(form.deliverStationId) : null,
			});

			toast("Tạo đơn giao hàng GHN thành công!");
			closeForm();
			await loadOrders();
		} catch (err: any) {
			console.error(err);
			setError(err?.message || "Tạo đơn giao hàng thất bại.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancelShipping = async (order: Order) => {
		if (!order.ghnOrderCode) return;
		if (!window.confirm("Bạn có chắc muốn hủy đơn giao hàng GHN này không?")) return;
		setCancellingCode(order.ghnOrderCode);
		try {
			await cancelShippingOrder(order.ghnOrderCode);
			toast("Đã gửi yêu cầu hủy.");
			await loadOrders();
		} catch (err: any) {
			console.error(err);
			toast(err?.message || "Hủy đơn giao hàng thất bại.");
		} finally {
			setCancellingCode(null);
		}
	};

	const getTabCount = (tabId: TabKey) => {
		if (tabId === "pending") {
			return orders.filter((order) => {
				const isCancelled =
					order.orderStatus?.toLowerCase() === "cancelled" || isCancelledShipmentStatus(order.shipmentStatus);
				return (
					!isCancelled &&
					!order.ghnOrderCode &&
					(isPendingShipmentStatus(order.shipmentStatus) || !order.shipmentStatus)
				);
			}).length;
		}
		if (tabId === "shipping") {
			return orders.filter(
				(order) =>
					isShippingShipmentStatus(order.shipmentStatus) ||
					!!order.ghnOrderCode,
			).length;
		}
		return orders.filter(
			(order) =>
				order.orderStatus?.toLowerCase() === "cancelled" ||
				isCancelledShipmentStatus(order.shipmentStatus),
		).length;
	};

	const tabs = [
		{ id: "pending" as TabKey, label: "Đơn chờ xử lý", icon: Package },
		{ id: "shipping" as TabKey, label: "Đang giao/Đã giao", icon: Truck },
		{ id: "cancelled" as TabKey, label: "Đã hủy", icon: XCircle },
	];
	const safeReviews = Array.isArray(reviews) ? reviews : [];
	const safeReturns = Array.isArray(returns) ? returns : [];
	const returnFilterLabels: Record<ReturnPhase | "all", string> = {
		all: "Tất cả",
		pending: "Chờ xử lý",
		approved: "Đã duyệt",
		receiving: "Hết hàng gửi",
		completed: "Hoàn tất",
		rejected: "Từ chối",
		other: "Khác",
	};
	const returnStatusFilters: Array<{ id: ReturnPhase | "all"; label: string; accent: string }> = [
		{ id: "all", label: "Tất cả", accent: "ring-neutral-200" },
		{ id: "pending", label: "Chờ xử lý", accent: "ring-amber-200" },
		{ id: "approved", label: "Đã duyệt", accent: "ring-blue-200" },
		{ id: "receiving", label: "Hết hàng gửi", accent: "ring-purple-200" },
		{ id: "completed", label: "Hoàn tất", accent: "ring-emerald-200" },
		{ id: "rejected", label: "Từ chối", accent: "ring-error-200" },
	];
	const returnPhaseCounts = useMemo(() => {
		const counts: Record<ReturnPhase | "all", number> = {
			all: safeReturns.length,
			pending: 0,
			approved: 0,
			receiving: 0,
			completed: 0,
			rejected: 0,
			other: 0,
		};
		safeReturns.forEach((request) => {
			const phase = getReturnPhase(request.status);
			counts[phase] = (counts[phase] || 0) + 1;
		});
		return counts;
	}, [safeReturns]);
	const filteredReturns = useMemo(() => {
		if (returnStatusFilter === "all") return safeReturns;
		return safeReturns.filter((request) => getReturnPhase(request.status) === returnStatusFilter);
	}, [safeReturns, returnStatusFilter]);

	const renderMainContent = () => {
		if (sectionTab === "reviews") {
			return (
				<>
					<div className="mb-8">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-3 bg-neutral-900 rounded-xl">
								<MessageSquare className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="heading-3">Quản lý đánh giá</h1>
								<p className="text-sm text-neutral-600 mt-1">
									Theo dõi đánh giá của khách và phản hồi kịp thời.
								</p>
							</div>
						</div>
					</div>

					<form
						className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6"
						onSubmit={(e) => {
							e.preventDefault();
							setReviewSearch(reviewSearchInput.trim());
						}}
					>
						<p className="text-sm text-neutral-500">Tổng đánh giá: {reviewTotal}</p>
						<div className="flex gap-2 w-full md:w-auto">
							<input
								className="input w-full md:w-72"
								placeholder="Tìm theo bình luận hoặc phản hồi"
								value={reviewSearchInput}
								onChange={(e) => setReviewSearchInput(e.target.value)}
							/>
							<button type="submit" className="btn-secondary whitespace-nowrap">
								Tìm
							</button>
							{reviewSearch && (
								<button
									type="button"
									className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-neutral-50"
									onClick={() => {
										setReviewSearch("");
										setReviewSearchInput("");
									}}
								>
									Xóa lọc
								</button>
							)}
						</div>
					</form>

					{reviewsLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2 className="w-8 h-8 text-neutral-400 animate-spin mb-4" />
							<p className="text-neutral-600">Đang tải đánh giá...</p>
						</div>
					) : reviewsError ? (
						<div className="bg-error-50 border border-error-200 rounded-lg p-4">
							<p className="text-sm font-medium text-error-900">{reviewsError}</p>
						</div>
					) : safeReviews.length === 0 ? (
						<div className="card text-center py-16">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
								<MessageSquare className="w-8 h-8 text-neutral-400" />
							</div>
							<h3 className="text-lg font-semibold text-neutral-900 mb-2">Chưa có đánh giá</h3>
							<p className="text-neutral-600">Không có đánh giá nào phù hợp với bộ lọc.</p>
						</div>
					) : (
						<div className="space-y-4">
							{safeReviews.map((review) => {
								const starCount = Math.max(0, Math.min(5, Math.round(review.rating ?? 0)));
								return (
									<div key={review.id} className="card space-y-4">
										<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
											<div>
												<p className="font-semibold text-neutral-900">
													{review.product?.name || "Sản phẩm"} • Đánh giá #{review.id}
												</p>
												<p className="text-sm text-neutral-500">
													{review.user?.name || "Khách hàng"} •{" "}
													{review.createdAt
														? new Date(review.createdAt).toLocaleString()
														: "Không rõ ngày"}
												</p>
											</div>
											<div className="flex items-center gap-1 text-amber-500">
												{Array.from({ length: starCount }).map((_, idx) => (
													<Star key={idx} className="w-4 h-4 fill-current" />
												))}
												<span className="text-sm text-neutral-600 ml-2">{review.rating}/5</span>
											</div>
										</div>

										<p className="text-sm text-neutral-700 whitespace-pre-line">{review.comment}</p>

										{(review.reply || review.sellerReply) && (
											<div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
												<p className="text-xs font-semibold text-neutral-500 mb-1">Phản hồi của shop</p>
												<p className="text-sm text-neutral-700">
													{review.reply || review.sellerReply}
												</p>
												{review.sellerRepliedAt && (
													<p className="text-xs text-neutral-500 mt-1">
														Cập nhật {new Date(review.sellerRepliedAt).toLocaleString()}
													</p>
												)}
											</div>
										)}

										<div className="flex justify-end">
											<button
												type="button"
												className="btn-primary"
												onClick={() => openReplyModal(review)}
											>
												{review.reply || review.sellerReply ? "Sửa phản hồi" : "Phản hồi"}
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</>
			);
		}

		if (sectionTab === "returns") {
			const pipelineCount = returnPhaseCounts.approved + returnPhaseCounts.receiving;
			const completionRate =
				returnPhaseCounts.all > 0
					? Math.round((returnPhaseCounts.completed / returnPhaseCounts.all) * 100)
					: 0;
			const displayedReturns = filteredReturns;
			return (
				<>
					<div className="mb-8 space-y-4">
						<div className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-50 via-white to-white p-6 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-6">
								<div className="flex items-center gap-4">
									<div className="p-3 bg-neutral-900 rounded-2xl text-white shadow-lg shadow-neutral-900/20">
										<RefreshCw className="w-6 h-6" />
									</div>
									<div>
										<h1 className="text-2xl font-semibold text-neutral-900">Quản lý đổi hàng</h1>
										<p className="text-sm text-neutral-600">Xem và xử lý yêu cầu đổi hàng của khách hàng với phần tóm tắt rõ ràng.</p>
									</div>
								</div>
								<div className="flex flex-wrap gap-6 text-sm text-neutral-600">
									<div>
										<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tổng yêu cầu</p>
										<p className="text-2xl font-bold text-neutral-900">{returnPhaseCounts.all}</p>
									</div>
									<div>
										<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Đang xử lý</p>
										<p className="text-2xl font-bold text-neutral-900">{pipelineCount}</p>
									</div>
									<div>
										<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tỷ lệ hoàn trả</p>
										<p className="text-2xl font-bold text-neutral-900">{completionRate}%</p>
									</div>
								</div>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
							{[
								{ label: 'Chờ duyệt', value: returnPhaseCounts.pending, desc: 'Chờ nhân viên xác nhận', badge: 'text-amber-700', bg: 'bg-amber-50' },
								{ label: 'Đã duyệt', value: returnPhaseCounts.approved, desc: 'Sẵn sàng nhận hàng', badge: 'text-blue-700', bg: 'bg-blue-50' },
								{ label: 'Đang nhận', value: returnPhaseCounts.receiving, desc: 'Hàng đang vận chuyện', badge: 'text-purple-700', bg: 'bg-purple-50' },
								{ label: 'Hoàn tất', value: returnPhaseCounts.completed, desc: 'Hoàn tất thành công', badge: 'text-emerald-700', bg: 'bg-emerald-50' },
								{ label: 'Từ chối', value: returnPhaseCounts.rejected, desc: 'Không đáp ứng chính sách', badge: 'text-red-700', bg: 'bg-error-50' },
							].map((card) => (
								<div key={card.label} className={`rounded-2xl border border-neutral-100 p-4 shadow-sm ${card.bg}`}>
									<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{card.label}</p>
									<p className={`text-3xl font-bold mt-1 ${card.badge}`}>{card.value}</p>
									<p className="text-xs text-neutral-600 mt-2">{card.desc}</p>
								</div>
							))}
						</div>
					</div>

					<div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 md:p-6 mb-6 space-y-4">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<p className="text-sm font-semibold text-neutral-900">Bộ lọc & tìm kiếm</p>
								<p className="text-xs text-neutral-500">Lọc theo trạng thái hoặc từ khóa tìm nhanh.</p>
							</div>
							<p className="text-xs text-neutral-500">Hiển thị {displayedReturns.length} / {returnPhaseCounts.all} yêu cầu</p>
						</div>

						<form
							className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
							onSubmit={(e) => {
								e.preventDefault();
								setReturnSearch(returnSearchInput.trim());
							}}
						>
							<div className="relative flex-1 w-full md:max-w-md">
								<input
									className="input w-full pl-4 pr-24"
									placeholder="Tìm theo đơn, khách hàng hoặc mã SKU..."
									value={returnSearchInput}
									onChange={(e) => setReturnSearchInput(e.target.value)}
								/>
								<button
									type="submit"
									className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
								>Tìm</button>
							</div>
							{returnSearch && (
								<button
									type="button"
									className="px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
									onClick={() => {
									setReturnSearch("");
									setReturnSearchInput("");
								}}
								>Xóa lọc</button>
							)}
						</form>

						<div className="flex flex-wrap gap-2 pt-2">
							{returnStatusFilters.map((filter) => {
								const isActive = returnStatusFilter === filter.id;
								return (
									<button
										key={filter.id}
										type="button"
										onClick={() => setReturnStatusFilter(filter.id)}
										className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ring-1 ${filter.accent} ${
											isActive
												? 'bg-neutral-900 text-white border-neutral-900 shadow-md shadow-neutral-900/10'
												: 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
										}`}
									>
										<span>{filter.label}</span>
										<span className={`ml-2 text-xs ${isActive ? 'text-white/80' : 'text-neutral-500'}`}>
											{returnPhaseCounts[filter.id] ?? 0}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{returnsLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2 className="w-8 h-8 text-neutral-400 animate-spin mb-4" />
							<p className="text-neutral-600">Đang tải yêu cầu đổi trả...</p>
						</div>
					) : returnsError ? (
						<div className="bg-error-50 border border-error-200 rounded-2xl p-5">
							<p className="text-sm font-medium text-error-900">{returnsError}</p>
						</div>
					) : displayedReturns.length === 0 ? (
						<div className="card text-center py-16">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
								<RefreshCw className="w-8 h-8 text-neutral-400" />
							</div>
							<h3 className="text-lg font-semibold text-neutral-900 mb-2">Không có yêu cầu phù hợp</h3>
							<p className="text-neutral-600">
								{returnStatusFilter === 'all' ? 'Chưa có yêu cầu đổi/trả.' : `Không tìm thấy yêu cầu với trạng thái "${returnFilterLabels[returnStatusFilter]}".`}
							</p>
						</div>
					) : (
						<div className="space-y-5">
							{displayedReturns.map((request) => {
								const actions = getReturnActions(request.status);
								const evidenceImages = request.images?.slice(0, 4) ?? [];
								return (
									<div
										key={request.id}
										className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm hover:shadow-lg transition-shadow p-5 space-y-5"
									>
										<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
											<div>
												<p className="font-semibold text-neutral-900">
													Đơn #{request.orderItem?.order?.id ?? "Không có"} - Mục #{request.orderItemId}
												</p>
												<p className="text-sm text-neutral-500">
													{request.user?.name || "Khách hàng"} -
													{request.createdAt ? ` ${new Date(request.createdAt).toLocaleString()}` : " Không rõ ngày"}
												</p>
											</div>
											<div className="flex flex-col gap-1 items-start md:items-end">
												<span
													className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getReturnStatusStyle(request.status)}`}
												>
													{formatReturnStatus(request.status)}
												</span>
												{request.rejectReason && (
													<span className="text-xs text-error-600 bg-error-50 border border-error-100 px-2 py-1 rounded-lg">
														Từ chối: {request.rejectReason}
													</span>
												)}
											</div>
										</div>

										<div className="grid gap-3 md:grid-cols-3">
											<div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
												<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Sản phẩm</p>
												<p className="text-sm text-neutral-900 font-medium mt-1">
													{request.orderItem?.variant?.product?.name || "Không có"}
												</p>
												{request.orderItem?.variant?.sku && (
													<p className="text-xs text-neutral-500">Mã SKU: {request.orderItem.variant.sku}</p>
												)}
											</div>
											<div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
												<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Số lượng & giá</p>
												<p className="text-sm text-neutral-900 font-medium mt-1">
													SL {request.orderItem?.quantity || 0} - {Number(request.orderItem?.price || 0).toLocaleString("vi-VN")}
												</p>
											</div>
											<div className="md:col-span-1 rounded-xl border border-neutral-100 bg-white p-4">
												<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Lý do khách hàng</p>
												<p className="text-sm text-neutral-700 mt-1">{request.reason || "Chưa cung cấp."}</p>
											</div>
										</div>

										{evidenceImages.length ? (
											<div className="rounded-xl border border-dashed border-neutral-200 p-4">
												<p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Bằng chứng</p>
												<div className="flex flex-wrap gap-3">
													{evidenceImages.map((image, idx) => (
														<img
															key={`${request.id}-${idx}`}
															src={image}
															alt={`Minh chứng đổi trả ${request.id} ảnh ${idx + 1}`}
															className="h-18 w-18 rounded-xl object-cover border border-neutral-200"
														/>
													))}
													{request.images!.length > evidenceImages.length && (
														<span className="text-xs text-neutral-500">
															+{request.images!.length - evidenceImages.length} ảnh nữa
														</span>
													)}
												</div>
											</div>
										) : null}

										<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4 border-t border-neutral-100">
											<div className="text-xs text-neutral-500 flex flex-wrap gap-4">
												<span className="font-semibold text-neutral-900">Yêu cầu #{request.id}</span>
												<span>Tạo lúc {request.createdAt ? new Date(request.createdAt).toLocaleString() : "Không xác định"}</span>
											</div>
											{actions.length === 0 ? (
												<p className="text-sm text-neutral-500">Không có hành động tiếp theo.</p>
											) : (
												<div className="flex flex-wrap gap-2">
													{actions.map((action) => (
														<button
															key={action}
															className={getReturnActionClass(action)}
															disabled={returnActionLoading === request.id}
															onClick={() => handleReturnAction(request, action)}
														>
															{returnActionLoading === request.id ? (
																<>
																	<Loader2 className="w-4 h-4 animate-spin" />
																	Đang cập nhật...
																</>
															) : (
																action === "receive" &&
																request.status?.toLowerCase() === "received"
																	? "Gửi đơn hàng"
																	: actionLabels[action]
															)}
														</button>
													))}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</>
			);
		}


		return (
			<>
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-3 bg-neutral-900 rounded-xl">
							<Truck className="w-6 h-6 text-white" />
						</div>
						<div>
							<h1 className="heading-3">Quản lý giao hàng</h1>
							<p className="text-sm text-neutral-600 mt-1">
							Theo dõi và xử lý đơn hàng, tạo đơn giao hàng GHN
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-3 mb-8">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`group flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
									isActive
										? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
										: "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
								}`}
							>
								<Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
								<span>{tab.label}</span>
								{getTabCount(tab.id) > 0 && (
									<span
										className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
											isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
										}`}
									>
										{getTabCount(tab.id)}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center py-16">
						<Loader2 className="w-8 h-8 text-neutral-400 animate-spin mb-4" />
						<p className="text-neutral-600">Đang tải danh sách đơn hàng...</p>
					</div>
				) : filteredOrders.length === 0 ? (
					<div className="card text-center py-16">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
							<Package className="w-8 h-8 text-neutral-400" />
						</div>
						<h3 className="text-lg font-semibold text-neutral-900 mb-2">Không có đơn hàng</h3>
						<p className="text-neutral-600">Hiện chưa có đơn hàng nào trong mục này.</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredOrders.map((order) => {
							return (
								<div key={order.id} className="card hover:shadow-md transition-shadow">
									<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-3">
												<div className="p-2 bg-neutral-100 rounded-lg">
													<FileText className="w-5 h-5 text-neutral-600" />
												</div>
												<div>
													<h3 className="font-semibold text-lg text-neutral-900">Đơn #{order.id}</h3>
													{order.ghnOrderCode && (
														<div className="flex items-center gap-1 mt-1">
															<Truck className="w-3 h-3 text-neutral-500" />
															<span className="text-xs text-neutral-600 font-mono">
																GHN: {order.ghnOrderCode}
															</span>
														</div>
													)}
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
												<div className="flex items-center gap-2 text-neutral-600">
													<User className="w-4 h-4 text-neutral-400" />
													<span className="font-medium">{order.user?.name || "Không có"}</span>
												</div>
												<div className="flex items-center gap-2 text-neutral-600">
													<Phone className="w-4 h-4 text-neutral-400" />
													<span>{order.user?.phone || "Không có"}</span>
												</div>
												<div className="flex items-center gap-2 text-neutral-600">
													<Calendar className="w-4 h-4 text-neutral-400" />
													<span>
														{order.createdAt
															? new Date(order.createdAt).toLocaleDateString("vi-VN")
															: "Không có"}
													</span>
												</div>
											</div>

											<div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium mb-3">
												{order.shipmentStatus === "delivered" ? (
													<CheckCircle2 className="w-3 h-3" />
												) : order.shipmentStatus === "cancelled" ||
												  order.orderStatus?.toLowerCase() === "cancelled" ? (
													<XCircle className="w-3 h-3" />
												) : (
													<AlertCircle className="w-3 h-3" />
												)}
												<span>
													{order.shipmentStatus === "delivered"
														? "Đã giao"
														: order.shipmentStatus === "shipping" || order.shipmentStatus === "shipped"
															? "Đang giao"
															: order.shipmentStatus === "cancelled" ||
																	order.orderStatus?.toLowerCase() === "cancelled"
																? "Đã hủy"
																: "Chờ xử lý"}
												</span>
											</div>
										</div>

										<div className="lg:text-right">
											<p className="text-xs text-neutral-500 mb-1">Tổng tiền</p>
											<p className="text-2xl font-bold text-neutral-900">
												{Number(order.totalAmount).toLocaleString("vi-VN")}
											</p>
										</div>
									</div>

									<div className="bg-neutral-50 rounded-lg p-3 mb-4">
										<div className="flex items-start gap-2">
											<MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
											<p className="text-sm text-neutral-700">{order.shippingAddress}</p>
										</div>
									</div>

									<div className="mb-4">
										<p className="text-xs font-medium text-neutral-500 mb-2">Sản phẩm</p>
										<div className="space-y-1">
											{order.items?.slice(0, 3).map((item) => (
												<div key={item.id} className="flex items-center justify-between text-sm">
													<span className="text-neutral-700">
														{item.variant?.product?.name || "Sản phẩm"}
													</span>
													<span className="text-neutral-500 font-medium">x{item.quantity}</span>
												</div>
											))}
											{(order.items?.length || 0) > 3 && (
												<p className="text-xs text-neutral-500 mt-2">
													...và {order.items!.length - 3} sản phẩm nữa
												</p>
											)}
										</div>
									</div>

									<div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
										{activeTab === "pending" ? (
											isOrderCancelled(order) ? (
												<div className="flex items-center gap-2 text-sm text-error-600">
													<XCircle className="w-4 h-4" />
													<span>Đơn đã hủy</span>
												</div>
											) : (
												<button
													className="btn-primary flex items-center gap-2"
													onClick={() => openCreateForm(order)}
												>
													<Truck className="w-4 h-4" />
													Tạo đơn GHN
												</button>
											)
										) : activeTab === "shipping" ? (
											order.ghnOrderCode ? (
												<button
													className="btn-secondary flex items-center gap-2 text-error-600 border-error-300 hover:bg-error-50"
													disabled={cancellingCode === order.ghnOrderCode}
													onClick={() => handleCancelShipping(order)}
												>
													{cancellingCode === order.ghnOrderCode ? (
														<>
															<Loader2 className="w-4 h-4 animate-spin" />
															Đang hủy...
														</>
													) : (
														<>
															<XCircle className="w-4 h-4" />
															Hủy giao hàng
														</>
													)}
												</button>
											) : (
												<div className="flex items-center gap-2 text-sm text-neutral-500">
													<AlertCircle className="w-4 h-4" />
													<span>Không có mã GHN</span>
												</div>
											)
										) : (
											<div className="flex items-center gap-2 text-sm text-error-600 font-medium">
												<XCircle className="w-4 h-4" />
												<span>Đã hủy giao hàng</span>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</>
		);
	};

	return (
		<main className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
			<div className="flex">
				<aside className="hidden lg:flex flex-col gap-2 w-64 bg-neutral-900 text-white min-h-screen p-6">
					<div className="mb-4">
						<p className="text-sm text-neutral-400">Bảng điều khiển</p>
						<h2 className="text-2xl font-bold">Thao tác</h2>
					</div>
					<button
						className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
							sectionTab === "shipping" ? "bg-white/10" : "hover:bg-white/5"
						}`}
						onClick={() => setSectionTab("shipping")}
					>
						<Truck className="w-5 h-5" />
						Tạo đơn giao hàng
					</button>
					<button
						className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
							sectionTab === "reviews" ? "bg-white/10" : "hover:bg-white/5"
						}`}
						onClick={() => setSectionTab("reviews")}
					>
						<MessageSquare className="w-5 h-5" />
						Quản lý bình luận
					</button>
					<button
						className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
							sectionTab === "returns" ? "bg-white/10" : "hover:bg-white/5"
						}`}
						onClick={() => setSectionTab("returns")}
					>
						<RefreshCw className="w-5 h-5" />
						Quản lý đổi hàng
					</button>
					<div className="mt-4 pt-4 border-t border-white/10">
						<p className="text-xs uppercase tracking-wide text-neutral-400 mb-3">Quản lý</p>
						<Link
							to="/staff/categories"
							className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-white/5"
						>
							<FolderTree className="w-5 h-5" />
							Quản lý danh mục
						</Link>
						<Link
							to="/staff/products"
							className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-white/5"
						>
							<Package className="w-5 h-5" />
							Quản lý sản phẩm
						</Link>
						<Link
							to="/staff/discounts"
							className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-white/5"
						>
							<Tag className="w-5 h-5" />
							Quản lý khuyến mãi
						</Link>
						<Link
							to="/staff/users"
							className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-white/5"
						>
							<Users className="w-5 h-5" />
							Quản lý người dùng
						</Link>
					</div>
					<Link
						to="/"
						className="mt-4 w-full inline-flex items-center justify-center px-4 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-center"
					>
						Về trang chủ
					</Link>
				</aside>

				<div className="flex-1">
					<Container>{renderMainContent()}</Container>
				</div>
			</div>

	{selectedOrder && form && (
				<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
						{/* Header */}
						<div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-neutral-50 to-white">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-neutral-900 rounded-lg">
									<Truck className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="heading-4">Tạo đơn giao hàng GHN</h2>
									<p className="text-sm text-neutral-600">Đơn #{selectedOrder.id}</p>
								</div>
							</div>
							<button
								className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
								onClick={closeForm}
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Form Content */}
						<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
							{/* Customer Information */}
							<div className="space-y-4">
								<h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
									<User className="w-4 h-4" />
									Thông tin người nhận
								</h3>
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1.5">
											Tên người nhận <span className="text-error-500">*</span>
										</label>
										<input
											className="input"
											placeholder="Nhập tên người nhận"
											value={form.toName}
											onChange={(e) => setForm({ ...form, toName: e.target.value })}
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1.5">
											Số điện thoại <span className="text-error-500">*</span>
										</label>
										<input
											className="input"
											placeholder="Nhập số điện thoại"
											value={form.toPhone}
											onChange={(e) => setForm({ ...form, toPhone: e.target.value })}
											required
										/>
									</div>
								</div>
							</div>

							{/* Address Information */}
							<div className="space-y-4">
								<h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
									<MapPin className="w-4 h-4" />
									Địa chỉ giao hàng
								</h3>
								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1.5">
										Địa chỉ chi tiết <span className="text-error-500">*</span>
									</label>
									<textarea
										className="input min-h-[80px] resize-none"
										placeholder="Số nhà, tên đường..."
										value={form.toAddress}
										onChange={(e) => setForm({ ...form, toAddress: e.target.value })}
										required
									/>
								</div>
								<div className="grid md:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1.5">
											Phường/Xã
										</label>
										<input
											className="input"
											placeholder="Nhập phường/xã"
											value={wardName}
											onChange={(e) => handleWardInputChange(e.target.value)}
										/>
										{matchedNames.ward && (
											<p className="text-xs text-success-600 mt-1 flex items-center gap-1">
												<CheckCircle2 className="w-3 h-3" />
												Khớp: {matchedNames.ward}
											</p>
										)}
									</div>
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1.5">
											Quận/Huyện
										</label>
										<input
											className="input"
											placeholder="Nhập quận/huyện"
											value={districtName}
											onChange={(e) => handleDistrictInputChange(e.target.value)}
										/>
										{matchedNames.district && (
											<p className="text-xs text-success-600 mt-1 flex items-center gap-1">
												<CheckCircle2 className="w-3 h-3" />
												Khớp: {matchedNames.district}
											</p>
										)}
									</div>
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1.5">
											Tỉnh/Thành phố
										</label>
										<input
											className="input"
											placeholder="Nhập tỉnh/thành phố"
											value={form.toProvinceName || ""}
											onChange={(e) => handleProvinceInputChange(e.target.value)}
										/>
										{matchedNames.province && (
											<p className="text-xs text-success-600 mt-1 flex items-center gap-1">
												<CheckCircle2 className="w-3 h-3" />
												Khớp: {matchedNames.province}
											</p>
										)}
									</div>
								</div>
							</div>
							{/* Debug Info (Collapsible) */}
							{Boolean(parsedAddress || matchedNames.ward || matchedNames.district || matchedNames.province) && (
								<div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
									<p className="text-xs font-semibold text-neutral-700 mb-2">Thông tin đối chiếu địa chỉ</p>
									<div className="space-y-1.5 text-xs">
										<div className="flex items-center gap-2">
											<span className="text-neutral-500">Khách hàng nhập:</span>
											<span className="text-neutral-700 font-mono">
												{parsedAddress?.ward || "?"}, {parsedAddress?.district || "?"},{" "}
												{parsedAddress?.province || "?"}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-neutral-500">Khớp:</span>
											<span className="text-success-600 font-medium">
												{matchedNames.ward || "?"}, {matchedNames.district || "?"}, {matchedNames.province || "?"}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-neutral-500">Mã GHN:</span>
											<span className="font-mono text-neutral-700">
												{form.toWardCode || "Chưa xác định"}
											</span>
											<span className="text-neutral-400">·</span>
											<span className="text-neutral-500">Mã quận/huyện:</span>
											<span className="font-mono text-neutral-700">
												{form.toDistrictId ? form.toDistrictId : "Chưa xác định"}
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Package Dimensions */}
							<div className="space-y-4">
								<h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
									<Box className="w-4 h-4" />
									Kích thước & Khối lượng
								</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									{([
										{ field: "weight" as const, label: "Khối lượng (g)", icon: Weight },
										{ field: "length" as const, label: "Dài (cm)", icon: Ruler },
										{ field: "width" as const, label: "Rộng (cm)", icon: Ruler },
										{ field: "height" as const, label: "Cao (cm)", icon: Ruler },
									] as const).map(({ field, label, icon: Icon }) => (
										<div key={field}>
											<label className="block text-sm font-medium text-neutral-700 mb-1.5">
												{label}
											</label>
											<div className="relative">
												<Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
												<input
													className="input pl-10"
													type="number"
													placeholder="0"
													value={form[field]}
													onChange={(e) =>
														setForm({
															...form,
															[field]: Number(e.target.value),
														})
													}
												/>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Financial Information */}
							<div className="space-y-4">
								<h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
									<DollarSign className="w-4 h-4" />
									Thông tin thanh toán
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1.5">
											Tiền thu hộ (₫)
										</label>
										<input
											className="input"
											type="number"
											placeholder="0"
											value={form.codAmount}
											onChange={(e) => setForm({ ...form, codAmount: Number(e.target.value) })}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-2">
											<Shield className="w-4 h-4" />
											Giá trị bảo hiểm (₫)
										</label>
										<input
											className="input"
											type="number"
											placeholder="0"
											value={form.insuranceValue}
											onChange={(e) => setForm({ ...form, insuranceValue: Number(e.target.value) })}
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-2">
										<MessageSquare className="w-4 h-4" />
										Ghi chú
									</label>
									<textarea
										className="input min-h-[80px] resize-none"
										placeholder="Nhập ghi chú (không bắt buộc)..."
										value={form.note || ""}
										onChange={(e) => setForm({ ...form, note: e.target.value })}
									/>
								</div>
							</div>

							{/* Error Message */}
							{error && (
								<div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start gap-3">
									<AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-error-900">Đã xảy ra lỗi</p>
										<p className="text-sm text-error-700 mt-1">{error}</p>
									</div>
								</div>
							)}

							{/* Form Actions */}
							<div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
								<button
									type="button"
									className="btn-secondary flex items-center gap-2"
									onClick={closeForm}
									disabled={submitting}
								>
									<X className="w-4 h-4" />
									Hủy
								</button>
								<button
									type="submit"
									className="btn-primary flex items-center gap-2"
									disabled={submitting}
								>
									{submitting ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Đang tạo...
										</>
									) : (
										<>
											<CheckCircle2 className="w-4 h-4" />
											Tạo đơn giao hàng
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			{replyingReview && (
				<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
						<div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
							<div>
								<p className="text-xs text-neutral-500">Đang phản hồi đánh giá #{replyingReview.id}</p>
								<h3 className="text-lg font-semibold text-neutral-900">
									{replyingReview.user?.name || "Khách hàng"}
								</h3>
							</div>
							<button
								className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
								onClick={closeReplyModal}
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleSubmitReply} className="p-6 space-y-4">
							<div className="space-y-1">
								<p className="text-xs font-semibold text-neutral-500">Bình luận của khách</p>
								<div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
									{replyingReview.comment}
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-1.5">
									Phản hồi của bạn <span className="text-error-500">*</span>
								</label>
								<textarea
									className="input min-h-[120px] resize-none"
									placeholder="Nhập phản hồi..."
									value={replyMessage}
									onChange={(e) => setReplyMessage(e.target.value)}
									required
								/>
							</div>
							<div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
								<button
									type="button"
									className="btn-secondary"
									onClick={closeReplyModal}
									disabled={replySubmitting}
								>
									Hủy
								</button>
								<button type="submit" className="btn-primary flex items-center gap-2" disabled={replySubmitting}>
									{replySubmitting ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Đang gửi...
										</>
									) : (
										<>
											<CheckCircle2 className="w-4 h-4" />
											Gửi phản hồi
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
}
