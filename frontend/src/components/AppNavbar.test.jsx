import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import AuthProvider from '../context/AuthProvider';
import { routes } from '../routes';
import { getCurrentUser, logout } from '../services/authService';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));

vi.mock('../services/userService', () => ({
  getUserOrders: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  getProductPage: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

// Text of the links; the logo link is named by the alt text of its image
function navLinks() {
  return screen.getAllByRole('link').map((link) => link.textContent || link.querySelector('img')?.alt);
}

describe('AppNavbar', () => {
  it('shows the log in link to anonymous users', () => {
    renderApp('/');
    expect(navLinks()).toEqual(['Kombo', 'Carta']);
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  });

  it.each([
    ['Cliente', CUSTOMER],
    ['Empleado', EMPLOYEE],
    ['Administrador', ADMIN],
  ])('shows the name, the role and the log out button to the role %s', (role, user) => {
    renderApp('/', { user });
    const navbar = screen.getByRole('navigation');
    expect(navbar).toHaveTextContent(user.name);
    expect(navbar).toHaveTextContent(role);
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
  });

  it('hides the log in button on the log in page', () => {
    renderApp('/login');
    expect(screen.getAllByRole('button', { name: 'Iniciar sesión' })).toHaveLength(1);
  });

  it('shows the order history to customers', () => {
    renderApp('/', { user: CUSTOMER });
    expect(navLinks()).toEqual(['Kombo', 'Carta', 'Mis pedidos']);
    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

  it('shows the profile to employees', () => {
    renderApp('/', { user: EMPLOYEE });
    expect(navLinks()).toEqual(['Kombo', 'Carta', 'Mi perfil']);
  });

  it('shows the user management to the administrator', () => {
    renderApp('/', { user: ADMIN });
    expect(navLinks()).toEqual(['Kombo', 'Carta', 'Usuarios']);
  });

  // Real AuthProvider: the session really ends, so ProtectedRoute could redirect to the log in page
  it('goes to the menu when logging out from a protected page', async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER);
    logout.mockResolvedValue(null);
    const router = createMemoryRouter(routes, { initialEntries: ['/profile'] });
    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Has cerrado sesión.')).toBeInTheDocument();
    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('logs out and shows a confirmation', async () => {
    const { auth } = renderApp('/', { user: CUSTOMER, logout: vi.fn().mockResolvedValue() });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(auth.logout).toHaveBeenCalled());
    expect(await screen.findByText('Has cerrado sesión.')).toBeInTheDocument();
  });
});
