import { useCallback } from 'react';
import { Pagination, Table } from 'react-bootstrap';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import usePagedList from '../hooks/usePagedList';
import { getUsers } from '../services/userService';
import { ROLE_LABELS } from '../utils/format';

// List of users, only for the administrator
export default function UsersPage() {
  const fetchPage = useCallback((page) => getUsers({ page }), []);
  const { items: users, pageInfo, loading, error, goToPage, retry } = usePagedList(fetchPage, { accumulate: false });
  const page = pageInfo?.number ?? 0;

  return (
    <section className="panel" aria-labelledby="users-title">
      <h1 id="users-title" className="h2 mb-4">Usuarios</h1>
      {error && <ErrorState message="No hemos podido cargar los usuarios." onRetry={retry} />}
      {loading && !pageInfo && <LoadingState label="Cargando usuarios…" />}
      {pageInfo && (
        <>
          <Table responsive hover className="align-middle mb-3">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Email</th>
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
          {pageInfo.totalPages > 1 && (
            <Pagination className="mb-0" aria-label="Páginas de usuarios">
              <Pagination.Prev disabled={page === 0 || loading} onClick={() => goToPage(page - 1)} />
              <Pagination.Item active>{page + 1}</Pagination.Item>
              <Pagination.Next disabled={page + 1 >= pageInfo.totalPages || loading} onClick={() => goToPage(page + 1)} />
            </Pagination>
          )}
        </>
      )}
    </section>
  );
}
