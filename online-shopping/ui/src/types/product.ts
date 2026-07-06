export type ProductSummary = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  priceCents: number;
  rating: number;
  accent: string;
  brief: string;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductDetail = ProductSummary & {
  description: string;
  highlights: string[];
  specs: ProductSpec[];
  shippingNote: string;
  stockStatus: string;
};

export type ProductListResponse = {
  products: ProductSummary[];
  meta: {
    total: number;
    fetchedAt: string;
  };
};

export type ProductDetailResponse = {
  product: ProductDetail;
  meta: {
    fetchedAt: string;
  };
};
