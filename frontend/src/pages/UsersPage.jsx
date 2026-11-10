import { useCallback } from 'react';
import { Button, Table } from 'react-bootstrap';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import usePagedList from '../hooks/usePagedList';
import { getUsers } from '../services/userService';
import { ROLE_LABELS } from '../utils/format';

// List of users, only for the administrator: 10 users and a "Más resultados" button for the next ones
export default function UsersPage() {
  const fetchPage = useCallback((page) => getUsers({ page }), []);
  const { items: users, pageInfo, loading, error, hasMore, loadMore, retry } = usePagedList(fetchPage);

  return (
    <section className="panel" aria-labelledby="users-title">
      <h1 id="users-title" className="page-title">Usuarios</h1>
      {error && <ErrorState message="No hemos podido cargar los usuarios." onRetry={retry} />}
      {loading && !pageInfo && <LoadingState label="Cargando usuarios…" />}
      {pageInfo && (
        <Table responsive hover className="align-middle mb-3">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Correo electrónico</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.name} {user.surname}
                </td>
                <td>{user.email}</td>
                <td>{user.phone ?? '—'}</td>
                <td>
                  <span className="role-badge">{ROLE_LABELS[user.role]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {hasMore && (
        <Button variant="outline-ink" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando…' : 'Más resultados'}
        </Button>
      )}
    </section>
  );
}
