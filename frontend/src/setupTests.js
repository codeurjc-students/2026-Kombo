// Adds DOM matchers such as toBeInTheDocument() and toHaveTextContent()
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Removes the rendered components after each test so tests do not affect each other,
// and empties localStorage, where the cart is kept
afterEach(() => {
  cleanup();
  localStorage.clear();
});