const PRODUCTS_PATH = '/api/v1/products';

// Returns the products of the first page of the menu.
// The REST API answers with a page: { content: [...], page: { size, number, totalElements, totalPages } }
export async function getProducts() {
  // Empty in the browser (Vite's proxy forwards /api to the backend).
  // Tests set VITE_API_URL to call the backend directly.
  const baseUrl = import.meta.env.VITE_API_URL ?? '';
  const response = await fetch(`${baseUrl}${PRODUCTS_PATH}`);
  if (!response.ok) {
    throw new Error(`Error fetching products: ${response.status}`);
  }
  const page = await response.json();
  return page.content;
}
