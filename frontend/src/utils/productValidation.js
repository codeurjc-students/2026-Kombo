// Validation of the forms of products and kombos of the administrator. Each function returns an object with a
// message (in Spanish) for each wrong field; an empty object means the form is valid. The server validates again.

// Same limits as the server (ProductRequestDTO and ComboRequestDTO)
const MAX_NAME = 100;
const MAX_DESCRIPTION = 255;
const MAX_PRICE = 99999.99;
const PRICE = /^\d{1,5}([.,]\d{1,2})?$/;
const MAX_INGREDIENT_QUANTITY = 10000;
const MAX_COMBO_UNITS = 20;

// The price is written with a dot or a comma (6,50) and sent as a number
export function parsePrice(text) {
  return Number(text.trim().replace(',', '.'));
}

// Message for a wrong price (written as text), or null when it is valid
export function validatePrice(text) {
  const price = text.trim();
  if (!PRICE.test(price) || parsePrice(price) <= 0 || parsePrice(price) > MAX_PRICE) {
    return 'Escribe un precio mayor que 0, con 2 decimales como máximo (por ejemplo 6,50).';
  }
  return null;
}

function validateCommon(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) {
    errors.name = 'Escribe el nombre.';
  } else if (name.length > MAX_NAME) {
    errors.name = `El nombre tiene como máximo ${MAX_NAME} caracteres.`;
  }
  const priceError = validatePrice(form.price);
  if (priceError) {
    errors.price = priceError;
  }
  if (form.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `La descripción tiene como máximo ${MAX_DESCRIPTION} caracteres.`;
  }
  return errors;
}

function isWholeNumber(value, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= max;
}

// form: { name, price, description, category, ingredients: [{ ingredientId, quantity }] } (values as text)
export function validateProduct(form) {
  const errors = validateCommon(form);
  if (!form.category) {
    errors.category = 'Elige la categoría.';
  }
  const ids = form.ingredients.map((item) => item.ingredientId);
  if (ids.some((id) => !id)) {
    errors.ingredients = 'Elige el ingrediente de cada línea o quita la línea.';
  } else if (new Set(ids).size !== ids.length) {
    errors.ingredients = 'Cada ingrediente aparece una sola vez.';
  } else if (form.ingredients.some((item) => !isWholeNumber(item.quantity, MAX_INGREDIENT_QUANTITY))) {
    errors.ingredients = `La cantidad de cada ingrediente es un número entero de 1 a ${MAX_INGREDIENT_QUANTITY}.`;
  }
  return errors;
}

// form: { name, price, description, products: [{ productId, quantity }] } (values as text)
export function validateCombo(form) {
  const errors = validateCommon(form);
  const ids = form.products.map((item) => item.productId);
  if (ids.length === 0 || ids.some((id) => !id)) {
    errors.products = 'Elige el producto de cada línea.';
  } else if (new Set(ids).size !== ids.length) {
    errors.products = 'Cada producto aparece una sola vez: cambia sus unidades.';
  } else if (form.products.some((item) => !isWholeNumber(item.quantity, MAX_COMBO_UNITS))) {
    errors.products = `Las unidades de cada producto son un número entero de 1 a ${MAX_COMBO_UNITS}.`;
  } else if (form.products.reduce((units, item) => units + Number(item.quantity), 0) < 2) {
    errors.products = 'Un kombo tiene al menos 2 unidades.';
  }
  return errors;
}
