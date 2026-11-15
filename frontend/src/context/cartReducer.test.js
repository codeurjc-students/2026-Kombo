import { describe, expect, it } from 'vitest';
import { MAX_QUANTITY, cartCount, cartReducer, cartSubtotal } from './cartReducer';

const BURGER = { id: 1, name: 'Test Burger', price: 8.5, description: 'Not stored' };
const DRINK = { id: 2, name: 'Test Drink', price: 2.2 };

function cartWith(...actions) {
  return actions.reduce(cartReducer, []);
}

describe('cartReducer', () => {
  it('adds products, keeping only the data the cart needs', () => {
    const items = cartWith({ type: 'add', product: BURGER }, { type: 'add', product: DRINK, quantity: 3 });

    expect(items).toEqual([
      { product: { id: 1, name: 'Test Burger', price: 8.5 }, quantity: 1 },
      { product: { id: 2, name: 'Test Drink', price: 2.2 }, quantity: 3 },
    ]);
  });

  it('adds to the quantity of a product that is already in the cart, up to the maximum', () => {
    expect(cartWith({ type: 'add', product: BURGER }, { type: 'add', product: BURGER, quantity: 2 })[0].quantity).toBe(3);
    expect(cartWith({ type: 'add', product: BURGER, quantity: 98 }, { type: 'add', product: BURGER, quantity: 5 })[0].quantity)
      .toBe(MAX_QUANTITY);
  });

  it('changes the quantity of a product and removes it when the quantity is 0', () => {
    const items = cartWith({ type: 'add', product: BURGER }, { type: 'add', product: DRINK });

    expect(cartReducer(items, { type: 'setQuantity', productId: 1, quantity: 4 })[0].quantity).toBe(4);
    expect(cartReducer(items, { type: 'setQuantity', productId: 1, quantity: 0 }).map((item) => item.product.id)).toEqual([2]);
    expect(cartReducer(items, { type: 'setQuantity', productId: 1, quantity: 500 })[0].quantity).toBe(MAX_QUANTITY);
  });

  it('removes a product and empties the cart', () => {
    const items = cartWith({ type: 'add', product: BURGER }, { type: 'add', product: DRINK });

    expect(cartReducer(items, { type: 'remove', productId: 2 }).map((item) => item.product.id)).toEqual([1]);
    expect(cartReducer(items, { type: 'clear' })).toEqual([]);
  });

  it('ignores adding no units and rejects unknown actions', () => {
    expect(cartWith({ type: 'add', product: BURGER, quantity: 0 })).toEqual([]);
    expect(() => cartReducer([], { type: 'unknown' })).toThrow('Unknown cart action');
  });

  it('counts the units and sums the prices without rounding errors', () => {
    const items = cartWith({ type: 'add', product: BURGER, quantity: 2 }, { type: 'add', product: DRINK, quantity: 3 });

    expect(cartCount(items)).toBe(5);
    // 2 × 8.50 + 3 × 2.20 = 23.60 (with floating point numbers, 3 × 2.2 is 6.6000000000000005)
    expect(cartSubtotal(items)).toBe(23.6);
    expect(cartSubtotal([])).toBe(0);
  });
});
