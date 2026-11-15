import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY } from '../context/CartProvider';
import { getSettings } from '../services/settingsService';
import { ADMIN, renderApp } from '../test-utils';

vi.mock('../services/settingsService', () => ({ getSettings: vi.fn() }));

const SETTINGS = { deliveryCost: 2.5, freeDeliveryThreshold: 25 };

function storeCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

const BURGER = { product: { id: 1, name: 'Hamburguesa clásica', price: 8.5 }, quantity: 2 };
const WATER = { product: { id: 2, name: 'Agua', price: 1.5 }, quantity: 1 };

// The page text uses non-breaking spaces between the number and the € sign
function amount(testId) {
  return screen.getByTestId(testId).textContent.replaceAll(' ', ' ');
}

describe('CartPage', () => {
  beforeEach(() => {
    getSettings.mockReset().mockResolvedValue(SETTINGS);
  });

  it('shows only the subtotal, because the delivery type is chosen in the checkout', async () => {
    storeCart([BURGER, WATER]);
    renderApp('/cart');

    const list = within(screen.getByRole('list', { name: 'Productos del carrito' }));
    expect(list.getByRole('link', { name: 'Hamburguesa clásica' })).toHaveAttribute('href', '/products/1');
    expect(list.getByRole('spinbutton', { name: 'Unidades de Hamburguesa clásica' })).toHaveValue(2);
    expect(amount('summary-subtotal')).toBe('18,50 €');
    expect(screen.queryByTestId('summary-delivery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('summary-total')).not.toBeInTheDocument();
    // The note explains the delivery cost of home deliveries
    await waitFor(() =>
      expect(amount('delivery-note')).toContain('A domicilio, el envío cuesta 2,50 € y es gratis a partir de 25,00 €.'),
    );
    expect(screen.getByRole('button', { name: 'Tramitar pedido' })).toHaveAttribute('href', '/checkout');
  });

  it('changes the units and removes products, updating the subtotal', async () => {
    storeCart([BURGER, WATER]);
    renderApp('/cart');
    await screen.findByText(/gratis a partir de/);

    fireEvent.click(screen.getByRole('button', { name: 'Añadir una unidad de Hamburguesa clásica' }));
    expect(amount('summary-subtotal')).toBe('27,00 €');
    expect(screen.getByTestId('cart-count')).toHaveTextContent('4');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Unidades de Agua' }), { target: { value: '5' } });
    expect(amount('summary-subtotal')).toBe('33,00 €');

    fireEvent.click(screen.getByRole('button', { name: 'Quitar una unidad de Hamburguesa clásica' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Agua del carrito' }));
    expect(screen.queryByText('Agua')).not.toBeInTheDocument();
    expect(amount('summary-subtotal')).toBe('17,00 €');
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))).toEqual([{ ...BURGER, quantity: 2 }]);
  });

  it('shows an empty cart with a link to the menu', () => {
    renderApp('/cart');

    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver la carta' })).toHaveAttribute('href', '/');
  });

  it('still shows the cart when the delivery cost cannot be loaded', async () => {
    getSettings.mockRejectedValue(new Error('offline'));
    storeCart([WATER]);
    renderApp('/cart');

    await waitFor(() => expect(getSettings).toHaveBeenCalled());
    expect(amount('summary-subtotal')).toBe('1,50 €');
    expect(amount('delivery-note')).toBe('En el siguiente paso eliges si es para comer aquí, para llevar o a domicilio.');
  });

  it('does not let the administrator place orders', async () => {
    storeCart([WATER]);
    renderApp('/cart', { user: ADMIN });

    expect(screen.getByText('El administrador no puede hacer pedidos.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tramitar pedido' })).not.toBeInTheDocument();
    await screen.findByText(/gratis a partir de/);
  });
});
