import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import {
  deleteUser,
  deleteUserImage,
  getUser,
  updateUser,
  updateUserAddresses,
  uploadUserImage,
} from '../services/userService';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/userService', () => ({
  deleteUser: vi.fn(),
  deleteUserImage: vi.fn(),
  getUser: vi.fn(),
  getUsers: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
  myImageUrl: (imageId) => `/api/v1/users/me/image?v=${imageId}`,
  updateUser: vi.fn(),
  updateUserAddresses: vi.fn(),
  uploadUserImage: vi.fn(),
  userImageUrl: (id, imageId) => `/api/v1/users/${id}/image?v=${imageId}`,
}));

describe('UserEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('changes the personal data of an employee, who has no addresses', async () => {
    getUser.mockResolvedValueOnce(EMPLOYEE).mockResolvedValueOnce({ ...EMPLOYEE, name: 'Carlos Javier' });
    updateUser.mockResolvedValue({ ...EMPLOYEE, name: 'Carlos Javier' });
    renderApp('/admin/users/3', { user: ADMIN });

    expect(await screen.findByText('employee@kombo.com')).toBeInTheDocument();
    expect(screen.getByText('Empleado')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Direcciones' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Carlos Javier' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos' }));

    expect(await screen.findByText('Los datos se han guardado.')).toBeInTheDocument();
    expect(updateUser).toHaveBeenCalledWith(3, { name: 'Carlos Javier', surname: 'López', phone: '' });
    expect(await screen.findByText('Carlos Javier López')).toBeInTheDocument();
  });

  it('uploads and removes the picture of a customer and changes their addresses', async () => {
    const withPicture = { ...CUSTOMER, imageId: 4, addresses: ['Calle Mayor 1'] };
    getUser.mockResolvedValueOnce({ ...CUSTOMER, addresses: ['Calle Mayor 1'] }).mockResolvedValue(withPicture);
    uploadUserImage.mockResolvedValue(withPicture);
    deleteUserImage.mockResolvedValue(null);
    updateUserAddresses.mockResolvedValue({ ...withPicture, addresses: [] });
    renderApp('/admin/users/2', { user: ADMIN });

    expect(await screen.findByText('Todavía no tiene foto.')).toBeInTheDocument();
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Nueva foto'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar foto' }));

    expect(await screen.findByText('La foto se ha guardado.')).toBeInTheDocument();
    expect(uploadUserImage).toHaveBeenCalledWith(2, file);
    expect(screen.getByRole('img', { name: 'Foto de perfil de Lucía' })).toHaveAttribute(
      'src',
      '/api/v1/users/2/image?v=4',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Quitar foto' }));
    expect(await screen.findByText('La foto se ha quitado.')).toBeInTheDocument();
    expect(deleteUserImage).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole('button', { name: 'Borrar Calle Mayor 1' }));
    expect(await screen.findByText('Dirección borrada.')).toBeInTheDocument();
    expect(updateUserAddresses).toHaveBeenCalledWith(2, []);
  });

  it('deletes the user after the confirmation and goes back to the list', async () => {
    getUser.mockResolvedValue(EMPLOYEE);
    deleteUser.mockResolvedValue(null);
    const { router } = renderApp('/admin/users/3', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Borrar usuario' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, borrar' }));

    expect(await screen.findByText('Se ha borrado a Carlos.')).toBeInTheDocument();
    expect(deleteUser).toHaveBeenCalledWith(3);
    expect(router.state.location.pathname).toBe('/admin/users');
  });

  it('shows an error when the user cannot be deleted', async () => {
    getUser.mockResolvedValue(EMPLOYEE);
    deleteUser.mockRejectedValue(new Error('offline'));
    renderApp('/admin/users/3', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Borrar usuario' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, borrar' }));

    expect(await screen.findByText('No hemos podido borrar el usuario. Inténtalo de nuevo.')).toBeInTheDocument();
  });

  it('shows the 404 page for a user that does not exist', async () => {
    getUser.mockRejectedValueOnce(new ApiError(404, 'User 99 not found'));
    renderApp('/admin/users/99', { user: ADMIN });

    expect(await screen.findByRole('heading', { name: 'Esta página no está en la carta' })).toBeInTheDocument();
  });

  it('retries after an error', async () => {
    getUser.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(EMPLOYEE);
    renderApp('/admin/users/3', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('employee@kombo.com')).toBeInTheDocument();
  });
});
