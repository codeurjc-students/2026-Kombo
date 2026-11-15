import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCart } from './CartContext';
import CartProvider, { CART_STORAGE_KEY } from './CartProvider';

const BURGER = { id: 1, name: 'Test Burger', price: 5, description: 'Not stored in the cart' };
const DRINK = { id: 2, name: 'Test Drink', price: 1.5 };

function Probe() {
  const { items, count, subtotal, addItem, updateQuantity, removeItem, clearCart } = useCart();
  return (
    <>
      <p>{count} units</p>
      <p>{subtotal} euros</p>
      <ul>
        {items.map((item) => (
          <li key={item.product.id}>
            {item.product.name} x{item.quantity}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => addItem(BURGER)}>burger</button>
      <button type="button" onClick={() => addItem(DRINK, 3)}>drinks</button>
      <button type="button" onClick={() => updateQuantity(1, 4)}>four burgers</button>
      <button type="button" onClick={() => removeItem(2)}>remove drinks</button>
      <button type="button" onClick={clearCart}>clear</button>
    </>
  );
}

function renderCart() {
  return render(<CartProvider><Probe /></CartProvider>);
}

function cartLines() {
  return screen.queryAllByRole('listitem').map((item) => item.textContent);
}

describe('CartProvider', () => {
  it('adds products and sums the units of the same product', () => {
    renderCart();
    expect(screen.getByText('0 units')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'burger' }));
    fireEvent.click(screen.getByRole('button', { name: 'burger' }));
    fireEvent.click(screen.getByRole('button', { name: 'drinks' }));

    expect(screen.getByText('5 units')).toBeInTheDocument();
    expect(screen.getByText('14.5 euros')).toBeInTheDocument();
    expect(cartLines()).toEqual(['Test Burger x2', 'Test Drink x3']);
  });

  it('changes quantities, removes products and empties the cart', () => {
    renderCart();
    fireEvent.click(screen.getByRole('button', { name: 'burger' }));
    fireEvent.click(screen.getByRole('button', { name: 'drinks' }));

    fireEvent.click(screen.getByRole('button', { name: 'four burgers' }));
    expect(cartLines()).toEqual(['Test Burger x4', 'Test Drink x3']);

    fireEvent.click(screen.getByRole('button', { name: 'remove drinks' }));
    expect(cartLines()).toEqual(['Test Burger x4']);
    expect(screen.getByText('20 euros')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(cartLines()).toEqual([]);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))).toEqual([]);
  });

  it('keeps the cart in localStorage, so it survives a reload', () => {
    const { unmount } = renderCart();
    fireEvent.click(screen.getByRole('button', { name: 'burger' }));
    fireEvent.click(screen.getByRole('button', { name: 'four burgers' }));
    unmount();

    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))).toEqual([
      { product: { id: 1, name: 'Test Burger', price: 5 }, quantity: 4 },
    ]);
    renderCart();
    expect(screen.getByText('4 units')).toBeInTheDocument();
  });

  it('starts empty when the stored cart is not valid and skips wrong items', () => {
    localStorage.setItem(CART_STORAGE_KEY, 'not json');
    const { unmount } = renderCart();
    expect(screen.getByText('0 units')).toBeInTheDocument();
    unmount();

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ product: { id: 2, name: 'Test Drink', price: 1.5 }, quantity: 2 }, { quantity: 3 }, null]),
    );
    renderCart();
    expect(cartLines()).toEqual(['Test Drink x2']);
  });

  it('fails when used outside the provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<Probe />)).toThrow('useCart must be used inside a CartProvider');
    console.error = consoleError;
  });
});
