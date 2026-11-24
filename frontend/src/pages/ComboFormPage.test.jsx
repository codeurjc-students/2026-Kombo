import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import { createCombo, getAdminProduct, getAdminProducts, updateCombo } from '../services/productService';
import { ADMIN, chooseOption, renderApp } from '../test-utils';

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  createCombo: vi.fn(),
  getAdminProduct: vi.fn(),
  getAdminProducts: vi.fn(),
  getIngredients: vi.fn().mockResolvedValue([]),
  updateCombo: vi.fn(),
  uploadProductImage: vi.fn(),
}));

const BURGER = { id: 1, name: 'Hamburguesa', price: 6.5, combo: false, active: true };
const DRINK = { id: 2, name: 'Refresco', price: 2, combo: false, active: true };
const KOMBO = {
  id: 7,
  name: 'Kombo clásico',
  price: 9.9,
  description: '',
  category: 'Combos',
  combo: true,
  active: false,
  imageId: 3,
  ingredients: [],
  products: [
    { product: BURGER, quantity: 1 },
    { product: DRINK, quantity: 1 },
  ],
};

function type(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('ComboFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminProducts.mockImplementation(({ combo }) =>
      Promise.resolve({ content: combo === false ? [BURGER, DRINK] : [], page: { number: 0, totalPages: 1 } }),
    );
  });

  it('creates a kombo with active products and shows the sum of their prices', async () => {
    createCombo.mockResolvedValue({ ...KOMBO, name: 'Kombo doble' });
    const { router } = renderApp('/admin/combos/new', { user: ADMIN });

    await screen.findByLabelText('Nombre');
    // Only the active products that are not kombos are offered
    expect(getAdminProducts).toHaveBeenCalledWith({ active: true, combo: false, size: 100 });
    type('Nombre', 'Kombo doble');
    type('Precio', '12');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir producto' }));
    chooseOption('Producto 1', 'Hamburguesa');
    type('Unidades del producto 1', '2');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir producto' }));
    chooseOption('Producto 2', 'Refresco');
    expect(screen.getByText(/15,00/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Kombo doble se ha guardado.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/products');
    expect(createCombo).toHaveBeenCalledWith({
      name: 'Kombo doble',
      price: 12,
      description: '',
      products: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    });
  });

  it('changes a kombo, starting with its products, and says when it is deactivated', async () => {
    getAdminProduct.mockResolvedValue(KOMBO);
    updateCombo.mockResolvedValue(KOMBO);
    renderApp('/admin/combos/7', { user: ADMIN });

    expect(await screen.findByRole('heading', { name: 'Modificar Kombo clásico' })).toBeInTheDocument();
    expect(screen.getByText('Este kombo está desactivado: no sale en la carta.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foto de Kombo clásico' })).toHaveAttribute(
      'src',
      '/api/v1/admin/products/7/image?v=3',
    );
    expect(screen.getByLabelText('Producto 2').value).toMatch(/^Refresco \(2,00/);
    type('Unidades del producto 2', '2');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Kombo clásico se ha guardado.')).toBeInTheDocument();
    expect(updateCombo).toHaveBeenCalledWith(7, expect.objectContaining({
      price: 9.9,
      products: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 2 },
      ],
    }));
  });

  it('asks for at least 2 units without calling the server, and shows the error of the server', async () => {
    createCombo.mockRejectedValue(new Error('offline'));
    renderApp('/admin/combos/new', { user: ADMIN });

    await screen.findByLabelText('Nombre');
    type('Nombre', 'Kombo');
    type('Precio', '5');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir producto' }));
    chooseOption('Producto 1', 'Hamburguesa');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Un kombo tiene al menos 2 unidades.')).toBeInTheDocument();
    expect(createCombo).not.toHaveBeenCalled();

    type('Unidades del producto 1', '2');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('No hemos podido guardar. Inténtalo de nuevo.')).toBeInTheDocument();
  });

  it('sends a product that is not a kombo to its own form', async () => {
    getAdminProduct.mockResolvedValue({ ...BURGER, category: 'Burgers', ingredients: [], products: [] });
    const { router } = renderApp('/admin/combos/1', { user: ADMIN });

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/products/1'));
    expect(await screen.findByLabelText('Categoría')).toHaveValue('Burgers');
  });

  it('shows the 404 page for a kombo that does not exist', async () => {
    getAdminProduct.mockRejectedValue(new ApiError(404, 'Product 99 not found'));
    renderApp('/admin/combos/99', { user: ADMIN });

    expect(await screen.findByRole('heading', { name: 'Esta página no está en la carta' })).toBeInTheDocument();
  });
});
