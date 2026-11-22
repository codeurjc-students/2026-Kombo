import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it, vi } from 'vitest';
import AuthProvider from '../context/AuthProvider';
import { routes } from '../routes';
import { getCurrentUser, logout } from '../services/authService';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));

vi.mock('../services/orderService', async (importOriginal) => ({
  ...(await importOriginal()),
  getMyOrders: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  getProductPage: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

// Text of the links; the logo link is named by the alt text of its image
// Links of the pages (the cart link is checked on its own)
function navLinks() {
  return screen
    .getAllByRole('link')
    .filter((link) => !link.getAttribute('aria-label')?.startsWith('Carrito'))
    .map((link) => link.textContent || link.querySelector('img')?.alt);
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

  it('shows the orders and the profile to employees', () => {
    renderApp('/', { user: EMPLOYEE });
    expect(navLinks()).toEqual(['Kombo', 'Carta', 'Pedidos', 'Mi perfil']);
    // No intermediate profile page: the settings of the account open directly
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile/settings');
  });

  it('shows the orders, the products, the user management and the profile to the administrator', () => {
    renderApp('/', { user: ADMIN });
    expect(navLinks()).toEqual(['Kombo', 'Carta', 'Pedidos', 'Productos', 'Usuarios', 'Ajustes', 'Mi perfil']);
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile/settings');
  });

  it('links the cart counter to the cart page', () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Carrito: 0 productos' })).toHaveAttribute('href', '/cart');
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
