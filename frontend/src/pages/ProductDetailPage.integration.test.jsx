import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProductPage } from '../services/productService';
import { renderApp } from '../test-utils';

// Integration test: real page, real service and real REST API (backend running with the sample data)
describe('ProductDetailPage with the real REST API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  async function idOf(category, name) {
    const page = await getProductPage({ category, size: 20 });
    return page.content.find((product) => product.name === name).id;
  }

  it('shows the ingredients of a sample product', async () => {
    renderApp(`/products/${await idOf('Burgers', 'Hamburguesa clásica')}`);

    expect(await screen.findByRole('heading', { level: 1, name: 'Hamburguesa clásica' })).toBeInTheDocument();
    const ingredients = within(screen.getByRole('list', { name: 'Ingredientes' }));
    expect(ingredients.getByText('Carne de ternera')).toBeInTheDocument();
    expect(ingredients.getByText('Queso cheddar')).toBeInTheDocument();
  });

  it('shows the products of a sample combo', async () => {
    renderApp(`/products/${await idOf('Combos', 'Menú clásico')}`);

    const products = within(await screen.findByRole('list', { name: 'Productos del menú' }));
    expect(products.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Hamburguesa clásica',
      'Patatas fritas',
      'Refresco de cola',
    ]);
  });

  it('shows the 404 page for a product that does not exist', async () => {
    renderApp('/products/999999');

    expect(await screen.findByRole('heading', { name: 'Esta página no está en la carta' })).toBeInTheDocument();
  });
});
