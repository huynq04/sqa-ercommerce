import type { Product } from "../types/product";

const API_BASE = "http://localhost:3000/api/v1";

export async function getRecommendations(limit = 8): Promise<Product[]> {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const query = limit ? `?limit=${limit}` : "";
    const res = await fetch(`${API_BASE}/recommendations${query}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
