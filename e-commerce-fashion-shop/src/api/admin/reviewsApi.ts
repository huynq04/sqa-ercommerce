const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
	"Content-Type": "application/json",
	Authorization: `Bearer ${token}`,
});

export type AdminReview = {
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
	product?: {
		id: number;
		name: string;
	};
	createdAt?: string;
	updatedAt?: string;
};

export type AdminReviewsResponse = {
	data: AdminReview[];
	total: number;
	page: number;
	limit: number;
};

export async function getAdminReviews(
	token: string,
	params?: { page?: number; limit?: number; sort?: string; q?: string; productId?: number },
): Promise<AdminReviewsResponse> {
	const query = new URLSearchParams();
	if (params?.page) query.append("page", params.page.toString());
	if (params?.limit) query.append("limit", params.limit.toString());
	if (params?.sort) query.append("sort", params.sort);
	if (params?.q) query.append("q", params.q);
	if (params?.productId) query.append("productId", params.productId.toString());

	const res = await fetch(`${API_BASE}/reviews${query.toString() ? `?${query}` : ""}`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function getAdminReview(token: string, id: number): Promise<AdminReview> {
	const res = await fetch(`${API_BASE}/reviews/${id}`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function replyReview(token: string, id: number, reply: string): Promise<AdminReview> {
	const res = await fetch(`${API_BASE}/reviews/${id}/reply`, {
		method: "PATCH",
		headers: authHeaders(token),
		body: JSON.stringify({ reply }),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}
