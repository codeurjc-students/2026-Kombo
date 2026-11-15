import { Spinner } from 'react-bootstrap';

export default function LoadingState({ label = 'Cargando…' }) {
  return (
    <output className="d-flex align-items-center justify-content-center gap-2 py-5 text-secondary">
      <Spinner animation="border" size="sm" aria-hidden="true" />
      <span>{label}</span>
    </output>
  );
}
