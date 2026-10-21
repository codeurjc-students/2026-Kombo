import { useEffect, useState } from 'react';
import { getProducts } from '../services/productService';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name} - {product.price} €
        </li>
      ))}
    </ul>
  );
}