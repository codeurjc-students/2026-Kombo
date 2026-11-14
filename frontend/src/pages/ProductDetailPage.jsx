import { useEffect, useState } from 'react';
import { Alert, Button, Col, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useCart } from '../context/CartContext';
import { ApiError } from '../services/httpClient';
import { CATEGORY_LABELS, getProduct, productImageUrl } from '../services/productService';
import NotFoundPage from './NotFoundPage';
import { formatPrice } from '../utils/format';

// Detail of a product or combo: picture, description, ingredients and, for a combo, the products it includes.
// State is only set when the request finishes (same approach as usePagedList).
export default function ProductDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState({ id, attempt: 0 });
  const [result, setResult] = useState({ request: null, product: null, error: null });

  // Derived state: another product (a link of a combo) starts a new request
  if (request.id !== id) {
    setRequest({ id, attempt: 0 });
  }

  useEffect(() => {
    let cancelled = false;
    getProduct(request.id)
      .then((product) => !cancelled && setResult({ request, product, error: null }))
      .catch((error) => !cancelled && setResult({ request, product: null, error }));
    return () => {
      cancelled = true;
    };
  }, [request]);

  if (result.request !== request) {
    return <LoadingState label="Cargando el producto…" />;
  }
  const { product, error } = result;
  // A product that does not exist (or an id that is not a number) shows the 404 page
  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
    return <NotFoundPage />;
  }
  if (error) {
    const retry = () => setRequest((current) => ({ ...current, attempt: current.attempt + 1 }));
    return <ErrorState message="No hemos podido cargar el producto." onRetry={retry} />;
  }
  // The key gives each product its own state (picture error, units added)
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }) {
  const { addItem } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(0);

  function handleAdd() {
    addItem(product);
    setAdded((times) => times + 1);
  }

  const category = CATEGORY_LABELS[product.category];

  return (
    <article className="panel product-detail" aria-labelledby="product-title">
      <Row className="g-4 g-lg-5 align-items-center">
        <Col md={6} className="order-md-2">
          <div className="product-media product-detail-media">
            {imageFailed ? (
              <div className="fallback" aria-hidden="true">
                <img src="/logo-icon.png" alt="" />
              </div>
            ) : (
              <img src={productImageUrl(product.id)} alt={product.name} onError={() => setImageFailed(true)} />
            )}
            {category && <span className="product-category">{category}</span>}
          </div>
        </Col>
        <Col md={6}>
          <Link to="/" className="back-link">← Volver a la carta</Link>
          <h1 id="product-title" className="product-detail-title">{product.name}</h1>
          <p className="product-detail-price">{formatPrice(product.price)}</p>

          <h2 className="product-detail-heading">Descripción</h2>
          <p className="text-secondary">{product.description}</p>

          {product.combo && (
            <>
              <h2 className="product-detail-heading">Incluye</h2>
              <ul className="detail-list" aria-label="Productos del menú">
                {product.products.map((item) => (
                  <li key={item.product.id}>
                    <span className="detail-quantity">{item.quantity} ×</span>{' '}
                    <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="product-detail-heading">Ingredientes</h2>
          <ul className="detail-list detail-list-columns" aria-label="Ingredientes">
            {product.ingredients.map((ingredient) => (
              <li key={ingredient.id}>{ingredient.name}</li>
            ))}
          </ul>

          <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
            <Button variant="primary" size="lg" onClick={handleAdd}>
              Añadir al carrito +
            </Button>
          </div>
          {added > 0 && (
            <Alert variant="success" className="mt-3 mb-0" role="status">
              {product.name} añadido al carrito{added > 1 ? ` (${added} unidades)` : ''}.
            </Alert>
          )}
        </Col>
      </Row>
    </article>
  );
}
