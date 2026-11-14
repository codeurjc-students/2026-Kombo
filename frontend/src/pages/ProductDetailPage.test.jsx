import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProduct } from '../services/productService';
import { ApiError } from '../services/httpClient';
import { renderApp } from '../test-utils';

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  getProduct: vi.fn(),
}));

const BURGER = {
  id: 1,
  name: 'Hamburguesa clásica',
  price: 8.5,
  description: 'Hamburguesa de ternera con lechuga, tomate y queso',
  category: 'Burgers',
  combo: false,
  ingredients: [
    { id: 10, name: 'Carne de ternera', unit: 'unidades', quantity: 1 },
    { id: 11, name: 'Lechuga', unit: 'g', quantity: 20 },
  ],
  products: [],
};

const MENU = {
  id: 3,
  name: 'Menú clásico',
  price: 11.5,
  description: 'Hamburguesa clásica, patatas fritas y refresco de cola',
  category: 'Combos',
  combo: true,
  ingredients: [{ id: 12, name: 'Patatas', unit: 'g', quantity: 150 }],
  products: [
    { product: { id: 1, name: 'Hamburguesa clásica' }, quantity: 1 },
    { product: { id: 2, name: 'Patatas fritas' }, quantity: 1 },
  ],
};

describe('ProductDetailPage', () => {
  beforeEach(() => {
    getProduct.mockReset();
  });

  it('shows the picture, price, description and ingredients of a product', async () => {
    getProduct.mockResolvedValue(BURGER);
    renderApp('/products/1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Hamburguesa clásica' })).toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledWith('1');
    expect(screen.getByRole('img', { name: 'Hamburguesa clásica' })).toHaveAttribute('src', '/api/v1/products/1/image');
    expect(screen.getByText(/8,50/)).toBeInTheDocument();
    expect(screen.getByText(BURGER.description)).toBeInTheDocument();
    const ingredients = within(screen.getByRole('list', { name: 'Ingredientes' }));
    expect(ingredients.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Carne de ternera', 'Lechuga']);
    expect(screen.queryByRole('list', { name: 'Productos del menú' })).not.toBeInTheDocument();
  });

  it('lists the products of a combo with links to their detail', async () => {
    getProduct.mockResolvedValue(MENU);
    renderApp('/products/3');

    const products = within(await screen.findByRole('list', { name: 'Productos del menú' }));
    expect(products.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '1 × Hamburguesa clásica',
      '1 × Patatas fritas',
    ]);
    expect(products.getByRole('link', { name: 'Patatas fritas' })).toHaveAttribute('href', '/products/2');
  });

  it('adds the product to the cart and updates the counter of the navigation bar', async () => {
    getProduct.mockResolvedValue(BURGER);
    renderApp('/products/1');
    const button = await screen.findByRole('button', { name: 'Añadir al carrito +' });
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

    fireEvent.click(button);
    expect(screen.getByRole('status')).toHaveTextContent('Hamburguesa clásica añadido al carrito.');
    fireEvent.click(button);

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByLabelText('Carrito: 2 productos')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('(2 unidades)');
  });

  it('shows the Kombo icon when the product has no picture', async () => {
    getProduct.mockResolvedValue(BURGER);
    renderApp('/products/1');

    fireEvent.error(await screen.findByRole('img', { name: 'Hamburguesa clásica' }));

    expect(screen.queryByRole('img', { name: 'Hamburguesa clásica' })).not.toBeInTheDocument();
  });

  it('shows the 404 page when the product does not exist', async () => {
    getProduct.mockRejectedValue(new ApiError(404, 'Product 99 not found'));
    renderApp('/products/99');

    expect(await screen.findByRole('heading', { name: 'Esta página no está en la carta' })).toBeInTheDocument();
  });

  it('shows an error with a retry button when the server fails', async () => {
    getProduct.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(BURGER);
    renderApp('/products/1');

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Hamburguesa clásica' })).toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledTimes(2);
  });
});
