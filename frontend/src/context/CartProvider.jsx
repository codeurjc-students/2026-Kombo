import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './CartContext';

// The cart is kept in the browser (localStorage), so anonymous users also have one and it is not lost
// when the page is reloaded. Each item is { product: { id, name, price }, quantity }.
export const CART_STORAGE_KEY = 'kombo.cart';

function readStoredItems() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredItems);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be full or disabled; the cart still works until the page is closed
    }
  }, [items]);

  // Adding a product that is already in the cart adds to its quantity
  const addItem = useCallback((product, quantity = 1) => {
    const { id, name, price } = product;
    setItems((current) => {
      const existing = current.find((item) => item.product.id === id);
      if (existing) {
        return current.map((item) =>
          item.product.id === id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [...current, { product: { id, name, price }, quantity }];
    });
  }, []);

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const value = useMemo(() => ({ items, count, addItem }), [items, count, addItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
