import { useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Link, Navigate, useParams } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import ProductFormFields from '../components/ProductFormFields';
import ProductPhotoField from '../components/ProductPhotoField';
import useSaveProduct from '../hooks/useSaveProduct';
import { ApiError } from '../services/httpClient';
import { createCombo, getAdminProduct, getAdminProducts, updateCombo } from '../services/productService';
import { formatPrice } from '../utils/format';
import { parsePrice, validateCombo } from '../utils/productValidation';
import NotFoundPage from './NotFoundPage';

// New kombo (/admin/combos/new) or change of a kombo (/admin/combos/:id) by the administrator: its data, its
// products with their units (only active products that are not kombos) and its picture. The administrator writes
// the price; the sum of the prices of its products is shown as a reference.
export default function ComboFormPage() {
  const { id } = useParams();
  const [state, setState] = useState({ key: null, combo: null, products: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const key = `${id}-${attempt}`;

  useEffect(() => {
    let cancelled = false;
    Promise.all([id ? getAdminProduct(id) : null, getAdminProducts({ active: true, combo: false, size: 100 })])
      .then(([combo, page]) => !cancelled && setState({ key, combo, products: page.content, error: null }))
      .catch((error) => !cancelled && setState({ key, combo: null, products: null, error }));
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  if (state.key !== key) {
    return <LoadingState label="Cargando…" />;
  }
  if (state.error instanceof ApiError && state.error.status === 404) {
    return <NotFoundPage />;
  }
  if (state.error) {
    return <ErrorState message="No hemos podido cargar el kombo." onRetry={() => setAttempt((n) => n + 1)} />;
  }
  // A product that is not a kombo is changed in its own form
  if (state.combo && !state.combo.combo) {
    return <Navigate to={`/admin/products/${state.combo.id}`} replace />;
  }
  return <ComboForm key={key} combo={state.combo} products={state.products} />;
}

function formOf(combo) {
  return {
    name: combo?.name ?? '',
    price: combo ? Number(combo.price).toFixed(2).replace('.', ',') : '',
    description: combo?.description ?? '',
    products: (combo?.products ?? []).map((item) => ({
      productId: String(item.product.id),
      quantity: String(item.quantity),
    })),
  };
}

function ComboForm({ combo, products }) {
  const [form, setForm] = useState(() => formOf(combo));
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const { save, saving, error } = useSaveProduct((savedId) => `/admin/combos/${savedId}`);
  // The products of the kombo are offered even if one was deactivated meanwhile (the server would reject it)
  const options = [
    ...products,
    ...(combo?.products ?? [])
      .map((item) => item.product)
      .filter((product) => !products.some((option) => option.id === product.id)),
  ];
  const prices = Object.fromEntries(options.map((product) => [String(product.id), Number(product.price)]));
  const sum = form.products.reduce(
    (total, item) => total + (prices[item.productId] ?? 0) * (Number(item.quantity) || 0),
    0,
  );

  function changeField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function changeProduct(index, field, value) {
    setForm((current) => ({
      ...current,
      products: current.products.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addProduct() {
    setForm((current) => ({ ...current, products: [...current.products, { productId: '', quantity: '1' }] }));
  }

  function removeProduct(index) {
    setForm((current) => ({ ...current, products: current.products.filter((_, i) => i !== index) }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateCombo(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0 || fileError) {
      return;
    }
    const request = {
      name: form.name.trim(),
      price: parsePrice(form.price),
      description: form.description.trim(),
      products: form.products.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) })),
    };
    save(() => (combo ? updateCombo(combo.id, request) : createCombo(request)), file);
  }

  const title = combo ? `Modificar ${combo.name}` : 'Nuevo kombo';
  return (
    <section className="panel" aria-labelledby="combo-form-title">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 id="combo-form-title" className="page-title mb-0">{title}</h1>
        <Button as={Link} to="/admin/products" variant="outline-ink">
          Volver a productos
        </Button>
      </div>
      {combo && !combo.active && <Alert variant="secondary">Este kombo está desactivado: no sale en la carta.</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form noValidate onSubmit={handleSubmit} aria-labelledby="combo-form-title">
        <ProductFormFields form={form} errors={errors} onChange={changeField} />
        <fieldset className="mb-4">
          <legend className="form-label fs-6 mb-2">Productos del kombo</legend>
          {form.products.length === 0 && <p className="text-secondary small mb-2">Añade al menos 2 unidades.</p>}
          {form.products.map((item, index) => (
            <div key={index} className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <Form.Select
                className="w-auto flex-grow-1"
                aria-label={`Producto ${index + 1}`}
                value={item.productId}
                onChange={(event) => changeProduct(index, 'productId', event.target.value)}
              >
                <option value="">Elige un producto</option>
                {options.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({formatPrice(product.price)})
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                className="quantity-input"
                type="number"
                min={1}
                aria-label={`Unidades del producto ${index + 1}`}
                value={item.quantity}
                onChange={(event) => changeProduct(index, 'quantity', event.target.value)}
              />
              <Button variant="outline-ink" size="sm" onClick={() => removeProduct(index)}>
                Quitar
              </Button>
            </div>
          ))}
          {errors.products && <p className="text-danger small mb-2">{errors.products}</p>}
          <Button variant="outline-ink" size="sm" onClick={addProduct}>
            Añadir producto
          </Button>
          <p className="small text-secondary mt-2 mb-0">
            Suma de los productos por separado: <strong>{formatPrice(sum)}</strong>
          </p>
        </fieldset>
        <ProductPhotoField
          product={combo}
          error={fileError}
          onChange={(chosen, chosenError) => {
            setFile(chosen);
            setFileError(chosenError);
          }}
        />
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
          Guardar
        </Button>
      </Form>
    </section>
  );
}
