const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type Size = {
    id: number;
    size: string;
    createdAt: string;
    updatedAt: string;
};

export type CreateSizePayload = {
    size: string;
};

export type UpdateSizePayload = {
    id: number;
    size: string;
};

export async function getSizes(token: string): Promise<Size[]> {
    const res = await fetch(`${API_BASE}/product-sizes`, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function createSize(token: string, payload: CreateSizePayload): Promise<Size> {
    const res = await fetch(`${API_BASE}/product-sizes/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateSize(token: string, payload: UpdateSizePayload): Promise<Size> {
    const res = await fetch(`${API_BASE}/product-sizes/update`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function deleteSize(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/product-sizes/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

