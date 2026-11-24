import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal, Spinner, Tab, Tabs } from 'react-bootstrap';
import { Link } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import useNow from '../hooks/useNow';
import usePagedList from '../hooks/usePagedList';
import { ApiError } from '../services/httpClient';
import { FINISHED_STATUSES, PENDING_STATUSES, getOrders, startOfToday, updateOrder } from '../services/orderService';
import { DELIVERY_TYPES, paymentStatus } from '../utils/delivery';
import {
  ORDER_STATUS,
  formatDateTime,
  formatMinutes,
  formatPrice,
  formatTime,
    minutesSince,
  orderLinesSummary,
} from '../utils/format';

// A pending order that has waited longer than this is shown in red
export const LATE_MINUTES = 10;
// The lists are read again from the server every 30 seconds, so new orders appear without pressing "Actualizar"
export const REFRESH_MS = 30000;

// Dashboard of the employees and the administrator: the pending orders, oldest first (the next one to prepare is
// on top), with the minutes they have been waiting, and the finished ones of today, most recent first, with the time
// they were placed. Each change reloads both lists from the server, and they are also read again every 30 seconds.
export default function OrdersDashboardPage() {
  // A new version creates new fetch functions, so both lists start again from their first page
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  async function change(order, changes, successText) {
    setResult(null);
    try {
      await updateOrder(order.id, changes);
      setResult({ variant: 'success', text: successText });
    } catch (err) {
      setResult({
        variant: 'danger',
        text:
          err instanceof ApiError && err.status === 409
            ? `El pedido nº ${order.orderNumber} ya no se puede cambiar así. Actualiza la lista.`
            : `No hemos podido cambiar el pedido nº ${order.orderNumber}. Inténtalo de nuevo.`,
      });
    } finally {
      reload();
    }
  }

  return (
    <section aria-labelledby="dashboard-title">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <h1 id="dashboard-title" className="page-title mb-0">Pedidos</h1>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-ink" onClick={reload}>
            Actualizar
          </Button>
          <Button as={Link} to="/" variant="primary">
            Nuevo pedido en mostrador
          </Button>
        </div>
      </div>
      {result && (
        <Alert variant={result.variant} dismissible onClose={() => setResult(null)}>
          {result.text}
        </Alert>
      )}
      <div className="panel">
        <Tabs defaultActiveKey="pending" id="orders-tabs" className="settings-tabs">
          <Tab eventKey="pending" title="Pendientes">
            <OrderList key={`pending-${version}`} statuses={PENDING_STATUSES} sort="createdAt,asc" onChange={change} />
          </Tab>
          <Tab eventKey="finished" title="Terminados">
            <OrderList key={`finished-${version}`} statuses={FINISHED_STATUSES} sort="createdAt,desc" today />
          </Tab>
        </Tabs>
      </div>
    </section>
  );
}

// A paginated list of orders: 10 and a "Más resultados" button for the next ones.
// onChange is only given to the pending orders, which are the ones that can change.
// today: only the orders placed since 00:00 of today (later, since the last cash register closing)
function OrderList({ statuses, sort, onChange, today = false }) {
  const fetchPage = useCallback(
    (page) => getOrders({ statuses, page, sort, since: today ? startOfToday() : undefined }),
    [statuses, sort, today],
  );
  const { items: orders, pageInfo, loading, error, hasMore, loadMore, retry, refresh } = usePagedList(fetchPage);
  const pending = Boolean(onChange);

  // Automatic reload: only the first page is read again (the next ones, if loaded, are left out until
  // "Más resultados" is pressed again). The cards keep their key, so an open confirmation is not closed.
  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);
  // The waiting time of the pending orders counts while the page is open
  const now = useNow(30000);

  if (error) {
    return <ErrorState message="No hemos podido cargar los pedidos." onRetry={retry} />;
  }
  if (!pageInfo) {
    return <LoadingState label="Cargando pedidos…" />;
  }
  if (orders.length === 0) {
    return (
      <p className="text-secondary mb-0">
        {pending ? 'No hay pedidos pendientes.' : 'Todavía no hay pedidos terminados hoy.'}
      </p>
    );
  }
  return (
    <>
      <ul
        className="list-unstyled d-grid gap-3 mb-0"
        aria-label={pending ? 'Pedidos pendientes' : 'Pedidos terminados'}
      >
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onChange={onChange} now={now} />
        ))}
      </ul>
      {hasMore && (
        <Button variant="outline-ink" className="mt-3" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando…' : 'Más resultados'}
        </Button>
      )}
    </>
  );
}

function OrderCard({ order, onChange, now }) {
  const [working, setWorking] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const status = ORDER_STATUS[order.status] ?? { label: order.status, bg: 'secondary' };
  const number = order.orderNumber;

  async function run(changes, successText) {
    setWorking(true);
    setConfirmingCancel(false);
    await onChange(order, changes, successText);
    setWorking(false);
  }

  return (
    <li className="order-item dashboard-order" aria-label={`Pedido nº ${number}`}>
      <div className="d-flex flex-wrap justify-content-between gap-2">
        <div>
          <div className="order-card-title">
            <Link to={`/orders/${order.id}`} className="order-card-link">
              Pedido nº {number}
            </Link>
            {' - '}
            {onChange ? (
              <WaitingTime order={order} now={now} />
            ) : (
              <time className="order-card-time" dateTime={order.createdAt} title={formatDateTime(order.createdAt)}>
                {formatTime(order.createdAt)}
              </time>
            )}
          </div>
          <div className="small text-secondary">
            {DELIVERY_TYPES[order.deliveryType]?.label}
            {order.customerName ? ` · ${order.customerName}` : ''}
          </div>
        </div>
        <div className="text-end">
          <Badge bg={status.bg} className="mb-1">
            {status.label}
          </Badge>
          <div className="order-total">{formatPrice(order.total)}</div>
        </div>
      </div>
      <p className="small mb-2 mt-1">{orderLinesSummary(order)}</p>
      {order.deliveryAddress && <p className="small text-secondary mb-2">Entrega en {order.deliveryAddress}</p>}
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className={`small ${paymentClass(order)}`}>{paymentStatus(order)}</span>
        {onChange && (
          <div className="d-flex flex-wrap gap-2 ms-auto">
            {working && <Spinner animation="border" size="sm" role="status" aria-label="Guardando" />}
            {!order.paid && (
              <Button
                size="sm"
                variant="outline-ink"
                disabled={working}
                onClick={() => run({ paid: true }, `Pedido nº ${number} cobrado en efectivo.`)}
              >
                Cobrar en efectivo
              </Button>
            )}
            {order.status === 'IN_PREPARATION' && (
              <Button
                size="sm"
                variant="primary"
                disabled={working}
                onClick={() => run({ status: 'READY' }, `Pedido nº ${number} listo.`)}
              >
                Marcar como listo
              </Button>
            )}
            {order.status === 'READY' && order.paid && (
              <Button
                size="sm"
                variant="primary"
                disabled={working}
                onClick={() => run({ status: 'DELIVERED' }, `Pedido nº ${number} entregado.`)}
              >
                Entregar
              </Button>
            )}
            <Button size="sm" variant="outline-danger" disabled={working} onClick={() => setConfirmingCancel(true)}>
              Cancelar
            </Button>
          </div>
        )}
      </div>
      {order.status === 'READY' && !order.paid && onChange && (
        <p className="small text-secondary mb-0 mt-2">Cóbralo antes de entregarlo.</p>
      )}
      <Modal show={confirmingCancel} onHide={() => setConfirmingCancel(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h4">¿Cancelar el pedido nº {number}?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Un pedido cancelado ya no se puede preparar ni entregar.</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-ink" onClick={() => setConfirmingCancel(false)}>
            Volver
          </Button>
          <Button variant="danger" onClick={() => run({ status: 'CANCELLED' }, `Pedido nº ${number} cancelado.`)}>
            Sí, cancelar el pedido
          </Button>
        </Modal.Footer>
      </Modal>
    </li>
  );
}

// Minutes since the order was placed, in red when they are more than LATE_MINUTES
function WaitingTime({ order, now }) {
  const minutes = minutesSince(order.createdAt, now);
  const late = minutes > LATE_MINUTES;
  return (
    <span
      className={`order-card-time${late ? ' text-danger' : ''}`}
      title={`Pedido el ${formatDateTime(order.createdAt)}`}
      aria-label={`Esperando ${formatMinutes(minutes)}`}
    >
      {formatMinutes(minutes)}
    </span>
  );
}

// Green when it is paid, red when it is still to be paid and grey when the order was cancelled
function paymentClass(order) {
  if (order.status === 'CANCELLED') {
    return 'text-secondary';
  }
  return order.paid ? 'text-success' : 'text-danger';
}
