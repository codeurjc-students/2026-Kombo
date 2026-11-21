import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import {
  changeMyPassword,
  deleteMyAccount,
  deleteMyImage,
  updateMyAddresses,
  updateMyProfile,
  uploadMyImage,
} from '../services/userService';
import { ADMIN, CUSTOMER, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/userService', () => ({
  changeMyPassword: vi.fn(),
  deleteMyAccount: vi.fn(),
  deleteMyImage: vi.fn(),
  myImageUrl: (imageId) => `/api/v1/users/me/image?v=${imageId}`,
  updateMyAddresses: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadMyImage: vi.fn(),
}));
// The profile page, shown when going back, loads the orders of the customer
vi.mock('../services/orderService', () => ({
  getMyOrders: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

const USER = { ...CUSTOMER, phone: '600111222' };

function type(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function openTab(name) {
  fireEvent.click(screen.getByRole('tab', { name }));
}

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the data of the user and the email, which cannot be changed', () => {
    renderApp('/profile/settings', { user: USER });

    expect(screen.getByLabelText('Nombre')).toHaveValue('Lucía');
    expect(screen.getByLabelText(/Apellidos/)).toHaveValue('García');
    expect(screen.getByLabelText(/Teléfono/)).toHaveValue('600111222');
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('customer@kombo.com');
    expect(screen.getByLabelText('Correo electrónico')).toBeDisabled();
    // Nothing has changed yet
    expect(screen.getByRole('button', { name: 'Guardar datos' })).toBeDisabled();
  });

  it('goes back to the profile without saving anything', () => {
    const { router } = renderApp('/profile/settings', { user: USER });
    type('Nombre', 'Otra');

    fireEvent.click(screen.getByRole('button', { name: 'Volver al perfil' }));

    expect(router.state.location.pathname).toBe('/profile');
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('saves only the personal data and reads the session again', async () => {
    updateMyProfile.mockResolvedValue({ ...USER, name: 'Lucía María' });
    const { auth } = renderApp('/profile/settings', { user: USER });
    type('Nombre', ' Lucía María ');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos' }));

    expect(await screen.findByText('Tus datos se han guardado.')).toBeInTheDocument();
    expect(updateMyProfile).toHaveBeenCalledWith({ name: 'Lucía María', surname: 'García', phone: '600111222' });
    expect(auth.refreshUser).toHaveBeenCalled();
    expect(changeMyPassword).not.toHaveBeenCalled();
  });

  it('shows the wrong fields and does not save them', () => {
    renderApp('/profile/settings', { user: USER });
    type('Nombre', ' ');
    type(/Teléfono/, '123');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos' }));

    expect(screen.getByText('Escribe tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Escribe un teléfono de 9 a 15 cifras.')).toBeInTheDocument();
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('shows an error when the data cannot be saved', async () => {
    updateMyProfile.mockRejectedValue(new ApiError(500, 'Error'));
    renderApp('/profile/settings', { user: USER });
    type('Nombre', 'Ana');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos' }));

    expect(await screen.findByText('No hemos podido guardar tus datos. Inténtalo de nuevo.')).toBeInTheDocument();
  });

  it('changes the password and empties the form', async () => {
    changeMyPassword.mockResolvedValue(null);
    renderApp('/profile/settings', { user: USER });
    openTab('Seguridad');
    type('Contraseña actual', 'customer');
    type('Contraseña nueva', 'new-secret-password');
    type('Repetir contraseña nueva', 'new-secret-password');

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('Tu contraseña se ha cambiado.')).toBeInTheDocument();
    expect(changeMyPassword).toHaveBeenCalledWith({ currentPassword: 'customer', newPassword: 'new-secret-password' });
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('');
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('checks the new password before sending it', () => {
    renderApp('/profile/settings', { user: USER });
    openTab('Seguridad');
    type('Contraseña actual', 'customer');
    type('Contraseña nueva', 'new-secret-password');
    type('Repetir contraseña nueva', 'other-password');

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(changeMyPassword).not.toHaveBeenCalled();
  });

  it('marks the current password when the server says it is wrong', async () => {
    changeMyPassword.mockRejectedValue(new ApiError(400, 'currentPassword: is not correct'));
    renderApp('/profile/settings', { user: USER });
    openTab('Seguridad');
    type('Contraseña actual', 'wrong-password');
    type('Contraseña nueva', 'new-secret-password');
    type('Repetir contraseña nueva', 'new-secret-password');

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument();
  });

  it('shows an error when the password cannot be changed', async () => {
    changeMyPassword.mockRejectedValue(new ApiError(500, 'Error'));
    renderApp('/profile/settings', { user: USER });
    openTab('Seguridad');
    type('Contraseña actual', 'customer');
    type('Contraseña nueva', 'new-secret-password');
    type('Repetir contraseña nueva', 'new-secret-password');

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('No hemos podido cambiar tu contraseña. Inténtalo de nuevo.')).toBeInTheDocument();
  });

  it('uploads a new profile picture', async () => {
    uploadMyImage.mockResolvedValue({ ...USER, imageId: 5 });
    const { auth } = renderApp('/profile/settings', { user: USER });
    expect(screen.getByText('Todavía no tienes foto.')).toBeInTheDocument();
    const file = new File(['x'], 'photo.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Nueva foto'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar foto' }));

    expect(await screen.findByText('Tu foto se ha guardado.')).toBeInTheDocument();
    expect(uploadMyImage).toHaveBeenCalledWith(file);
    expect(auth.refreshUser).toHaveBeenCalled();
  });

  it('does not upload a file that is not a picture', () => {
    renderApp('/profile/settings', { user: USER });

    fireEvent.change(screen.getByLabelText('Nueva foto'), {
      target: { files: [new File(['%PDF'], 'document.pdf', { type: 'application/pdf' })] },
    });

    expect(screen.getByText('La foto tiene que ser una imagen JPG, PNG, GIF o WebP.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar foto' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar foto' }));
    expect(uploadMyImage).not.toHaveBeenCalled();
  });

  it('shows the error of the server when the picture is rejected', async () => {
    uploadMyImage.mockRejectedValue(new ApiError(400, 'image: the file must be a JPEG, PNG, GIF or WebP picture'));
    renderApp('/profile/settings', { user: USER });

    fireEvent.change(screen.getByLabelText('Nueva foto'), {
      target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar foto' }));

    expect(await screen.findByText('El archivo no es una imagen válida de 1 MB como máximo.')).toBeInTheDocument();
  });

  it('shows the picture of the user and removes it', async () => {
    deleteMyImage.mockResolvedValue(null);
    renderApp('/profile/settings', { user: { ...USER, imageId: 5 } });
    expect(within(screen.getByRole('main')).getByRole('img', { name: 'Foto de perfil de Lucía' })).toHaveAttribute(
      'src',
      '/api/v1/users/me/image?v=5',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Quitar foto' }));

    expect(await screen.findByText('Tu foto se ha quitado.')).toBeInTheDocument();
    expect(deleteMyImage).toHaveBeenCalled();
  });

  it('adds a new address to the saved ones', async () => {
    updateMyAddresses.mockResolvedValue({});
    const { auth } = renderApp('/profile/settings', { user: { ...USER, addresses: ['Calle Mayor 1'] } });
    openTab('Direcciones');

    type('Nueva dirección', ' Calle Luna 2 ');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir dirección' }));

    expect(await screen.findByText('Dirección añadida.')).toBeInTheDocument();
    expect(updateMyAddresses).toHaveBeenCalledWith(['Calle Mayor 1', 'Calle Luna 2']);
    expect(auth.refreshUser).toHaveBeenCalled();
    expect(screen.getByLabelText('Nueva dirección')).toHaveValue('');
  });

  it('does not add an empty or repeated address', () => {
    renderApp('/profile/settings', { user: { ...USER, addresses: ['Calle Mayor 1'] } });
    openTab('Direcciones');

    fireEvent.click(screen.getByRole('button', { name: 'Añadir dirección' }));
    expect(screen.getByText('Escribe la dirección.')).toBeInTheDocument();

    type('Nueva dirección', 'Calle Mayor 1');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir dirección' }));
    expect(screen.getByText('Ya tienes guardada esa dirección.')).toBeInTheDocument();
    expect(updateMyAddresses).not.toHaveBeenCalled();
  });

  it('deletes a saved address', async () => {
    updateMyAddresses.mockResolvedValue({});
    renderApp('/profile/settings', { user: { ...USER, addresses: ['Calle Mayor 1', 'Calle Luna 2'] } });
    openTab('Direcciones');
    const list = within(screen.getByRole('list', { name: 'Direcciones guardadas' }));

    fireEvent.click(list.getByRole('button', { name: 'Borrar Calle Mayor 1' }));

    expect(await screen.findByText('Dirección borrada.')).toBeInTheDocument();
    expect(updateMyAddresses).toHaveBeenCalledWith(['Calle Luna 2']);
  });

  it('shows an error when the addresses cannot be saved', async () => {
    updateMyAddresses.mockRejectedValue(new ApiError(500, 'Error'));
    renderApp('/profile/settings', { user: USER });
    openTab('Direcciones');

    type('Nueva dirección', 'Calle Luna 2');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir dirección' }));

    expect(await screen.findByText('No hemos podido guardar tus direcciones. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva dirección')).toHaveValue('Calle Luna 2');
  });

  it('deletes the account after the confirmation and closes the session', async () => {
    deleteMyAccount.mockResolvedValue(null);
    const { router, auth } = renderApp('/profile/settings', { user: USER });
    openTab('Cuenta');

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));
    expect(deleteMyAccount).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, eliminar mi cuenta' }));

    expect(await screen.findByText('Tu cuenta se ha eliminado.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(auth.logout).toHaveBeenCalled();
  });

  it('keeps the account when the deletion is cancelled or fails', async () => {
    deleteMyAccount.mockRejectedValue(new ApiError(500, 'Error'));
    const { router, auth } = renderApp('/profile/settings', { user: USER });
    openTab('Cuenta');

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(deleteMyAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, eliminar mi cuenta' }));

    expect(await screen.findByText('No hemos podido eliminar tu cuenta. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/profile/settings');
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('shows the name, the email and the tabs of a customer', () => {
    renderApp('/profile/settings', { user: USER });
    expect(screen.getByText('Lucía García')).toBeInTheDocument();
    expect(screen.getByText('customer@kombo.com')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Perfil',
      'Seguridad',
      'Direcciones',
      'Cuenta',
    ]);
    expect(screen.getByRole('heading', { name: 'Datos personales' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Foto de perfil' })).toBeInTheDocument();
  });

  it('shows no addresses to employees and no deletion of the account to the administrator', () => {
    renderApp('/profile/settings', { user: EMPLOYEE });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Perfil', 'Seguridad', 'Cuenta']);
  });

  it('does not let the administrator delete their account', () => {
    renderApp('/profile/settings', { user: ADMIN });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Perfil', 'Seguridad']);
    expect(screen.queryByRole('button', { name: 'Eliminar cuenta' })).not.toBeInTheDocument();
  });
});
