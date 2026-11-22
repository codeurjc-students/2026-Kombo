import { apiFetch, apiUrl } from './httpClient';

const PRODUCTS_PATH = '/api/v1/products';

// Categories of the menu, with the text shown to the user
export const CATEGORIES = [
  { value: 'Burgers', label: 'Hamburguesas' },
  { value: 'Combos', label: 'Kombos' },
  { value: 'Sides', label: 'Acompañamientos' },
  { value: 'Drinks', label: 'Bebidas' },
  { value: 'Desserts', label: 'Postres' },
];

// Text shown for each category of the REST API, for example CATEGORY_LABELS.Burgers is 'Hamburguesas'
export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((category) => [category.value, category.label]));

// Returns a page of the menu: { content: [...], page: { size, number, totalElements, totalPages } }
export function getProductPage({ category, page = 0, size = 12 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (category) {
    params.set('category', category);
  }
  return apiFetch(`${PRODUCTS_PATH}?${params}`);
}

// Returns the products of the first page of the menu
export async function getProducts() {
  const page = await apiFetch(PRODUCTS_PATH);
  return page.content;
}

export function getProduct(id) {
  return apiFetch(`${PRODUCTS_PATH}/${id}`);
}

export function productImageUrl(id) {
  return apiUrl(`${PRODUCTS_PATH}/${id}/image`);
}

// Management of the administrator: products and kombos, also the deactivated ones

const ADMIN_PATH = '/api/v1/admin';

// Categories of the products that are not kombos (the kombos always have the category Combos)
export const PRODUCT_CATEGORIES = CATEGORIES.filter((category) => category.value !== 'Combos');

// Filters: active (true or false) and combo (true: only kombos; false: only products). Both optional.
export function getAdminProducts({ page = 0, size = 12, active, combo } = {}) {
  const params = new URLSearchParams({ page, size });
  if (active !== undefined) {
    params.set('active', active);
  }
  if (combo !== undefined) {
    params.set('combo', combo);
  }
  return apiFetch(`${ADMIN_PATH}/products?${params}`);
}

export function getAdminProduct(id) {
  return apiFetch(`${ADMIN_PATH}/products/${id}`);
}

// product: { name, price, description, category, ingredients: [{ ingredientId, quantity }] }
export function createProduct(product) {
  return apiFetch(`${ADMIN_PATH}/products`, { method: 'POST', body: product });
}

export function updateProduct(id, product) {
  return apiFetch(`${ADMIN_PATH}/products/${id}`, { method: 'PUT', body: product });
}

// combo: { name, price, description, products: [{ productId, quantity }] }
export function createCombo(combo) {
  return apiFetch(`${ADMIN_PATH}/combos`, { method: 'POST', body: combo });
}

export function updateCombo(id, combo) {
  return apiFetch(`${ADMIN_PATH}/combos/${id}`, { method: 'PUT', body: combo });
}

// Activates or deactivates a product or a kombo; 409 (ApiError with problem.products) when it is not possible
export function setProductActive(id, active) {
  return apiFetch(`${ADMIN_PATH}/products/${id}`, { method: 'PATCH', body: { active } });
}

// Uploads or replaces the picture of a product or kombo (a File)
export function uploadProductImage(id, file) {
  const form = new FormData();
  form.append('image', file);
  return apiFetch(`${ADMIN_PATH}/products/${id}/image`, { method: 'PUT', body: form });
}

// The picture also of a deactivated product; imageId changes the URL with every new picture
export function adminProductImageUrl(id, imageId) {
  return apiUrl(`${ADMIN_PATH}/products/${id}/image?v=${imageId}`);
}

// Every ingredient, sorted by name, to choose the ingredients of a product
export async function getIngredients() {
  const page = await apiFetch(`${ADMIN_PATH}/ingredients?size=100`);
  return page.content;
}
