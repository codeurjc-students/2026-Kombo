import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import { createOrder, getOrder } from '../services/orderService';
import { getProductPage } from '../services/productService';
import { startCustomerSession } from '../test-session';
import { renderApp } from '../test-utils';

// Integration test: real profile and order pages, real services and real REST API (backend running with the
// sample data). Each run signs up new customers, so it can be repeated against the same database.
describe('Order history with the real REST API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function placeOrderOfWater(customer) {
    const page = await getProductPage({ category: 'Drinks', size: 20 });
    const water = page.content.find((product) => product.name === 'Agua');
    return createOrder({
      lines: [{ productId: water.id, quantity: 3 }],
      deliveryType: 'TAKE_AWAY',
      deliveryAddress: null,
      paymentMethod: 'CASH',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
    });
  }

  it('shows the last orders in the profile and the detail of each one', async () => {
    const customer = await startCustomerSession('history-test');
    const order = await placeOrderOfWater(customer);
    renderApp('/profile', { user: customer });

    const link = await screen.findByRole('link', { name: `Pedido nº ${order.orderNumber}` }, { timeout: 5000 });
    expect(screen.getByText('3 × Agua')).toBeInTheDocument();
    fireEvent.click(link);

    expect(await screen.findByRole('heading', { name: `Pedido nº ${order.orderNumber}` })).toBeInTheDocument();
    expect(screen.getByText('Efectivo - Pendiente de pago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repetir pedido' })).toBeInTheDocument();
  });

  it('does not give the order of a customer to another customer (403)', async () => {
    const owner = await startCustomerSession('history-owner');
    const order = await placeOrderOfWater(owner);
    await startCustomerSession('history-other');

    const error = await getOrder(order.id).catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(403);
  });
});
