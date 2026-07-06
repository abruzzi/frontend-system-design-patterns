import type { ProductDetailResponse, ProductListResponse } from "../types/product";

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Ignore JSON parsing failures and fall back to the status message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function fetchProducts(): Promise<ProductListResponse> {
  return fetchJson<ProductListResponse>("/api/products");
}

export function fetchProduct(productId: string): Promise<ProductDetailResponse> {
  return fetchJson<ProductDetailResponse>(`/api/products/${productId}`);
}
