import { Link } from "react-router-dom";
import type { CategoryCardProps } from "../types/category";

export default function CategoryCard({
	label,
	to,
	imageSrc,
	className,
}: CategoryCardProps) {
	return (
		<Link
			to={to}
			className={`group block w-full ${className ? className : ""}`}
		>
			<div className="relative h-full min-h-[240px] sm:min-h-[280px] md:min-h-[340px] w-full overflow-hidden rounded-[32px] shadow-lg transition duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl">
				{imageSrc ? (
					<>
						<img
							src={imageSrc}
							alt={`Danh mục ${label}`}
							className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
							loading="lazy"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
					</>
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200" />
				)}
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-2xl font-semibold uppercase tracking-wide text-white drop-shadow-lg">
						{label}
					</span>
				</div>
			</div>
		</Link>
	);
}
