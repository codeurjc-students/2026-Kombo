import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductList from './ProductList';
import { getProductPage } from '../services/productService';

// Replaces the real service with a fake one: no HTTP requests are made
vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  getProductPage: vi.fn(),
}));

function page(content, number = 0, totalPages = 1) {
  return { content, page: { size: 12, number, totalElements: content.length, totalPages } };
}

describe('ProductList', () => {
  beforeEach(() => {
    getProductPage.mockReset();
  });

  it('renders the products returned by the service', async () => {
    getProductPage.mockResolvedValue(
      page([
        { id: 1, name: 'Test Burger', price: 5, description: 'A burger' },
        { id: 2, name: 'Test Drink', price: 1.5, description: 'A drink' },
      ]),
    );

    render(<ProductList />);

    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole('heading')).toHaveTextContent('Test Burger');
    expect(cards[0]).toHaveTextContent(/5,00\s€/);
    expect(cards[1]).toHaveTextContent(/1,50\s€/);
  });

  it('filters by category', async () => {
    getProductPage.mockResolvedValue(page([{ id: 1, name: 'Test Drink', price: 1 }]));
    render(<ProductList />);
    await screen.findByText('Test Drink');

    fireEvent.click(screen.getByRole('button', { name: 'Bebidas' }));

    expect(screen.getByRole('button', { name: 'Bebidas' })).toHaveAttribute('aria-pressed', 'true');
    expect(getProductPage).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Drinks', page: 0 }));
  });

  it('shows the whole menu again with "Todo"', async () => {
    getProductPage.mockResolvedValue(page([{ id: 1, name: 'Test Drink', price: 1 }]));
    render(<ProductList />);
    await screen.findByText('Test Drink');
    fireEvent.click(screen.getByRole('button', { name: 'Bebidas' }));

    fireEvent.click(screen.getByRole('button', { name: 'Todo' }));

    expect(screen.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'true');
    expect(getProductPage).toHaveBeenLastCalledWith(expect.objectContaining({ category: null, page: 0 }));
  });

  it('loads the next page with the "show more" button', async () => {
    getProductPage
      .mockResolvedValueOnce(page([{ id: 1, name: 'First', price: 1 }], 0, 2))
      .mockResolvedValueOnce(page([{ id: 2, name: 'Second', price: 1 }], 1, 2));
    render(<ProductList />);

    fireEvent.click(await screen.findByRole('button', { name: 'Más resultados' }));

    expect(await screen.findByText('Second')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Más resultados' })).not.toBeInTheDocument();
  });

  it('shows an error with a retry button', async () => {
    getProductPage.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(page([{ id: 1, name: 'Back', price: 1 }]));
    render(<ProductList />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Back')).toBeInTheDocument();
  });

  it('shows a message when a category is empty', async () => {
    getProductPage.mockResolvedValue(page([]));

    render(<ProductList />);

    expect(await screen.findByText(/No hay productos/)).toBeInTheDocument();
  });

  it('shows the Kombo icon when the product has no image', async () => {
    getProductPage.mockResolvedValue(page([{ id: 1, name: 'Agua', price: 1, category: 'Drinks' }]));
    const { container } = render(<ProductList />);

    fireEvent.error(await screen.findByRole('img', { name: 'Agua' }));

    expect(screen.queryByRole('img', { name: 'Agua' })).not.toBeInTheDocument();
    expect(container.querySelector('.fallback img')).toHaveAttribute('src', '/logo-icon.png');
  });

  it('shows the category of each product', async () => {
    getProductPage.mockResolvedValue(page([{ id: 1, name: 'Agua', price: 1, category: 'Drinks' }]));
    render(<ProductList />);

    const card = await screen.findByRole('article');
    expect(within(card).getByText('Bebidas')).toBeInTheDocument();
  });
});
