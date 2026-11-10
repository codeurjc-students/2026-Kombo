import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductList from './ProductList';

// Integration test: uses the real service and the real REST API.
// The backend must be running with the sample data, by default on https://localhost
// (KOMBO_BACKEND_URL changes it).
describe('ProductList with the real REST API', () => {
  it('renders the sample products returned by the backend', async () => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');

    render(<ProductList />);

    expect(await screen.findByRole('heading', { name: 'Hamburguesa clásica' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hamburguesa de pollo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Patatas fritas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Refresco de cola' })).toBeInTheDocument();
  });
});