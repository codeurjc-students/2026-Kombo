import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  getProductPage: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

function navLinks() {
  return screen.getAllByRole('link').map((link) => link.textContent);
}

describe('AppNavbar', () => {
  it('shows the log in link to anonymous users', () => {
    renderApp('/');
    expect(navLinks()).toEqual(['kombo', 'Carta', 'Iniciar sesión']);
  });

  it('shows the order history to customers', () => {
    renderApp('/', { user: CUSTOMER });
    expect(navLinks()).toEqual(['kombo', 'Carta', 'Mis pedidos']);
    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

  it('shows the profile to employees', () => {
    renderApp('/', { user: EMPLOYEE });
    expect(navLinks()).toEqual(['kombo', 'Carta', 'Mi perfil']);
  });

  it('shows the user management to the administrator', () => {
    renderApp('/', { user: ADMIN });
    expect(navLinks()).toEqual(['kombo', 'Carta', 'Usuarios']);
  });

  it('logs out and shows a confirmation', async () => {
    const { auth } = renderApp('/', { user: CUSTOMER, logout: vi.fn().mockResolvedValue() });

    fireEvent.click(screen.getByRole('button', { name: /Lucía/ }));
    fireEvent.click(await screen.findByText('Cerrar sesión'));

    await waitFor(() => expect(auth.logout).toHaveBeenCalled());
    expect(await screen.findByText('Has cerrado sesión.')).toBeInTheDocument();
  });
});
