import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import { getOrders, startOfToday, updateOrder } from '../services/orderService';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/orderService', async (importOriginal) => ({
  ...(await importOriginal()),
  getOrders: vi.fn(),
  updateOrder: vi.fn(),
}));

function order(id, status, { paid = true, paymentMethod = 'CARD', minutesAgo = 0 } = {}) {
  return {
    id,
    orderNumber: 1000 + id,
    status,
    paid,
    paymentMethod,
    deliveryType: 'TAKE_AWAY',
    customerName: 'Ana',
    total: 9.5,
    createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    lines: [{ id, quantity: 1, productName: 'Hamburguesa clásica' }],
  };
}

const page = (content) => ({ content, page: { number: 0, totalPages: 1 } });

// The dashboard asks the server for the pending orders and the finished ones
function mockOrders(pending, finished = []) {
  getOrders.mockImplementation(({ statuses }) =>
    Promise.resolve(page(statuses.includes('READY') ? pending : finished)),
  );
}

async function card(number) {
  return within(await screen.findByRole('listitem', { name: `Pedido nº ${number}` }));
}

describe('OrdersDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateOrder.mockResolvedValue({});
  });

  it('shows the pending orders oldest first and the finished ones most recent first', async () => {
    mockOrders([order(1, 'IN_PREPARATION'), order(2, 'READY')], [order(3, 'DELIVERED')]);
    renderApp('/orders', { user: EMPLOYEE });

    const pending = within(await screen.findByRole('list', { name: 'Pedidos pendientes' }));
    expect(pending.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Pedido nº 1001',
      'Pedido nº 1002',
    ]);
    expect(getOrders).toHaveBeenCalledWith({ statuses: ['IN_PREPARATION', 'READY'], page: 0, sort: 'createdAt,asc' });

    fireEvent.click(screen.getByRole('tab', { name: 'Terminados' }));

    const finished = within(await screen.findByRole('list', { name: 'Pedidos terminados' }));
    expect(finished.getByText('Entregado')).toBeInTheDocument();
    // "Pedido nº 1003 - 13:05": the time it was placed instead of the waiting minutes
    expect(finished.getByText(/^\d{1,2}:\d{2}$/)).toBeInTheDocument();
    expect(finished.queryByLabelText(/Esperando/)).not.toBeInTheDocument();
    expect(finished.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    // Only the finished orders of today
    expect(getOrders).toHaveBeenCalledWith({
      statuses: ['DELIVERED', 'CANCELLED'],
      since: startOfToday(),
      page: 0,
      sort: 'createdAt,desc',
    });
  });

  it('shows how long each pending order has been waiting, in red after 10 minutes', async () => {
    mockOrders([
      order(1, 'IN_PREPARATION', { minutesAgo: 25 }),
      order(2, 'READY', { minutesAgo: 10 }),
      order(3, 'IN_PREPARATION', { minutesAgo: 75 }),
    ]);
    renderApp('/orders', { user: EMPLOYEE });

    // "Pedido nº 1001 - 25 min", with the minutes in red
    const late = (await card(1001)).getByLabelText('Esperando 25 min');
    expect(late).toHaveTextContent(/^25 min$/);
    expect(late).toHaveClass('text-danger');
    expect((await card(1002)).getByLabelText('Esperando 10 min')).not.toHaveClass('text-danger');
    expect((await card(1003)).getByLabelText('Esperando 1 h 15 min')).toHaveClass('text-danger');
  });

  it('keeps counting the waiting time while the page is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      mockOrders([order(1, 'IN_PREPARATION', { minutesAgo: 9 })]);
      renderApp('/orders', { user: EMPLOYEE });
      expect((await card(1001)).getByLabelText('Esperando 9 min')).not.toHaveClass('text-danger');

      await act(() => vi.advanceTimersByTimeAsync(2 * 60000));

      expect((await card(1001)).getByLabelText('Esperando 11 min')).toHaveClass('text-danger');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reads the orders again every 30 seconds without hiding the list', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      mockOrders([order(1, 'IN_PREPARATION')]);
      renderApp('/orders', { user: EMPLOYEE });
      await card(1001);
      const calls = getOrders.mock.calls.length;
      mockOrders([order(1, 'IN_PREPARATION'), order(2, 'IN_PREPARATION')]);

      await act(() => vi.advanceTimersByTimeAsync(29000));
      expect(getOrders).toHaveBeenCalledTimes(calls);

      await act(() => vi.advanceTimersByTimeAsync(1000));

      expect(await card(1002)).toBeTruthy();
      expect(screen.queryByText('Cargando pedidos…')).not.toBeInTheDocument();
      // Both lists (pending and finished) are read again, from their first page
      expect(getOrders).toHaveBeenCalledTimes(calls + 2);
      expect(getOrders.mock.calls.slice(calls).map(([options]) => options.page)).toEqual([0, 0]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the confirmation open when the orders are read again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      mockOrders([order(1, 'IN_PREPARATION')]);
      renderApp('/orders', { user: EMPLOYEE });
      fireEvent.click((await card(1001)).getByRole('button', { name: 'Cancelar' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await act(() => vi.advanceTimersByTimeAsync(30000));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('marks an order as ready and reloads the lists', async () => {
    mockOrders([order(1, 'IN_PREPARATION')]);
    renderApp('/orders', { user: EMPLOYEE });

    fireEvent.click((await card(1001)).getByRole('button', { name: 'Marcar como listo' }));

    expect(await screen.findByText('Pedido nº 1001 listo.')).toBeInTheDocument();
    expect(updateOrder).toHaveBeenCalledWith(1, { status: 'READY' });
    expect(getOrders.mock.calls.length).toBeGreaterThan(2);
  });

  it('charges a cash order before it is delivered', async () => {
    mockOrders([order(2, 'READY', { paid: false, paymentMethod: 'CASH' }), order(3, 'READY')]);
    renderApp('/orders', { user: EMPLOYEE });

    const unpaid = await card(1002);
    expect(unpaid.getByText('Efectivo - Pendiente de pago')).toBeInTheDocument();
    expect(unpaid.getByText('Cóbralo antes de entregarlo.')).toBeInTheDocument();
    expect(unpaid.queryByRole('button', { name: 'Entregar' })).not.toBeInTheDocument();
    fireEvent.click(unpaid.getByRole('button', { name: 'Cobrar en efectivo' }));
    expect(await screen.findByText('Pedido nº 1002 cobrado en efectivo.')).toBeInTheDocument();
    expect(updateOrder).toHaveBeenCalledWith(2, { paid: true });

    fireEvent.click((await card(1003)).getByRole('button', { name: 'Entregar' }));
    expect(await screen.findByText('Pedido nº 1003 entregado.')).toBeInTheDocument();
    expect(updateOrder).toHaveBeenLastCalledWith(3, { status: 'DELIVERED' });
  });

  it('cancels an order only after the confirmation', async () => {
    mockOrders([order(1, 'IN_PREPARATION')]);
    renderApp('/orders', { user: ADMIN });

    fireEvent.click((await card(1001)).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Volver' }));
    expect(updateOrder).not.toHaveBeenCalled();

    fireEvent.click((await card(1001)).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, cancelar el pedido' }));

    expect(await screen.findByText('Pedido nº 1001 cancelado.')).toBeInTheDocument();
    expect(updateOrder).toHaveBeenCalledWith(1, { status: 'CANCELLED' });
  });

  it('explains when an order changed meanwhile or cannot be saved', async () => {
    mockOrders([order(1, 'IN_PREPARATION')]);
    updateOrder.mockRejectedValueOnce(new ApiError(409, 'Conflict')).mockRejectedValueOnce(new ApiError(500, 'Error'));
    renderApp('/orders', { user: EMPLOYEE });

    fireEvent.click((await card(1001)).getByRole('button', { name: 'Marcar como listo' }));
    expect(await screen.findByText(/ya no se puede cambiar así/)).toBeInTheDocument();

    fireEvent.click((await card(1001)).getByRole('button', { name: 'Marcar como listo' }));
    expect(await screen.findByText(/No hemos podido cambiar el pedido nº 1001/)).toBeInTheDocument();
  });

  it('shows an empty list, an error with a retry button and the counter order button', async () => {
    getOrders.mockResolvedValueOnce(page([])).mockRejectedValueOnce(new ApiError(500, 'Error'));
    renderApp('/orders', { user: EMPLOYEE });

    expect(await screen.findByText('No hay pedidos pendientes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo pedido en mostrador' })).toHaveAttribute('href', '/');
    fireEvent.click(screen.getByRole('tab', { name: 'Terminados' }));
    expect(await screen.findByText('No hemos podido cargar los pedidos.')).toBeInTheDocument();
  });

  it('is only for employees and the administrator', () => {
    renderApp('/orders', { user: CUSTOMER });
    expect(screen.queryByRole('heading', { name: 'Pedidos' })).not.toBeInTheDocument();
    expect(getOrders).not.toHaveBeenCalled();
  });
});
