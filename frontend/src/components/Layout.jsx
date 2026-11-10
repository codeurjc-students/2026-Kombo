import { useState } from 'react';
import { Container, Toast, ToastContainer } from 'react-bootstrap';
import { Outlet, useLocation } from 'react-router';
import AppNavbar from './AppNavbar';
import BrandLogo from './BrandLogo';

// Common frame of every page: navigation bar, content and footer.
// Pages can show a confirmation message by navigating with state: { message }.
export default function Layout({ children }) {
  const location = useLocation();
  // Each navigation has its own key, so a message is shown once per navigation until it is closed
  const [closedKey, setClosedKey] = useState(null);
  const message = location.key !== closedKey ? (location.state?.message ?? null) : null;

  return (
    <div className="app-shell">
      <AppNavbar />
      <main className="app-main">
        <Container>{children ?? <Outlet />}</Container>
      </main>
      <footer className="app-footer py-4">
        <Container className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <BrandLogo className="" />
          <span>Comida rápida, pedida fácil.</span>
        </Container>
      </footer>
      <ToastContainer position="bottom-center" className="p-3">
        <Toast show={message !== null} onClose={() => setClosedKey(location.key)} delay={3500} autohide bg="dark">
          <Toast.Body className="text-white">{message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
