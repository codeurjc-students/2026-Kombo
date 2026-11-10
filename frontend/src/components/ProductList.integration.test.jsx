import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductList from './ProductList';

// Integration test: uses the real service and the real REST API.
// The backend must be running with the sample data, by default on https://localhost
// (KOMBO_BACKEND_URL changes it).
describe('ProductList with the real REST API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  it('renders the sample products returned by the backend', async () => {
    render(<ProductList />);

    expect(await screen.findByRole('heading', { name: 'Hamburguesa clásica' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hamburguesa de pollo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Patatas fritas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Refresco de cola' })).toBeInTheDocument();
  });

  it('shows only the combos of the "Menús" category', async () => {
    render(<ProductList />);
    await screen.findByRole('heading', { name: 'Hamburguesa clásica' });

    fireEvent.click(screen.getByRole('button', { name: 'Menús' }));

    expect(await screen.findByRole('heading', { name: 'Menú familiar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Menú clásico' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Menú de pollo' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hamburguesa clásica' })).not.toBeInTheDocument();
  });

  // The first page has the 10 first sample products; "Menú de pollo" (the 11th) comes with the next page
  it('loads the next products with "Más resultados"', async () => {
    render(<ProductList />);
    await screen.findByRole('heading', { name: 'Hamburguesa clásica' });
    expect(screen.queryByRole('heading', { name: 'Menú de pollo' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Más resultados' }));

    expect(await screen.findByRole('heading', { name: 'Menú de pollo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hamburguesa clásica' })).toBeInTheDocument();
  });
});
