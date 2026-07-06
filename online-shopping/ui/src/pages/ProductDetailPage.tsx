import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { fetchProduct } from "../lib/api";

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export function ProductDetailPage() {
  const { productId } = useParams();

  const { data, isPending, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId!),
    enabled: Boolean(productId),
    staleTime: 2 * 60 * 1000,
  });

  if (!productId) {
    return (
      <section className="panel empty-state">
        Missing product id. Head back to the catalog and pick an item.
      </section>
    );
  }

  if (isPending) {
    return (
      <section className="panel loading-state">
        Loading product details...
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel error-state">
        Could not load that product: {error.message}
      </section>
    );
  }

  const product = data.product;

  return (
    <>
      <Link className="back-link" to="/products">
        {"<-"} Back to products
      </Link>

      <section className="panel panel-pad detail-grid">
        <div className="detail-hero">
          <div className="stack-xs">
            <div className="detail-meta">
              <span
                className="accent-pill"
                style={{ color: product.accent, borderColor: `${product.accent}40` }}
              >
                {product.category}
              </span>
              <span className="chip">
                <strong>Stock:</strong> {product.stockStatus}
              </span>
            </div>

            <div>
              <h2 className="detail-title">{product.name}</h2>
              <p className="product-card__tagline">{product.tagline}</p>
            </div>

            <div className="detail-summary">
              <span className="price-mark">{formatPrice(product.priceCents)}</span>
              <span className="chip">
                <strong>Rating:</strong> {product.rating.toFixed(1)} / 5
              </span>
            </div>

            <p className="detail-copy">{product.description}</p>

            <div className="action-row">
              <button className="primary-button" type="button">
                Add to cart
              </button>
              <button className="ghost-button" type="button">
                Save for later
              </button>
            </div>
          </div>

          <section className="stack-sm">
            <div className="section-heading">
              <div>
                <h3>Highlights</h3>
                <p>
                  A few standout details shoppers would want before committing to the purchase.
                </p>
              </div>
            </div>

            <div className="highlights-grid">
              {product.highlights.map((highlight) => (
                <article className="highlight-card" key={highlight}>
                  <h3>{highlight}</h3>
                  <p>
                    Built to make the product page feel richer and more informative than the
                    catalog overview.
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="stack-sm">
          <div className="detail-sidebar stack-sm">
            <div>
              <p className="stat-label">Shipping</p>
              <p className="stat-value">Fast dispatch</p>
              <p className="stat-hint">{product.shippingNote}</p>
            </div>
            <div>
              <p className="stat-label">Support</p>
              <p className="stat-value">Expert help</p>
              <p className="stat-hint">Chat with the Orbit team for setup and compatibility questions.</p>
            </div>
            <div>
              <p className="stat-label">Returns</p>
              <p className="stat-value">30-day window</p>
              <p className="stat-hint">Easy returns on unopened items and gift exchanges.</p>
            </div>
          </div>

          <div className="detail-sidebar stack-sm">
            <div className="section-heading">
              <div>
                <h3>Specs</h3>
                <p>Key details at a glance before checkout.</p>
              </div>
            </div>
            <dl className="spec-grid">
              {product.specs.map((spec) => (
                <div className="spec-row" key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </section>
    </>
  );
}
