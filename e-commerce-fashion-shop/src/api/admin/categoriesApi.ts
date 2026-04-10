const API_BASE = "http://localhost:3000/api/v1/admin";
import type { Category } from "../../types/category";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type CreateCategoryPayload = {
    name: string;
    description: string;
    parentId?: number | null;
};

export type UpdateCategoryPayload = {
    id: number;
    name?: string;
    description?: string;
    parentId?: number | null;
};

export async function createCategory(token: string, payload: CreateCategoryPayload): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/create`, {
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

export async function updateCategory(token: string, payload: UpdateCategoryPayload): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/update`, {
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

export async function deleteCategory(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
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

