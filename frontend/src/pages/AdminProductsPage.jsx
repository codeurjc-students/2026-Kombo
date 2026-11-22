import { useCallback, useState } from 'react';
import { Alert, Badge, Button, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import usePagedList from '../hooks/usePagedList';
import { ApiError } from '../services/httpClient';
import {
  CATEGORY_LABELS,
  adminProductImageUrl,
  getAdminProducts,
  setProductActive,
} from '../services/productService';
import { formatPrice } from '../utils/format';

// Management of the menu by the administrator: every product and kombo, the deactivated ones in grey. Products are
// never deleted (the orders keep them): they are deactivated and leave the menu until they are activated again.
export default function AdminProductsPage() {
  const fetchPage = useCallback((page) => getAdminProducts({ page }), []);
  const { items, pageInfo, loading, error, hasMore, loadMore, retry } = usePagedList(fetchPage);
  // Products changed on this page, shown instead of the loaded ones (so the loaded pages are kept)
  const [changed, setChanged] = useState({});
  const [working, setWorking] = useState(null);
  const [result, setResult] = useState(null);
  // Product that could not be deactivated and the active kombos that include it (window with links to them)
  const [blocked, setBlocked] = useState(null);

  async function toggleActive(product) {
    setWorking(product.id);
    setResult(null);
    try {
      const saved = await setProductActive(product.id, !product.active);
      setChanged((current) => ({ ...current, [saved.id]: saved }));
      const text = saved.active ? `${saved.name} está de nuevo en la carta.` : `${saved.name} ya no sale en la carta.`;
      setResult({ variant: 'success', text });
    } catch (err) {
      if (product.active && err instanceof ApiError && err.status === 409) {
        setBlocked({ product, combos: err.problem.products ?? [] });
      } else {
        setResult({ variant: 'danger', text: activeErrorMessage(product, err) });
      }
    } finally {
      setWorking(null);
    }
  }

  const products = items.map((product) => changed[product.id] ?? product);

  return (
    <section aria-labelledby="products-title">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <h1 id="products-title" className="page-title mb-0">Productos</h1>
        <div className="d-flex flex-wrap gap-2">
          <Button as={Link} to="/admin/products/new" variant="primary">
            Nuevo producto
          </Button>
          <Button as={Link} to="/admin/combos/new" variant="outline-ink">
            Nuevo kombo
          </Button>
        </div>
      </div>
      {result && (
        <Alert variant={result.variant} dismissible onClose={() => setResult(null)}>
          {result.text}
        </Alert>
      )}
      {error && <ErrorState message="No hemos podido cargar los productos." onRetry={retry} />}
      {loading && !pageInfo && <LoadingState label="Cargando productos…" />}
      {pageInfo && (
        <Row xs={1} md={2} xl={3} className="g-4 list-unstyled mb-0" as="ul" aria-label="Productos y kombos">
          {products.map((product) => (
            <Col as="li" key={product.id}>
              <AdminProductCard
                product={product}
                working={working === product.id}
                onToggleActive={() => toggleActive(product)}
              />
            </Col>
          ))}
        </Row>
      )}
      {hasMore && (
        <Button variant="outline-ink" className="mt-4" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando…' : 'Más resultados'}
        </Button>
      )}
      {blocked && <CombosOfProductModal {...blocked} onClose={() => setBlocked(null)} />}
    </section>
  );
}

// A product in active kombos cannot be deactivated: the window lists those kombos with a link to change each one
// (to remove the product from it). It closes when one is opened; pressing "Desactivar" again shows the kombos that
// still include the product.
function CombosOfProductModal({ product, combos, onClose }) {
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h4">
          CONFLICTO
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="small">
        <p>
          {product.name} no se puede desactivar porque está en{' '}
          {combos.length === 1 ? 'este kombo activo' : 'estos kombos activos'}. Quítalo del kombo o desactiva el
          kombo antes.
        </p>
        <ul className="list-unstyled d-grid gap-2 mb-0" aria-label={`Kombos con ${product.name}`}>
          {combos.map((combo) => (
            <li key={combo.id} className="d-flex align-items-center justify-content-between gap-2 order-item">
              <span className="fw-semibold">{combo.name}</span>
              <Button
                as={Link}
                to={`/admin/combos/${combo.id}`}
                variant="outline-ink"
                size="sm"
                aria-label={`Modificar ${combo.name}`}
              >
                Modificar
              </Button>
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-ink" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// A card of the mockup: picture, name, price, category and the ingredients (or the products of a kombo), with
// "Modificar" and "Desactivar" or "Activar". A deactivated product is shown in grey.
function AdminProductCard({ product, working, onToggleActive }) {
  const editUrl = product.combo ? `/admin/combos/${product.id}` : `/admin/products/${product.id}`;
  const contents = product.combo
    ? product.products.map((item) => `${item.quantity} × ${item.product.name}`)
    : product.ingredients.map((ingredient) => ingredient.name);

  return (
    <article
      className={`admin-product-card${product.active ? '' : ' is-inactive'}`}
      aria-labelledby={`admin-product-${product.id}`}
    >
      <div className="admin-product-media">
        {product.imageId ? (
          <img src={adminProductImageUrl(product.id, product.imageId)} alt="" loading="lazy" />
        ) : (
          <img src="/logo-icon.png" alt="" className="fallback-logo" />
        )}
      </div>
      <div className="p-3 d-flex flex-column gap-2 flex-grow-1">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h2 id={`admin-product-${product.id}`} className="h5 mb-0">
            {product.name}
          </h2>
          <span className="product-price">{formatPrice(product.price)}</span>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <span className="role-badge">{CATEGORY_LABELS[product.category] ?? product.category}</span>
          {!product.active && <Badge bg="secondary">Desactivado</Badge>}
        </div>
        <p className="small text-secondary mb-0">
          {contents.length > 0 ? contents.join(', ') : 'Sin ingredientes'}
        </p>
        <div className="d-flex flex-wrap gap-2 mt-auto pt-2">
          <Button as={Link} to={editUrl} variant="outline-ink" size="sm" aria-label={`Modificar ${product.name}`}>
            Modificar
          </Button>
          <Button
            variant={product.active ? 'outline-danger' : 'outline-success'}
            size="sm"
            onClick={onToggleActive}
            disabled={working}
            aria-label={`${product.active ? 'Desactivar' : 'Activar'} ${product.name}`}
          >
            {working && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
            {product.active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </div>
    </article>
  );
}

// 409 when activating: a kombo with a deactivated product cannot be activated; the server sends those products
function activeErrorMessage(product, error) {
  if (error instanceof ApiError && error.status === 409) {
    const names = (error.problem.products ?? []).map((item) => item.name).join(', ');
    return `No se puede activar ${product.name} porque incluye productos desactivados (${names}). Actívalos antes.`;
  }
  return `No hemos podido cambiar ${product.name}. Inténtalo de nuevo.`;
}
