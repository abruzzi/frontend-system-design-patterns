import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchProducts } from "../lib/api";
import type { ProductSummary } from "../types/product";

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export function ProductListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isPending, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 30_000,
  });

  const products = data?.products ?? [];
  const query = searchTerm.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.tagline,
        product.category,
        product.brief,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [products, query]);

  if (isPending) {
    return (
      <section className="panel loading-state">
        Loading the product catalog...
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel error-state">
        Could not load the product catalog: {error.message}
      </section>
    );
  }

  return (
    <>
      <section className="panel panel-pad">
        <div className="catalog-toolbar">
          <div>
            <h2>Shop electronics</h2>
            <p className="muted-copy">
              {query
                ? `${filteredProducts.length} result${filteredProducts.length === 1 ? "" : "s"} for "${searchTerm.trim()}".`
                : `Search and browse ${products.length} products.`}
            </p>
          </div>
          {query && (
            <button className="ghost-button" type="button" onClick={() => setSearchTerm("")}>
              Clear search
            </button>
          )}
        </div>

        <label htmlFor="product-search">
          <span className="search-label">Search</span>
          <input
            id="product-search"
            className="search-input"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, category, or feature"
          />
        </label>

        <div className="section-heading products-heading">
          <div>
            <h2>Products</h2>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="catalog-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No products matched <strong>{searchTerm.trim()}</strong>.
          </div>
        )}
      </section>
    </>
  );
}

function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card"
      style={{ boxShadow: `inset 0 0 0 1px ${product.accent}25` }}
    >
      <div className="product-card__top">
        <span
          className="product-card__category"
          style={{ color: product.accent, borderColor: `${product.accent}40` }}
        >
          {product.category}
        </span>
        <span className="product-card__rating">{product.rating.toFixed(1)} / 5</span>
      </div>

      <div>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__tagline">{product.tagline}</p>
      </div>

      <p className="product-card__brief">{product.brief}</p>

      <div className="product-card__bottom">
        <div>
          <div className="product-card__price">{formatPrice(product.priceCents)}</div>
          <div className="product-card__rating">Free shipping on eligible orders</div>
        </div>
        <span className="product-card__cta">See product {"->"}</span>
      </div>
    </Link>
  );
}
