import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { renderApp } from '../test-utils';
import ErrorPage from './ErrorPage';

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  getProductPage: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

function Broken() {
  throw new Error('boom');
}

function renderRouteThatFails(loader) {
  const router = createMemoryRouter([{ path: '/', element: <Broken />, loader, errorElement: <ErrorPage /> }]);
  render(
    <AuthContext.Provider value={{ user: null, loading: false }}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe('404 and error pages', () => {
  it('shows the 404 page for an unknown address, inside the layout', () => {
    renderApp('/this-does-not-exist');

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Esta página no está en la carta' })).toBeInTheDocument();
    expect(screen.getByText('Volver a la carta')).toHaveAttribute('href', '/');
    expect(screen.getByText('kombo')).toBeInTheDocument();
  });

  it('shows the error page when a page fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderRouteThatFails();

    expect(screen.getByRole('heading', { name: 'Algo ha fallado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument();
    expect(screen.getByText('kombo')).toBeInTheDocument();
  });

  it('shows the 404 page for a 404 route error', async () => {
    renderRouteThatFails(() => {
      throw new Response('Not found', { status: 404 });
    });

    expect(await screen.findByText('404')).toBeInTheDocument();
  });
});
