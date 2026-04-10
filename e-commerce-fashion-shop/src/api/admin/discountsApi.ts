const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type Discount = {
    id: number;
    code: string;
    description: string;
    discountPercent: string;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usedCount: number;
    createdAt: string;
    updatedAt: string;
};

export type CreateDiscountPayload = {
    code: string;
    description: string;
    discountPercent: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
};

export type UpdateDiscountPayload = {
    description?: string;
    discountPercent?: number;
    startDate?: string;
    endDate?: string;
    usageLimit?: number;
};

export async function getDiscounts(): Promise<Discount[]> {
    const res = await fetch(`${API_BASE}/discounts`, {
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getDiscount(token: string, id: number): Promise<Discount> {
    const res = await fetch(`${API_BASE}/discounts/${id}`, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function createDiscount(token: string, payload: CreateDiscountPayload): Promise<Discount> {
    const res = await fetch(`${API_BASE}/discounts`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateDiscount(token: string, id: number, payload: UpdateDiscountPayload): Promise<Discount> {
    const res = await fetch(`${API_BASE}/discounts/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function deleteDiscount(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/discounts/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

