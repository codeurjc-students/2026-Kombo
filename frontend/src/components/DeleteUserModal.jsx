import { useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { deleteUser } from '../services/userService';

// Confirmation before deleting a user. Their orders are kept for the sales, without the personal data.
export default function DeleteUserModal({ user, onCancel, onDeleted, onError }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteUser(user.id);
    } catch {
      onError(user);
      return;
    }
    onDeleted(user);
  }

  return (
    <Modal show onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h4">
          ¿Borrar a {user.name} {user.surname}?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Se borrarán sus datos, sus direcciones y su foto. Sus pedidos se conservan para el restaurante, pero sin sus
        datos personales. No se puede deshacer.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-ink" onClick={onCancel} disabled={deleting}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={deleting}>
          {deleting && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
          Sí, borrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
