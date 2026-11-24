import { useState } from 'react';
import { Alert, Button, Form, Modal, Spinner, Tab, Tabs } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { AddressesForm, PersonalDataForm, PictureForm } from '../components/AccountForms';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/httpClient';
import {
  changeMyPassword,
  deleteMyAccount,
  deleteMyImage,
  updateMyAddresses,
  updateMyProfile,
  uploadMyImage,
} from '../services/userService';
import { validatePasswordChange } from '../utils/profileValidation';

// Settings of the account of the logged in user. Each section is saved on its own, so changing one thing
// does not require filling in the others; "Volver al perfil" leaves without saving anything.
// Only customers keep addresses, and the account of the administrator cannot be deleted.
// A header with the picture, the name and the email, and a tab for each group of settings. A tab is rendered
// the first time it is opened and then kept, so moving between tabs does not lose what was written.
export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();

  return (
    <div className="profile-settings">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <h1 className="page-title mb-0">Mi perfil</h1>
        {/* Only customers have a page with their orders to go back to */}
        {user.role === 'CUSTOMER' && (
          <Button as={Link} to="/profile" variant="outline-ink">
            Volver a mis pedidos
          </Button>
        )}
      </div>
      <section className="panel" aria-label="Tu cuenta">
        <div className="settings-header settings-avatar">
          <UserAvatar user={user} />
          <div className="user-name-text">
            <p className="h4 mb-0">
              {user.name} {user.surname}
            </p>
            <p className="text-secondary mb-0">{user.email}</p>
          </div>
        </div>
        <Tabs defaultActiveKey="profile" id="settings-tabs" className="settings-tabs" mountOnEnter>
          <Tab eventKey="profile" title="Perfil">
            <PersonalDataForm user={user} save={updateMyProfile} onSaved={refreshUser} />
            <hr className="settings-divider" />
            <PictureForm user={user} upload={uploadMyImage} remove={deleteMyImage} onSaved={refreshUser} />
          </Tab>
          <Tab eventKey="security" title="Seguridad">
            <PasswordForm />
          </Tab>
          {user.role === 'CUSTOMER' && (
            <Tab eventKey="addresses" title="Direcciones">
              <AddressesForm user={user} save={updateMyAddresses} onSaved={refreshUser} />
            </Tab>
          )}
          {user.role !== 'ADMIN' && (
            <Tab eventKey="account" title="Cuenta">
              <DeleteAccountPanel />
            </Tab>
          )}
        </Tabs>
      </section>
    </div>
  );
}

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', repeatPassword: '' };

// The current password is asked again, so nobody can change it from a session left open
function PasswordForm() {
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  function changeField(field) {
    return (event) => setPasswords((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validatePasswordChange(passwords);
    setErrors(formErrors);
    setResult(null);
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await changeMyPassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords(EMPTY_PASSWORDS);
      setResult({ variant: 'success', text: 'Tu contraseña se ha cambiado.' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.message.startsWith('currentPassword')) {
        setErrors({ currentPassword: 'La contraseña actual no es correcta.' });
      } else {
        setResult({ variant: 'danger', text: 'No hemos podido cambiar tu contraseña. Inténtalo de nuevo.' });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="password-title">
      <h2 id="password-title" className="h4 mb-3">Cambiar contraseña</h2>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      <Form noValidate onSubmit={handleSubmit} aria-labelledby="password-title">
        <Form.Group className="mb-3" controlId="password-current">
          <Form.Label>Contraseña actual</Form.Label>
          <Form.Control
            type="password"
            autoComplete="current-password"
            value={passwords.currentPassword}
            onChange={changeField('currentPassword')}
            isInvalid={Boolean(errors.currentPassword)}
          />
          <Form.Control.Feedback type="invalid">{errors.currentPassword}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3" controlId="password-new">
          <Form.Label>Contraseña nueva</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            aria-describedby="password-new-help"
            value={passwords.newPassword}
            onChange={changeField('newPassword')}
            isInvalid={Boolean(errors.newPassword)}
          />
          <Form.Control.Feedback type="invalid">{errors.newPassword}</Form.Control.Feedback>
          <Form.Text id="password-new-help">Al menos 8 caracteres.</Form.Text>
        </Form.Group>
        <Form.Group className="mb-4" controlId="password-repeat">
          <Form.Label>Repetir contraseña nueva</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            value={passwords.repeatPassword}
            onChange={changeField('repeatPassword')}
            isInvalid={Boolean(errors.repeatPassword)}
          />
          <Form.Control.Feedback type="invalid">{errors.repeatPassword}</Form.Control.Feedback>
        </Form.Group>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
          Cambiar contraseña
        </Button>
      </Form>
    </section>
  );
}

// Deletes the account after a confirmation. The orders are kept for the restaurant, without the personal data.
function DeleteAccountPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteMyAccount();
    } catch {
      setError('No hemos podido eliminar tu cuenta. Inténtalo de nuevo.');
      setDeleting(false);
      setConfirming(false);
      return;
    }
    // As when logging out (AppNavbar): first the menu, then the session is closed
    await navigate('/', { state: { message: 'Tu cuenta se ha eliminado.' }, flushSync: true });
    await logout();
  }

  return (
    <section aria-labelledby="delete-account-title">
      <h2 id="delete-account-title" className="h4 mb-2">Eliminar cuenta</h2>
      <p className="text-secondary">
        Se borrarán tus datos, tus direcciones y tu foto. No se puede deshacer.
      </p>
      {error && <Alert variant="danger">{error}</Alert>}
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Eliminar cuenta
      </Button>
      <Modal show={confirming} onHide={() => setConfirming(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h4">¿Eliminar tu cuenta?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Se borrarán tus datos, tus direcciones y tu foto, y se cerrará la sesión. Tus pedidos se conservan para
          el restaurante, pero sin tus datos personales.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-ink" onClick={() => setConfirming(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
            Sí, eliminar mi cuenta
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
