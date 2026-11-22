import { Form } from 'react-bootstrap';
import { adminProductImageUrl } from '../services/productService';
import { IMAGE_TYPES, MAX_PRODUCT_IMAGE_SIZE, validateImageFile } from '../utils/profileValidation';

// Picture of a product or kombo in its form: the current one (if any) and a file to upload when the form is saved.
// JPG, PNG, GIF or WebP of 10 MB at most, checked here and again in the server. onChange receives the file and its
// error (null when it is valid).
export default function ProductPhotoField({ product, error, onChange }) {
  function chooseFile(event) {
    const file = event.target.files[0] ?? null;
    onChange(file, file ? validateImageFile(file, MAX_PRODUCT_IMAGE_SIZE) : null);
  }

  return (
    <Form.Group className="mb-4" controlId="product-photo">
      <Form.Label>Foto</Form.Label>
      {product?.imageId ? (
        <img
          className="admin-product-photo d-block mb-2"
          src={adminProductImageUrl(product.id, product.imageId)}
          alt={`Foto de ${product.name}`}
        />
      ) : (
        <p className="text-secondary small mb-2">Todavía no tiene foto.</p>
      )}
      <Form.Control
        type="file"
        accept={IMAGE_TYPES.join(',')}
        aria-describedby="product-photo-help"
        onChange={chooseFile}
        isInvalid={Boolean(error)}
      />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      <Form.Text id="product-photo-help">
        JPG, PNG, GIF o WebP de 10 MB como máximo. Se guarda al guardar el formulario.
      </Form.Text>
    </Form.Group>
  );
}
