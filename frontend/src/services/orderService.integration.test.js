import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './httpClient';
import {
  FINISHED_STATUSES,
  PENDING_STATUSES,
  cancelOrder,
  createOrder,
  getOrders,
  startOfToday,
  updateOrder,
} from './orderService';
import { getSettings } from './settingsService';
import { getProductPage } from './productService';
import { startCustomerSession, startSession } from '../test-session';

// Integration test: real services and real REST API (backend running with the sample data).
// The sample employee places a new counter order in every run, so the test can be repeated against the same
// database without changing the sample orders.
describe('orderService for the order dashboard with the real REST API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function waterId() {
    const page = await getProductPage({ category: 'Drinks', size: 20 });
    return page.content.find((product) => product.name === 'Agua').id;
  }

  it('places a counter order, charges it, prepares it and delivers it', async () => {
    await startSession('employee@kombo.com', 'employee');
    const order = await createOrder({
      lines: [{ productId: await waterId(), quantity: 1 }],
      deliveryType: 'EAT_IN',
      paymentMethod: 'CASH',
      customerName: 'Mesa 4',
      customerEmail: '',
      customerPhone: '',
    });
    expect(order).toMatchObject({ customerName: 'Mesa 4', customerEmail: null, paid: false, status: 'IN_PREPARATION' });

    const pending = await getOrders({ statuses: PENDING_STATUSES, size: 100 });
    expect(pending.content.map((item) => item.id)).toContain(order.id);

    const notPaid = await updateOrder(order.id, { status: 'READY' })
      .then(() => updateOrder(order.id, { status: 'DELIVERED' }))
      .catch((err) => err);
    expect(notPaid).toBeInstanceOf(ApiError);
    expect(notPaid.status).toBe(409);

    await updateOrder(order.id, { paid: true });
    const delivered = await updateOrder(order.id, { status: 'DELIVERED' });
    expect(delivered).toMatchObject({ status: 'DELIVERED', paid: true });

    const finished = await getOrders({ statuses: FINISHED_STATUSES, since: startOfToday(), sort: 'createdAt,desc' });
    expect(finished.content[0].id).toBe(order.id);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const none = await getOrders({ statuses: FINISHED_STATUSES, since: startOfToday(tomorrow) });
    expect(none.content).toEqual([]);
  });

  it('lets a customer order without a phone to take away and cancel the order while it is in preparation', async () => {
    const settings = await getSettings();
    expect(settings.cancellationFeePercent).toBeGreaterThanOrEqual(0);
    await startCustomerSession('client-cancel');
    const order = await createOrder({
      lines: [{ productId: await waterId(), quantity: 1 }],
      deliveryType: 'TAKE_AWAY',
      paymentMethod: 'CARD',
      customerName: 'Ana',
      customerEmail: 'client-cancel@example.com',
      customerPhone: '',
    });
    expect(order).toMatchObject({ customerPhone: null, paid: true, status: 'IN_PREPARATION' });

    const cancelled = await cancelOrder(order.id);
    expect(cancelled).toMatchObject({ status: 'CANCELLED', paid: true, cancellationFee: 0 });

    const again = await cancelOrder(order.id).catch((err) => err);
    expect(again).toBeInstanceOf(ApiError);
    expect(again.status).toBe(409);
  });

  it('does not show the dashboard to customers', async () => {
    await startCustomerSession('client-dashboard');

    const error = await getOrders({ statuses: PENDING_STATUSES }).catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(403);
  });
});
