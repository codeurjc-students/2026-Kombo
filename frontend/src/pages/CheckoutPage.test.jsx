import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY } from '../context/CartProvider';
import { ApiError } from '../services/httpClient';
import { createOrder } from '../services/orderService';
import { getSettings } from '../services/settingsService';
import { CUSTOMER, renderApp } from '../test-utils';

vi.mock('../services/settingsService', () => ({ getSettings: vi.fn() }));
vi.mock('../services/orderService', async (importOriginal) => ({
  ...(await importOriginal()),
  createOrder: vi.fn(),
}));

const BURGER = { product: { id: 1, name: 'Hamburguesa clásica', price: 8.5 }, quantity: 2 };

// Order as returned by POST /api/v1/orders
const PLACED_ORDER = {
  id: 7,
  orderNumber: 1007,
  deliveryType: 'DELIVERY',
  deliveryAddress: 'Calle Mayor 1',
  paymentMethod: 'CARD',
  paid: true,
  customerName: 'Ana Pérez',
  lines: [{ id: 70, productName: 'Hamburguesa clásica', quantity: 2, unitPrice: 8.5, subtotal: 17 }],
  subtotal: 17,
  deliveryCost: 2.5,
  total: 19.5,
};

function type(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillContactAndCard() {
  type('Nombre', 'Ana Pérez');
  type('Correo electrónico', 'ana@example.com');
  type('Teléfono', '600123456');
  type('Número de tarjeta', '4111 1111 1111 1111');
  type('Caducidad', '12/99');
  type('CVV', '123');
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Confirmar y pagar/ }));
}

function amount(testId) {
  return screen.getByTestId(testId).textContent.replaceAll(' ', ' ');
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([BURGER]));
    getSettings.mockReset().mockResolvedValue({ deliveryCost: 2.5, freeDeliveryThreshold: 25 });
    createOrder.mockReset().mockResolvedValue(PLACED_ORDER);
  });

  it('places a home delivery paid by card and shows the order number', async () => {
    renderApp('/checkout');
    fireEvent.click(screen.getByLabelText(/A domicilio/));
    type('Dirección de entrega', 'Calle Mayor 1');
    fillContactAndCard();
    // The delivery cost is added for home deliveries below 25 €
    await waitFor(() => expect(amount('summary-delivery')).toBe('2,50 €'));
    expect(amount('summary-total')).toBe('19,50 €');

    submit();

    expect(await screen.findByRole('heading', { name: 'Pedido confirmado' })).toBeInTheDocument();
    expect(screen.getByTestId('order-number')).toHaveTextContent('1007');
    expect(createOrder).toHaveBeenCalledWith({
      lines: [{ productId: 1, quantity: 2 }],
      deliveryType: 'DELIVERY',
      deliveryAddress: 'Calle Mayor 1',
      paymentMethod: 'CARD',
      customerName: 'Ana Pérez',
      customerEmail: 'ana@example.com',
      customerPhone: '600123456',
    });
    // The card data is never sent, and the cart is emptied
    expect(JSON.stringify(createOrder.mock.calls[0][0])).not.toContain('4111');
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))).toEqual([]);
  });

  it('shows the wrong fields and does not send the order', () => {
    renderApp('/checkout');
    fireEvent.click(screen.getByLabelText(/A domicilio/));

    submit();

    expect(screen.getByText('Escribe la dirección de entrega.')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Escribe un correo electrónico válido.')).toBeInTheDocument();
    expect(screen.getByText('El número de tarjeta tiene 16 cifras.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveClass('is-invalid');
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('shows the saved data of the customer, who can pay in cash without card data', async () => {
    const refreshUser = vi.fn();
    renderApp('/checkout', { user: { ...CUSTOMER, phone: '600111222', addresses: ['Calle Tulipán s/n'] }, refreshUser });
    const summary = within(screen.getByTestId('contact-summary'));
    expect(summary.getByText('Lucía García')).toBeInTheDocument();
    expect(summary.getByText('customer@kombo.com')).toBeInTheDocument();
    expect(summary.getByText('600111222')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Efectivo'));
    expect(screen.queryByLabelText('Número de tarjeta')).not.toBeInTheDocument();
    submit();

    await screen.findByRole('heading', { name: 'Pedido confirmado' });
    expect(createOrder.mock.calls[0][0]).toMatchObject({
      deliveryType: 'TAKE_AWAY',
      deliveryAddress: null,
      paymentMethod: 'CASH',
      customerName: 'Lucía García',
      customerEmail: 'customer@kombo.com',
      customerPhone: '600111222',
    });
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it('waits for the session before showing the form', () => {
    renderApp('/checkout', { loading: true });

    expect(screen.getByText('Comprobando tu sesión…')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('lets the customer change their saved data for this order', async () => {
    renderApp('/checkout', { user: { ...CUSTOMER, phone: '600111222' } });

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    expect(screen.getByLabelText('Nombre')).toHaveValue('Lucía García');
    type('Teléfono', '699999999');
    fireEvent.click(screen.getByLabelText('Efectivo'));
    submit();

    await screen.findByRole('heading', { name: 'Pedido confirmado' });
    expect(createOrder.mock.calls[0][0].customerPhone).toBe('699999999');
  });

  it('opens the contact form when the saved data of the customer is not complete', () => {
    renderApp('/checkout', { user: { ...CUSTOMER, phone: null } });
    fireEvent.click(screen.getByLabelText('Efectivo'));

    submit();

    expect(screen.getByText('Escribe un teléfono de 9 a 15 cifras.')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono')).toHaveClass('is-invalid');
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('delivers to a saved address chosen by the customer', async () => {
    const refreshUser = vi.fn();
    const user = { ...CUSTOMER, phone: '600111222', addresses: ['Calle Tulipán s/n', 'Calle Mayor 1'] };
    renderApp('/checkout', { user, refreshUser });
    fireEvent.click(screen.getByLabelText(/A domicilio/));

    // The first saved address is chosen at first
    expect(screen.getByLabelText('Calle Tulipán s/n')).toBeChecked();
    expect(screen.queryByLabelText('Nueva dirección')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Calle Mayor 1'));
    fireEvent.click(screen.getByLabelText('Efectivo'));
    submit();

    await screen.findByRole('heading', { name: 'Pedido confirmado' });
    expect(createOrder.mock.calls[0][0].deliveryAddress).toBe('Calle Mayor 1');
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it('delivers to a new address, which is saved in the profile of the customer', async () => {
    const refreshUser = vi.fn();
    renderApp('/checkout', { user: { ...CUSTOMER, phone: '600111222', addresses: ['Calle Tulipán s/n'] }, refreshUser });
    fireEvent.click(screen.getByLabelText(/A domicilio/));
    fireEvent.click(screen.getByLabelText('Otra dirección'));
    expect(screen.getByText('Se guardará en tu perfil para tus próximos pedidos.')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Efectivo'));

    submit();
    expect(screen.getByText('Escribe la dirección de entrega.')).toBeInTheDocument();

    type('Nueva dirección', ' Calle Nueva 3 ');
    submit();

    await screen.findByRole('heading', { name: 'Pedido confirmado' });
    expect(createOrder.mock.calls[0][0].deliveryAddress).toBe('Calle Nueva 3');
    // The session is read again to have the new address
    expect(refreshUser).toHaveBeenCalled();
  });

  it('shows the error of the server and keeps the cart', async () => {
    createOrder.mockRejectedValue(new ApiError(400, 'Product 1 is not on the menu'));
    renderApp('/checkout');
    fillContactAndCard();

    submit();

    expect(await screen.findByText('Revisa los datos del pedido: Product 1 is not on the menu')).toBeInTheDocument();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');

    createOrder.mockRejectedValue(new Error('offline'));
    submit();
    expect(await screen.findByText(/No hemos podido hacer el pedido/)).toBeInTheDocument();
  });

  it('sends the user to the cart when it is empty', () => {
    localStorage.clear();
    renderApp('/checkout');

    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument();
  });

  it('lists the products of the order in the summary', () => {
    renderApp('/checkout');

    const items = within(screen.getByRole('list', { name: 'Productos del pedido' }));
    expect(items.getByText('2 × Hamburguesa clásica')).toBeInTheDocument();
  });
});

describe('OrderConfirmationPage', () => {
  it('has nothing to show after a reload', () => {
    renderApp('/order-confirmation');

    expect(screen.getByRole('heading', { name: 'No hay ningún pedido reciente' })).toBeInTheDocument();
  });
});
