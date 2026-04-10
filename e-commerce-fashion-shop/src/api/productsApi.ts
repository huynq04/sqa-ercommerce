const API_BASE = "http://localhost:3000/api/v1";
import type { Product } from "../types/product";

export type ProductsResponse = {
    data: Product[];
    total: number;
    page: number;
    limit: number;
};

export async function getProducts(params?: {
    page?: number;
    limit?: number;
    sort?: string;
}): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);

    const url = `${API_BASE}/products${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getProduct(id: number): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

