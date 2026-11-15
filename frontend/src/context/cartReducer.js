// Pure logic of the cart, used by CartProvider and tested on its own.
// The cart is a list of { product: { id, name, price }, quantity }.

export const MAX_QUANTITY = 99;

function clampQuantity(quantity) {
  return Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(Number(quantity) || 0)));
}

export function cartReducer(items, action) {
  switch (action.type) {
    case 'add': {
      const { id, name, price } = action.product;
      const quantity = clampQuantity(action.quantity ?? 1);
      if (quantity === 0) {
        return items;
      }
      // Adding a product that is already in the cart adds to its quantity
      if (items.some((item) => item.product.id === id)) {
        return items.map((item) =>
          item.product.id === id ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item,
        );
      }
      return [...items, { product: { id, name, price }, quantity }];
    }
    case 'setQuantity': {
      // A quantity of 0 removes the product
      const quantity = clampQuantity(action.quantity);
      if (quantity === 0) {
        return items.filter((item) => item.product.id !== action.productId);
      }
      return items.map((item) => (item.product.id === action.productId ? { ...item, quantity } : item));
    }
    case 'remove':
      return items.filter((item) => item.product.id !== action.productId);
    case 'clear':
      return [];
    default:
      throw new Error(`Unknown cart action: ${action.type}`);
  }
}

export function cartCount(items) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

// Sum of price × quantity, rounded to cents (prices are numbers with two decimals)
export function cartSubtotal(items) {
  const cents = items.reduce((total, item) => total + Math.round(Number(item.product.price) * 100) * item.quantity, 0);
  return cents / 100;
}
