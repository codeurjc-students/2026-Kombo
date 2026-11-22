import { useCallback } from 'react';
import { Badge, Button, Col, Row } from 'react-bootstrap';
import { Link, Navigate } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import usePagedList from '../hooks/usePagedList';
import useRepeatOrder from '../hooks/useRepeatOrder';
import { getMyOrders } from '../services/orderService';
import { ORDER_STATUS, ROLE_LABELS, formatDateTime, formatPrice, orderLinesSummary } from '../utils/format';

// Orders shown at a time in the profile
const RECENT_ORDERS = 4;

// Profile of the customer with their last orders. Employees and the administrator have no orders, so they go
// straight to the settings of their account.
export default function ProfilePage() {
  const { user } = useAuth();

  if (user.role !== 'CUSTOMER') {
    return <Navigate to="/profile/settings" replace />;
  }

  return (
    <Row className="g-4">
      <Col lg={4}>
        <section className="panel" aria-labelledby="profile-title">
          <div className="profile-header">
            <UserAvatar user={user} />
            <div>
              <h1 id="profile-title" className="h3 mb-1">
                {user.name} {user.surname}
              </h1>
              <span className="role-badge">{ROLE_LABELS[user.role]}</span>
            </div>
          </div>
          <dl className="mb-0">
            <dt className="small text-secondary">Correo electrónico</dt>
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
          <Button as={Link} to="/profile/settings" variant="outline-ink" className="mt-3">
            Configuración
          </Button>
        </section>
      </Col>
      <Col lg={8}>
        <RecentOrders />
      </Col>
    </Row>
  );
}

// The last orders of the customer, 4 at a time, with a link to their detail and a "Repetir pedido" button
function RecentOrders() {
  const fetchPage = useCallback((page) => getMyOrders({ page, size: RECENT_ORDERS }), []);
  const { items: orders, loading, error, hasMore, loadMore, retry } = usePagedList(fetchPage);
  const repeatOrder = useRepeatOrder();

  return (
    <section className="panel" aria-labelledby="orders-title">
      <h2 id="orders-title" className="h3 mb-3">Mis pedidos</h2>
      {error && <ErrorState message="No hemos podido cargar tus pedidos." onRetry={retry} />}
      {loading && orders.length === 0 && <LoadingState label="Cargando tus pedidos…" />}
      {!loading && !error && orders.length === 0 && (
        <p className="text-secondary mb-0">Todavía no has hecho ningún pedido. Echa un vistazo a la carta.</p>
      )}
      <ul className="list-unstyled d-grid gap-2 mb-0" aria-label="Últimos pedidos">
        {orders.map((order) => {
          const status = ORDER_STATUS[order.status] ?? { label: order.status, bg: 'secondary' };
          return (
            <li key={order.id} className="order-item order-card">
              <div className="d-flex flex-wrap justify-content-between gap-2">
                <div>
                  {/* Stretched link: the whole card opens the detail of the order */}
                  <Link to={`/orders/${order.id}`} className="order-card-link stretched-link">
                    Pedido nº {order.orderNumber}
                  </Link>
                  <div className="small text-secondary">{formatDateTime(order.createdAt)}</div>
                </div>
                <div className="text-end">
                  <Badge bg={status.bg} className="mb-1">{status.label}</Badge>
                  <div className="order-total">{formatPrice(order.total)}</div>
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-1">
                <span className="small text-secondary">{orderLinesSummary(order)}</span>
                <Button variant="outline-ink" size="sm" className="order-card-action" onClick={() => repeatOrder(order)}>
                  Repetir pedido
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <Button variant="outline-ink" className="mt-3" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando…' : 'Más resultados'}
        </Button>
      )}
    </section>
  );
}
