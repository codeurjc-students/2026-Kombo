import { formatPrice } from '../utils/format';

// Subtotal, delivery cost and total of a cart or an order. Without deliveryCost (the cart, where the
// delivery type is not chosen yet) only the subtotal is shown.
export default function OrderSummary({ subtotal, deliveryCost, total, children }) {
  if (deliveryCost === undefined) {
    return (
      <section className="panel order-summary" aria-labelledby="order-summary-title">
        <h2 id="order-summary-title" className="h4 mb-3">Resumen</h2>
        <dl className="summary-list">
          <div className="summary-total">
            <dt>Subtotal</dt>
            <dd data-testid="summary-subtotal">{formatPrice(subtotal)}</dd>
          </div>
        </dl>
        {children}
      </section>
    );
  }
  return (
    <section className="panel order-summary" aria-labelledby="order-summary-title">
      <h2 id="order-summary-title" className="h4 mb-3">Resumen</h2>
      <dl className="summary-list">
        <div>
          <dt>Subtotal</dt>
          <dd data-testid="summary-subtotal">{formatPrice(subtotal)}</dd>
        </div>
        <div>
          <dt>Gastos de envío</dt>
          <dd data-testid="summary-delivery">{deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd data-testid="summary-total">{formatPrice(total)}</dd>
        </div>
      </dl>
      {children}
    </section>
  );
}
