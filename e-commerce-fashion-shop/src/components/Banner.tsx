import { useEffect, useState } from "react";

import banner1 from "../assets/banners/banner1.jpeg";
import banner2 from "../assets/banners/banner2.jpeg";
import banner3 from "../assets/banners/banner3.jpeg";
import banner4 from "../assets/banners/banner4.jpeg";
import banner5 from "../assets/banners/banner5.jpeg";

const slides = [banner1, banner2, banner3, banner4, banner5];

export default function Banner() {
	const [current, setCurrent] = useState(0);

	useEffect(() => {
		if (slides.length <= 1) return;
		const timer = setInterval(() => {
			setCurrent((prev) => (prev + 1) % slides.length);
		}, 8000);
		return () => clearInterval(timer);
	}, []);

	const goTo = (index: number) => {
		if (!slides.length) return;
		setCurrent((index + slides.length) % slides.length);
	};

	return (
		<section className="relative overflow-hidden">
			<div
				className="relative text-white flex items-center py-32 sm:py-56 px-4 sm:px-6 lg:px-16 transition-all duration-700 min-h-[600px] sm:min-h-[720px] lg:min-h-[820px]"
				style={{
					backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.38), rgba(0,0,0,0.18)), url(${slides[current]})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div className="max-w-xl mx-auto">
					<p className="text-sm uppercase tracking-wider text-neutral-200 mb-4">Bộ sưu tập 2024</p>
					<h1 className="heading-1 text-white mb-6">Khám phá bộ sưu tập mới</h1>
					<p className="body-large text-neutral-200 mb-8">
						Sản phẩm tinh gọn, thoải mái và thời trang. Mua ngay những mẫu mới nhất để nâng tầm phong cách.
					</p>
					<div className="flex flex-col sm:flex-row gap-4">
						<a href="/shop" className="btn-primary bg-white text-neutral-900 hover:bg-neutral-100 text-center">
							Mua ngay
						</a>
						<a href="/shop?category=new" className="btn-outline border-white text-white hover:bg-white hover:text-neutral-900 text-center">
							Xem bộ sưu tập
						</a>
					</div>
				</div>

				{slides.length > 1 && (
					<>
						<button
							className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur"
							onClick={() => goTo(current - 1)}
							aria-label="Ảnh trước"
						>
							{"<"}
						</button>
						<button
							className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur"
							onClick={() => goTo(current + 1)}
							aria-label="Ảnh tiếp theo"
						>
							{">"}
						</button>
						<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
							{slides.map((_, idx) => (
								<button
									key={idx}
									onClick={() => goTo(idx)}
									className={`h-2.5 w-2.5 rounded-full transition ${
										idx === current ? "bg-white" : "bg-white/50 hover:bg-white/80"
									}`}
									aria-label={`Chuyển tới ảnh ${idx + 1}`}
								/>
							))}
						</div>
					</>
				)}
			</div>
		</section>
	);
}
