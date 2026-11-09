import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import AuthProvider from '../context/AuthProvider';
import { getCurrentUser, login } from '../services/authService';
import { ApiError } from '../services/httpClient';
import { routes } from '../routes';
import { ADMIN, CUSTOMER, renderApp } from '../test-utils';

// Only the first test uses the real AuthProvider, with the service mocked
vi.mock('../services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));

vi.mock('../services/userService', () => ({
  getUsers: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 1 } }),
  getUserOrders: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'customer@kombo.com' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'customer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

describe('LoginPage', () => {
  it('logs in and goes to the page of the role', async () => {
    getCurrentUser.mockResolvedValue(null);
    login.mockResolvedValue(ADMIN);
    const router = createMemoryRouter(routes, { initialEntries: ['/login'] });
    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );

    fillAndSubmit();

    expect(await screen.findByText('Hola, Admin. Has iniciado sesión.')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith('customer@kombo.com', 'customer');
    expect(router.state.location.pathname).toBe('/admin/users');
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });

  it('shows an error with wrong credentials', async () => {
    renderApp('/login', { login: vi.fn().mockRejectedValue(new ApiError(401, 'Unauthorized')) });

    fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('El email o la contraseña no son correctos.');
  });

  it('shows a generic error when the server fails', async () => {
    renderApp('/login', { login: vi.fn().mockRejectedValue(new Error('offline')) });

    fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('No hemos podido iniciar sesión');
  });

  it('sends logged in users to the home page', () => {
    const { router } = renderApp('/login', { user: CUSTOMER });
    expect(router.state.location.pathname).toBe('/');
  });
});
