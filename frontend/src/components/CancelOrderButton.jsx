import { useState } from 'react';
import { Alert, Button, Modal, Spinner } from 'react-bootstrap';
import useSettings from '../hooks/useSettings';
import { ApiError } from '../services/httpClient';
import { cancelOrder } from '../services/orderService';
import { canBeCancelledByCustomer, cancellationFeeFor } from '../utils/delivery';
import { formatPrice } from '../utils/format';

// "Cancelar pedido" button of an order of the customer, with a confirmation window that says how much is given
// back. Only shown while the order is in preparation or ready; onCancelled receives the cancelled order.
export default function CancelOrderButton({ order, onCancelled, className = '' }) {
  const [confirming, setConfirming] = useState(false);

  if (!canBeCancelledByCustomer(order)) {
    return null;
  }
  return (
    <>
      <Button variant="outline-danger" size="sm" className={className} onClick={() => setConfirming(true)}>
        Cancelar pedido
      </Button>
      {confirming && (
        <CancelOrderModal order={order} onClose={() => setConfirming(false)} onCancelled={onCancelled} />
      )}
    </>
  );
}

function CancelOrderModal({ order, onClose, onCancelled }) {
  const { settings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      const cancelled = await cancelOrder(order.id);
      onClose();
      onCancelled(cancelled);
    } catch (err) {
      // 409: an employee changed the order meanwhile (for example, it was delivered)
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Este pedido ya no se puede cancelar. Recarga la página para ver su estado.'
          : 'No hemos podido cancelar el pedido. Inténtalo de nuevo.',
      );
      setSaving(false);
    }
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h4">
          ¿Cancelar el pedido nº {order.orderNumber}?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p className="mb-0">{refundText(order, settings)}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-ink" onClick={onClose} disabled={saving}>
          Volver
        </Button>
        <Button variant="danger" onClick={confirm} disabled={saving || !settings}>
          {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
          Sí, cancelar el pedido
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// What happens to the money of the order (the server calculates it again)
function refundText(order, settings) {
  if (!order.paid) {
    return 'No se te cobrará nada.';
  }
  if (order.status !== 'READY') {
    return `Se te devolverá todo el importe (${formatPrice(order.total)}).`;
  }
  if (!settings) {
    return 'Calculando el importe que se te devuelve…';
  }
  const percent = Number(settings.cancellationFeePercent);
  // Without a valid percentage (for example, a server of a previous version) no amounts are invented
  if (settings.cancellationFeePercent == null || Number.isNaN(percent)) {
    return 'Tu pedido ya está listo: se cobra un gasto de cancelación y se te devolverá el resto.';
  }
  const fee = cancellationFeeFor(order, percent);
  return (
    `Tu pedido ya está listo: se cobra el ${percent} % (${formatPrice(fee)}) ` +
    `y se te devolverán ${formatPrice(Number(order.total) - fee)}.`
  );
}
