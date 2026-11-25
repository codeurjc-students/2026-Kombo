// @vitest-environment node
// Node.js environment (not jsdom): its fetch only accepts its own FormData and File for the uploads
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startCustomerSession, startSession } from '../test-session';
import { ApiError } from './httpClient';
import {
  adminProductImageUrl,
  createCombo,
  createProduct,
  getAdminProduct,
  getAdminProducts,
  getIngredients,
  getProduct,
  setProductActive,
  updateCombo,
  uploadProductImage,
} from './productService';

// Integration test: real service and real REST API (backend running with the sample data), logged in as the
// administrator. Products are never deleted, so everything created here is left deactivated at the end: the menu of
// the other tests (the sample products) does not change. Each run uses new names.
describe('productService for the management of products with the real REST API', () => {
  const created = [];

  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  afterEach(async () => {
    // Kombos first: a product in an active kombo cannot be deactivated
    for (const product of created.reverse()) {
      await setProductActive(product.id, false).catch(() => null);
    }
    created.length = 0;
    vi.unstubAllGlobals();
  });

  async function newProduct(name, category = 'Burgers', ingredients = []) {
    const product = await createProduct({ name, price: 5, description: '', category, ingredients });
    created.push(product);
    return product;
  }

  it('creates a product with an ingredient and a picture of more than 1 MB', async () => {
    await startSession('admin@kombo.com', 'admin');
    const [ingredient] = await getIngredients();

    const product = await newProduct(`Hamburguesa test ${Date.now()}`, 'Burgers', [
      { ingredientId: ingredient.id, quantity: 2 },
    ]);
    expect(product).toMatchObject({ active: true, combo: false, ingredients: [{ id: ingredient.id, quantity: 2 }] });

    const picture = new Uint8Array(2 * 1024 * 1024);
    picture.set([0xff, 0xd8, 0xff]);
    const withPicture = await uploadProductImage(product.id, new File([picture], 'photo.jpg', { type: 'image/jpeg' }));
    const response = await fetch(adminProductImageUrl(product.id, withPicture.imageId));
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect((await getProduct(product.id)).name).toBe(product.name);
  });

  it('creates and changes a kombo, which keeps its products from being deactivated', async () => {
    await startSession('admin@kombo.com', 'admin');
    const burger = await newProduct(`Hamburguesa test ${Date.now()}`);
    const drink = await newProduct(`Bebida test ${Date.now()}`, 'Drinks');
    const combo = await createCombo({
      name: `Kombo test ${Date.now()}`,
      price: 8,
      description: '',
      products: [
        { productId: burger.id, quantity: 1 },
        { productId: drink.id, quantity: 1 },
      ],
    });
    created.push(combo);
    expect(combo).toMatchObject({ combo: true, category: 'Combos' });
    const changed = await updateCombo(combo.id, {
      name: combo.name,
      price: 7,
      products: [{ productId: burger.id, quantity: 2 }],
    });
    expect(changed.products).toEqual([{ product: expect.objectContaining({ id: burger.id }), quantity: 2 }]);

    const error = await setProductActive(burger.id, false).catch((err) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.problem.products).toEqual([{ id: combo.id, name: combo.name }]);

    await setProductActive(combo.id, false);
    expect((await setProductActive(burger.id, false)).active).toBe(false);
    expect((await getProduct(burger.id).catch((err) => err)).status).toBe(404);
    const inactive = await getAdminProducts({ active: false, size: 100 });
    expect(inactive.content.map((product) => product.id)).toContain(burger.id);
  });

  it('removes a product from its kombo with a new price, as the window of the products page does', async () => {
    await startSession('admin@kombo.com', 'admin');
    const sauce = await newProduct(`Salsa test ${Date.now()}`, 'Sides');
    const drink = await newProduct(`Bebida test ${Date.now()}`, 'Drinks');
    const combo = await createCombo({
      name: `Kombo test ${Date.now()}`,
      price: 4,
      description: '',
      products: [
        { productId: sauce.id, quantity: 1 },
        { productId: drink.id, quantity: 2 },
      ],
    });
    created.push(combo);
    const kombo = await getAdminProduct(combo.id);

    const changed = await updateCombo(kombo.id, {
      name: kombo.name,
      price: 3.5,
      description: kombo.description ?? '',
      products: kombo.products
        .filter((item) => item.product.id !== sauce.id)
        .map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    });

    expect(changed).toMatchObject({ price: 3.5, products: [{ product: expect.objectContaining({ id: drink.id }) }] });
    expect((await setProductActive(sauce.id, false)).active).toBe(false);
  });

  it('is only for the administrator', async () => {
    await startCustomerSession('client-products');

    const error = await getAdminProducts().catch((err) => err);

    expect(error.status).toBe(403);
  });
});
