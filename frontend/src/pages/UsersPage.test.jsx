import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteUser, getUsers } from '../services/userService';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/userService', () => ({ getUsers: vi.fn(), deleteUser: vi.fn() }));

function page(users, number = 0, totalPages = 1) {
  return { content: users, page: { number, totalPages } };
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists 10 users and loads the next ones with "Más resultados"', async () => {
    getUsers.mockResolvedValueOnce(page([ADMIN], 0, 2)).mockResolvedValueOnce(page([CUSTOMER], 1, 2));
    renderApp('/admin/users', { user: ADMIN });

    expect(await screen.findByText('admin@kombo.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Más resultados' }));

    expect(await screen.findByText('customer@kombo.com')).toBeInTheDocument();
    expect(screen.getByText('admin@kombo.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Más resultados' })).not.toBeInTheDocument();
    expect(getUsers).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('shows an error that can be retried', async () => {
    getUsers.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(page([ADMIN]));
    renderApp('/admin/users', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('admin@kombo.com')).toBeInTheDocument();
  });

  it('edits and deletes customers and employees, but not the administrator', async () => {
    getUsers.mockResolvedValue(page([ADMIN, CUSTOMER, EMPLOYEE]));
    renderApp('/admin/users', { user: ADMIN });

    // The links look like buttons (role "button")
    expect(await screen.findByRole('button', { name: 'Editar a Lucía' })).toHaveAttribute('href', '/admin/users/2');
    expect(screen.getByRole('button', { name: 'Editar a Carlos' })).toHaveAttribute('href', '/admin/users/3');
    expect(screen.getByRole('button', { name: 'Borrar a Carlos' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar a Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Borrar a Admin' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo usuario' })).toHaveAttribute('href', '/admin/users/new');
  });

  it('deletes a user after the confirmation and reads the list again', async () => {
    getUsers.mockResolvedValueOnce(page([ADMIN, EMPLOYEE])).mockResolvedValueOnce(page([ADMIN]));
    deleteUser.mockResolvedValue(null);
    renderApp('/admin/users', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Borrar a Carlos' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('¿Borrar a Carlos López?')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sí, borrar' }));

    expect(await screen.findByText('Se ha borrado a Carlos.')).toBeInTheDocument();
    expect(deleteUser).toHaveBeenCalledWith(3);
    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('employee@kombo.com')).not.toBeInTheDocument();
  });

  it('does not delete anything when the confirmation is cancelled, and shows the errors', async () => {
    getUsers.mockResolvedValue(page([ADMIN, EMPLOYEE]));
    deleteUser.mockRejectedValue(new Error('offline'));
    renderApp('/admin/users', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Borrar a Carlos' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(deleteUser).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Borrar a Carlos' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, borrar' }));

    expect(await screen.findByText('No hemos podido borrar a Carlos. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByText('employee@kombo.com')).toBeInTheDocument();
  });
});
