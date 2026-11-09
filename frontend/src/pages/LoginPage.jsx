import { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/httpClient';

// Page each role goes to after logging in, when they did not come from a protected page
const HOME_BY_ROLE = { CUSTOMER: '/profile', EMPLOYEE: '/profile', ADMIN: '/admin/users' };

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (user && !submitting) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedUser = await login(email, password);
      const target = location.state?.from ?? HOME_BY_ROLE[loggedUser.role] ?? '/';
      navigate(target, { replace: true, state: { message: `Hola, ${loggedUser.name}. Has iniciado sesión.` } });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'El email o la contraseña no son correctos.'
          : 'No hemos podido iniciar sesión. Inténtalo de nuevo en unos minutos.',
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="panel auth-card" aria-labelledby="login-title">
      <div className="auth-aside">
        <div className="hero-badge" aria-hidden="true">
          <img src="/logo-icon.png" alt="" />
        </div>
        <div>
          <h2>Tu menú favorito, a un clic.</h2>
          <p>Entra para ver tus pedidos y tus datos, y pedir más rápido.</p>
        </div>
      </div>
      <div className="auth-form">
        <h1 id="login-title" className="h2 mb-1">Inicia sesión</h1>
        <p className="text-secondary mb-4">Consulta tus pedidos y pide más rápido.</p>
        {error && (
          <Alert variant="danger" role="alert">
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} noValidate={false}>
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
          <Button type="submit" variant="primary" size="lg" className="w-100" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" aria-hidden="true" className="me-2" />
                Iniciando sesión…
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </Form>
      </div>
    </section>
  );
}
