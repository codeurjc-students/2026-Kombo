import { useState } from 'react';
import { Alert, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import useSettings from '../hooks/useSettings';
import { updateSettings } from '../services/settingsService';
import { formatPrice } from '../utils/format';

// Administrator: change the delivery cost of home deliveries and the percentage of the total that the restaurant
// keeps when a customer cancels a paid order that is already ready
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
  const [feePercent, setFeePercent] = useState(String(settings.cancellationFeePercent));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const saved = await updateSettings({
        deliveryCost: Number(deliveryCost),
        cancellationFeePercent: Number(feePercent),
      });
      setDeliveryCost(Number(saved.deliveryCost).toFixed(2));
      setFeePercent(String(saved.cancellationFeePercent));
      setResult({
        variant: 'success',
        text:
          `Ajustes guardados: envío de ${formatPrice(saved.deliveryCost)} y gasto de cancelación del ` +
          `${saved.cancellationFeePercent} %.`,
      });
    } catch {
      setResult({ variant: 'danger', text: 'No hemos podido guardar los ajustes.' });
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
        <Form.Group className="mb-3" controlId="settings-cancellation-fee">
          <Form.Label>Gasto de cancelación de un pedido listo</Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              required
              min="0"
              max="100"
              step="1"
              aria-describedby="settings-cancellation-fee-help"
              value={feePercent}
              onChange={(event) => setFeePercent(event.target.value)}
            />
            <InputGroup.Text>%</InputGroup.Text>
          </InputGroup>
          <Form.Text id="settings-cancellation-fee-help">
            Parte del total que se queda el restaurante si el cliente cancela un pedido pagado que ya está listo.
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
