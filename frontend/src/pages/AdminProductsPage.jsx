import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import usePagedList from '../hooks/usePagedList';
import { ApiError } from '../services/httpClient';
import {
  CATEGORY_LABELS,
  adminProductImageUrl,
  getAdminProduct,
  getAdminProducts,
  setProductActive,
  updateCombo,
} from '../services/productService';
import { formatPrice } from '../utils/format';
import { parsePrice, validatePrice } from '../utils/productValidation';

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
      {blocked && (
        <CombosOfProductModal
          {...blocked}
          onClose={() => setBlocked(null)}
          onKomboChanged={(saved) => setChanged((current) => ({ ...current, [saved.id]: saved }))}
          onDeactivateProduct={() => {
            setBlocked(null);
            toggleActive(blocked.product);
          }}
        />
      )}
    </section>
  );
}

// A product in active kombos cannot be deactivated: the window lists those kombos. In each one the administrator
// can remove the product right there ("Quitar", with the new price of the kombo) or open the kombo ("Modificar").
// A kombo that would keep fewer than 2 units cannot lose the product: it can be deactivated instead. When no kombo
// is left, the product can be deactivated from the window. onKomboChanged receives each kombo saved here.
function CombosOfProductModal({ product, combos, onClose, onKomboChanged, onDeactivateProduct }) {
  const [state, setState] = useState({ kombos: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(combos.map((combo) => getAdminProduct(combo.id)))
      .then((kombos) => !cancelled && setState({ kombos, error: null }))
      .catch((error) => !cancelled && setState({ kombos: null, error }));
    return () => {
      cancelled = true;
    };
  }, [combos, attempt]);

  function removeRow(saved) {
    setState((current) => ({ ...current, kombos: current.kombos.filter((kombo) => kombo.id !== saved.id) }));
    onKomboChanged(saved);
  }

  const { kombos, error } = state;
  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h4">
          CONFLICTO
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="small">
        {error && (
          <ErrorState message="No hemos podido cargar los kombos." onRetry={() => setAttempt((n) => n + 1)} />
        )}
        {!error && !kombos && <LoadingState label="Cargando los kombos…" />}
        {kombos && kombos.length > 0 && (
          <>
            <p>
              {product.name} no se puede desactivar porque está en{' '}
              {kombos.length === 1 ? 'este kombo activo' : 'estos kombos activos'}. Quítalo del kombo (puedes
              cambiar su precio a la vez) o desactiva el kombo antes.
            </p>
            <ul className="list-unstyled d-grid gap-2 mb-0" aria-label={`Kombos con ${product.name}`}>
              {kombos.map((kombo) => (
                <KomboOfProductRow key={kombo.id} kombo={kombo} product={product} onSaved={removeRow} />
              ))}
            </ul>
          </>
        )}
        {kombos && kombos.length === 0 && (
          <p className="mb-0">{product.name} ya no está en ningún kombo activo: ya puedes desactivarlo.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-ink" onClick={onClose}>
          Cerrar
        </Button>
        {kombos && kombos.length === 0 && (
          <Button variant="danger" onClick={onDeactivateProduct}>
            Desactivar {product.name}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

// A kombo of the window: its name with its price next to it (it can be changed when the product is removed), the
// units of the product in it, and the buttons on the right (the action on the product above "Modificar")
function KomboOfProductRow({ kombo, product, onSaved }) {
  const [price, setPrice] = useState(() => Number(kombo.price).toFixed(2).replace('.', ','));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const units = kombo.products.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const remaining = kombo.products.reduce((total, item) => total + item.quantity, 0) - units;
  const canRemove = remaining >= 2;
  const priceError = validatePrice(price);

  async function save(action) {
    setSaving(true);
    setError(null);
    try {
      onSaved(await action());
    } catch {
      setError(`No hemos podido cambiar ${kombo.name}. Inténtalo de nuevo.`);
      setSaving(false);
    }
  }

  function remove() {
    if (priceError) {
      return;
    }
    save(() =>
      updateCombo(kombo.id, {
        name: kombo.name,
        price: parsePrice(price),
        description: kombo.description ?? '',
        products: kombo.products
          .filter((item) => item.product.id !== product.id)
          .map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      }),
    );
  }

  return (
    <li className="order-item kombo-row" aria-label={kombo.name}>
      <div className="kombo-row-info">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold">{kombo.name}</span>
          {canRemove ? (
            <InputGroup size="sm" className="kombo-row-price">
              <Form.Control
                aria-label={`Precio de ${kombo.name}`}
                value={price}
                inputMode="decimal"
                isInvalid={Boolean(priceError)}
                onChange={(event) => setPrice(event.target.value)}
              />
              <InputGroup.Text>€</InputGroup.Text>
            </InputGroup>
          ) : (
            <span className="text-secondary">{formatPrice(kombo.price)}</span>
          )}
        </div>
        <span className="text-secondary">
          {units} × {product.name}
        </span>
        {!canRemove && <span className="text-danger">Se queda con menos de 2 productos</span>}
        {canRemove && priceError && <span className="text-danger">{priceError}</span>}
        {error && <span className="text-danger">{error}</span>}
      </div>
      {/* The action on the product first, and the link to the whole kombo below */}
      <div className="kombo-row-actions">
        {canRemove ? (
          <Button
            variant="outline-danger"
            size="sm"
            disabled={saving || Boolean(priceError)}
            onClick={remove}
            aria-label={`Quitar ${product.name} de ${kombo.name}`}
          >
            {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
            Quitar
          </Button>
        ) : (
          <Button
            variant="outline-danger"
            size="sm"
            disabled={saving}
            onClick={() => save(() => setProductActive(kombo.id, false))}
            aria-label={`Desactivar kombo ${kombo.name}`}
          >
            {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
            Desactivar kombo
          </Button>
        )}
        <Button
          as={Link}
          to={`/admin/combos/${kombo.id}`}
          variant="outline-ink"
          size="sm"
          aria-label={`Modificar ${kombo.name}`}
        >
          Modificar
        </Button>
      </div>
    </li>
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
