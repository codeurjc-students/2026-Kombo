import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY } from '../context/CartProvider';
import { ApiError } from '../services/httpClient';
import { getOrder } from '../services/orderService';
import { CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/orderService', () => ({ getOrder: vi.fn(), getMyOrders: vi.fn() }));

// Order as returned by GET /api/v1/orders/{id}. The burger costs 9,00 € now: the line keeps the 8,50 € paid.
const ORDER = {
  id: 7,
  orderNumber: 1007,
  status: 'DELIVERED',
  createdAt: '2026-11-09T10:00:00',
  deliveryType: 'DELIVERY',
  deliveryAddress: 'Calle Mayor 1',
  paymentMethod: 'CASH',
  paid: true,
  lines: [
    {
      id: 70,
      productName: 'Hamburguesa clásica',
      product: { id: 1, name: 'Hamburguesa clásica', price: 9 },
      quantity: 2,
      unitPrice: 8.5,
      subtotal: 17,
    },
    { id: 71, productName: 'Agua', product: { id: 8, name: 'Agua', price: 1.5 }, quantity: 1, unitPrice: 1.5, subtotal: 1.5 },
  ],
  subtotal: 18.5,
  deliveryCost: 2.5,
  total: 21,
};

function amount(testId) {
  return screen.getByTestId(testId).textContent.replaceAll(' ', ' ');
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    getOrder.mockReset().mockResolvedValue(ORDER);
  });

  it('shows the products with the price paid, the delivery, the payment and the totals', async () => {
    renderApp('/orders/7', { user: CUSTOMER });

    expect(await screen.findByRole('heading', { name: 'Pedido nº 1007' })).toBeInTheDocument();
    expect(getOrder).toHaveBeenCalledWith('7');
    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('A domicilio')).toBeInTheDocument();
    expect(screen.getByText('Calle Mayor 1')).toBeInTheDocument();
    expect(screen.getByText('Efectivo (pagado)')).toBeInTheDocument();
    const rows = within(screen.getByRole('table')).getAllByRole('row').map((row) => row.textContent.replaceAll(' ', ' '));
    expect(rows.slice(1)).toEqual(['Hamburguesa clásica28,50 €17,00 €', 'Agua11,50 €1,50 €']);
    expect(amount('summary-subtotal')).toBe('18,50 €');
    expect(amount('summary-delivery')).toBe('2,50 €');
    expect(amount('summary-total')).toBe('21,00 €');
  });

  it('repeats the order with the current prices', async () => {
    const { router } = renderApp('/orders/7', { user: CUSTOMER });

    fireEvent.click(await screen.findByRole('button', { name: 'Repetir pedido' }));

    expect(router.state.location.pathname).toBe('/cart');
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))).toEqual([
      { product: { id: 1, name: 'Hamburguesa clásica', price: 9 }, quantity: 2 },
      { product: { id: 8, name: 'Agua', price: 1.5 }, quantity: 1 },
    ]);
  });

  it('only offers to repeat the order to customers', async () => {
    renderApp('/orders/7', { user: EMPLOYEE });

    await screen.findByRole('heading', { name: 'Pedido nº 1007' });
    expect(screen.queryByRole('button', { name: 'Repetir pedido' })).not.toBeInTheDocument();
  });

  it('shows 403 for the order of another user', async () => {
    getOrder.mockRejectedValueOnce(new ApiError(403, 'Access denied'));
    renderApp('/orders/8', { user: CUSTOMER });
    expect(await screen.findByRole('heading', { name: 'Este pedido no es tuyo' })).toBeInTheDocument();
  });

  it('shows the 404 page for an order that does not exist and errors with Reintentar', async () => {
    getOrder.mockRejectedValueOnce(new ApiError(404, 'Order 9 not found'));
    const { router } = renderApp('/orders/9', { user: CUSTOMER });
    expect(await screen.findByRole('heading', { name: 'Esta página no está en la carta' })).toBeInTheDocument();

    getOrder.mockRejectedValueOnce(new Error('offline'));
    await router.navigate('/orders/10');
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Pedido nº 1007' })).toBeInTheDocument();
  });

  it('needs a session', async () => {
    const { router } = renderApp('/orders/7');
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});
