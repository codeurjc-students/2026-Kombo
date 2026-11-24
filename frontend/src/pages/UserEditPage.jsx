import { useCallback, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import { AddressesForm, PersonalDataForm, PictureForm } from '../components/AccountForms';
import DeleteUserModal from '../components/DeleteUserModal';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import UserAvatar from '../components/UserAvatar';
import { ApiError } from '../services/httpClient';
import {
  deleteUserImage,
  getUser,
  updateUser,
  updateUserAddresses,
  uploadUserImage,
  userImageUrl,
} from '../services/userService';
import { ROLE_LABELS } from '../utils/format';
import NotFoundPage from './NotFoundPage';

// The administrator changes the personal data, the picture and the addresses (only customers keep addresses) of a
// customer or an employee, or deletes them. The forms are the same as in the profile settings; the email and
// the password cannot be changed here.
export default function UserEditPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const [state, setState] = useState({ user: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const reload = useCallback(async () => {
    const user = await getUser(id);
    setState({ user, error: null });
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    getUser(id)
      .then((user) => !cancelled && setState({ user, error: null }))
      .catch((error) => !cancelled && setState({ user: null, error }));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const { user, error } = state;
  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundPage />;
  }
  if (error) {
    return <ErrorState message="No hemos podido cargar el usuario." onRetry={() => setAttempt((n) => n + 1)} />;
  }
  if (!user || user.id !== id) {
    return <LoadingState label="Cargando usuario…" />;
  }

  return (
    <div className="profile-settings">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <h1 className="page-title mb-0">Editar usuario</h1>
        <Button as={Link} to="/admin/users" variant="outline-ink">
          Volver a usuarios
        </Button>
      </div>
      <section className="panel" aria-label="Cuenta del usuario">
        <div className="settings-header settings-avatar">
          <UserAvatar user={user} imageUrl={(imageId) => userImageUrl(user.id, imageId)} />
          <div className="user-name-text">
            <p className="h4 mb-0">
              {user.name} {user.surname}
            </p>
            <p className="text-secondary mb-0">{user.email}</p>
            <span className="role-badge">{ROLE_LABELS[user.role]}</span>
          </div>
        </div>
        <PersonalDataForm user={user} save={(profile) => updateUser(id, profile)} onSaved={reload} own={false} />
        <hr className="settings-divider" />
        <PictureForm
          user={user}
          upload={(file) => uploadUserImage(id, file)}
          remove={() => deleteUserImage(id)}
          onSaved={reload}
          own={false}
        />
        {user.role === 'CUSTOMER' && (
          <>
            <hr className="settings-divider" />
            <AddressesForm user={user} save={(list) => updateUserAddresses(id, list)} onSaved={reload} own={false} />
          </>
        )}
        {user.role !== 'ADMIN' && (
          <>
            <hr className="settings-divider" />
            <section aria-labelledby="delete-user-title">
              <h2 id="delete-user-title" className="h4 mb-2">Borrar usuario</h2>
              {deleteError && (
                <p className="text-danger">No hemos podido borrar el usuario. Inténtalo de nuevo.</p>
              )}
              <Button variant="danger" onClick={() => setDeleting(true)}>
                Borrar usuario
              </Button>
            </section>
          </>
        )}
      </section>
      {deleting && (
        <DeleteUserModal
          user={user}
          onCancel={() => setDeleting(false)}
          onDeleted={() => navigate('/admin/users', { state: { message: `Se ha borrado a ${user.name}.` } })}
          onError={() => {
            setDeleting(false);
            setDeleteError(true);
          }}
        />
      )}
    </div>
  );
}
