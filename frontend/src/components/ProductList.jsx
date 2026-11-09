import { useCallback, useState } from 'react';
import { Button, Placeholder } from 'react-bootstrap';
import { CATEGORIES, getProductPage } from '../services/productService';
import ErrorState from './ErrorState';
import ProductCard from './ProductCard';
import usePagedList from '../hooks/usePagedList';

// Lists show 10 items and a "Más resultados" button for the next ones
const PAGE_SIZE = 10;

// Menu with a category filter and a "show more" button (the REST API returns pages)
export default function ProductList() {
  const [category, setCategory] = useState(null);
  const fetchPage = useCallback((page) => getProductPage({ category, page, size: PAGE_SIZE }), [category]);
  const { items: products, loading, error, hasMore, loadMore, retry } = usePagedList(fetchPage);

  return (
    <section aria-labelledby="menu-title">
      <div className="menu-toolbar">
        <h2 id="menu-title">Nuestra carta</h2>
      </div>
      <div className="category-pills" role="group" aria-label="Filtrar por categoría">
        <CategoryPill label="Todo" active={category === null} onClick={() => setCategory(null)} />
        {CATEGORIES.map((item) => (
          <CategoryPill
            key={item.value}
            label={item.label}
            active={category === item.value}
            onClick={() => setCategory(item.value)}
          />
        ))}
      </div>

      {error && (
        <ErrorState
          message="No hemos podido cargar la carta. Comprueba tu conexión e inténtalo de nuevo."
          onRetry={retry}
        />
      )}

      {!error && !loading && products.length === 0 && (
        <p className="text-secondary py-4">No hay productos en esta categoría todavía.</p>
      )}

      <div className="product-grid" data-testid="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {loading && products.length === 0 && <ProductSkeletons />}
      </div>

      {hasMore && !error && (
        <div className="text-center mt-5">
          <Button variant="outline-ink" size="lg" onClick={loadMore} disabled={loading}>
            {loading ? 'Cargando…' : 'Más resultados'}
          </Button>
        </div>
      )}
    </section>
  );
}

function CategoryPill({ label, active, onClick }) {
  return (
    <button type="button" className="category-pill" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );
}

function ProductSkeletons() {
  return Array.from({ length: 4 }, (_, index) => (
    <div key={index} className="product-card" aria-hidden="true">
      <div className="product-media" />
      <Placeholder as="div" animation="glow" className="product-body">
        <Placeholder xs={8} size="lg" /> <Placeholder xs={11} /> <Placeholder xs={6} />
      </Placeholder>
    </div>
  ));
}
