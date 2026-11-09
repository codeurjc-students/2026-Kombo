import { useState } from 'react';
import { productImageUrl } from '../services/productService';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="product-card" aria-labelledby={`product-${product.id}`}>
      <div className="product-media">
        {imageFailed ? (
          <div className="fallback" aria-hidden="true">{product.name.charAt(0)}</div>
        ) : (
          <img
            src={productImageUrl(product.id)}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="price-sticker">{formatPrice(product.price)}</span>
      </div>
      <div className="product-body">
        <h2 id={`product-${product.id}`}>{product.name}</h2>
        <p>{product.description}</p>
      </div>
    </article>
  );
}
