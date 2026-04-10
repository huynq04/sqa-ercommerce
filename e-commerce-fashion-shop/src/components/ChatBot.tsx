import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
	id: number;
	text: string;
	sender: "user" | "bot";
	timestamp: Date;
}

const QUICK_REPLIES = [
	"Thông tin sản phẩm",
	"Trạng thái đơn hàng",
	"Giao hàng & đổi trả",
	"Phương thức thanh toán",
	"Liên hệ hỗ trợ",
];

const BOT_RESPONSES: Record<string, string> = {
	"product information": "Chúng tôi có nhiều sản phẩm thời trang như quần áo, phụ kiện và nhiều hơn nữa. Bạn có thể xem danh mục ở mục Cửa hàng. Bạn đang tìm sản phẩm cụ thể nào?",
	"order status": "Để kiểm tra trạng thái đơn hàng, vui lòng vào trang Đơn hàng trong tài khoản của bạn. Bạn cần đăng nhập để xem đơn. Mình có thể hỗ trợ gì thêm không?",
	"shipping & returns": "Chúng tôi hỗ trợ giao hàng miễn phí cho mọi đơn hàng! Đổi trả trong vòng 30 ngày kể từ khi mua. Sản phẩm cần còn nguyên tem và bao bì. Bạn muốn biết thêm chi tiết không?",
	"payment methods": "Chúng tôi chấp nhận COD và VNPay cho thanh toán online. Mọi giao dịch đều an toàn và được mã hóa. Bạn muốn hỏi về phương thức nào?",
	"contact support": "Đội ngũ hỗ trợ trực tuyến 24/7. Bạn có thể chat tại đây, email support@shop.com, hoặc gọi +84 123 456 789. Mình có thể giúp gì cho bạn?",
};

export default function ChatBot() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: 1,
			text: "Xin chào! Mình là trợ lý mua sắm. Mình có thể giúp gì cho bạn hôm nay?",
			sender: "bot",
			timestamp: new Date(),
		},
	]);
	const [inputValue, setInputValue] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const handleSendMessage = (text: string) => {
		if (!text.trim()) return;

		// Add user message
		const userMessage: Message = {
			id: messages.length + 1,
			text: text.trim(),
			sender: "user",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");
		setIsTyping(true);

		// Simulate bot response
		setTimeout(() => {
			const botResponse = generateBotResponse(text.trim().toLowerCase());
			const botMessage: Message = {
				id: messages.length + 2,
				text: botResponse,
				sender: "bot",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, botMessage]);
			setIsTyping(false);
		}, 1000 + Math.random() * 1000);
	};

	const generateBotResponse = (userInput: string): string => {
		// Check for keywords in user input
		for (const [key, response] of Object.entries(BOT_RESPONSES)) {
			if (userInput.includes(key)) {
				return response;
			}
		}

		// Default responses
		if (userInput.includes("hello") || userInput.includes("hi") || userInput.includes("hey")) {
			return "Xin chào! Mình ở đây để hỗ trợ mua sắm. Bạn muốn tìm hiểu điều gì?";
		}

		if (userInput.includes("thank") || userInput.includes("thanks")) {
			return "Rất vui được hỗ trợ! Bạn cần thêm gì nữa không?";
		}

		if (userInput.includes("bye") || userInput.includes("goodbye")) {
			return "Tạm biệt! Khi cần hỗ trợ hãy quay lại nhé. Chúc bạn mua sắm vui vẻ!";
		}

		// Generic response
		return "Mình hiểu bạn đang hỏi về: \"" + userInput + "\". Mình có thể hỗ trợ về sản phẩm, đơn hàng, giao hàng, thanh toán hoặc liên hệ hỗ trợ. Bạn cần thông tin cụ thể nào?";
	};

	const handleQuickReply = (reply: string) => {
		handleSendMessage(reply);
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage(inputValue);
		}
	};

	return (
		<>
			{/* Floating Button */}
			{!isOpen && (
				<button
					onClick={() => setIsOpen(true)}
					className="fixed bottom-6 right-6 w-14 h-14 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
					aria-label="Mở chat"
				>
					<MessageCircle className="h-6 w-6" />
					{/* Notification badge */}
					<span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></span>
				</button>
			)}

			{/* Chat Window */}
			{isOpen && (
				<div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-neutral-200 overflow-hidden">
					{/* Header */}
					<div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
								<Bot className="h-6 w-6" />
							</div>
							<div>
								<h3 className="font-semibold">Hỗ trợ khách hàng</h3>
								<p className="text-xs text-neutral-300">Đang trực tuyến</p>
							</div>
						</div>
						<button
							onClick={() => setIsOpen(false)}
							className="text-white hover:text-neutral-200 transition-colors p-1"
							aria-label="Đóng chat"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Messages Container */}
					<div className="flex-1 overflow-y-auto p-4 bg-neutral-50 space-y-4">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
							>
								{message.sender === "bot" && (
									<div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
										<Bot className="h-4 w-4 text-white" />
									</div>
								)}
								<div
									className={`max-w-[75%] rounded-2xl px-4 py-2 ${
										message.sender === "user"
											? "bg-neutral-900 text-white rounded-br-sm"
											: "bg-white text-neutral-900 rounded-bl-sm shadow-sm border border-neutral-200"
									}`}
								>
									<p className="text-sm leading-relaxed">{message.text}</p>
									<p
										className={`text-xs mt-1 ${
											message.sender === "user" ? "text-neutral-300" : "text-neutral-500"
										}`}
									>
										{message.timestamp.toLocaleTimeString("en-US", {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
								{message.sender === "user" && (
									<div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
										<User className="h-4 w-4 text-neutral-600" />
									</div>
								)}
							</div>
						))}

						{/* Typing Indicator */}
						{isTyping && (
							<div className="flex gap-3 justify-start">
								<div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
									<Bot className="h-4 w-4 text-white" />
								</div>
								<div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-neutral-200 px-4 py-3">
									<div className="flex gap-1">
										<div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
										<div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
										<div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
									</div>
								</div>
							</div>
						)}

						{/* Quick Replies */}
						{messages.length === 1 && !isTyping && (
							<div className="space-y-2">
								<p className="text-xs text-neutral-500 font-medium">Gợi ý nhanh:</p>
								<div className="flex flex-wrap gap-2">
									{QUICK_REPLIES.map((reply, index) => (
										<button
											key={index}
											onClick={() => handleQuickReply(reply)}
											className="px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-full hover:bg-neutral-100 hover:border-neutral-900 transition-colors text-neutral-700"
										>
											{reply}
										</button>
									))}
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className="border-t border-neutral-200 bg-white p-4">
						<div className="flex gap-2">
							<input
								ref={inputRef}
								type="text"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Nhập tin nhắn..."
								className="flex-1 px-4 py-2 border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm"
								disabled={isTyping}
							/>
							<button
								onClick={() => handleSendMessage(inputValue)}
								disabled={!inputValue.trim() || isTyping}
								className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								aria-label="Gửi tin nhắn"
							>
								<Send className="h-5 w-5" />
							</button>
						</div>
						<p className="text-xs text-neutral-500 mt-2 text-center">
							Nhấn Enter để gửi
						</p>
					</div>
				</div>
			)}
		</>
	);
}

