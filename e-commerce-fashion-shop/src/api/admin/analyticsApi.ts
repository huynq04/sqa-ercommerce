const API_BASE = "http://localhost:3000/api/v1/admin";

const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
});

export type RevenueStats = {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    productsSold: number;
};

export type BestSellingProduct = {
    productId: number;
    name: string;
    imageUrl: string;
    totalSold: number;
    revenue: number;
};

export type MonthlyRevenue = {
    month: string;
    revenue: number;
};

function buildQuery(params?: Record<string, string | number | undefined>) {
    const query = new URLSearchParams();
    if (!params) return "";
    Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, String(value));
    });
    const str = query.toString();
    return str ? `?${str}` : "";
}

export async function getRevenueStats(token: string, params?: {
    startDate?: string;
    endDate?: string;
}): Promise<RevenueStats> {
    const url = `${API_BASE}/reports/overview${buildQuery(params)}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getBestSellingProducts(token: string, params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
}): Promise<BestSellingProduct[]> {
    const url = `${API_BASE}/reports/best-sellers${buildQuery(params)}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getProductSales(token: string, params?: {
    startDate?: string;
    endDate?: string;
}): Promise<BestSellingProduct[]> {
    const url = `${API_BASE}/reports/product-sales${buildQuery(params)}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getRevenueByMonth(token: string, params?: {
    startDate?: string;
    endDate?: string;
}): Promise<MonthlyRevenue[]> {
    const url = `${API_BASE}/reports/revenue-by-month${buildQuery(params)}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

