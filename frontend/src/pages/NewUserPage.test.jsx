import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import { createUser, getUsers } from '../services/userService';
import { ADMIN, renderApp } from '../test-utils';

vi.mock('../services/userService', () => ({
  createUser: vi.fn(),
  getUsers: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
}));

function type(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillIn() {
  type('Nombre', ' Luis ');
  type('Correo electrónico', 'luis@kombo.com');
  type('Contraseña', 'secret-password');
  type('Repite la contraseña', 'secret-password');
}

describe('NewUserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an employee and goes back to the list of users', async () => {
    createUser.mockResolvedValue({ id: 9, name: 'Luis', role: 'EMPLOYEE' });
    const { router } = renderApp('/admin/users/new', { user: ADMIN });

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(await screen.findByText('Se ha creado el empleado Luis.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/users');
    expect(getUsers).toHaveBeenCalled();
    expect(createUser).toHaveBeenCalledWith({
      name: 'Luis',
      surname: '',
      email: 'luis@kombo.com',
      phone: '',
      password: 'secret-password',
      role: 'EMPLOYEE',
    });
  });

  it('can create a customer, but not another administrator', async () => {
    createUser.mockResolvedValue({ id: 9, name: 'Luis', role: 'CUSTOMER' });
    renderApp('/admin/users/new', { user: ADMIN });

    const roles = screen.getByLabelText('Rol');
    expect([...roles.options].map((option) => option.value)).toEqual(['EMPLOYEE', 'CUSTOMER']);
    fireEvent.change(roles, { target: { value: 'CUSTOMER' } });
    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(await screen.findByText('Se ha creado el cliente Luis.')).toBeInTheDocument();
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'CUSTOMER' }));
  });

  it('shows the wrong fields without calling the server', () => {
    renderApp('/admin/users/new', { user: ADMIN });

    type('Correo electrónico', 'luis');
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(screen.getByText('Escribe el nombre.')).toBeInTheDocument();
    expect(screen.getByText('Escribe un correo electrónico válido.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña tiene entre 8 y 72 caracteres.')).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it.each([
    [new ApiError(409, 'Email already registered'), 'Ya existe una cuenta con ese correo electrónico.'],
    [new ApiError(400, 'email: not valid'), 'Revisa los datos del formulario: hay algún campo que no es válido.'],
    [new Error('offline'), 'No hemos podido crear el usuario. Inténtalo de nuevo.'],
  ])('shows the error of the server', async (error, message) => {
    createUser.mockRejectedValue(error);
    renderApp('/admin/users/new', { user: ADMIN });

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear usuario' })).toBeEnabled();
  });

  it('is only for the administrator', () => {
    renderApp('/admin/users/new', { user: { ...ADMIN, role: 'EMPLOYEE' } });

    expect(screen.queryByRole('heading', { name: 'Nuevo usuario' })).not.toBeInTheDocument();
  });
});
