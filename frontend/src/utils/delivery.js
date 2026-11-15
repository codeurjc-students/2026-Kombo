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
