import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY } from '../context/CartProvider';
import { getProductPage } from '../services/productService';
import { getSettings } from '../services/settingsService';
import { renderApp } from '../test-utils';

// Integration test: real checkout page, real services and real REST API (backend running with the sample data).
// Every run places a new anonymous order, so the test can be repeated against the same database.
describe('CheckoutPage with the real REST API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  function type(label, value) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }

  it('places an order from the cart and shows the number given by the server', async () => {
    const page = await getProductPage({ category: 'Drinks', size: 20 });
    const water = page.content.find((product) => product.name === 'Agua');
    const settings = await getSettings();
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ product: water, quantity: 2 }]));
    renderApp('/checkout');

    fireEvent.click(screen.getByLabelText(/A domicilio/));
    type('Dirección de entrega', 'Calle Tulipán s/n');
    type('Nombre', 'Ana Pérez');
    type('Correo electrónico', 'ana@example.com');
    type('Teléfono', '600123456');
    fireEvent.click(screen.getByLabelText('Efectivo'));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar y pagar/ }));

    expect(await screen.findByRole('heading', { name: 'Pedido confirmado' }, { timeout: 5000 })).toBeInTheDocument();
    expect(Number(screen.getByTestId('order-number').textContent)).toBeGreaterThan(1000);
    // 2 × 1,50 € is below the free delivery threshold: the server adds the delivery cost
    const total = 3 + Number(settings.deliveryCost);
    expect(screen.getByTestId('summary-total').textContent.replaceAll(' ', ' '))
      .toBe(`${total.toFixed(2).replace('.', ',')} €`);
    expect(screen.getByText(/pendiente de pago/)).toBeInTheDocument();
  });
});
