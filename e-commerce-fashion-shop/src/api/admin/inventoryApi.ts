const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type InventoryItem = {
    id: number;
    productId: number;
    variantId: number | null;
    quantity: number;
    location: string;
    product?: {
        id: number;
        name: string;
    };
    variant?: {
        id: number;
        sku: string;
    };
};

export type InventoryResponse = {
    data: InventoryItem[];
    total: number;
    page: number;
    limit: number;
};

export type UpdateInventoryPayload = {
    id: number;
    quantity?: number;
    location?: string;
};

export async function getInventory(token: string, params?: {
    page?: number;
    limit?: number;
}): Promise<InventoryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `${API_BASE}/inventory${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateInventory(token: string, payload: UpdateInventoryPayload): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory/update`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

