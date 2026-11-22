import { Form, InputGroup } from 'react-bootstrap';

// Fields shared by the forms of products and kombos: name, price and description. form has the values as text.
export default function ProductFormFields({ form, errors, onChange }) {
  return (
    <>
      <Form.Group className="mb-3" controlId="product-name">
        <Form.Label>Nombre</Form.Label>
        <Form.Control value={form.name} onChange={onChange('name')} isInvalid={Boolean(errors.name)} />
        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3" controlId="product-price">
        <Form.Label>Precio</Form.Label>
        <InputGroup hasValidation>
          <Form.Control
            inputMode="decimal"
            value={form.price}
            onChange={onChange('price')}
            isInvalid={Boolean(errors.price)}
          />
          <InputGroup.Text>€</InputGroup.Text>
          <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
        </InputGroup>
      </Form.Group>
      <Form.Group className="mb-3" controlId="product-description">
        <Form.Label>
          Descripción <span className="text-secondary small">(opcional)</span>
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.description}
          onChange={onChange('description')}
          isInvalid={Boolean(errors.description)}
        />
        <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
      </Form.Group>
    </>
  );
}
