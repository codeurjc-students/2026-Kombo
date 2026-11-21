import { useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner, Tab, Tabs } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
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
import {
  IMAGE_TYPES,
  validateAddress,
  validateImageFile,
  validatePasswordChange,
  validateProfile,
} from '../utils/profileValidation';

// Settings of the account of the logged in user. Each section is saved on its own, so changing one thing
// does not require filling in the others; "Volver al perfil" leaves without saving anything.
// Only customers keep addresses, and the account of the administrator cannot be deleted.
// A header with the picture, the name and the email, and a tab for each group of settings. A tab is rendered
// the first time it is opened and then kept, so moving between tabs does not lose what was written.
export default function ProfileSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="profile-settings">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <h1 className="page-title mb-0">Configuración</h1>
        <Button as={Link} to="/profile" variant="outline-ink">
          Volver al perfil
        </Button>
      </div>
      <section className="panel" aria-label="Tu cuenta">
        <div className="settings-header settings-avatar">
          <UserAvatar user={user} />
          <div>
            <p className="h4 mb-0">
              {user.name} {user.surname}
            </p>
            <p className="text-secondary mb-0">{user.email}</p>
          </div>
        </div>
        <Tabs defaultActiveKey="profile" id="settings-tabs" className="settings-tabs" mountOnEnter>
          <Tab eventKey="profile" title="Perfil">
            <PersonalDataForm />
            <hr className="settings-divider" />
            <PictureForm />
          </Tab>
          <Tab eventKey="security" title="Seguridad">
            <PasswordForm />
          </Tab>
          {user.role === 'CUSTOMER' && (
            <Tab eventKey="addresses" title="Direcciones">
              <AddressesForm />
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

function profileOf(user) {
  return { name: user.name, surname: user.surname ?? '', phone: user.phone ?? '' };
}

// Name, surname and phone. The email is shown but cannot be changed (it is used to log in).
function PersonalDataForm() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(() => profileOf(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const changed = JSON.stringify(profile) !== JSON.stringify(profileOf(user));

  function changeField(field) {
    return (event) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateProfile(profile);
    setErrors(formErrors);
    setResult(null);
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const saved = await updateMyProfile({
        name: profile.name.trim(),
        surname: profile.surname.trim(),
        phone: profile.phone.trim(),
      });
      setProfile(profileOf(saved));
      await refreshUser();
      setResult({ variant: 'success', text: 'Tus datos se han guardado.' });
    } catch {
      setResult({ variant: 'danger', text: 'No hemos podido guardar tus datos. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="personal-data-title">
      <h2 id="personal-data-title" className="h4 mb-3">Datos personales</h2>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      <Form noValidate onSubmit={handleSubmit} aria-labelledby="personal-data-title">
        <Form.Group className="mb-3" controlId="profile-name">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            autoComplete="given-name"
            value={profile.name}
            onChange={changeField('name')}
            isInvalid={Boolean(errors.name)}
          />
          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3" controlId="profile-surname">
          <Form.Label>
            Apellidos <span className="text-secondary small">(opcional)</span>
          </Form.Label>
          <Form.Control
            autoComplete="family-name"
            value={profile.surname}
            onChange={changeField('surname')}
            isInvalid={Boolean(errors.surname)}
          />
          <Form.Control.Feedback type="invalid">{errors.surname}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3" controlId="profile-email">
          <Form.Label>Correo electrónico</Form.Label>
          <Form.Control type="email" value={user.email} disabled aria-describedby="profile-email-help" />
          <Form.Text id="profile-email-help">El correo electrónico no se puede cambiar.</Form.Text>
        </Form.Group>
        <Form.Group className="mb-4" controlId="profile-phone">
          <Form.Label>
            Teléfono <span className="text-secondary small">(opcional)</span>
          </Form.Label>
          <Form.Control
            type="tel"
            autoComplete="tel"
            value={profile.phone}
            onChange={changeField('phone')}
            isInvalid={Boolean(errors.phone)}
          />
          <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
        </Form.Group>
        <Button type="submit" variant="primary" disabled={!changed || saving}>
          {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
          Guardar datos
        </Button>
      </Form>
    </section>
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

// Profile picture: JPG, PNG, GIF or WebP of 1 MB at most, checked here and again in the server
function PictureForm() {
  const { user, refreshUser } = useAuth();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  function chooseFile(event) {
    const chosen = event.target.files[0] ?? null;
    setFile(chosen);
    setResult(null);
    setError(chosen ? validateImageFile(chosen) : null);
  }

  async function run(action, successText, errorText) {
    setSaving(true);
    setResult(null);
    try {
      await action();
      await refreshUser();
      setFile(null);
      fileInput.current.value = '';
      setResult({ variant: 'success', text: successText });
    } catch (err) {
      const text = err instanceof ApiError && [400, 413].includes(err.status)
        ? 'El archivo no es una imagen válida de 1 MB como máximo.'
        : errorText;
      setResult({ variant: 'danger', text });
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const fileError = validateImageFile(file);
    setError(fileError);
    if (!fileError) {
      run(() => uploadMyImage(file), 'Tu foto se ha guardado.', 'No hemos podido guardar tu foto. Inténtalo de nuevo.');
    }
  }

  function handleDelete() {
    run(deleteMyImage, 'Tu foto se ha quitado.', 'No hemos podido quitar tu foto. Inténtalo de nuevo.');
  }

  return (
    <section aria-labelledby="picture-title">
      <h2 id="picture-title" className="h4 mb-3">Foto de perfil</h2>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      {!user.imageId && <p className="text-secondary small">Todavía no tienes foto.</p>}
      <Form noValidate onSubmit={handleSubmit} aria-labelledby="picture-title">
        <Form.Group className="mb-3" controlId="picture-file">
          <Form.Label>Nueva foto</Form.Label>
          <Form.Control
            ref={fileInput}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            aria-describedby="picture-file-help"
            onChange={chooseFile}
            isInvalid={Boolean(error)}
          />
          <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
          <Form.Text id="picture-file-help">JPG, PNG, GIF o WebP de 1 MB como máximo.</Form.Text>
        </Form.Group>
        <div className="d-flex flex-wrap gap-2">
          <Button type="submit" variant="primary" disabled={!file || saving}>
            {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
            Guardar foto
          </Button>
          {user.imageId && (
            <Button variant="outline-ink" onClick={handleDelete} disabled={saving}>
              Quitar foto
            </Button>
          )}
        </div>
      </Form>
    </section>
  );
}

// Saved addresses of the customer, chosen in the checkout. Each change saves the whole list at once.
function AddressesForm() {
  const { user, refreshUser } = useAuth();
  const addresses = user.addresses ?? [];
  const [newAddress, setNewAddress] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  async function save(list, successText) {
    setSaving(true);
    setResult(null);
    try {
      await updateMyAddresses(list);
      await refreshUser();
      setResult({ variant: 'success', text: successText });
      return true;
    } catch {
      setResult({ variant: 'danger', text: 'No hemos podido guardar tus direcciones. Inténtalo de nuevo.' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    const addressError = validateAddress(newAddress, addresses);
    setError(addressError);
    if (!addressError && (await save([...addresses, newAddress.trim()], 'Dirección añadida.'))) {
      setNewAddress('');
    }
  }

  function handleDelete(address) {
    setError(null);
    save(addresses.filter((saved) => saved !== address), 'Dirección borrada.');
  }

  return (
    <section aria-labelledby="addresses-title">
      <h2 id="addresses-title" className="h4 mb-3">Mis direcciones</h2>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      {addresses.length === 0 ? (
        <p className="text-secondary">No tienes direcciones guardadas.</p>
      ) : (
        <ul className="list-unstyled d-grid gap-2 mb-3" aria-label="Direcciones guardadas">
          {addresses.map((address) => (
            <li key={address} className="d-flex align-items-center justify-content-between gap-2 order-item">
              <span>{address}</span>
              <Button
                variant="outline-ink"
                size="sm"
                onClick={() => handleDelete(address)}
                disabled={saving}
                aria-label={`Borrar ${address}`}
              >
                Borrar
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Form noValidate onSubmit={handleAdd} aria-labelledby="addresses-title">
        <Form.Group className="mb-3" controlId="address-new">
          <Form.Label>Nueva dirección</Form.Label>
          <Form.Control
            autoComplete="street-address"
            value={newAddress}
            onChange={(event) => setNewAddress(event.target.value)}
            isInvalid={Boolean(error)}
          />
          <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        </Form.Group>
        <Button type="submit" variant="primary" disabled={saving}>
          Añadir dirección
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
