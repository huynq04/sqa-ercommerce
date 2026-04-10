const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export type Shipping = {
    id: number;
    orderId: number;
    shippingAddress: string;
    shippingMethod: string;
    trackingNumber: string | null;
    status: string;
    estimatedDelivery: string | null;
    actualDelivery: string | null;
    order?: {
        id: number;
        totalAmount: string;
        user: {
            name: string;
            email: string;
        };
    };
};

export type ShippingResponse = {
    data: Shipping[];
    total: number;
    page: number;
    limit: number;
};

export type UpdateShippingPayload = {
    id: number;
    trackingNumber?: string;
    status?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
};

export async function getShippings(token: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
}): Promise<ShippingResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);

    const url = `${API_BASE}/shipping${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateShipping(token: string, payload: UpdateShippingPayload): Promise<Shipping> {
    const res = await fetch(`${API_BASE}/shipping/update`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

