import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/swiper-bundle.css";
import CategoryCard from "./CategoryCard";
import { useEffect, useState } from "react";
import maleCategoryImg from "../assets/banners/danhmucnam.jpg";
import femaleCategoryImg from "../assets/banners/danhmucnu.jpg";

const CATEGORY_IMAGE_MAP: Record<string, string> = {
	nam: maleCategoryImg,
	nu: femaleCategoryImg,
};

const normalizeCategoryName = (name: string) =>
	name
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

type CategoryWithImage = { id: number; name: string; imageSrc?: string };

export default function Carousel() {
	const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
	const [genderCategories, setGenderCategories] = useState<CategoryWithImage[]>([]);

	useEffect(() => {
		fetch("http://localhost:3000/api/v1/categories?page=1&limit=20")
			.then((res) => res.json())
			.then((data) => {
				if (!data.data) return;
				const parents = data.data.filter((c: any) => c.parent === null);
				setCategories(parents);

				const matched: Record<string, CategoryWithImage> = {};
				parents.forEach((cat: any) => {
					const normalized = normalizeCategoryName(cat.name);
					const imageSrc =
						CATEGORY_IMAGE_MAP[
							normalized as keyof typeof CATEGORY_IMAGE_MAP
						];
					if (imageSrc) {
						matched[normalized] = {
							id: cat.id,
							name: cat.name,
							imageSrc,
						};
					}
				});

				if (matched.nam && matched.nu) {
					setGenderCategories([matched.nam, matched.nu]);
				} else {
					setGenderCategories([]);
				}
			})
			.catch((err) => console.error("Tải danh mục thất bại:", err));
	}, []);

	const getCategoryImage = (name: string) => {
		const normalized = normalizeCategoryName(name);
		return CATEGORY_IMAGE_MAP[normalized as keyof typeof CATEGORY_IMAGE_MAP];
	};

	if (genderCategories.length === 2) {
		return (
			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
				{genderCategories.map((category) => (
					<CategoryCard
						key={category.id}
						label={category.name}
						to={`/category/${category.id}`}
						imageSrc={category.imageSrc}
						className="h-[260px] md:h-[420px]"
					/>
				))}
			</div>
		);
	}

	return (
		<div className="relative">
			<Swiper
				modules={[Navigation, Pagination]}
				spaceBetween={20}
				slidesPerView={2}
				navigation={{
					nextEl: ".swiper-button-next-custom",
					prevEl: ".swiper-button-prev-custom",
				}}
				pagination={{
					clickable: true,
					el: ".swiper-pagination-custom",
				}}
				breakpoints={{
					640: { slidesPerView: 3 },
					768: { slidesPerView: 4 },
					1024: { slidesPerView: 5 },
				}}
				className="!pb-12"
			>
				{categories.map((category) => {
					const imageSrc = getCategoryImage(category.name);
					return (
						<SwiperSlide key={category.id}>
							<CategoryCard
								label={category.name}
								to={`/category/${category.id}`}
								imageSrc={imageSrc}
							/>
						</SwiperSlide>
					);
				})}
			</Swiper>

			<button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-4 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-md hover:bg-neutral-50 transition-colors">
				<ChevronLeft className="h-5 w-5 text-neutral-700" />
			</button>
			<button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-4 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-md hover:bg-neutral-50 transition-colors">
				<ChevronRight className="h-5 w-5 text-neutral-700" />
			</button>

			<div className="swiper-pagination-custom flex justify-center gap-2 mt-4" />
		</div>
	);
}
