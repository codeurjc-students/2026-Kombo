import { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/httpClient';

// Page each role goes to after logging in, when they did not come from a protected page
const HOME_BY_ROLE = { CUSTOMER: '/profile', EMPLOYEE: '/profile', ADMIN: '/admin/users' };

const EMPTY_SIGN_UP = { name: '', surname: '', email: '', phone: '', password: '', repeatPassword: '' };

// Sign up (left) and log in (right) on the same page, as in the mockup
export default function LoginPage() {
  const { user, login, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newUser, setNewUser] = useState(EMPTY_SIGN_UP);
  // Form being sent ('login' or 'signUp'); while it is sent, the session changes and the redirect is done here
  const [submitting, setSubmitting] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [signUpError, setSignUpError] = useState(null);

  if (user && !submitting) {
    return <Navigate to="/" replace />;
  }

  function goToHome(loggedUser, message) {
    const target = location.state?.from ?? HOME_BY_ROLE[loggedUser.role] ?? '/';
    navigate(target, { replace: true, state: { message } });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting('login');
    setLoginError(null);
    try {
      const loggedUser = await login(email, password);
      goToHome(loggedUser, `Hola, ${loggedUser.name}. Has iniciado sesión.`);
    } catch (err) {
      setLoginError(
        err instanceof ApiError && err.status === 401
          ? 'El correo electrónico o la contraseña no son correctos.'
          : 'No hemos podido iniciar sesión. Inténtalo de nuevo en unos minutos.',
      );
      setSubmitting(null);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    if (newUser.password !== newUser.repeatPassword) {
      setSignUpError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting('signUp');
    setSignUpError(null);
    try {
      const { name, surname, email: newEmail, phone, password: newPassword } = newUser;
      const loggedUser = await signUp({ name, surname, email: newEmail, phone, password: newPassword });
      goToHome(loggedUser, `Hola, ${loggedUser.name}. Tu cuenta se ha creado.`);
    } catch (err) {
      setSignUpError(signUpErrorMessage(err));
      setSubmitting(null);
    }
  }

  function changeField(field) {
    return (event) => setNewUser((current) => ({ ...current, [field]: event.target.value }));
  }

  return (
    <section className="panel auth-card auth-card-double">
      <div className="auth-form">
        <h1 id="sign-up-title" className="h2 mb-1">Crea tu cuenta</h1>
        <p className="text-secondary mb-4">Guarda tus datos y sigue tus pedidos.</p>
        {signUpError && (
          <Alert variant="danger" role="alert">
            {signUpError}
          </Alert>
        )}
        <Form onSubmit={handleSignUp} aria-labelledby="sign-up-title">
          <Form.Group className="mb-3" controlId="sign-up-name">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              autoComplete="given-name"
              required
              maxLength={50}
              value={newUser.name}
              onChange={changeField('name')}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="sign-up-surname">
            <Form.Label>
              Apellidos <span className="text-secondary small">(opcional)</span>
            </Form.Label>
            <Form.Control
              autoComplete="family-name"
              maxLength={100}
              value={newUser.surname}
              onChange={changeField('surname')}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="sign-up-email">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              required
              maxLength={100}
              value={newUser.email}
              onChange={changeField('email')}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="sign-up-phone">
            <Form.Label>
              Teléfono <span className="text-secondary small">(opcional)</span>
            </Form.Label>
            <Form.Control
              type="tel"
              autoComplete="tel"
              pattern="\+?[0-9 ]{9,15}"
              title="Entre 9 y 15 cifras"
              value={newUser.phone}
              onChange={changeField('phone')}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="sign-up-password">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              aria-describedby="sign-up-password-help"
              value={newUser.password}
              onChange={changeField('password')}
            />
            <Form.Text id="sign-up-password-help">Al menos 8 caracteres.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-4" controlId="sign-up-repeat-password">
            <Form.Label>Repetir contraseña</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              required
              value={newUser.repeatPassword}
              onChange={changeField('repeatPassword')}
            />
          </Form.Group>
          <Button type="submit" variant="primary" size="lg" className="w-100" disabled={submitting !== null}>
            {submitting === 'signUp' ? <Sending label="Creando la cuenta…" /> : 'Crear cuenta'}
          </Button>
        </Form>
      </div>

      <div className="auth-divider" aria-hidden="true" />

      <div className="auth-form">
        <h1 id="login-title" className="h2 mb-1">Inicia sesión</h1>
        <p className="text-secondary mb-4">Consulta tus pedidos y pide más rápido.</p>
        {loginError && (
          <Alert variant="danger" role="alert">
            {loginError}
          </Alert>
        )}
        <Form onSubmit={handleLogin} aria-labelledby="login-title">
          <Form.Group className="mb-3" controlId="login-email">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="login-password">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Form.Group>
          <Button type="submit" variant="primary" size="lg" className="w-100" disabled={submitting !== null}>
            {submitting === 'login' ? <Sending label="Iniciando sesión…" /> : 'Iniciar sesión'}
          </Button>
        </Form>
      </div>
    </section>
  );
}

function Sending({ label }) {
  return (
    <>
      <Spinner animation="border" size="sm" aria-hidden="true" className="me-2" />
      {label}
    </>
  );
}

function signUpErrorMessage(error) {
  if (error instanceof ApiError && error.status === 409) {
    return 'Ya existe una cuenta con ese correo electrónico. Inicia sesión o usa otro correo.';
  }
  if (error instanceof ApiError && error.status === 400) {
    return 'Revisa los datos del formulario: hay algún campo que no es válido.';
  }
  return 'No hemos podido crear la cuenta. Inténtalo de nuevo en unos minutos.';
}
