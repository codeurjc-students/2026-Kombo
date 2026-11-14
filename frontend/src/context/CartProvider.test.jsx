import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCart } from './CartContext';
import CartProvider, { CART_STORAGE_KEY } from './CartProvider';

const BURGER = { id: 1, name: 'Test Burger', price: 5, description: 'Not stored in the cart' };
const DRINK = { id: 2, name: 'Test Drink', price: 1.5 };

function Probe() {
  const { items, count, addItem } = useCart();
  return (
    <>
      <p>{count} units</p>
      <ul>
        {items.map((item) => (
          <li key={item.product.id}>
            {item.product.name} x{item.quantity}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => addItem(BURGER)}>burger</button>
      <button type="button" onClick={() => addItem(DRINK, 3)}>drinks</button>
    </>
  );
}

describe('CartProvider', () => {
  it('adds products and sums the units of the same product', () => {
    render(<CartProvider><Probe /></CartProvider>);
    expect(screen.getByText('0 units')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'burger' }));
    fireEvent.click(screen.getByRole('button', { name: 'burger' }));
    fireEvent.click(screen.getByRole('button', { name: 'drinks' }));

    expect(screen.getByText('5 units')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Test Burger x2', 'Test Drink x3']);
  });

  it('keeps the cart in localStorage', () => {
    const { unmount } = render(<CartProvider><Probe /></CartProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'burger' }));
    unmount();

    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))).toEqual([
      { product: { id: 1, name: 'Test Burger', price: 5 }, quantity: 1 },
    ]);
    render(<CartProvider><Probe /></CartProvider>);
    expect(screen.getByText('1 units')).toBeInTheDocument();
  });

  it('starts empty when the stored cart is not valid', () => {
    localStorage.setItem(CART_STORAGE_KEY, 'not json');

    render(<CartProvider><Probe /></CartProvider>);

    expect(screen.getByText('0 units')).toBeInTheDocument();
  });
});
