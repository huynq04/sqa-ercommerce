type BuyNowPayload = {
    variantId: number;
    quantity: number;
    paymentMethod: "vnpay" | "cod";
    shippingAddress: string;
    shippingFee: number;
    discountCode?: string;
};

type FromCartPayload = {
    paymentMethod: "vnpay" | "cod";
    shippingAddress: string;
    shippingFee: number;
    discountCode?: string;
};

const API_BASE = "http://localhost:3000/api/v1";

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

const parseErrorMessage = (text: string) => {
    try {
        const parsed = JSON.parse(text);
        const message = parsed?.message ?? parsed?.error;
        if (Array.isArray(message)) {
            return message.join(", ");
        }
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    } catch {
        // ignore parse errors
    }
    return text;
};

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
    shippingAddress: string;
    vnpTransDate: string | null;
    vnpTxnRef: string | null;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
};

export type OrdersResponse = {
    data: Order[];
    total: number;
    page: number;
    limit: number;
};

export async function getUserOrders(
    token: string,
    params?: {
        page?: number;
        limit?: number;
        sort?: string;
    }
): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);

    const url = `${API_BASE}/orders${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}

export async function getUserOrder(token: string, id: number): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}

export async function buyNow(
    token: string,
    payload: BuyNowPayload
): Promise<{ order: any; payUrl?: string }> {
    const res = await fetch(`${API_BASE}/orders/buy-now`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}

export async function checkoutFromCart(
    token: string,
    payload: FromCartPayload
): Promise<{ order: any; payUrl?: string }> {
    const res = await fetch(`${API_BASE}/orders/from-cart`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}
