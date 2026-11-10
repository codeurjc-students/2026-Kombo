import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProductPage, getProducts, productImageUrl } from './productService';

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

  it('builds the URL of the product image', () => {
    expect(productImageUrl(7)).toBe('/api/v1/products/7/image');
  });
});
