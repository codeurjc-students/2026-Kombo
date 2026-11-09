import { Alert, Button } from 'react-bootstrap';

// Error inside a page, with a button to try again
export default function ErrorState({ message, onRetry }) {
  return (
    <Alert variant="danger" className="d-flex flex-wrap align-items-center justify-content-between gap-2">
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline-danger" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </Alert>
  );
}
