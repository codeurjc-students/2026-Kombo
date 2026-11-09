import { useState } from 'react';
import { CATEGORIES, productImageUrl } from '../services/productService';
import { formatPrice } from '../utils/format';

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((category) => [category.value, category.label]));

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const category = CATEGORY_LABELS[product.category];

  return (
    <article className="product-card" aria-labelledby={`product-${product.id}`}>
      <div className="product-media">
        {imageFailed ? (
          <div className="fallback" aria-hidden="true">
            <img src="/logo-icon.png" alt="" />
          </div>
        ) : (
          <img
            src={productImageUrl(product.id)}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        {category && <span className="product-category">{category}</span>}
      </div>
      <div className="product-body">
        <h3 id={`product-${product.id}`}>{product.name}</h3>
        <p>{product.description}</p>
        <span className="product-price">{formatPrice(product.price)}</span>
      </div>
    </article>
  );
}
