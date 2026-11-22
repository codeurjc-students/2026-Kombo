import { useCallback, useState } from 'react';
import { Alert, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import DeleteUserModal from '../components/DeleteUserModal';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import usePagedList from '../hooks/usePagedList';
import { getUsers } from '../services/userService';
import { ROLE_LABELS } from '../utils/format';

// List of users, only for the administrator: 10 users and a "Más resultados" button for the next ones.
// The administrator creates customers and employees, and edits or deletes any user except themselves.
export default function UsersPage() {
  // A new version mounts the list again, so it is read again from the first page (after deleting a user)
  const [version, setVersion] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [result, setResult] = useState(null);

  function handleDeleted(user) {
    setDeleting(null);
    setResult({ variant: 'success', text: `Se ha borrado a ${user.name}.` });
    setVersion((current) => current + 1);
  }

  function handleDeleteError(user) {
    setDeleting(null);
    setResult({ variant: 'danger', text: `No hemos podido borrar a ${user.name}. Inténtalo de nuevo.` });
  }

  return (
    <section className="panel" aria-labelledby="users-title">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 id="users-title" className="page-title mb-0">Usuarios</h1>
        <Button as={Link} to="/admin/users/new" variant="primary">
          Nuevo usuario
        </Button>
      </div>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      <UserList key={version} onDelete={setDeleting} />
      {deleting && (
        <DeleteUserModal
          user={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={handleDeleted}
          onError={handleDeleteError}
        />
      )}
    </section>
  );
}

function UserList({ onDelete }) {
  const fetchPage = useCallback((page) => getUsers({ page }), []);
  const { items: users, pageInfo, loading, error, hasMore, loadMore, retry } = usePagedList(fetchPage);

  return (
    <>
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
              <th scope="col">Acciones</th>
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
                <td>
                  {user.role !== 'ADMIN' && (
                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        as={Link}
                        to={`/admin/users/${user.id}`}
                        variant="outline-ink"
                        size="sm"
                        aria-label={`Editar a ${user.name}`}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onDelete(user)}
                        aria-label={`Borrar a ${user.name}`}
                      >
                        Borrar
                      </Button>
                    </div>
                  )}
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
    </>
  );
}
