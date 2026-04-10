const API_BASE = "http://localhost:3000/api/v1/admin";

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

export type User = {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    role: string;
    isVerified: boolean;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
};

export type UsersResponse = {
    data: User[];
    total: number;
    page: number;
    limit: number;
};

export type UpdateUserPayload = {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    role?: string;
    isVerified?: boolean;
};

export type CreateStaffUserPayload = {
    name: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
};

export async function getUsers(token: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    role?: string;
}): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.role) queryParams.append("role", params.role);

    const url = `${API_BASE}/users${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}

export async function getUser(token: string, id: number): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
        headers: authHeaders(token),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}

export async function updateUser(token: string, payload: UpdateUserPayload): Promise<User> {
    const res = await fetch(`${API_BASE}/users/update`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}

export async function deleteUser(token: string, id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(parseErrorMessage(text));
    }
    return res.json();
}

export async function createStaffUser(token: string, payload: CreateStaffUserPayload): Promise<User> {
    const res = await fetch(`${API_BASE}/users/staff/create`, {
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

