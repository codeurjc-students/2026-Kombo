import { useState } from 'react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ROLE_LABELS } from '../utils/format';
import BrandLogo from './BrandLogo';
import UserAvatar from './UserAvatar';

// Links shown to each role. Pages that do not exist yet are not linked.
const LINKS = {
  ANONYMOUS: [{ to: '/', label: 'Carta', end: true }],
  CUSTOMER: [
    { to: '/', label: 'Carta', end: true },
    { to: '/profile', label: 'Mis pedidos' },
  ],
  EMPLOYEE: [
    { to: '/', label: 'Carta', end: true },
    { to: '/orders', label: 'Pedidos', end: true },
    { to: '/profile', label: 'Mi perfil' },
  ],
  ADMIN: [
    { to: '/', label: 'Carta', end: true },
    { to: '/orders', label: 'Pedidos', end: true },
    { to: '/admin/users', label: 'Usuarios' },
    { to: '/admin/settings', label: 'Ajustes' },
    { to: '/profile', label: 'Mi perfil' },
  ],
};

export default function AppNavbar() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const links = LINKS[user?.role ?? 'ANONYMOUS'];

  // Goes to the menu first: if the session were closed while a protected page is shown,
  // ProtectedRoute would send the user to the log in page instead.
  // React Router renders navigations as a low-priority transition: flushSync shows the menu at once,
  // so the protected page is no longer on screen when the user becomes null.
  async function handleLogout() {
    setExpanded(false);
    await navigate('/', { state: { message: 'Has cerrado sesión.' }, flushSync: true });
    await logout();
  }

  return (
    <Navbar expand="md" sticky="top" className="app-navbar py-2" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
          <BrandLogo />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" label="Abrir menú" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto ms-md-3 gap-1">
            {links.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.end} onClick={() => setExpanded(false)}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
          <Nav className="align-items-md-center gap-2">
            {/* Units in the cart, with a link to the cart page */}
            <Link
              to="/cart"
              className="nav-cart"
              aria-label={`Carrito: ${count} ${count === 1 ? 'producto' : 'productos'}`}
              onClick={() => setExpanded(false)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                <path
                  d="M3 9h18l-2 10H5L3 9Zm5 0V7a4 4 0 0 1 8 0v2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="nav-cart-count" data-testid="cart-count">{count}</span>
            </Link>
            {/* Not shown on the log in page itself */}
            {!loading && !user && pathname !== '/login' && (
              <Button as={Link} to="/login" variant="primary" className="nav-login" onClick={() => setExpanded(false)}>
                Iniciar sesión
              </Button>
            )}
            {/* The log out button is always visible (no dropdown menu): one click and easy to find */}
            {user && (
              <div className="nav-user">
                <span className="nav-user-name" title={user.email}>
                  <UserAvatar user={user} />
                  {user.name} <span className="role-badge ms-2">{ROLE_LABELS[user.role]}</span>
                </span>
                <Button variant="outline-ink" size="sm" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
