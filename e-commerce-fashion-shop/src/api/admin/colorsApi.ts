const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type Color = {
    id: number;
    color: string;
    createdAt: string;
    updatedAt: string;
};

export type CreateColorPayload = {
    color: string;
};

export type UpdateColorPayload = {
    id: number;
    color: string;
};

export async function getColors(token: string): Promise<Color[]> {
    const res = await fetch(`${API_BASE}/product-colors`, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function createColor(token: string, payload: CreateColorPayload): Promise<Color> {
    const res = await fetch(`${API_BASE}/product-colors/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateColor(token: string, payload: UpdateColorPayload): Promise<Color> {
    const res = await fetch(`${API_BASE}/product-colors/update`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function deleteColor(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/product-colors/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

