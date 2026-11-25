import { describe, expect, it } from 'vitest';
import { parsePrice, validateCombo, validatePrice, validateProduct } from './productValidation';

const PRODUCT = { name: 'Hamburguesa', price: '6,50', description: '', category: 'Burgers', ingredients: [] };
const COMBO = { name: 'Kombo', price: '8.90', description: '', products: [{ productId: '1', quantity: '2' }] };

describe('validateProduct', () => {
  it('accepts a product without ingredients and a price with a comma or a dot', () => {
    expect(validateProduct(PRODUCT)).toEqual({});
    expect(validateProduct({ ...PRODUCT, price: '6.5' })).toEqual({});
    expect(parsePrice(' 6,50 ')).toBe(6.5);
  });

  it('asks for the name, a valid price and the category', () => {
    expect(validateProduct({ ...PRODUCT, name: ' ', price: '0', category: '' })).toEqual({
      name: 'Escribe el nombre.',
      price: 'Escribe un precio mayor que 0, con 2 decimales como máximo (por ejemplo 6,50).',
      category: 'Elige la categoría.',
    });
    expect(validateProduct({ ...PRODUCT, price: '6,555' }).price).toBeDefined();
    expect(validateProduct({ ...PRODUCT, price: 'abc' }).price).toBeDefined();
  });

  it('rejects a name or a description that is too long', () => {
    expect(validateProduct({ ...PRODUCT, name: 'a'.repeat(101), description: 'b'.repeat(256) })).toEqual({
      name: 'El nombre tiene como máximo 100 caracteres.',
      description: 'La descripción tiene como máximo 255 caracteres.',
    });
  });

  it('checks the ingredients: chosen, once each and with a whole quantity', () => {
    const ingredient = (ingredientId, quantity = '1') => ({ ingredientId, quantity });

    expect(validateProduct({ ...PRODUCT, ingredients: [ingredient('')] }).ingredients).toBe(
      'Elige el ingrediente de cada línea o quita la línea.',
    );
    expect(validateProduct({ ...PRODUCT, ingredients: [ingredient('1'), ingredient('1')] }).ingredients).toBe(
      'Cada ingrediente aparece una sola vez.',
    );
    expect(validateProduct({ ...PRODUCT, ingredients: [ingredient('1', '1.5')] }).ingredients).toBe(
      'La cantidad de cada ingrediente es un número entero de 1 a 10000.',
    );
    expect(validateProduct({ ...PRODUCT, ingredients: [ingredient('1', '150')] })).toEqual({});
  });
});

describe('validateCombo', () => {
  it('accepts a kombo with 2 units', () => {
    expect(validateCombo(COMBO)).toEqual({});
  });

  it('asks for products, once each, with at least 2 units in total', () => {
    expect(validateCombo({ ...COMBO, products: [] }).products).toBe('Elige el producto de cada línea.');
    expect(validateCombo({ ...COMBO, products: [{ productId: '1', quantity: '1' }] }).products).toBe(
      'Un kombo tiene al menos 2 unidades.',
    );
    expect(
      validateCombo({ ...COMBO, products: [{ productId: '1', quantity: '1' }, { productId: '1', quantity: '1' }] })
        .products,
    ).toBe('Cada producto aparece una sola vez: cambia sus unidades.');
    expect(validateCombo({ ...COMBO, products: [{ productId: '1', quantity: '0' }] }).products).toBe(
      'Las unidades de cada producto son un número entero de 1 a 20.',
    );
  });
});

describe('validatePrice', () => {
  it('accepts a price greater than 0 with at most 2 decimals', () => {
    expect(validatePrice('7,50')).toBeNull();
    expect(validatePrice(' 12 ')).toBeNull();
    expect(validatePrice('0')).toMatch(/mayor que 0/);
    expect(validatePrice('7,505')).toMatch(/2 decimales/);
    expect(validatePrice('')).not.toBeNull();
  });
});
