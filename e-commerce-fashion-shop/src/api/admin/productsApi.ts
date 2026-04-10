const API_BASE = "http://localhost:3000/api/v1/admin";
import type { Product } from "../../types/product";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type CreateProductPayload = {
    name: string;
    description: string;
    price: number;
    discount: number;
    categoryId: number;
    mainImageUrl: string;
};

export type UpdateProductPayload = {
    id: number;
    name?: string;
    description?: string;
    price?: number;
    discount?: number;
    categoryId?: number;
    mainImageUrl?: string;
};

export async function createProduct(token: string, payload: CreateProductPayload): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/create`, {
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

export async function updateProduct(token: string, payload: UpdateProductPayload): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/update`, {
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

export async function deleteProduct(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
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
