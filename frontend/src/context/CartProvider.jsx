import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { CartContext } from './CartContext';
import { cartCount, cartReducer, cartSubtotal } from './cartReducer';

// The cart is kept in the browser (localStorage), so anonymous users also have one and it is not lost
// when the page is reloaded. Each item is { product: { id, name, price }, quantity }.
export const CART_STORAGE_KEY = 'kombo.cart';

function isValidItem(item) {
  return item?.product?.id != null && Number.isInteger(item.quantity) && item.quantity > 0;
}

function readStoredItems() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return Array.isArray(items) ? items.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

export default function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, readStoredItems);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be full or disabled; the cart still works until the page is closed
    }
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => dispatch({ type: 'add', product, quantity }), []);
  const updateQuantity = useCallback(
    (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
    [],
  );
  const removeItem = useCallback((productId) => dispatch({ type: 'remove', productId }), []);
  const clearCart = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
