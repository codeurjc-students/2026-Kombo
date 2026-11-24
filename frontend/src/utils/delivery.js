import { formatPrice } from './format';

// Delivery types and payment methods of an order, with the texts shown to the user
export const DELIVERY_TYPES = {
  EAT_IN: { label: 'Comer aquí', help: 'Recoges tu pedido en el mostrador y lo tomas en el local.' },
  TAKE_AWAY: { label: 'Para llevar', help: 'Recoges tu pedido en el restaurante.' },
  DELIVERY: { label: 'A domicilio', help: 'Te lo llevamos a la dirección que indiques.' },
};

export const PAYMENT_METHODS = {
  CARD: { label: 'Tarjeta' },
  CASH: { label: 'Efectivo' },
};

// Same rule as the server (Settings.deliveryCostFor): only home deliveries pay the delivery cost,
// and only when the subtotal is below the free delivery threshold. The server always recalculates it.
export function deliveryCostFor(deliveryType, subtotal, settings) {
  if (!settings || deliveryType !== 'DELIVERY' || subtotal >= Number(settings.freeDeliveryThreshold)) {
    return 0;
  }
  return Number(settings.deliveryCost);
}

export function orderTotal(subtotal, deliveryCost) {
  return Math.round((subtotal + deliveryCost) * 100) / 100;
}

// Payment of an order as shown in every view, for example "Tarjeta - Pagado". A paid order that was cancelled is
// given back: in full ("Efectivo - Devuelto") or except the cancellation fee that the restaurant keeps.
export function paymentStatus(order) {
  const method = PAYMENT_METHODS[order.paymentMethod]?.label ?? order.paymentMethod;
  if (order.status === 'CANCELLED') {
    if (!order.paid) {
      return `${method} - No cobrado`;
    }
    const fee = Number(order.cancellationFee ?? 0);
    if (fee > 0) {
      return `${method} - Devuelto ${formatPrice(Number(order.total) - fee)} (cobrado ${formatPrice(fee)})`;
    }
    return `${method} - Devuelto`;
  }
  return `${method} - ${order.paid ? 'Pagado' : 'Pendiente de pago'}`;
}

// Same rule as the server (OrderService.cancelByCustomer): a customer who cancels a paid order that is already
// ready pays the percentage of the settings, rounded to cents; otherwise nothing.
export function cancellationFeeFor(order, percent) {
  if (order.status !== 'READY' || !order.paid) {
    return 0;
  }
  return Math.round(Number(order.total) * Number(percent)) / 100;
}

// A customer can cancel their order while it is in preparation or ready
export function canBeCancelledByCustomer(order) {
  return order.status === 'IN_PREPARATION' || order.status === 'READY';
}
