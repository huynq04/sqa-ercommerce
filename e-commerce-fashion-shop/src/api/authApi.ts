const API_BASE = "http://localhost:3000/api/v1";

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
};

export type AuthResponse = {
    access_token: string;
};

export type ProfileResponse = {
    sub: number;
    email: string;
    role: string;
    iat: number;
    exp: number;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const message = await res.text();
        const error = new Error(message) as Error & { status?: number };
        error.status = res.status;
        throw error;
    }
    return res.json();
}

export async function register(payload: RegisterPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function verifyOtp(payload: { email: string; otp: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function resetPassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
}): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getProfile(token: string): Promise<ProfileResponse> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

