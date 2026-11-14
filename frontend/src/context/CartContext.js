import { createContext, useContext } from 'react';

// Cart shared by the whole application: { items, count, addItem }
export const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
}
