import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { AuthContext } from './context/AuthContext';
import { routes } from './routes';

// Renders the real routes of the application at a URL, with a fake session
export function renderApp(url, { user = null, loading = false, login = vi.fn(), logout = vi.fn() } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const auth = { user, loading, login, logout };
  render(
    <AuthContext.Provider value={auth}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
  return { router, auth };
}

export const CUSTOMER = { id: 2, name: 'Lucía', surname: 'García', email: 'customer@kombo.com', role: 'CUSTOMER', addresses: [] };
export const EMPLOYEE = { id: 3, name: 'Carlos', surname: 'López', email: 'employee@kombo.com', role: 'EMPLOYEE', addresses: [] };
export const ADMIN = { id: 1, name: 'Admin', surname: 'Kombo', email: 'admin@kombo.com', role: 'ADMIN', addresses: [] };
