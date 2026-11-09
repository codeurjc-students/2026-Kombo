import { useCallback } from 'react';
import { Badge, Button, Col, ListGroup, Row } from 'react-bootstrap';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import usePagedList from '../hooks/usePagedList';
import { getUserOrders } from '../services/userService';
import { ORDER_STATUS, ROLE_LABELS, formatDateTime, formatPrice } from '../utils/format';

// Profile of the logged in user and, for customers, their order history
export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Row className="g-4">
      <Col lg={4}>
        <section className="panel" aria-labelledby="profile-title">
          <h1 id="profile-title" className="h3 mb-1">
            {user.name} {user.surname}
          </h1>
          <span className="role-badge">{ROLE_LABELS[user.role]}</span>
          <dl className="mt-4 mb-0">
            <dt className="small text-secondary">Email</dt>
            <dd>{user.email}</dd>
            {user.phone && (
              <>
                <dt className="small text-secondary">Teléfono</dt>
                <dd>{user.phone}</dd>
              </>
            )}
            {user.addresses?.length > 0 && (
              <>
                <dt className="small text-secondary">Direcciones</dt>
                {user.addresses.map((address) => (
                  <dd key={address} className="mb-1">{address}</dd>
                ))}
              </>
            )}
          </dl>
        </section>
      </Col>
      <Col lg={8}>{user.role === 'CUSTOMER' && <OrderHistory userId={user.id} />}</Col>
    </Row>
  );
}

function OrderHistory({ userId }) {
  const fetchPage = useCallback((page) => getUserOrders(userId, { page }), [userId]);
  const { items: orders, loading, error, hasMore, loadMore, retry } = usePagedList(fetchPage);

  return (
    <section className="panel" aria-labelledby="orders-title">
      <h2 id="orders-title" className="h3 mb-3">Mis pedidos</h2>
      {error && <ErrorState message="No hemos podido cargar tus pedidos." onRetry={retry} />}
      {loading && orders.length === 0 && <LoadingState label="Cargando tus pedidos…" />}
      {!loading && !error && orders.length === 0 && (
        <p className="text-secondary mb-0">Todavía no has hecho ningún pedido. Echa un vistazo a la carta.</p>
      )}
      <ListGroup variant="flush">
        {orders.map((order) => {
          const status = ORDER_STATUS[order.status] ?? { label: order.status, bg: 'secondary' };
          return (
            <ListGroup.Item key={order.id} className="px-0 py-3">
              <div className="d-flex flex-wrap justify-content-between gap-2">
                <div>
                  <strong>Pedido nº {order.orderNumber}</strong>
                  <div className="small text-secondary">{formatDateTime(order.createdAt)}</div>
                </div>
                <div className="text-end">
                  <Badge bg={status.bg} className="mb-1">{status.label}</Badge>
                  <div className="fw-bold">{formatPrice(order.total)}</div>
                </div>
              </div>
              <div className="small text-secondary mt-1">
                {order.lines.map((line) => `${line.quantity} × ${line.product.name}`).join(', ')}
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
      {hasMore && (
        <Button variant="outline-ink" className="mt-3" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando…' : 'Ver pedidos anteriores'}
        </Button>
      )}
    </section>
  );
}
