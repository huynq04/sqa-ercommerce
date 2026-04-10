const API_URL = "http://localhost:3000/api/v1/cart";

export async function getCart(token: string) {
    return fetch(API_URL, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).then(res => res.json());
}

export async function addToCart(token: string, variantId: number, quantity = 1) {
    return fetch(`${API_URL}/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ variantId, quantity })
    }).then(res => res.json());
}

export async function updateCartItem(token: string, itemId: number, quantity: number) {
    return fetch(`${API_URL}/${itemId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
    }).then(res => res.json());
}

export async function removeCartItem(token: string, itemId: number) {
    return fetch(`${API_URL}/${itemId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).then(res => res.json());
}

export async function clearCart(token: string) {
    return fetch(API_URL, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).then(res => res.json());
}
