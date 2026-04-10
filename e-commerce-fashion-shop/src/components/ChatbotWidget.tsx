import { useState } from "react";

type ChatMessage = {
	id: number;
	sender: "user" | "bot";
	text: string;
};

export default function ChatbotWidget() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSend = async () => {
		if (!input.trim()) return;

		const userMessage: ChatMessage = {
			id: Date.now(),
			sender: "user",
			text: input.trim(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setError(null);
		setLoading(true);

		try {
			const getGuestId = () => {
				let guestId = localStorage.getItem("guestId");
				if (!guestId) {
					guestId = crypto.randomUUID();
					localStorage.setItem("guestId", guestId);
				}
				return guestId;
			};

			const guestId = getGuestId();

			const token = localStorage.getItem("token");

			const res = await fetch("http://localhost:3000/api/v1/chatbot/message", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "*/*",
					...(token && {
						Authorization: `Bearer ${token}`,
					}),
				},
				body: JSON.stringify({ message: userMessage.text , guestId}),
			});

			const data = await res.json();
			const botResponse = data?.response || "Xin lỗi, hiện tại tôi không thể trả lời.";

			setMessages((prev) => [
				...prev,
				{
					id: Date.now() + 1,
					sender: "bot",
					text: botResponse,
				},
			]);
		} catch (err: any) {
			console.error(err);
			setError("Không thể gửi tin nhắn, vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed bottom-6 right-6 z-50">
			{open && (
				<div className="mb-3 w-80 max-w-[90vw] rounded-xl border border-neutral-200 bg-white shadow-xl flex flex-col h-96">
					<div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
						<div>
							<p className="font-semibold">Trợ lý mua sắm</p>
							<p className="text-xs text-neutral-500">Trợ lý ảo hỗ trợ 24/7</p>
						</div>
						<button
							onClick={() => setOpen(false)}
							className="text-neutral-500 hover:text-neutral-900"
							aria-label="Đóng chatbot"
						>
							✕
						</button>
					</div>

					<div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
						{messages.length === 0 && (
							<p className="text-neutral-500 text-center">
								Bạn cần hỗ trợ gì? Hãy đặt câu hỏi để trợ lý ảo giúp bạn.
							</p>
						)}
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`px-3 py-2 rounded-2xl max-w-[80%] ${
										msg.sender === "user" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
									}`}
								>
									{msg.text}
								</div>
							</div>
						))}
						{error && <p className="text-xs text-red-500 text-center">{error}</p>}
					</div>

					<div className="border-t border-neutral-200 p-2 flex gap-2">
						<input
							type="text"
							className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
							placeholder="Nhập câu hỏi..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSend();
							}}
							disabled={loading}
						/>
						<button
							className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
							onClick={handleSend}
							disabled={loading}
						>
							Gửi
						</button>
					</div>
				</div>
			)}

			<button
				onClick={() => setOpen((prev) => !prev)}
				className="rounded-full bg-neutral-900 text-white px-4 py-3 shadow-lg hover:bg-neutral-800 transition-colors flex items-center gap-2"
			>
				<span role="img" aria-label="trò chuyện">
					💬
				</span>
				<span>Trợ lý ảo</span>
			</button>
		</div>
	);
}
