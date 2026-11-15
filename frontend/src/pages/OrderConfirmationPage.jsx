import { Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router';
import OrderSummary from '../components/OrderSummary';
import { DELIVERY_TYPES, PAYMENT_METHODS } from '../utils/delivery';
import { formatPrice } from '../utils/format';

// Confirmation of the order just placed. The checkout sends the order in the navigation state,
// so after reloading the page there is nothing to show.
export default function OrderConfirmationPage() {
  const order = useLocation().state?.order;

  if (!order) {
    return (
      <section className="panel text-center py-5">
        <h1 className="page-title">No hay ningún pedido reciente</h1>
        <Button as={Link} to="/" variant="primary">Ver la carta</Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="confirmation-title">
      <div className="panel text-center mb-4">
        <p className="confirmation-kicker mb-1">¡Gracias, {order.customerName}!</p>
        <h1 id="confirmation-title" className="page-title mb-2">Pedido confirmado</h1>
        <p className="mb-1">Tu número de pedido es</p>
        <p className="order-number" data-testid="order-number">{order.orderNumber}</p>
        <p className="text-secondary mb-0">
          {DELIVERY_TYPES[order.deliveryType]?.label}
          {order.deliveryAddress ? ` · ${order.deliveryAddress}` : ''} · {PAYMENT_METHODS[order.paymentMethod]?.label}
          {order.paid ? ' (pagado)' : ' (pendiente de pago)'}
        </p>
      </div>
      <OrderSummary subtotal={Number(order.subtotal)} deliveryCost={Number(order.deliveryCost)} total={Number(order.total)}>
        <ul className="summary-items" aria-label="Productos del pedido">
          {order.lines.map((line) => (
            <li key={line.id}>
              {line.quantity} × {line.productName} <span className="text-secondary">{formatPrice(line.subtotal)}</span>
            </li>
          ))}
        </ul>
        <Button as={Link} to="/" variant="outline-ink" className="w-100">Volver a la carta</Button>
      </OrderSummary>
    </section>
  );
}
