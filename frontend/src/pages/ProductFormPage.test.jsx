import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import {
  createProduct,
  getAdminProduct,
  getAdminProducts,
  getIngredients,
  updateProduct,
  uploadProductImage,
} from '../services/productService';
import { ADMIN, renderApp } from '../test-utils';

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  createProduct: vi.fn(),
  getAdminProduct: vi.fn(),
  getAdminProducts: vi.fn(),
  getIngredients: vi.fn(),
  updateProduct: vi.fn(),
  uploadProductImage: vi.fn(),
}));

const INGREDIENTS = [
  { id: 1, name: 'Pan', unit: 'unidades' },
  { id: 2, name: 'Queso', unit: 'g' },
];
const BURGER = {
  id: 5,
  name: 'Hamburguesa',
  price: 6.5,
  description: 'Clásica',
  category: 'Burgers',
  combo: false,
  active: true,
  imageId: null,
  ingredients: [{ id: 1, name: 'Pan', unit: 'unidades', quantity: 1 }],
  products: [],
};

function type(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('ProductFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getIngredients.mockResolvedValue(INGREDIENTS);
    // The list of products, shown after saving
    getAdminProducts.mockResolvedValue({ content: [], page: { number: 0, totalPages: 0 } });
  });

  it('creates a product with its ingredients and its picture and goes back to the products', async () => {
    createProduct.mockResolvedValue({ ...BURGER, id: 9, name: 'Hamburguesa doble' });
    uploadProductImage.mockResolvedValue({});
    const { router } = renderApp('/admin/products/new', { user: ADMIN });

    await screen.findByLabelText('Nombre');
    type('Nombre', ' Hamburguesa doble ');
    type('Precio', '7,25');
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Burgers' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir ingrediente' }));
    fireEvent.change(screen.getByLabelText('Ingrediente 1'), { target: { value: '2' } });
    type('Cantidad del ingrediente 1', '30');
    expect(screen.getByText('g')).toBeInTheDocument();
    // A picture of 2 MB is accepted for a product (the limit is 10 MB)
    const file = new File([new Uint8Array(2 * 1024 * 1024)], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Foto'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Hamburguesa doble se ha guardado.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/products');
    expect(createProduct).toHaveBeenCalledWith({
      name: 'Hamburguesa doble',
      price: 7.25,
      description: '',
      category: 'Burgers',
      ingredients: [{ ingredientId: 2, quantity: 30 }],
    });
    expect(uploadProductImage).toHaveBeenCalledWith(9, file);
  });

  it('changes a product, starting with its data, and removes an ingredient', async () => {
    getAdminProduct.mockResolvedValue(BURGER);
    updateProduct.mockResolvedValue(BURGER);
    renderApp('/admin/products/5', { user: ADMIN });

    expect(await screen.findByRole('heading', { name: 'Modificar Hamburguesa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Precio')).toHaveValue('6,50');
    expect(screen.getByLabelText('Ingrediente 1')).toHaveValue('1');
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Hamburguesa se ha guardado.')).toBeInTheDocument();
    expect(updateProduct).toHaveBeenCalledWith(5, expect.objectContaining({ price: 6.5, ingredients: [] }));
    expect(uploadProductImage).not.toHaveBeenCalled();
  });

  it('shows the wrong fields and a picture that is too big without calling the server', async () => {
    renderApp('/admin/products/new', { user: ADMIN });

    await screen.findByLabelText('Nombre');
    type('Precio', '0');
    const tooBig = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Foto'), { target: { files: [tooBig] } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('Escribe el nombre.')).toBeInTheDocument();
    expect(screen.getByText('Elige la categoría.')).toBeInTheDocument();
    expect(screen.getByText('La foto ocupa más de 10 MB.')).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('shows the error of the server and keeps the form', async () => {
    getAdminProduct.mockResolvedValue(BURGER);
    updateProduct.mockRejectedValue(new ApiError(400, 'ingredients: ingredient 1 does not exist'));
    renderApp('/admin/products/5', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText('Revisa los datos del formulario: hay algún campo que no es válido.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Hamburguesa');
  });

  it('keeps the saved product when the picture fails, on its edit page', async () => {
    createProduct.mockResolvedValue({ ...BURGER, id: 9 });
    uploadProductImage.mockRejectedValue(new ApiError(413, 'image: the file is bigger than 10 MB'));
    getAdminProduct.mockResolvedValue({ ...BURGER, id: 9 });
    const { router } = renderApp('/admin/products/new', { user: ADMIN });

    await screen.findByLabelText('Nombre');
    type('Nombre', 'Hamburguesa');
    type('Precio', '6,50');
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Burgers' } });
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Foto'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText(
        'Hamburguesa se ha guardado, pero la foto no: el archivo no es una imagen válida de 10 MB como máximo.',
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/products/9');
  });

  it('sends a kombo to its own form', async () => {
    getAdminProduct.mockResolvedValue({ ...BURGER, combo: true, products: [] });
    const { router } = renderApp('/admin/products/5', { user: ADMIN });

    expect(await screen.findByText('Productos del kombo')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/combos/5');
  });

  it('shows the 404 page for a product that does not exist', async () => {
    getAdminProduct.mockRejectedValueOnce(new ApiError(404, 'Product 99 not found'));
    renderApp('/admin/products/99', { user: ADMIN });
    expect(await screen.findByRole('heading', { name: 'Esta página no está en la carta' })).toBeInTheDocument();
  });

  it('retries after an error', async () => {
    getIngredients.mockRejectedValueOnce(new Error('offline'));
    renderApp('/admin/products/new', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Nuevo producto' })).toBeInTheDocument();
  });
});
