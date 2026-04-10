export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
	id: number;
	message: string;
	type: ToastType;
};

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export function toast(message: string, type: ToastType = "info") {
	const payload: ToastPayload = {
		id: Date.now() + Math.floor(Math.random() * 10000),
		message,
		type,
	};
	listeners.forEach((listener) => listener(payload));
}

export function subscribeToast(listener: ToastListener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
