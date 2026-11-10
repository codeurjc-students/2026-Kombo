import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/userService', () => ({
  getUsers: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 1 } }),
  getUserOrders: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

describe('ProtectedRoute', () => {
  it('sends anonymous users to the log in page', async () => {
    const { router } = renderApp('/profile');

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('waits while the session is being checked', () => {
    renderApp('/profile', { loading: true });
    expect(screen.getByText('Comprobando tu sesión…')).toBeInTheDocument();
  });

  it('shows 403 to a role that is not allowed', () => {
    renderApp('/admin/users', { user: EMPLOYEE });
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No tienes acceso a esta página' })).toBeInTheDocument();
  });

  it('shows the page to an allowed role', async () => {
    renderApp('/profile', { user: CUSTOMER });
    expect(await screen.findByRole('heading', { name: 'Mis pedidos' })).toBeInTheDocument();
  });
});
