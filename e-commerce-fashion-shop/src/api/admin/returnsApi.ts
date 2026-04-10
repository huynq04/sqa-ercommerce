const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
	Authorization: `Bearer ${token}`,
	"Content-Type": "application/json",
});

export type AdminReturnRequest = {
	id: number;
	orderItemId: number;
	userId: number;
	reason: string;
	images: string[];
	status: string;
	rejectReason?: string | null;
	createdAt?: string;
	updatedAt?: string;
	user?: {
		id: number;
		name?: string | null;
		email?: string | null;
		phone?: string | null;
	};
	orderItem?: {
		id: number;
		quantity: number;
		price: string;
		variant?: {
			sku?: string;
			product?: { name?: string };
		};
		order?: { id: number; user?: { name?: string; email?: string } };
	};
};

export async function getAdminReturns(token: string, params?: { page?: number; limit?: number; sort?: string; q?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.append("page", params.page.toString());
	if (params?.limit) query.append("limit", params.limit.toString());
	if (params?.sort) query.append("sort", params.sort);
	if (params?.q) query.append("q", params.q);

	const res = await fetch(`${API_BASE}/requests/returns${query.toString() ? `?${query}` : ""}`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json() as Promise<{ data: AdminReturnRequest[]; total: number; page: number; limit: number }>;
}

export async function getAdminReturnDetail(token: string, id: number): Promise<AdminReturnRequest> {
	const res = await fetch(`${API_BASE}/requests/return/${id}`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function approveReturnRequest(token: string, id: number) {
	const res = await fetch(`${API_BASE}/requests/return/${id}/approve`, {
		method: "PATCH",
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function rejectReturnRequest(token: string, id: number, reason?: string) {
	const res = await fetch(`${API_BASE}/requests/return/${id}/reject`, {
		method: "PATCH",
		headers: authHeaders(token),
		body: JSON.stringify(reason ? { reason } : {}),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function receiveReturnRequest(token: string, id: number) {
	const res = await fetch(`${API_BASE}/requests/return/${id}/receive`, {
		method: "PATCH",
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function completeReturnRequest(token: string, id: number) {
	const res = await fetch(`${API_BASE}/requests/return/${id}/complete`, {
		method: "PATCH",
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}
