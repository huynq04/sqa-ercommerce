const API_BASE = "http://localhost:3000/api/v1";

export type DiscountApplyResponse = {
	code: string;
	discountPercent: number;
	discountAmount: number;
	newTotal: number;
};

export type Discount = {
	id: number;
	code: string;
	description?: string | null;
	discountPercent: number;
	startDate: string;
	endDate: string;
	usageLimit: number;
	usedCount: number;
	createdAt?: string;
	updatedAt?: string;
};

export async function getAllDiscounts(): Promise<Discount[]> {
	const res = await fetch(`${API_BASE}/discounts`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	if (!res.ok) {
		throw new Error(await res.text());
	}
	return (await res.json()) as Discount[];
}

export async function applyDiscount(code: string, totalAmount: number) {
	const res = await fetch(`${API_BASE}/discounts/apply`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ code, totalAmount }),
	});
	if (!res.ok) {
		throw new Error(await res.text());
	}
	return (await res.json()) as DiscountApplyResponse;
}
