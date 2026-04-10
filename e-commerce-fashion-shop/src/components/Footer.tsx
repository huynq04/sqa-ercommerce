import { useEffect, useState } from "react";
import Container from "./Container";
import { Facebook, Instagram, Twitter, Mail, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";

type Policy = {
	id: number;
	title: string;
	content: string;
};

const SHOP_FACEBOOK = "https://www.facebook.com/duong.chinh.170038";
const POLICY_ENDPOINT = "http://localhost:3000/api/v1/policies";

export default function Footer() {
	const currentYear = new Date().getFullYear();
	const [policies, setPolicies] = useState<Policy[]>([]);

	useEffect(() => {
		const loadPolicies = async () => {
			try {
				const res = await fetch(POLICY_ENDPOINT);
				const data = await res.json();
				if (Array.isArray(data)) {
					setPolicies(data);
				}
			} catch (error) {
				console.error("Tải chính sách thất bại:", error);
			}
		};

		loadPolicies();
	}, []);

	const footerLinks = {
		shop: [
			// { label: "Hàng mới", to: "/shop?category=new" },
			{ label: "Nam", to: "/category/1" },
			{ label: "Nữ", to: "/category/2" },
		],
		company: [
			{ label: "Về chúng tôi", to: "/about" },
			{ label: "Liên hệ", to: "/contact" },
		],
	};

	const socialLinks = [
		{ icon: Facebook, href: SHOP_FACEBOOK, label: "Facebook" },
		{ icon: Instagram, href: SHOP_FACEBOOK, label: "Instagram" },
		{ icon: Twitter, href: SHOP_FACEBOOK, label: "Twitter" },
		{ icon: Mail, href: SHOP_FACEBOOK, label: "Hộp thư" },
	];

	return (
		<footer className="border-t border-neutral-200 mt-20 bg-neutral-900 text-white">
			<Container>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 py-12">
					<div>
						<h3 className="font-display text-2xl font-bold mb-4">Cửa hàng</h3>
						<p className="body-small text-neutral-400">
							Sản phẩm tinh gọn, thoải mái và thời trang.
						</p>
						<p className="body-small text-neutral-400 mt-4">
							Địa chỉ: 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội
						</p>
						<p className="body-small text-neutral-400">
							Hotline:{" "}
							<a
								className="text-white hover:underline"
								href="tel:0368895036"
							>
								0368 895 036
							</a>
						</p>
						<div className="mt-6 flex items-center gap-4">
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									aria-label={social.label}
									target="_blank"
									rel="noreferrer"
									className="p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
								>
									<social.icon className="h-5 w-5" />
								</a>
							))}
						</div>
					</div>

					<div>
						<h4 className="font-semibold mb-4">Mua sắm</h4>
						<ul className="space-y-3">
							{footerLinks.shop.map((link) => (
								<li key={link.to}>
									<Link
										to={link.to}
										className="body-small text-neutral-400 hover:text-white transition-colors"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-semibold mb-4">Công ty</h4>
						<ul className="space-y-3">
							{footerLinks.company.map((link) => (
								<li key={link.to}>
									<Link
										to={link.to}
										className="body-small text-neutral-400 hover:text-white transition-colors"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-semibold mb-4">Pháp lý</h4>
						{policies.length ? (
							<ul className="space-y-4">
								{policies.map((policy) => (
									<li key={policy.id}>
										<p className="font-medium text-white mb-1">
											{policy.title}
										</p>
										<p className="body-small text-neutral-400">
											{policy.content}
										</p>
									</li>
								))}
							</ul>
						) : (
							<p className="body-small text-neutral-500">
								Đang tải chính sách...
							</p>
						)}
					</div>
				</div>

				<div className="border-t border-neutral-800 py-6">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="body-small text-neutral-400">
							© {currentYear} Cửa hàng. Giữ mọi quyền.
						</p>
						<div className="flex items-center gap-6">
							<Link
								to="#"
								className="body-small text-neutral-400 hover:text-white transition-colors"
							>
								Bảo mật
							</Link>
							<Link
								to="#"
								className="body-small text-neutral-400 hover:text-white transition-colors"
							>
								Điều khoản
							</Link>
							<Link
								to="#"
								className="body-small text-neutral-400 hover:text-white transition-colors"
							>
								Cookie trình duyệt
							</Link>
							<button
								onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
								className="p-2 rounded-full bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
								aria-label="Lên đầu trang"
							>
								<ArrowUp className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
			</Container>
		</footer>
	);
}
