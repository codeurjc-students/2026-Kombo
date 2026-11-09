import { useState } from 'react';
import { Button, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';
import BrandLogo from './BrandLogo';

// Links shown to each role. Pages that do not exist yet are not linked.
const LINKS = {
  ANONYMOUS: [{ to: '/', label: 'Carta', end: true }],
  CUSTOMER: [
    { to: '/', label: 'Carta', end: true },
    { to: '/profile', label: 'Mis pedidos' },
  ],
  EMPLOYEE: [
    { to: '/', label: 'Carta', end: true },
    { to: '/profile', label: 'Mi perfil' },
  ],
  ADMIN: [
    { to: '/', label: 'Carta', end: true },
    { to: '/admin/users', label: 'Usuarios' },
  ],
};

export default function AppNavbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const links = LINKS[user?.role ?? 'ANONYMOUS'];

  // Goes to the menu first: if the session were closed while a protected page is shown,
  // ProtectedRoute would send the user to the log in page instead
  async function handleLogout() {
    setExpanded(false);
    navigate('/', { state: { message: 'Has cerrado sesión.' } });
    await logout();
  }

  return (
    <Navbar expand="md" sticky="top" className="app-navbar py-2" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
          <BrandLogo />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" aria-label="Abrir menú" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto ms-md-3 gap-1">
            {links.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.end} onClick={() => setExpanded(false)}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
          <Nav>
            {/* Not shown on the log in page itself */}
            {!loading && !user && pathname !== '/login' && (
              <Button as={Link} to="/login" variant="primary" className="nav-login" onClick={() => setExpanded(false)}>
                Iniciar sesión
              </Button>
            )}
            {user && (
              <NavDropdown
                align="end"
                title={
                  <span className="d-inline-flex align-items-center">
                    <span className="user-avatar" aria-hidden="true">{user.name.charAt(0)}</span>
                    {user.name} <span className="role-badge ms-2">{ROLE_LABELS[user.role]}</span>
                  </span>
                }
                id="user-menu"
              >
                <NavDropdown.ItemText className="small text-secondary">{user.email}</NavDropdown.ItemText>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Cerrar sesión</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
