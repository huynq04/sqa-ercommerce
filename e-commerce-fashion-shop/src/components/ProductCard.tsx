import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import type {ProductCardProps} from "../types/product.ts";

export default function ProductCard({
		to = '/product/1',
		title,
		price,
		discount,
		image,
	}: ProductCardProps) {

	const finalPrice = Number(price).toLocaleString('vi-VN') + '₫';

	const originalPrice =
		discount && discount !== '0.00'
			? (Number(price) / (1 - Number(discount) / 100)).toLocaleString('vi-VN') + '₫'
			: null;

	const badge = discount && discount !== '0.00' ? `-${Number(discount)}%` : null;

	return (
		<div className="group relative">
			<Link to={to} className="block">
				<div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-100 shadow-sm transition-all duration-300 group-hover:shadow-lg">

					{/* Badge */}
					{badge && (
						<span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-neutral-900 text-white text-xs font-semibold rounded-md">
							{badge}
						</span>
					)}

					{/* Quick actions */}
					<div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<button className="p-2 rounded-full bg-white/90 text-neutral-700 hover:bg-white backdrop-blur-sm transition-colors">
							<Eye className="h-4 w-4" />
						</button>
					</div>

					{/* Image */}
					{image ? (
						<img
							src={image}
							alt={title}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					) : (
						<div className="h-full w-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
					)}
				</div>
			</Link>

			{/* Product info */}
			<div className="mt-4">
				<Link to={to}>
					<h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors mb-1">
						{title}
					</h3>
				</Link>
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-neutral-900">{finalPrice}</span>
					{originalPrice && (
						<span className="text-sm text-neutral-500 line-through">{originalPrice}</span>
					)}
				</div>
			</div>
		</div>
	)
}
