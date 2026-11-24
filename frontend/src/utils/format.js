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

// Whole minutes from a date until now (0 if the date is in the future)
export function minutesSince(value, now = new Date()) {
  return Math.max(0, Math.floor((now - new Date(value)) / 60000));
}

// A number of minutes in words, for example "3 min" or "1 h 5 min"
export function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}

const time = new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' });

// Time of a date, for example "13:05"
export function formatTime(value) {
  return time.format(new Date(value));
}

// "2 × Hamburguesa clásica, 1 × Agua": the name of each line is the one it had when the order was placed
export function orderLinesSummary(order) {
  return order.lines.map((line) => `${line.quantity} × ${line.productName ?? line.product.name}`).join(', ');
}

// Text without accents and in lower case, so a search finds "Pan de hamburguesa" when "HAMBURGUÉSA" is written
export function normalizeForSearch(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
