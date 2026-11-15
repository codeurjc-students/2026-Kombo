import { useState } from 'react';
import { Alert, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import useSettings from '../hooks/useSettings';
import { updateDeliveryCost } from '../services/settingsService';
import { formatPrice } from '../utils/format';

// Administrator: change the delivery cost of home deliveries
export default function AdminSettingsPage() {
  const { settings, error } = useSettings();

  if (error) {
    return <ErrorState message="No hemos podido cargar los ajustes." />;
  }
  if (!settings) {
    return <LoadingState />;
  }
  return <SettingsForm settings={settings} />;
}

// The form starts with the stored values
function SettingsForm({ settings }) {
  const [deliveryCost, setDeliveryCost] = useState(Number(settings.deliveryCost).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const saved = await updateDeliveryCost(Number(deliveryCost));
      setDeliveryCost(Number(saved.deliveryCost).toFixed(2));
      setResult({ variant: 'success', text: `Gastos de envío guardados: ${formatPrice(saved.deliveryCost)}.` });
    } catch {
      setResult({ variant: 'danger', text: 'No hemos podido guardar los gastos de envío.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel settings-panel" aria-labelledby="settings-title">
      <h1 id="settings-title" className="page-title">Ajustes</h1>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="settings-delivery-cost">
          <Form.Label>Gastos de envío a domicilio</Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              required
              min="0"
              max="99.99"
              step="0.01"
              aria-describedby="settings-delivery-cost-help"
              value={deliveryCost}
              onChange={(event) => setDeliveryCost(event.target.value)}
            />
            <InputGroup.Text>€</InputGroup.Text>
          </InputGroup>
          <Form.Text id="settings-delivery-cost-help">
            Los pedidos a domicilio de {formatPrice(settings.freeDeliveryThreshold)} o más no pagan envío.
          </Form.Text>
        </Form.Group>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
          Guardar
        </Button>
      </Form>
    </section>
  );
}
