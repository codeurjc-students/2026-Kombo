import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PRODUCT_CATEGORIES,
  adminProductImageUrl,
  createCombo,
  createProduct,
  getAdminProduct,
  getAdminProducts,
  getIngredients,
  getProduct,
  getProductPage,
  getProducts,
  productImageUrl,
  setProductActive,
  updateCombo,
  updateProduct,
  uploadProductImage,
} from './productService';

const page = {
  content: [{ id: 1, name: 'Test Burger', price: 5 }],
  page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
};

function mockFetch(response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

describe('productService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the products of the page sent by the REST API', async () => {
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve(page) });

    const products = await getProducts();

    expect(fetch).toHaveBeenCalledWith('/api/v1/products', expect.objectContaining({ credentials: 'include' }));
    expect(products).toEqual([{ id: 1, name: 'Test Burger', price: 5 }]);
  });

  it('asks for a page of a category', async () => {
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve(page) });

    await getProductPage({ category: 'Drinks', page: 1, size: 12 });

    expect(fetch.mock.calls[0][0]).toBe('/api/v1/products?page=1&size=12&category=Drinks');
  });

  it('throws an error when the REST API answers with an error', async () => {
    mockFetch({ ok: false, status: 500, json: () => Promise.resolve({}) });

    await expect(getProducts()).rejects.toThrow('Error 500');
  });

  it('returns the detail of a product', async () => {
    const detail = { id: 7, name: 'Test Menu', combo: true, ingredients: [], products: [] };
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve(detail) });

    expect(await getProduct(7)).toEqual(detail);
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/products/7');
  });

  it('builds the URL of the product image', () => {
    expect(productImageUrl(7)).toBe('/api/v1/products/7/image');
  });

  it('calls the endpoints of the management of products and kombos', async () => {
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve(page) });
    const product = { name: 'Hamburguesa', price: 5, category: 'Burgers', ingredients: [] };
    const combo = { name: 'Kombo', price: 8, products: [] };
    const file = new File(['x'], 'photo.png', { type: 'image/png' });

    await getAdminProducts({ page: 1, active: true, combo: false });
    await getAdminProduct(3);
    await createProduct(product);
    await updateProduct(3, product);
    await createCombo(combo);
    await updateCombo(4, combo);
    await setProductActive(3, false);
    await uploadProductImage(3, file);
    expect(await getIngredients()).toEqual(page.content);

    const calls = fetch.mock.calls.map(([url, options]) => [url, options.method]);
    expect(calls).toEqual([
      ['/api/v1/admin/products?page=1&size=12&active=true&combo=false', 'GET'],
      ['/api/v1/admin/products/3', 'GET'],
      ['/api/v1/admin/products', 'POST'],
      ['/api/v1/admin/products/3', 'PUT'],
      ['/api/v1/admin/combos', 'POST'],
      ['/api/v1/admin/combos/4', 'PUT'],
      ['/api/v1/admin/products/3', 'PATCH'],
      ['/api/v1/admin/products/3/image', 'PUT'],
      ['/api/v1/admin/ingredients?size=100', 'GET'],
    ]);
    expect(JSON.parse(fetch.mock.calls[6][1].body)).toEqual({ active: false });
    expect(fetch.mock.calls[7][1].body.get('image')).toBe(file);
  });

  it('builds the URL of the picture for the administrator and has no kombo category for products', () => {
    expect(adminProductImageUrl(3, 9)).toBe('/api/v1/admin/products/3/image?v=9');
    expect(PRODUCT_CATEGORIES.map((category) => category.value)).toEqual(['Burgers', 'Sides', 'Drinks', 'Desserts']);
  });
});
