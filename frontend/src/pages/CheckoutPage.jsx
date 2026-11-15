import { useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router';
import OrderSummary from '../components/OrderSummary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useSettings from '../hooks/useSettings';
import { ApiError } from '../services/httpClient';
import { createOrder, orderLinesFromCart } from '../services/orderService';
import { validateCheckout } from '../utils/checkoutValidation';
import { DELIVERY_TYPES, PAYMENT_METHODS, deliveryCostFor, orderTotal } from '../utils/delivery';
import { formatPrice } from '../utils/format';

// Logged in users start with their own data, which they can change
function initialForm(user) {
  return {
    deliveryType: 'TAKE_AWAY',
    address: user?.addresses?.[0] ?? '',
    name: user ? [user.name, user.surname].filter(Boolean).join(' ') : '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    paymentMethod: 'CARD',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  };
}

// Checkout: delivery type, contact data and simulated payment. The order is placed with POST /api/v1/orders
// and the confirmation page shows its number.
export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => initialForm(user));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Nothing to order (the cart is emptied after placing the order, while going to the confirmation)
  if (items.length === 0 && !submitting) {
    return <Navigate to="/cart" replace />;
  }
  if (user?.role === 'ADMIN') {
    return <Alert variant="info">El administrador no puede hacer pedidos.</Alert>;
  }

  const deliveryCost = deliveryCostFor(form.deliveryType, subtotal, settings);

  function changeField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateCheckout(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const order = await createOrder({
        lines: orderLinesFromCart(items),
        deliveryType: form.deliveryType,
        deliveryAddress: form.deliveryType === 'DELIVERY' ? form.address.trim() : null,
        paymentMethod: form.paymentMethod,
        customerName: form.name.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
      });
      await navigate('/order-confirmation', { replace: true, state: { order } });
      clearCart();
    } catch (err) {
      setServerError(
        err instanceof ApiError && err.status === 400
          ? `Revisa los datos del pedido: ${err.message}`
          : 'No hemos podido hacer el pedido. Inténtalo de nuevo en unos minutos.',
      );
      setSubmitting(false);
    }
  }

  // Props of a field with its validation message
  function field(name) {
    return { value: form[name], onChange: changeField(name), isInvalid: Boolean(errors[name]) };
  }

  return (
    <section aria-labelledby="checkout-title">
      <Link to="/cart" className="back-link">← Volver al carrito</Link>
      <h1 id="checkout-title" className="page-title">Tramitar pedido</h1>
      <Row className="g-4">
        <Col lg={8}>
          <Form noValidate onSubmit={handleSubmit} className="panel" aria-labelledby="checkout-title">
            {serverError && <Alert variant="danger">{serverError}</Alert>}

            <fieldset className="checkout-section">
              <legend className="h4">1. Entrega</legend>
              {Object.entries(DELIVERY_TYPES).map(([value, { label, help }]) => (
                <Form.Check
                  key={value}
                  type="radio"
                  id={`delivery-${value}`}
                  name="deliveryType"
                  value={value}
                  checked={form.deliveryType === value}
                  onChange={changeField('deliveryType')}
                  label={
                    <>
                      <strong>{label}</strong> <span className="text-secondary small">{help}</span>
                    </>
                  }
                />
              ))}
              {form.deliveryType === 'DELIVERY' && (
                <Form.Group className="mt-3" controlId="checkout-address">
                  <Form.Label>Dirección de entrega</Form.Label>
                  <Form.Control autoComplete="street-address" maxLength={255} {...field('address')} />
                  <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                </Form.Group>
              )}
            </fieldset>

            <fieldset className="checkout-section">
              <legend className="h4">2. Datos de contacto</legend>
              <Form.Group className="mb-3" controlId="checkout-name">
                <Form.Label>Nombre</Form.Label>
                <Form.Control autoComplete="name" maxLength={100} {...field('name')} />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
              <Row>
                <Form.Group as={Col} md={7} className="mb-3" controlId="checkout-email">
                  <Form.Label>Correo electrónico</Form.Label>
                  <Form.Control type="email" autoComplete="email" maxLength={255} {...field('email')} />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md={5} className="mb-3" controlId="checkout-phone">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control type="tel" autoComplete="tel" {...field('phone')} />
                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                </Form.Group>
              </Row>
            </fieldset>

            <fieldset className="checkout-section">
              <legend className="h4">3. Pago</legend>
              <p className="small text-secondary">Pago simulado: no se hace ningún cargo real.</p>
              {Object.entries(PAYMENT_METHODS).map(([value, { label }]) => (
                <Form.Check
                  inline
                  key={value}
                  type="radio"
                  id={`payment-${value}`}
                  name="paymentMethod"
                  value={value}
                  checked={form.paymentMethod === value}
                  onChange={changeField('paymentMethod')}
                  label={label}
                />
              ))}
              {form.paymentMethod === 'CARD' ? (
                <Row className="mt-3">
                  <Form.Group as={Col} md={6} className="mb-3" controlId="checkout-card-number">
                    <Form.Label>Número de tarjeta</Form.Label>
                    <Form.Control inputMode="numeric" autoComplete="off" maxLength={19} {...field('cardNumber')} />
                    <Form.Control.Feedback type="invalid">{errors.cardNumber}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} xs={6} md={3} className="mb-3" controlId="checkout-card-expiry">
                    <Form.Label>Caducidad</Form.Label>
                    <Form.Control placeholder="MM/AA" autoComplete="off" maxLength={5} {...field('cardExpiry')} />
                    <Form.Control.Feedback type="invalid">{errors.cardExpiry}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} xs={6} md={3} className="mb-3" controlId="checkout-card-cvv">
                    <Form.Label>CVV</Form.Label>
                    <Form.Control inputMode="numeric" autoComplete="off" maxLength={3} {...field('cardCvv')} />
                    <Form.Control.Feedback type="invalid">{errors.cardCvv}</Form.Control.Feedback>
                  </Form.Group>
                </Row>
              ) : (
                <p className="mt-3 mb-0">Pagarás en efectivo al recoger o recibir el pedido.</p>
              )}
            </fieldset>

            <Button type="submit" variant="primary" size="lg" disabled={submitting}>
              {submitting && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
              Confirmar y pagar {formatPrice(orderTotal(subtotal, deliveryCost))}
            </Button>
          </Form>
        </Col>
        <Col lg={4}>
          <OrderSummary subtotal={subtotal} deliveryCost={deliveryCost} total={orderTotal(subtotal, deliveryCost)}>
            <ul className="summary-items" aria-label="Productos del pedido">
              {items.map(({ product, quantity }) => (
                <li key={product.id}>
                  {quantity} × {product.name}
                </li>
              ))}
            </ul>
          </OrderSummary>
        </Col>
      </Row>
    </section>
  );
}
