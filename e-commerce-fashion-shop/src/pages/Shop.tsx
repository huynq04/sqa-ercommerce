import Container from '../components/Container'
import ProductCard from '../components/ProductCard'
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import type { Product, ProductImage } from "../types/product";

export default function Shop() {
	const [products, setProducts] = useState<Product[]>([])
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const limit = 8

	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const q = searchParams.get("q") || ""

	useEffect(() => {
		setPage(1)
	}, [q])

	useEffect(() => {
		// Base URL
		let url = `http://localhost:3000/api/v1/products?page=${page}&limit=${limit}&sort=-createdAt`

		if (q.trim() !== "") {
			url += `&q=${encodeURIComponent(q)}`
		}

		fetch(url)
			.then((res) => res.json())
			.then((data) => {
				const list = data.data ?? [];
				setProducts(list);
				setTotal(Number.isFinite(data.total) ? data.total : list.length);
			})
			.catch((err) => console.error("Tải sản phẩm thất bại:", err))
	}, [q, page])

	const totalPages = Math.max(1, Math.ceil(total / limit))

	return (
		<main className="py-12">
			<Container>
				<div className="flex items-end justify-between gap-4 mb-10">
					<h1 className="heading-3">Cửa hàng</h1>
					<div className="body-small">
					Hiển thị {products.length} / {total} kết quả
				</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{products.map((p) => (
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

				{totalPages > 1 && (
					<div className="mt-10 flex items-center justify-center gap-4">
						<button
							className="btn-secondary px-4 py-2"
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							disabled={page === 1}
						>
							Trước
						</button>
						<span className="body-small">
							Trang {page} / {totalPages}
						</span>
						<button
							className="btn-secondary px-4 py-2"
							onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
							disabled={page >= totalPages}
						>
							Sau
						</button>
					</div>
				)}
			</Container>
		</main>
	)
}
