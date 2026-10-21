import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductList from './ProductList';

// Integration test: uses the real service and the real REST API.
// The backend must be running on http://localhost:8080 with the sample data.
describe('ProductList with the real REST API', () => {
  it('renders the sample products returned by the backend', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8080');

    render(<ProductList />);

    expect(await screen.findByText(/Classic Burger/)).toBeInTheDocument();
    expect(screen.getByText(/Chicken Burger/)).toBeInTheDocument();
    expect(screen.getByText(/French Fries/)).toBeInTheDocument();
    expect(screen.getByText(/Cola/)).toBeInTheDocument();
  });
});