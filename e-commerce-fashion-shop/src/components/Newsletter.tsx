import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "../utils/toast";

const API_BASE = "http://localhost:3000/api/v1";

export default function Newsletter() {
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = email.trim();
		if (!trimmed || submitting) return;

		setSubmitting(true);
		try {
			const query = new URLSearchParams({ to: trimmed });
			const res = await fetch(`${API_BASE}/mail/send?${query.toString()}`);
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || "Request failed");
			}
			const payload = await res.json().catch(() => null);
			toast(payload?.message || "?? g?i email ??ng k?.");
			setEmail("");
		} catch (err) {
			const message = err instanceof Error && err.message ? err.message : "G?i email th?t b?i.";
			toast(message, "error");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<section className="bg-gradient-to-br from-neutral-50 to-neutral-100 py-14 rounded-2xl border border-neutral-200">
			<div className="mx-auto max-w-3xl px-6">
				<h3 className="heading-4 text-center">Đăng ký nhận bản tin</h3>
				<p className="mt-3 body-small text-center">
					Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt.
				</p>
				<form className="mt-8 flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
					<input
						className="input flex-1"
						type="email"
						placeholder="ban@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<button type="submit" className="btn-primary whitespace-nowrap px-8" disabled={submitting}>
						{submitting ? "Đang gửi..." : "Đăng ký"}
					</button>
				</form>
			</div>
		</section>
	);
}
