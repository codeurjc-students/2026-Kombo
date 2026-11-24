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

// Statuses of the dashboard of the employees
export const PENDING_STATUSES = ['IN_PREPARATION', 'READY'];
export const FINISHED_STATUSES = ['DELIVERED', 'CANCELLED'];

// Employees and the administrator: the orders in the statuses, one page at a time.
// sort: 'createdAt,asc' (oldest first, the default of the server) or 'createdAt,desc'.
// since: only the orders placed from that local date and time, as 'YYYY-MM-DDTHH:mm:ss'.
export function getOrders({ statuses = [], since, page = 0, size = 10, sort = 'createdAt,asc' } = {}) {
  const params = new URLSearchParams({ page, size, sort });
  statuses.forEach((status) => params.append('status', status));
  if (since) {
    params.set('since', since);
  }
  return apiFetch(`${ORDERS_PATH}?${params}`);
}

// 00:00 of today in local time, as getOrders expects it in since
export function startOfToday(now = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00`;
}

// Employees and the administrator: { status } to change the status, { paid: true } to mark a cash order as paid.
// 409 if the order cannot change that way (for example, delivering an order that is not paid).
export function updateOrder(id, changes) {
  return apiFetch(`${ORDERS_PATH}/${id}`, { method: 'PATCH', body: changes });
}

// A customer cancels one of their orders in preparation or ready (409 for any other status). Returns the order with
// its cancellationFee: the money the restaurant keeps (a percentage of a paid order that was already ready).
export function cancelOrder(id) {
  return apiFetch(`${ORDERS_PATH}/${id}`, { method: 'PATCH', body: { status: 'CANCELLED' } });
}

// Order history of the logged in user, the most recent first
export function getMyOrders({ page = 0, size = 4 } = {}) {
  return apiFetch(`/api/v1/users/me/orders?${new URLSearchParams({ page, size })}`);
}

// Turns the items of the cart into the lines of an order (only ids and units: the server sets the prices)
export function orderLinesFromCart(items) {
  return items.map((item) => ({ productId: item.product.id, quantity: item.quantity }));
}
