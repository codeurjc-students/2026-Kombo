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
