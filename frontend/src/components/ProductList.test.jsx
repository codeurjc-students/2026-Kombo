import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductList from './ProductList';
import { getProducts } from '../services/productService';

// Replaces the real service with a fake one: no HTTP requests are made
vi.mock('../services/productService');

describe('ProductList', () => {
  it('renders the products returned by the service', async () => {
    
    getProducts.mockResolvedValue([
      { id: 1, name: 'Test Burger', price: 5 },
      { id: 2, name: 'Test Drink', price: 1.5 },
    ]);

    
    render(<ProductList />);

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Test Burger - 5 €');
    expect(items[1]).toHaveTextContent('Test Drink - 1.5 €');
  });
});