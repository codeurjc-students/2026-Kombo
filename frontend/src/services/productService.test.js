import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProducts } from './productService';

describe('productService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the products of the page sent by the REST API', async () => {
    const page = {
      content: [{ id: 1, name: 'Test Burger', price: 5 }],
      page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(page) }));

    const products = await getProducts();

    expect(fetch).toHaveBeenCalledWith('/api/v1/products');
    expect(products).toEqual([{ id: 1, name: 'Test Burger', price: 5 }]);
  });

  it('throws an error when the REST API answers with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(getProducts()).rejects.toThrow('Error fetching products: 500');
  });
});
