import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';

// "Repetir pedido": adds the products of a past order to the cart, with the same units, and opens the cart.
// The cart keeps the current price of each product (the order line keeps the price paid then); the server
// takes the prices again when the order is placed.
export default function useRepeatOrder() {
  const { addItem } = useCart();
  const navigate = useNavigate();

  return useCallback(
    (order) => {
      order.lines.forEach((line) => addItem(line.product, line.quantity));
      navigate('/cart', { state: { message: `Hemos añadido al carrito los productos del pedido nº ${order.orderNumber}.` } });
    },
    [addItem, navigate],
  );
}
