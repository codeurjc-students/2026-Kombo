import { Button } from 'react-bootstrap';
import { Link } from 'react-router';

// Common look of the 404, 403 and error pages
export default function StatusPage({ code, title, message, action }) {
  return (
    <section className="status-page" aria-labelledby="status-title">
      <p className="status-code" aria-hidden="true">{code}</p>
      <h1 id="status-title" className="h2 mb-3">{title}</h1>
      <p className="text-secondary mb-4">{message}</p>
      {action ?? (
        <Button as={Link} to="/" variant="primary" size="lg">
          Volver a la carta
        </Button>
      )}
    </section>
  );
}
