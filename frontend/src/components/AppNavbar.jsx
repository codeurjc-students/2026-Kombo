import { useState } from 'react';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';

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
  const [expanded, setExpanded] = useState(false);
  const links = LINKS[user?.role ?? 'ANONYMOUS'];

  async function handleLogout() {
    setExpanded(false);
    await logout();
    navigate('/', { state: { message: 'Has cerrado sesión.' } });
  }

  return (
    <Navbar expand="md" variant="dark" className="app-navbar py-3" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand-wordmark" onClick={() => setExpanded(false)}>
          kombo
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" aria-label="Abrir menú" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {links.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.end} onClick={() => setExpanded(false)}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
          <Nav>
            {!loading && !user && (
              <Nav.Link as={NavLink} to="/login" onClick={() => setExpanded(false)}>
                Iniciar sesión
              </Nav.Link>
            )}
            {user && (
              <NavDropdown
                align="end"
                title={
                  <span>
                    {user.name} <span className="role-badge ms-1">{ROLE_LABELS[user.role]}</span>
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
