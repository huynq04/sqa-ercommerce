import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Container from "../components/Container";
import ProductCard from "../components/ProductCard";
import type { Product } from "../types/product";
import type {Category} from "../types/category.ts";

export default function CategoryPage() {
    const { id } = useParams<{ id: string }>();
    const [category, setCategory] = useState<Category | null>(null);
    const [rootCategories, setRootCategories] = useState<Category[]>([]);
    const [tabCategories, setTabCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState(1);
    const limit = 8;

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setPage(1);

        (async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/v1/categories/${id}`);
                const data: Category = await res.json();
                setCategory(data);

                const rootRes = await fetch("http://localhost:3000/api/v1/categories?page=1&limit=50&sort=id");
                const rootList = await rootRes.json();
                setRootCategories(rootList.data.filter((c: Category) => !c.parent));

                if (data.parent) {
                    // Fetch parent to get all siblings
                    const parentRes = await fetch(`http://localhost:3000/api/v1/categories/${data.parent.id}`);
                    const parentData: Category = await parentRes.json();
                    setTabCategories(parentData.children || []);
                } else {
                    // Parent level → show its children
                    setTabCategories(data.children || []);
                }

                // Merge products if category has children
                if (data.children?.length) {
                    let merged = [...data.products];
                    for (const child of data.children) {
                        const childRes = await fetch(`http://localhost:3000/api/v1/categories/${child.id}`);
                        const childData = await childRes.json();
                        merged = [...merged, ...childData.products];
                    }
                    setProducts(merged);
                } else {
                    setProducts(data.products);
                }

                setLoading(false);
            } catch {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <div className="py-20 text-center text-neutral-500">Đang tải danh mục...</div>;
    if (!category) return <div className="py-20 text-center text-red-500">Không tìm thấy danh mục.</div>;

    const totalPages = Math.max(1, Math.ceil(products.length / limit));
    const start = (page - 1) * limit;
    const pagedProducts = products.slice(start, start + limit);

    // Determine if ROOT NAV should be shown
    const showRootNav = category.parent && rootCategories.length > 1;
    
    // Filter out root categories from tabs if they're already shown in ROOT NAV
    const rootCategoryIds = showRootNav ? rootCategories.map(r => r.id) : [];
    const filteredTabs = tabCategories.filter(cat => !rootCategoryIds.includes(cat.id));

    return (
        <main className="py-12">
            <Container>

                {/* ROOT NAV - Only show if we're in a child category and there are multiple root categories */}
                {showRootNav && (
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b">
                        {rootCategories.map((root) => (
                            <Link
                                key={root.id}
                                to={`/category/${root.id}`}
                                className={`px-4 py-2 rounded-md border text-sm whitespace-nowrap transition
                                    ${root.id === category.parent?.id
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "border-neutral-300 hover:border-neutral-900"
                                }`}
                            >
                                {root.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* CHILD CATEGORIES TABS - Show children, but exclude root categories if they're already shown above */}
                {filteredTabs.length > 0 && (
                    <div className="flex gap-2 mb-10 overflow-x-auto pb-2 border-b">
                        {filteredTabs.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.id}`}
                                className={`px-4 py-2 rounded-md border text-sm whitespace-nowrap transition
                                    ${cat.id === category.id
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "border-neutral-300 hover:border-neutral-900"
                                }`}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* TITLE */}
                <div className="mb-8">
                    <h1 className="heading-3 mb-2">{category.name}</h1>
                    {category.description && (
                        <p className="body-text text-neutral-600">{category.description}</p>
                    )}
                    <p className="body-small text-neutral-600 mt-2">
                        Hiển thị {pagedProducts.length} / {products.length} kết quả
                    </p>
                </div>

                {/* PRODUCT GRID */}
                {products.length === 0 ? (
                    <div className="py-20 text-center text-neutral-500">
                        Không có sản phẩm trong danh mục này.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {pagedProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                title={p.name}
                                price={p.price}
                                discount={p.discount}
                                image={p.mainImageUrl}
                                to={`/product/${p.id}`}
                            />
                        ))}
                    </div>
                )}

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
    );
}
