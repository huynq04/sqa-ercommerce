export type ProductImage = {
    id: number;
    imageUrl: string;
    isMain: boolean;
};

export type ProductVariant = {
    id: number;
    sku: string;
    price: string;
    stock: number;
    imageUrl: string;
    color?: {
        id: number;
        color: string;
    };
    size?: {
        id: number;
        size: string;
    };
};

export type CategoryInfo = {
    id: number;
    name: string;
    description?: string;
};

export type Product = {
    id: number;
    name: string;
    description: string;
    price: string;
    discount: string;
    stock: number;
    mainImageUrl?: string;
    categoryId: number;
    category?: CategoryInfo;
    images?: ProductImage[];
    variants?: ProductVariant[];
};

export type ProductCardProps = {
    to?: string
    title: string
    price: string
    originalPrice?: string
    discount?: string
    badge?: string
    image?: string
}