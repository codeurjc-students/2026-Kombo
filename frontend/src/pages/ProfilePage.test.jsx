import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserOrders } from '../services/userService';
import { CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/userService', () => ({ getUserOrders: vi.fn() }));

const order = (id, status) => ({
  id,
  orderNumber: id,
  status,
  total: 12.5,
  createdAt: '2026-11-09T10:00:00',
  lines: [{ id, quantity: 2, product: { name: 'Classic Burger' } }],
});

describe('ProfilePage', () => {
  beforeEach(() => {
    getUserOrders.mockReset();
  });

  it('shows the data and the orders of the customer', async () => {
    getUserOrders
      .mockResolvedValueOnce({ content: [order(2, 'READY')], page: { number: 0, totalPages: 2 } })
      .mockResolvedValueOnce({ content: [order(1, 'DELIVERED')], page: { number: 1, totalPages: 2 } });
    renderApp('/profile', { user: { ...CUSTOMER, phone: '600111222', addresses: ['Calle Mayor 1'] } });

    expect(screen.getByText('customer@kombo.com')).toBeInTheDocument();
    expect(screen.getByText('Calle Mayor 1')).toBeInTheDocument();
    expect(await screen.findByText('Pedido nº 2')).toBeInTheDocument();
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(screen.getAllByText('2 × Classic Burger')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Más resultados' }));

    expect(await screen.findByText('Entregado')).toBeInTheDocument();
    expect(getUserOrders).toHaveBeenLastCalledWith(CUSTOMER.id, { page: 1 });
  });

  it('invites the customer to order when there are no orders', async () => {
    getUserOrders.mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } });
    renderApp('/profile', { user: CUSTOMER });
    expect(await screen.findByText(/Todavía no has hecho ningún pedido/)).toBeInTheDocument();
  });

  it('does not show order history to employees', () => {
    renderApp('/profile', { user: EMPLOYEE });
    expect(screen.queryByText('Mis pedidos', { selector: 'h2' })).not.toBeInTheDocument();
    expect(getUserOrders).not.toHaveBeenCalled();
  });
});
