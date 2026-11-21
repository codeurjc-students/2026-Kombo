const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const dateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

export function formatPrice(value) {
  return currency.format(Number(value));
}

export function formatDateTime(value) {
  return value ? dateTime.format(new Date(value)) : '';
}

export const ROLE_LABELS = {
  CUSTOMER: 'Cliente',
  EMPLOYEE: 'Empleado',
  ADMIN: 'Administrador',
};

export const ORDER_STATUS = {
  IN_PREPARATION: { label: 'En preparación', bg: 'warning' },
  READY: { label: 'Listo', bg: 'info' },
  DELIVERED: { label: 'Entregado', bg: 'success' },
  CANCELLED: { label: 'Cancelado', bg: 'secondary' },
};

// "2 × Hamburguesa clásica, 1 × Agua": the name of each line is the one it had when the order was placed
export function orderLinesSummary(order) {
  return order.lines.map((line) => `${line.quantity} × ${line.productName ?? line.product.name}`).join(', ');
}
