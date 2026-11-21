import { apiFetch } from './httpClient';

const ORDERS_PATH = '/api/v1/orders';

// Places an order and returns it with its number.
// order: { lines: [{ productId, quantity }], deliveryType, deliveryAddress, paymentMethod,
//          customerName, customerEmail, customerPhone }
export function createOrder(order) {
  return apiFetch(ORDERS_PATH, { method: 'POST', body: order });
}

// Detail of an order: the customer who placed it, employees or the administrator (403 for other users)
export function getOrder(id) {
  return apiFetch(`${ORDERS_PATH}/${id}`);
}

// Order history of the logged in user, the most recent first
export function getMyOrders({ page = 0, size = 4 } = {}) {
  return apiFetch(`/api/v1/users/me/orders?${new URLSearchParams({ page, size })}`);
}

// Turns the items of the cart into the lines of an order (only ids and units: the server sets the prices)
export function orderLinesFromCart(items) {
  return items.map((item) => ({ productId: item.product.id, quantity: item.quantity }));
}
