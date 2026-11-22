import { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../services/httpClient';
import { createUser } from '../services/userService';
import { ROLE_LABELS } from '../utils/format';
import { validateNewUser } from '../utils/profileValidation';

const EMPTY_USER = { name: '', surname: '', email: '', phone: '', password: '', repeatPassword: '', role: 'EMPLOYEE' };

// The administrator creates an employee or a customer and gives them their first password; the user can change it
// later in their profile settings. There is only one administrator, so that role cannot be chosen.
export default function NewUserPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(EMPTY_USER);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function changeField(field) {
    return (event) => setUser((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateNewUser(user);
    setErrors(formErrors);
    setError(null);
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const created = await createUser({
        name: user.name.trim(),
        surname: user.surname.trim(),
        email: user.email.trim(),
        phone: user.phone.trim(),
        password: user.password,
        role: user.role,
      });
      const role = ROLE_LABELS[created.role].toLowerCase();
      await navigate('/admin/users', { state: { message: `Se ha creado el ${role} ${created.name}.` } });
    } catch (err) {
      setError(createErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="new-user-title">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 id="new-user-title" className="page-title mb-0">Nuevo usuario</h1>
        <Button as={Link} to="/admin/users" variant="outline-ink">
          Volver a usuarios
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form noValidate onSubmit={handleSubmit} aria-labelledby="new-user-title">
        <Form.Group className="mb-3" controlId="new-user-role">
          <Form.Label>Rol</Form.Label>
          <Form.Select value={user.role} onChange={changeField('role')}>
            <option value="EMPLOYEE">{ROLE_LABELS.EMPLOYEE}</option>
            <option value="CUSTOMER">{ROLE_LABELS.CUSTOMER}</option>
          </Form.Select>
        </Form.Group>
        <TextField id="new-user-name" label="Nombre" value={user.name} onChange={changeField('name')}
          error={errors.name} autoComplete="off" />
        <TextField id="new-user-surname" label="Apellidos" optional value={user.surname}
          onChange={changeField('surname')} error={errors.surname} autoComplete="off" />
        <TextField id="new-user-email" label="Correo electrónico" type="email" value={user.email}
          onChange={changeField('email')} error={errors.email} autoComplete="off" />
        <TextField id="new-user-phone" label="Teléfono" type="tel" optional value={user.phone}
          onChange={changeField('phone')} error={errors.phone} autoComplete="off" />
        <TextField id="new-user-password" label="Contraseña" type="password" value={user.password}
          onChange={changeField('password')} error={errors.password} autoComplete="new-password" />
        <TextField id="new-user-repeat-password" label="Repite la contraseña" type="password"
          value={user.repeatPassword} onChange={changeField('repeatPassword')} error={errors.repeatPassword}
          autoComplete="new-password" />
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
          Crear usuario
        </Button>
      </Form>
    </section>
  );
}

function TextField({ id, label, optional = false, error, ...input }) {
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>
        {label} {optional && <span className="text-secondary small">(opcional)</span>}
      </Form.Label>
      <Form.Control {...input} isInvalid={Boolean(error)} />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}

function createErrorMessage(error) {
  if (error instanceof ApiError && error.status === 409) {
    return 'Ya existe una cuenta con ese correo electrónico.';
  }
  if (error instanceof ApiError && error.status === 400) {
    return 'Revisa los datos del formulario: hay algún campo que no es válido.';
  }
  return 'No hemos podido crear el usuario. Inténtalo de nuevo.';
}
