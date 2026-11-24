import { useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router';
import LoadingState from '../components/LoadingState';
import OrderSummary from '../components/OrderSummary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useSettings from '../hooks/useSettings';
import { ApiError } from '../services/httpClient';
import { createOrder, orderLinesFromCart } from '../services/orderService';
import { validateCheckout } from '../utils/checkoutValidation';
import { DELIVERY_TYPES, PAYMENT_METHODS, deliveryCostFor, orderTotal } from '../utils/delivery';
import { formatPrice } from '../utils/format';

// Value of the address choice that means "write a new address"
const NEW_ADDRESS = 'NEW';

// Customers start with their own data, which they can change, and their first saved address. Anonymous users and
// employees (counter orders, for a customer at the counter) start with an empty form.
function initialForm(user) {
  const customer = user?.role === 'CUSTOMER' ? user : null;
  return {
    deliveryType: 'TAKE_AWAY',
    addressChoice: customer?.addresses?.[0] ?? NEW_ADDRESS,
    address: '',
    name: customer ? [customer.name, customer.surname].filter(Boolean).join(' ') : '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    paymentMethod: 'CARD',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  };
}

// Checkout: delivery type, contact data and simulated payment. The order is placed with POST /api/v1/orders
// and the confirmation page shows its number. A customer sees their saved data instead of the contact form
// (they can change it) and chooses one of their addresses or writes a new one, which the server saves in
// their profile. An employee places counter orders: only the name of the customer is required, and a card is
// paid with the card reader of the restaurant.
export default function CheckoutPage() {
  const { loading } = useAuth();
  // The form starts with the data of the session: after reloading the page, it waits until the session is known
  if (loading) {
    return <LoadingState label="Comprobando tu sesión…" />;
  }
  return <Checkout />;
}

function Checkout() {
  const { user, refreshUser } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => initialForm(user));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const isCustomer = user?.role === 'CUSTOMER';
  const isCounter = user?.role === 'EMPLOYEE';
  // A customer starts with the summary of their data; anonymous users and employees fill in the form
  const [editingContact, setEditingContact] = useState(!isCustomer);
  const savedAddresses = isCustomer ? (user.addresses ?? []) : [];

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

  // The address sent: the saved one chosen, or the new one written
  const deliveryAddress = form.addressChoice === NEW_ADDRESS ? form.address : form.addressChoice;

  async function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateCheckout({ ...form, address: deliveryAddress }, new Date(), { counter: isCounter });
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      // The saved data of a customer can be wrong (for example, no phone): show the form to fix it
      if (formErrors.name || formErrors.email || formErrors.phone) {
        setEditingContact(true);
      }
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const order = await createOrder({
        lines: orderLinesFromCart(items),
        deliveryType: form.deliveryType,
        deliveryAddress: form.deliveryType === 'DELIVERY' ? deliveryAddress.trim() : null,
        paymentMethod: form.paymentMethod,
        customerName: form.name.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
      });
      await navigate('/order-confirmation', { replace: true, state: { order } });
      clearCart();
      // The server saved the new address in the profile: read the session again to have it next time
      if (isCustomer && form.deliveryType === 'DELIVERY' && form.addressChoice === NEW_ADDRESS) {
        refreshUser();
      }
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
      <h1 id="checkout-title" className="page-title">{isCounter ? 'Pedido en mostrador' : 'Tramitar pedido'}</h1>
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
              {form.deliveryType === 'DELIVERY' && savedAddresses.length > 0 && (
                <fieldset className="saved-addresses mt-3">
                  <legend className="form-label fs-6">Dirección de entrega</legend>
                  {savedAddresses.map((address, index) => (
                    <Form.Check
                      key={address}
                      type="radio"
                      id={`address-${index}`}
                      name="addressChoice"
                      value={address}
                      checked={form.addressChoice === address}
                      onChange={changeField('addressChoice')}
                      label={address}
                    />
                  ))}
                  <Form.Check
                    type="radio"
                    id="address-new"
                    name="addressChoice"
                    value={NEW_ADDRESS}
                    checked={form.addressChoice === NEW_ADDRESS}
                    onChange={changeField('addressChoice')}
                    label="Otra dirección"
                  />
                </fieldset>
              )}
              {form.deliveryType === 'DELIVERY' && form.addressChoice === NEW_ADDRESS && (
                <Form.Group className="mt-3" controlId="checkout-address">
                  <Form.Label>{savedAddresses.length > 0 ? 'Nueva dirección' : 'Dirección de entrega'}</Form.Label>
                  <Form.Control
                    autoComplete="street-address"
                    maxLength={255}
                    aria-describedby={isCustomer ? 'checkout-address-help' : undefined}
                    {...field('address')}
                  />
                  <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                  {isCustomer && (
                    <Form.Text id="checkout-address-help">Se guardará en tu perfil para tus próximos pedidos.</Form.Text>
                  )}
                </Form.Group>
              )}
            </fieldset>

            <fieldset className="checkout-section">
              <legend className="h4">{isCounter ? '2. Datos del cliente' : '2. Datos de contacto'}</legend>
              {editingContact ? (
                <>
                <Form.Group className="mb-3" controlId="checkout-name">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control autoComplete="name" maxLength={100} {...field('name')} />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
                <Row>
                  <Form.Group as={Col} md={7} className="mb-3" controlId="checkout-email">
                    <Form.Label>
                      Correo electrónico {isCounter && <span className="text-secondary small">(opcional)</span>}
                    </Form.Label>
                    <Form.Control type="email" autoComplete="email" maxLength={255} {...field('email')} />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} md={5} className="mb-3" controlId="checkout-phone">
                    <Form.Label>
                      Teléfono{' '}
                      {form.deliveryType !== 'DELIVERY' && <span className="text-secondary small">(opcional)</span>}
                    </Form.Label>
                    <Form.Control type="tel" autoComplete="tel" {...field('phone')} />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </Form.Group>
                </Row>
                </>
              ) : (
                <div className="contact-summary" data-testid="contact-summary">
                  <div>
                    <strong>{form.name}</strong>
                    <div className="small text-secondary">{form.email}</div>
                    <div className="small text-secondary">{form.phone}</div>
                  </div>
                  <Button variant="outline-ink" size="sm" onClick={() => setEditingContact(true)}>
                    Cambiar
                  </Button>
                </div>
              )}
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
              {isCounter && (
                <p className="mt-3 mb-0">
                  {form.paymentMethod === 'CARD'
                    ? 'Cobra con el datáfono del restaurante: el pedido queda pagado.'
                    : 'Cobra en efectivo y márcalo como pagado en el panel de pedidos.'}
                </p>
              )}
              {isCounter ? null : form.paymentMethod === 'CARD' ? (
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
              {isCounter ? 'Confirmar pedido' : 'Confirmar y pagar'} {formatPrice(orderTotal(subtotal, deliveryCost))}
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
