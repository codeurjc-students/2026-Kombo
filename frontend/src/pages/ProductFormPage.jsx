import { useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Link, Navigate, useParams } from 'react-router';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import ProductFormFields from '../components/ProductFormFields';
import ProductPhotoField from '../components/ProductPhotoField';
import SearchableSelect from '../components/SearchableSelect';
import useSaveProduct from '../hooks/useSaveProduct';
import { ApiError } from '../services/httpClient';
import {
  PRODUCT_CATEGORIES,
  createProduct,
  getAdminProduct,
  getIngredients,
  updateProduct,
} from '../services/productService';
import { parsePrice, validateProduct } from '../utils/productValidation';
import NotFoundPage from './NotFoundPage';

// New product (/admin/products/new) or change of a product (/admin/products/:id) by the administrator: its data,
// its ingredients with their quantities (chosen from the existing ingredients) and its picture
export default function ProductFormPage() {
  const { id } = useParams();
  const [state, setState] = useState({ key: null, product: null, ingredients: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const key = `${id}-${attempt}`;

  useEffect(() => {
    let cancelled = false;
    Promise.all([id ? getAdminProduct(id) : null, getIngredients()])
      .then(([product, ingredients]) => !cancelled && setState({ key, product, ingredients, error: null }))
      .catch((error) => !cancelled && setState({ key, product: null, ingredients: null, error }));
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
    return <ErrorState message="No hemos podido cargar el producto." onRetry={() => setAttempt((n) => n + 1)} />;
  }
  // A kombo is changed in its own form
  if (state.product?.combo) {
    return <Navigate to={`/admin/combos/${state.product.id}`} replace />;
  }
  return <ProductForm key={key} product={state.product} ingredients={state.ingredients} />;
}

function formOf(product) {
  return {
    name: product?.name ?? '',
    price: product ? Number(product.price).toFixed(2).replace('.', ',') : '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    ingredients: (product?.ingredients ?? []).map((item) => ({
      ingredientId: String(item.id),
      quantity: String(item.quantity),
    })),
  };
}

function ProductForm({ product, ingredients }) {
  const [form, setForm] = useState(() => formOf(product));
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const { save, saving, error } = useSaveProduct((savedId) => `/admin/products/${savedId}`);
  const units = Object.fromEntries(ingredients.map((ingredient) => [String(ingredient.id), ingredient.unit]));
  const ingredientOptions = ingredients.map((ingredient) => ({ value: ingredient.id, label: ingredient.name }));

  function changeField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function changeIngredient(index, field, value) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addIngredient() {
    setForm((current) => ({ ...current, ingredients: [...current.ingredients, { ingredientId: '', quantity: '1' }] }));
  }

  function removeIngredient(index) {
    setForm((current) => ({ ...current, ingredients: current.ingredients.filter((_, i) => i !== index) }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const formErrors = validateProduct(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0 || fileError) {
      return;
    }
    const request = {
      name: form.name.trim(),
      price: parsePrice(form.price),
      description: form.description.trim(),
      category: form.category,
      ingredients: form.ingredients.map((item) => ({
        ingredientId: Number(item.ingredientId),
        quantity: Number(item.quantity),
      })),
    };
    save(() => (product ? updateProduct(product.id, request) : createProduct(request)), file);
  }

  const title = product ? `Modificar ${product.name}` : 'Nuevo producto';
  return (
    <section className="panel" aria-labelledby="product-form-title">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 id="product-form-title" className="page-title mb-0">{title}</h1>
        <Button as={Link} to="/admin/products" variant="outline-ink">
          Volver a productos
        </Button>
      </div>
      {product && !product.active && (
        <Alert variant="secondary">Este producto está desactivado: no sale en la carta.</Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form noValidate onSubmit={handleSubmit} aria-labelledby="product-form-title">
        <ProductFormFields form={form} errors={errors} onChange={changeField} />
        <Form.Group className="mb-3" controlId="product-category">
          <Form.Label>Categoría</Form.Label>
          <Form.Select value={form.category} onChange={changeField('category')} isInvalid={Boolean(errors.category)}>
            <option value="">Elige una categoría</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
        </Form.Group>
        <fieldset className="mb-4">
          <legend className="form-label fs-6 mb-2">Ingredientes</legend>
          {form.ingredients.length === 0 && <p className="text-secondary small mb-2">Sin ingredientes.</p>}
          {form.ingredients.map((item, index) => (
            <div key={index} className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <SearchableSelect
                className="flex-grow-1"
                ariaLabel={`Ingrediente ${index + 1}`}
                placeholder="Elige o escribe un ingrediente"
                options={ingredientOptions}
                value={item.ingredientId}
                onChange={(ingredientId) => changeIngredient(index, 'ingredientId', ingredientId)}
              />
              <Form.Control
                className="quantity-input"
                type="number"
                min={1}
                aria-label={`Cantidad del ingrediente ${index + 1}`}
                value={item.quantity}
                onChange={(event) => changeIngredient(index, 'quantity', event.target.value)}
              />
              <span className="text-secondary small unit-label">{units[item.ingredientId] ?? ''}</span>
              <Button variant="outline-ink" size="sm" onClick={() => removeIngredient(index)}>
                Quitar
              </Button>
            </div>
          ))}
          {errors.ingredients && <p className="text-danger small mb-2">{errors.ingredients}</p>}
          <Button variant="outline-ink" size="sm" onClick={addIngredient}>
            Añadir ingrediente
          </Button>
        </fieldset>
        <ProductPhotoField
          product={product}
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
