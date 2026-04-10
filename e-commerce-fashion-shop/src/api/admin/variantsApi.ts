const API_BASE = "http://localhost:3000/api/v1/admin";
import type { ProductVariant } from "../../types/product";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type CreateVariantPayload = {
    productId: number;
    sizeId: number;
    colorId: number;
    sku: string;
    price: number;
    stock: number;
    imageUrl: string;
};

export type UpdateVariantPayload = {
    id: number;
    sizeId?: number;
    colorId?: number;
    sku?: string;
    price?: number;
    stock?: number;
    imageUrl?: string;
};

export async function createVariant(token: string, payload: CreateVariantPayload): Promise<ProductVariant> {
    const res = await fetch(`${API_BASE}/product-variants/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
            const parsed = JSON.parse(text);
            message = parsed?.message || message;
        } catch {
            // ignore JSON parse errors
        }
        throw new Error(message);
    }
    return res.json();
}

export async function updateVariant(token: string, payload: UpdateVariantPayload): Promise<ProductVariant> {
    const res = await fetch(`${API_BASE}/product-variants/update`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
            const parsed = JSON.parse(text);
            message = parsed?.message || message;
        } catch {
            // ignore JSON parse errors
        }
        throw new Error(message);
    }
    return res.json();
}

export async function deleteVariant(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/product-variants/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
            const parsed = JSON.parse(text);
            message = parsed?.message || message;
        } catch {
            // ignore JSON parse errors
        }
        throw new Error(message);
    }
    return res.json();
}

