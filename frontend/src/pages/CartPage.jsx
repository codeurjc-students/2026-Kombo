import { Alert, Button, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import OrderSummary from '../components/OrderSummary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MAX_QUANTITY } from '../context/cartReducer';
import useSettings from '../hooks/useSettings';
import { formatPrice } from '../utils/format';

// Cart: change the units, remove products and see the subtotal. The delivery type is chosen in the checkout,
// so the cart only explains the delivery cost of home deliveries; the checkout shows the total.
export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();

  if (items.length === 0) {
    return (
      <section className="panel text-center py-5">
        <h1 className="page-title">Tu carrito está vacío</h1>
        <p className="text-secondary">Añade algo rico desde la carta.</p>
        <Button as={Link} to="/" variant="primary">Ver la carta</Button>
      </section>
    );
  }

  const canOrder = user?.role !== 'ADMIN';

  return (
    <section aria-labelledby="cart-title">
      <h1 id="cart-title" className="page-title">Tu carrito</h1>
      <Row className="g-4">
        <Col lg={8}>
          <ul className="panel cart-list" aria-label="Productos del carrito">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="cart-item">
                <div className="cart-item-name">
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                  <span className="text-secondary small">{formatPrice(product.price)} / unidad</span>
                </div>
                <div className="cart-quantity">
                  <Button
                    variant="outline-ink"
                    size="sm"
                    aria-label={`Quitar una unidad de ${product.name}`}
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    −
                  </Button>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={1}
                    max={MAX_QUANTITY}
                    aria-label={`Unidades de ${product.name}`}
                    value={quantity}
                    onChange={(event) => {
                      // An empty field while typing keeps the product; 0 or less is ignored here (use the − or ✕ button)
                      const value = Number(event.target.value);
                      if (value >= 1) {
                        updateQuantity(product.id, value);
                      }
                    }}
                  />
                  <Button
                    variant="outline-ink"
                    size="sm"
                    aria-label={`Añadir una unidad de ${product.name}`}
                    disabled={quantity >= MAX_QUANTITY}
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <strong className="cart-line-total">{formatPrice(Number(product.price) * quantity)}</strong>
                <Button
                  variant="link"
                  className="cart-remove"
                  aria-label={`Eliminar ${product.name} del carrito`}
                  onClick={() => removeItem(product.id)}
                >
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        </Col>
        <Col lg={4}>
          <OrderSummary subtotal={subtotal}>
            <p className="small text-secondary" data-testid="delivery-note">
              En el siguiente paso eliges si es para comer aquí, para llevar o a domicilio.
              {settings && (
                <>
                  {' '}A domicilio, el envío cuesta {formatPrice(settings.deliveryCost)} y es gratis a partir de{' '}
                  {formatPrice(settings.freeDeliveryThreshold)}.
                </>
              )}
            </p>
            {canOrder ? (
              <Button as={Link} to="/checkout" variant="primary" size="lg" className="w-100">
                Tramitar pedido
              </Button>
            ) : (
              <Alert variant="info" className="mb-0">El administrador no puede hacer pedidos.</Alert>
            )}
          </OrderSummary>
        </Col>
      </Row>
    </section>
  );
}
