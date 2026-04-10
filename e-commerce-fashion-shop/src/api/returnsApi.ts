const API_BASE = "http://localhost:3000/api/v1";

const authHeaders = (token: string) => ({
	Authorization: `Bearer ${token}`,
	"Content-Type": "application/json",
});

export type UserReturnRequest = {
	id: number;
	orderItemId: number;
	userId: number;
	reason: string;
	images: string[];
	status: string;
	rejectReason?: string | null;
	createdAt?: string;
	updatedAt?: string;
	orderItem?: {
		id: number;
		quantity: number;
		price: string;
	};
};

export async function getUserReturnRequests(token: string): Promise<UserReturnRequest[]> {
	const res = await fetch(`${API_BASE}/user/requests/returns`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function createReturnRequest(token: string, payload: { orderItemId: number; reason: string; images: string[] }) {
	const res = await fetch(`${API_BASE}/user/requests/return`, {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}
