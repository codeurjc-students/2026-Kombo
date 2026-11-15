import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './httpClient';
import { createOrder, orderLinesFromCart } from './orderService';
import { getSettings, updateDeliveryCost } from './settingsService';

vi.mock('./httpClient', () => ({ apiFetch: vi.fn() }));

describe('orderService and settingsService', () => {
  beforeEach(() => {
    apiFetch.mockReset().mockResolvedValue({});
  });

  it('sends the order with POST', async () => {
    const order = { lines: [{ productId: 1, quantity: 2 }], deliveryType: 'EAT_IN' };

    await createOrder(order);

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/orders', { method: 'POST', body: order });
  });

  it('sends only the ids and units of the cart, never the prices', () => {
    const items = [{ product: { id: 1, name: 'Test Burger', price: 8.5 }, quantity: 2 }];

    expect(orderLinesFromCart(items)).toEqual([{ productId: 1, quantity: 2 }]);
  });

  it('reads and changes the delivery cost', async () => {
    await getSettings();
    await updateDeliveryCost(3.2);

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/api/v1/settings');
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/api/v1/settings', { method: 'PUT', body: { deliveryCost: 3.2 } });
  });
});
