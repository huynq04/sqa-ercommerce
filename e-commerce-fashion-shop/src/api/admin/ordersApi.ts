const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
});

export type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    variant: {
        id: number;
        sku: string;
        price: string;
        stock: number;
        imageUrl: string;
        product: {
            id: number;
            name: string;
            description: string;
            price: string;
            discount: string;
            stock: number;
            mainImageUrl: string;
        };
    };
};

export type Order = {
    id: number;
    totalAmount: string;
    orderStatus: string;
    paymentMethod: string;
    paymentStatus: string;
    shipmentStatus: string;
    ghnOrderCode?: string | null;
    shippingAddress: string;
    vnpTransDate: string | null;
    vnpTxnRef: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    items: OrderItem[];
};

export type OrdersResponse = {
    data: Order[];
    total: number;
    page: number;
    limit: number;
};

export async function getOrders(token: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
}): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);

    const url = `${API_BASE}/orders${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export type UpdateOrderPayload = {
    orderStatus?: string;
    paymentStatus?: string;
    shipmentStatus?: string;
    ghnOrderCode?: string | null;
};

export async function getOrder(token: string, id: number): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateOrder(token: string, id: number, payload: UpdateOrderPayload): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: "PATCH",
        headers: {
            ...authHeaders(token),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

