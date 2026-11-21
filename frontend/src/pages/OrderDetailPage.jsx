import { useEffect, useState } from 'react';
import { Badge, Button, Col, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import OrderSummary from '../components/OrderSummary';
import StatusPage from '../components/StatusPage';
import { useAuth } from '../context/AuthContext';
import useRepeatOrder from '../hooks/useRepeatOrder';
import { ApiError } from '../services/httpClient';
import { getOrder } from '../services/orderService';
import { DELIVERY_TYPES, PAYMENT_METHODS } from '../utils/delivery';
import { ORDER_STATUS, formatDateTime, formatPrice } from '../utils/format';
import NotFoundPage from './NotFoundPage';

// Detail of an order: products with the price paid, delivery, payment, status and totals, and a button to
// order the same again. The server only returns the order to its customer, employees and the administrator.
export default function OrderDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState({ id, attempt: 0 });
  const [result, setResult] = useState({ request: null, order: null, error: null });

  // Derived state: another order starts a new request
  if (request.id !== id) {
    setRequest({ id, attempt: 0 });
  }

  useEffect(() => {
    let cancelled = false;
    getOrder(request.id)
      .then((order) => !cancelled && setResult({ request, order, error: null }))
      .catch((error) => !cancelled && setResult({ request, order: null, error }));
    return () => {
      cancelled = true;
    };
  }, [request]);

  if (result.request !== request) {
    return <LoadingState label="Cargando el pedido…" />;
  }
  const { order, error } = result;
  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
    return <NotFoundPage />;
  }
  if (error instanceof ApiError && error.status === 403) {
    return <StatusPage code="403" title="Este pedido no es tuyo" message="Solo puedes ver los pedidos que has hecho tú." />;
  }
  if (error) {
    const retry = () => setRequest((current) => ({ ...current, attempt: current.attempt + 1 }));
    return <ErrorState message="No hemos podido cargar el pedido." onRetry={retry} />;
  }
  return <OrderDetail order={order} />;
}

function OrderDetail({ order }) {
  const { user } = useAuth();
  const repeatOrder = useRepeatOrder();
  const status = ORDER_STATUS[order.status] ?? { label: order.status, bg: 'secondary' };

  return (
    <section aria-labelledby="order-title">
      <Link to="/profile" className="back-link">← Volver a mi perfil</Link>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <h1 id="order-title" className="page-title mb-0">Pedido nº {order.orderNumber}</h1>
        <Badge bg={status.bg}>{status.label}</Badge>
      </div>
      <Row className="g-4">
        <Col lg={8}>
          <div className="panel">
            <dl className="order-facts">
              <div>
                <dt>Fecha</dt>
                <dd>{formatDateTime(order.createdAt)}</dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>
                  {DELIVERY_TYPES[order.deliveryType]?.label}
                  {order.deliveryAddress && <span className="d-block small text-secondary">{order.deliveryAddress}</span>}
                </dd>
              </div>
              <div>
                <dt>Pago</dt>
                <dd>
                  {PAYMENT_METHODS[order.paymentMethod]?.label} ({order.paid ? 'pagado' : 'pendiente de pago'})
                </dd>
              </div>
            </dl>
            <h2 className="h5 mt-4">Productos</h2>
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col" className="text-center">Unidades</th>
                  <th scope="col" className="text-end">Precio</th>
                  <th scope="col" className="text-end">Importe</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.productName ?? line.product.name}</td>
                    <td className="text-center">{line.quantity}</td>
                    <td className="text-end">{formatPrice(line.unitPrice)}</td>
                    <td className="text-end">{formatPrice(line.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Col>
        <Col lg={4}>
          <OrderSummary
            subtotal={Number(order.subtotal)}
            deliveryCost={Number(order.deliveryCost)}
            total={Number(order.total)}
          >
            {user?.role === 'CUSTOMER' && (
              <>
                <Button variant="primary" size="lg" className="w-100" onClick={() => repeatOrder(order)}>
                  Repetir pedido
                </Button>
                <p className="small text-secondary mt-2 mb-0">
                  Se añaden al carrito con el precio actual de cada producto.
                </p>
              </>
            )}
          </OrderSummary>
        </Col>
      </Row>
    </section>
  );
}
