const API_BASE = "http://localhost:3000/api/v1";

const authHeaders = (token: string) => ({
	"Content-Type": "application/json",
	Authorization: `Bearer ${token}`,
});

export type Review = {
	id: number;
	orderItemId: number;
	productId: number;
	rating: number;
	comment: string;
	sellerReply?: string | null;
	sellerRepliedAt?: string | null;
	reply?: string | null;
	user?: {
		id: number;
		name: string;
		email: string;
	};
	createdAt?: string;
	updatedAt?: string;
};

export type ReviewsResponse = {
	data: Review[];
	total: number;
	page: number;
	limit: number;
};

export type CreateReviewPayload = {
	orderItemId: number;
	rating: number;
	comment: string;
};

export async function createReview(token: string, payload: CreateReviewPayload) {
	const res = await fetch(`${API_BASE}/reviews`, {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

// Returns review data if exists; null if not
export async function checkOrderItemReview(token: string, orderItemId: number): Promise<Review | null> {
	const res = await fetch(`${API_BASE}/reviews/order-items/${orderItemId}/check`, {
		headers: authHeaders(token),
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function getProductReviews(
	productId: number,
	params?: { page?: number; limit?: number; sort?: string; q?: string },
	token?: string | null,
): Promise<ReviewsResponse> {
	const query = new URLSearchParams();
	if (params?.page) query.append("page", params.page.toString());
	if (params?.limit) query.append("limit", params.limit.toString());
	if (params?.sort) query.append("sort", params.sort);
	if (params?.q) query.append("q", params.q);

	const headers: Record<string, string> = {};
	if (token) headers.Authorization = `Bearer ${token}`;

	const res = await fetch(`${API_BASE}/reviews/product/${productId}${query.toString() ? `?${query}` : ""}`, {
		headers,
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}
