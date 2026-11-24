import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './httpClient';
import {
  PENDING_STATUSES,
  cancelOrder,
  createOrder,
  getMyOrders,
  getOrder,
  getOrders,
  orderLinesFromCart,
  startOfToday,
  updateOrder,
} from './orderService';
import { getSettings, updateSettings } from './settingsService';

vi.mock('./httpClient', () => ({ apiFetch: vi.fn() }));

describe('orderService and settingsService', () => {
  beforeEach(() => {
    apiFetch.mockReset().mockResolvedValue({});
  });

  it('reads the orders of the dashboard by status and age', async () => {
    await getOrders({ statuses: PENDING_STATUSES });
    await getOrders({ statuses: ['DELIVERED'], since: '2026-11-22T00:00:00', page: 1, sort: 'createdAt,desc' });

    expect(apiFetch.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/orders?page=0&size=10&sort=createdAt%2Casc&status=IN_PREPARATION&status=READY',
      '/api/v1/orders?page=1&size=10&sort=createdAt%2Cdesc&status=DELIVERED&since=2026-11-22T00%3A00%3A00',
    ]);
  });

  it('gives 00:00 of today in local time', () => {
    expect(startOfToday(new Date(2026, 0, 5, 18, 30))).toBe('2026-01-05T00:00:00');
  });

  it('changes an order with PATCH', async () => {
    await updateOrder(7, { paid: true });

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/orders/7', { method: 'PATCH', body: { paid: true } });
  });

  it('sends the order with POST', async () => {
    const order = { lines: [{ productId: 1, quantity: 2 }], deliveryType: 'EAT_IN' };

    await createOrder(order);

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/orders', { method: 'POST', body: order });
  });

  it('reads an order and the history of the logged in user', async () => {
    await getOrder(7);
    await getMyOrders();
    await getMyOrders({ page: 2, size: 10 });

    expect(apiFetch.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/orders/7',
      '/api/v1/users/me/orders?page=0&size=4',
      '/api/v1/users/me/orders?page=2&size=10',
    ]);
  });

  it('sends only the ids and units of the cart, never the prices', () => {
    const items = [{ product: { id: 1, name: 'Test Burger', price: 8.5 }, quantity: 2 }];

    expect(orderLinesFromCart(items)).toEqual([{ productId: 1, quantity: 2 }]);
  });

  it('reads and changes the settings', async () => {
    await getSettings();
    await updateSettings({ deliveryCost: 3.2, cancellationFeePercent: 80 });

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/api/v1/settings');
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/api/v1/settings', {
      method: 'PUT',
      body: { deliveryCost: 3.2, cancellationFeePercent: 80 },
    });
  });

  it('cancels an order of the customer with PATCH and the status CANCELLED', async () => {
    await cancelOrder(7);

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/orders/7', { method: 'PATCH', body: { status: 'CANCELLED' } });
  });
});
