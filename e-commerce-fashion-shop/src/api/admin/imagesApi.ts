const API_BASE = "http://localhost:3000/api/v1/admin";
import type { ProductImage } from "../../types/product";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type CreateImagePayload = {
    productId: number;
    imageUrl: string;
    isMain: boolean;
};

export type UpdateImagePayload = {
    isMain?: boolean;
    imageUrl?: string;
};

export async function uploadImage(token: string, payload: CreateImagePayload): Promise<{ message: string; imageUrl?: string }> {
    const res = await fetch(`${API_BASE}/product-images/upload`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateImage(token: string, id: number, payload: UpdateImagePayload): Promise<{ message: string; image: ProductImage }> {
    const res = await fetch(`${API_BASE}/product-images/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function deleteImage(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/product-images/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

