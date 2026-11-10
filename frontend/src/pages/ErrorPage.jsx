import { Button } from 'react-bootstrap';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import Layout from '../components/Layout';
import StatusPage from '../components/StatusPage';
import NotFoundPage from './NotFoundPage';

// Shown by the router when a page fails. It renders its own Layout because it replaces the root route.
export default function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <Layout>
        <NotFoundPage />
      </Layout>
    );
  }

  return (
    <Layout>
      <StatusPage
        code="¡Ups!"
        title="Algo ha fallado"
        message="Ha ocurrido un error inesperado al mostrar esta página. Recárgala o vuelve a la carta."
        action={
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
              Recargar la página
            </Button>
            <Button variant="outline-ink" size="lg" href="/">
              Volver a la carta
            </Button>
          </div>
        }
      />
    </Layout>
  );
}
