const PRODUCTS_URL = '/api/v1/products';

export async function getProducts() {
  const response = await fetch(PRODUCTS_URL);
  if (!response.ok) {
    throw new Error(`Error fetching products: ${response.status}`);
  }
  return response.json();
}