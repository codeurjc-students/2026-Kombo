import { useRef, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { ApiError } from '../services/httpClient';
import { IMAGE_TYPES, validateAddress, validateImageFile, validateProfile } from '../utils/profileValidation';

// Forms of the account of a user, shared by the profile settings of the logged in user (own) and the user
// management of the administrator. Each one receives the user, the call to the REST API that saves the change and
// onSaved, which reads the user again after saving. own chooses the texts ("tus datos" or "los datos").

function profileOf(user) {
  return { name: user.name, surname: user.surname ?? '', phone: user.phone ?? '' };
}

// Name, surname and phone. The email is shown but cannot be changed (it is used to log in).
// save sends the new data and answers with the saved user.
export function PersonalDataForm({ user, save, onSaved, own = true }) {
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
      const saved = await save({
        name: profile.name.trim(),
        surname: profile.surname.trim(),
        phone: profile.phone.trim(),
      });
      setProfile(profileOf(saved));
      await onSaved();
      setResult({ variant: 'success', text: own ? 'Tus datos se han guardado.' : 'Los datos se han guardado.' });
    } catch {
      const text = own ? 'No hemos podido guardar tus datos.' : 'No hemos podido guardar los datos.';
      setResult({ variant: 'danger', text: `${text} Inténtalo de nuevo.` });
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

// Profile picture: JPG, PNG, GIF or WebP of 1 MB at most, checked here and again in the server.
// upload sends a file and remove deletes the current picture.
export function PictureForm({ user, upload, remove, onSaved, own = true }) {
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
      await onSaved();
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
      run(() => upload(file), own ? 'Tu foto se ha guardado.' : 'La foto se ha guardado.',
        `No hemos podido guardar ${own ? 'tu' : 'la'} foto. Inténtalo de nuevo.`);
    }
  }

  function handleDelete() {
    run(remove, own ? 'Tu foto se ha quitado.' : 'La foto se ha quitado.',
      `No hemos podido quitar ${own ? 'tu' : 'la'} foto. Inténtalo de nuevo.`);
  }

  return (
    <section aria-labelledby="picture-title">
      <h2 id="picture-title" className="h4 mb-3">Foto de perfil</h2>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      {!user.imageId && (
        <p className="text-secondary small">{own ? 'Todavía no tienes foto.' : 'Todavía no tiene foto.'}</p>
      )}
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

// Saved addresses of the customer, chosen in the checkout. Each change saves the whole list at once with save.
export function AddressesForm({ user, save: saveAddresses, onSaved, own = true }) {
  const addresses = user.addresses ?? [];
  const [newAddress, setNewAddress] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  async function save(list, successText) {
    setSaving(true);
    setResult(null);
    try {
      await saveAddresses(list);
      await onSaved();
      setResult({ variant: 'success', text: successText });
      return true;
    } catch {
      const text = `No hemos podido guardar ${own ? 'tus' : 'las'} direcciones. Inténtalo de nuevo.`;
      setResult({ variant: 'danger', text });
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
      <h2 id="addresses-title" className="h4 mb-3">{own ? 'Mis direcciones' : 'Direcciones'}</h2>
      {result && <Alert variant={result.variant}>{result.text}</Alert>}
      {addresses.length === 0 ? (
        <p className="text-secondary">{own ? 'No tienes direcciones guardadas.' : 'No tiene direcciones guardadas.'}</p>
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
