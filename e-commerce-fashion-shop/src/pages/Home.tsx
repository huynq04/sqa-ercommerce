import { useEffect, useState } from "react";
import Banner from "../components/Banner";
import Carousel from "../components/Carousel";
import Container from "../components/Container";
import ProductCard from "../components/ProductCard";
import Newsletter from "../components/Newsletter";
import { Star, Truck, Shield, RefreshCw } from "lucide-react";
import type { Product, ProductImage } from "../types/product";
import { getRecommendations } from "../api/recommendationsApi";

export default function Home() {
	const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
	const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
	const [isRecLoading, setIsRecLoading] = useState(false);
	const [recError, setRecError] = useState<string | null>(null);

	useEffect(() => {
		fetch("http://localhost:3000/api/v1/products?page=1&limit=100&sort=-createdAt")
			.then((res) => res.json())
			.then((data) => {
				if (!data.data) return;
				const products: Product[] = data.data;

				// Lấy 8 sản phẩm mới nhất
				setFeaturedProducts(products.slice(0, 8));
			})
			.catch((err) => console.error("Tải sản phẩm thất bại:", err));
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) return;

		setRecError(null);
		setIsRecLoading(true);
		getRecommendations(8)
			.then((data) => setRecommendedProducts(data || []))
			.catch((err) => {
				// Hide auth errors silently, surface others
				if (String(err).toLowerCase().includes("unauthorized")) return;
				setRecError("Không thể tải gợi ý ngay bây giờ.");
				console.error(err);
			})
			.finally(() => setIsRecLoading(false));
	}, []);

	const features = [
		{ icon: Truck, title: "Miễn phí giao hàng", desc: "Cho đơn từ 100k" },
		{ icon: RefreshCw, title: "Đổi hàng dễ dàng", desc: "Chính sách 30 ngày" },
		{ icon: Shield, title: "Thanh toán an toàn", desc: "Bảo mật 100%" },
		{ icon: Star, title: "Chất lượng cao", desc: "Chỉ sản phẩm chọn lọc" },
	];

	return (
		<main>
			<Banner />

			{/* Categories */}
			<section className="py-16 bg-white">
				<Container>
					<div className="text-center mb-12">
						<h2 className="heading-3 mb-4">Mua sắm theo danh mục</h2>
						<p className="body-text text-neutral-600">
							Khám phá các bộ sưu tập được chọn lọc
						</p>
					</div>
					<Carousel />
				</Container>
			</section>

			{/* Featured Products */}
			<section className="py-16 bg-neutral-50">
				<Container size="wide">
					<div className="flex items-center justify-between mb-8">
						<div>
							<h2 className="heading-3 mb-2">Sản phẩm mới</h2>
							<p className="body-text text-neutral-600">
								Sản phẩm vừa cập nhật
							</p>
						</div>
						<a
							className="body-small text-neutral-600 hover:text-neutral-900 transition-colors font-medium hidden md:inline-flex items-center gap-1"
							href="/shop"
						>
							Xem tất cả <span>→</span>
						</a>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{featuredProducts.map((p) => (
							<ProductCard
								key={p.id}
								title={p.name}
								price={p.price}
								discount={p.discount}
								image={
									p.mainImageUrl ||
									p.images?.find((img: ProductImage) => img.isMain)?.imageUrl
								}
								to={`/product/${p.id}`}
							/>
						))}
					</div>
				</Container>
			</section>

			{/* Personalized recommendations */}
			{(recommendedProducts.length > 0 || isRecLoading || recError) && (
				<section className="py-16 bg-white">
					<Container size="wide">
						<div className="flex items-center justify-between mb-8">
							<div>
								<h2 className="heading-3 mb-2">Sản phẩm bạn có thể quan tâm</h2>
								<p className="body-text text-neutral-600">
									Dựa trên lịch sử mua hàng của bạn
								</p>
							</div>
							{recError && (
								<span className="text-sm text-red-600">{recError}</span>
							)}
						</div>

						{isRecLoading ? (
							<p className="text-neutral-600">Đang tải gợi ý...</p>
						) : (
							<>
								{!recommendedProducts.length ? (
									<p className="text-neutral-600">
										Chúng tôi sẽ gợi ý sau khi bạn có một vài đơn hàng.
									</p>
								) : (
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
										{recommendedProducts.map((p) => (
											<ProductCard
												key={`rec-${p.id}`}
												title={p.name}
												price={p.price}
												discount={p.discount}
												image={
													p.mainImageUrl ||
													p.images?.find((img: ProductImage) => img.isMain)?.imageUrl
												}
												to={`/product/${p.id}`}
											/>
										))}
									</div>
								)}
							</>
						)}
					</Container>
				</section>
			)}

			{/* Features */}
			<section className="py-16 bg-white border-y border-neutral-200">
				<Container>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
						{features.map((feature, i) => (
							<div key={i} className="text-center">
								<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
									<feature.icon className="h-6 w-6 text-neutral-900" />
								</div>
								<h3 className="font-semibold text-neutral-900 mb-2">
									{feature.title}
								</h3>
								<p className="body-small text-neutral-600">
									{feature.desc}
								</p>
							</div>
						))}
					</div>
				</Container>
			</section>

			{/* Newsletter */}
			<div className="py-16 bg-neutral-50">
				<Container>
					<Newsletter />
				</Container>
			</div>
		</main>
	);
}
