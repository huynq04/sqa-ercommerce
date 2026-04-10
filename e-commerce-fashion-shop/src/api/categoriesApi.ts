const API_BASE = "http://localhost:3000/api/v1";
import type { Category } from "../types/category";

export type CategoriesResponse = {
    data: Category[];
    total: number;
    page: number;
    limit: number;
};

export async function getCategories(params?: {
    page?: number;
    limit?: number;
    sort?: string;
}): Promise<CategoriesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);

    const url = `${API_BASE}/categories${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getCategory(id: number): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

