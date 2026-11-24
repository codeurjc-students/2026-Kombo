import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY } from '../context/CartProvider';
import { cancelOrder, getMyOrders } from '../services/orderService';
import { getSettings } from '../services/settingsService';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/orderService', () => ({ getMyOrders: vi.fn(), getOrder: vi.fn(), cancelOrder: vi.fn() }));
vi.mock('../services/settingsService', () => ({
  getSettings: vi.fn().mockResolvedValue({ deliveryCost: 2.5, freeDeliveryThreshold: 25, cancellationFeePercent: 80 }),
}));

const order = (id, status) => ({
  id,
  orderNumber: 1000 + id,
  status,
  total: 12.5,
  createdAt: '2026-11-09T10:00:00',
  lines: [{ id, quantity: 2, productName: 'Hamburguesa clásica', product: { id: 1, name: 'Hamburguesa clásica', price: 8.5 } }],
});

describe('ProfilePage', () => {
  beforeEach(() => {
    getMyOrders.mockReset();
  });

  it('shows the data and the last orders of the customer, 4 at a time', async () => {
    getMyOrders
      .mockResolvedValueOnce({ content: [order(2, 'READY')], page: { number: 0, totalPages: 2 } })
      .mockResolvedValueOnce({ content: [order(1, 'DELIVERED')], page: { number: 1, totalPages: 2 } });
    renderApp('/profile', { user: { ...CUSTOMER, phone: '600111222', addresses: ['Calle Mayor 1'] } });

    expect(screen.getByText('customer@kombo.com')).toBeInTheDocument();
    expect(screen.getByText('Calle Mayor 1')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Pedido nº 1002' })).toHaveAttribute('href', '/orders/2');
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(screen.getByText('2 × Hamburguesa clásica')).toBeInTheDocument();
    expect(getMyOrders).toHaveBeenCalledWith({ page: 0, size: 4 });

    fireEvent.click(screen.getByRole('button', { name: 'Más resultados' }));

    expect(await screen.findByText('Entregado')).toBeInTheDocument();
    expect(getMyOrders).toHaveBeenLastCalledWith({ page: 1, size: 4 });
  });

  it('cancels an order in preparation after the confirmation and reads the orders again', async () => {
    const unpaid = { ...order(2, 'IN_PREPARATION'), paymentMethod: 'CASH', paid: false };
    getMyOrders
      .mockResolvedValueOnce({ content: [unpaid, order(1, 'DELIVERED')], page: { number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({
        content: [{ ...unpaid, status: 'CANCELLED', cancellationFee: 0 }, order(1, 'DELIVERED')],
        page: { number: 0, totalPages: 1 },
      });
    cancelOrder.mockResolvedValue({ ...unpaid, status: 'CANCELLED', cancellationFee: 0 });
    renderApp('/profile', { user: CUSTOMER });

    // Only the order in preparation can be cancelled
    const card = within((await screen.findByRole('link', { name: 'Pedido nº 1002' })).closest('li'));
    const delivered = within(screen.getByRole('link', { name: 'Pedido nº 1001' }).closest('li'));
    expect(delivered.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();
    fireEvent.click(card.getByRole('button', { name: 'Cancelar pedido' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('No se te cobrará nada.')).toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: 'Sí, cancelar el pedido' }));

    expect(await screen.findByText('Pedido nº 1002 cancelado. Efectivo - No cobrado.')).toBeInTheDocument();
    expect(cancelOrder).toHaveBeenCalledWith(2);
    expect(await screen.findByText('Cancelado')).toBeInTheDocument();
    expect(getSettings).toHaveBeenCalled();
  });

  it('repeats an order: its products go to the cart', async () => {
    getMyOrders.mockResolvedValue({ content: [order(2, 'DELIVERED')], page: { number: 0, totalPages: 1 } });
    const { router } = renderApp('/profile', { user: CUSTOMER });
    const card = within((await screen.findByRole('link', { name: 'Pedido nº 1002' })).closest('li'));

    fireEvent.click(card.getByRole('button', { name: 'Repetir pedido' }));

    expect(router.state.location.pathname).toBe('/cart');
    expect(await screen.findByText(/Hemos añadido al carrito los productos del pedido nº 1002/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))).toEqual([
      { product: { id: 1, name: 'Hamburguesa clásica', price: 8.5 }, quantity: 2 },
    ]);
  });

  it('invites the customer to order when there are no orders', async () => {
    getMyOrders.mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } });
    renderApp('/profile', { user: CUSTOMER });
    expect(await screen.findByText(/Todavía no has hecho ningún pedido/)).toBeInTheDocument();
  });

  it.each([
    ['employees', EMPLOYEE],
    ['the administrator', ADMIN],
  ])('sends %s straight to the settings of their account, without order history', async (_, user) => {
    const { router } = renderApp('/profile', { user });

    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/profile/settings');
    expect(getMyOrders).not.toHaveBeenCalled();
  });

  it('leaves the settings of the account to the "Mi perfil" link of the menu, as for the other roles', async () => {
    getMyOrders.mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } });
    renderApp('/profile', { user: CUSTOMER });
    await screen.findByText(/Todavía no has hecho ningún pedido/);
    expect(screen.queryByRole('button', { name: 'Configuración' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile/settings');
  });

  it('shows the profile picture of the user', async () => {
    getMyOrders.mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } });
    renderApp('/profile', { user: { ...CUSTOMER, imageId: 4 } });
    expect(within(screen.getByRole('main')).getByRole('img', { name: 'Foto de perfil de Lucía' })).toHaveAttribute(
      'src',
      '/api/v1/users/me/image?v=4',
    );
    await screen.findByText(/Todavía no has hecho ningún pedido/);
  });
});
