import { fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it, vi } from 'vitest';
import AuthProvider from '../context/AuthProvider';
import { getCurrentUser, login } from '../services/authService';
import { signUp as signUpRequest } from '../services/userService';
import { ApiError } from '../services/httpClient';
import { routes } from '../routes';
import { ADMIN, CUSTOMER, renderApp } from '../test-utils';

// The tests of the redirections use the real AuthProvider, with the services mocked
vi.mock('../services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));

vi.mock('../services/userService', () => ({
  getUsers: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 1 } }),
  getUserOrders: vi.fn().mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } }),
  signUp: vi.fn(),
}));

// The page has two forms (sign up and log in): each test looks inside the one it uses
function fillAndSubmit() {
  const form = within(screen.getByRole('form', { name: 'Inicia sesión' }));
  fireEvent.change(form.getByLabelText('Correo electrónico'), { target: { value: 'customer@kombo.com' } });
  fireEvent.change(form.getByLabelText('Contraseña'), { target: { value: 'customer' } });
  fireEvent.click(form.getByRole('button', { name: 'Iniciar sesión' }));
}

const NEW_USER = { name: 'Ana', surname: 'Martín', email: 'ana@example.com', phone: '600123456', password: 'secret-password' };

function fillSignUp({ repeatPassword = NEW_USER.password } = {}) {
  const form = within(screen.getByRole('form', { name: 'Crea tu cuenta' }));
  fireEvent.change(form.getByLabelText('Nombre'), { target: { value: NEW_USER.name } });
  fireEvent.change(form.getByLabelText(/Apellidos/), { target: { value: NEW_USER.surname } });
  fireEvent.change(form.getByLabelText('Correo electrónico'), { target: { value: NEW_USER.email } });
  fireEvent.change(form.getByLabelText(/Teléfono/), { target: { value: NEW_USER.phone } });
  fireEvent.change(form.getByLabelText('Contraseña'), { target: { value: NEW_USER.password } });
  fireEvent.change(form.getByLabelText('Repetir contraseña'), { target: { value: repeatPassword } });
  fireEvent.click(form.getByRole('button', { name: 'Crear cuenta' }));
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

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo electrónico o la contraseña no son correctos.');
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

  it('shows the sign up form next to the log in form', () => {
    renderApp('/login');

    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('signs up, logs in and goes to the profile', async () => {
    getCurrentUser.mockResolvedValue(null);
    signUpRequest.mockResolvedValue({ ...CUSTOMER, name: 'Ana' });
    login.mockResolvedValue({ ...CUSTOMER, name: 'Ana' });
    const router = createMemoryRouter(routes, { initialEntries: ['/login'] });
    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );

    fillSignUp();

    expect(await screen.findByText('Hola, Ana. Tu cuenta se ha creado.')).toBeInTheDocument();
    // The repeated password is only checked in the page, it is not sent to the server
    expect(signUpRequest).toHaveBeenCalledWith(NEW_USER);
    expect(login).toHaveBeenCalledWith(NEW_USER.email, NEW_USER.password);
    expect(router.state.location.pathname).toBe('/profile');
  });

  it('does not send the sign up when the passwords are different', () => {
    const signUp = vi.fn();
    renderApp('/login', { signUp });

    fillSignUp({ repeatPassword: 'other-password' });

    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('tells the user when the email is already registered', async () => {
    renderApp('/login', { signUp: vi.fn().mockRejectedValue(new ApiError(409, 'Conflict')) });

    fillSignUp();

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese correo electrónico.');
  });

  it('shows an error when the server rejects the data', async () => {
    renderApp('/login', { signUp: vi.fn().mockRejectedValue(new ApiError(400, 'Bad Request')) });

    fillSignUp();

    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa los datos del formulario');
  });
});
