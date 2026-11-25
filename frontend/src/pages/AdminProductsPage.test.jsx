import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/httpClient';
import { getAdminProduct, getAdminProducts, setProductActive, updateCombo } from '../services/productService';
import { ADMIN, EMPLOYEE, renderApp } from '../test-utils';

vi.mock('../services/productService', async (importOriginal) => ({
  ...(await importOriginal()),
  getAdminProduct: vi.fn(),
  getAdminProducts: vi.fn(),
  setProductActive: vi.fn(),
  updateCombo: vi.fn(),
}));

const BURGER = {
  id: 1,
  name: 'Hamburguesa clásica',
  price: 8.5,
  category: 'Burgers',
  combo: false,
  active: true,
  imageId: 4,
  ingredients: [
    { id: 1, name: 'Pan', unit: 'unidades', quantity: 1 },
    { id: 2, name: 'Queso', unit: 'g', quantity: 20 },
  ],
  products: [],
};
const FRIES = { ...BURGER, id: 2, name: 'Patatas', category: 'Sides', active: false, imageId: null, ingredients: [] };
const KOMBO = {
  ...BURGER,
  id: 3,
  name: 'Kombo clásico',
  category: 'Combos',
  combo: true,
  ingredients: [],
  products: [{ product: { id: 1, name: 'Hamburguesa clásica' }, quantity: 2 }],
};

const DRINK = { id: 5, name: 'Refresco' };
// Kombos of the burger as read by the window: the classic one keeps 2 units without it, the family one only 1
const CLASSIC = {
  ...KOMBO,
  price: 9.9,
  description: 'Menú',
  products: [
    { product: { id: 1, name: 'Hamburguesa clásica' }, quantity: 1 },
    { product: DRINK, quantity: 2 },
  ],
};
const FAMILY = {
  ...KOMBO,
  id: 4,
  name: 'Kombo familiar',
  price: 20,
  products: [
    { product: { id: 1, name: 'Hamburguesa clásica' }, quantity: 2 },
    { product: DRINK, quantity: 1 },
  ],
};

// The burger cannot be deactivated: it is in the active kombos
function burgerInKombos(...kombos) {
  setProductActive.mockRejectedValueOnce(
    new ApiError(409, 'The product is in active combos', {
      products: kombos.map((kombo) => ({ id: kombo.id, name: kombo.name })),
    }),
  );
  getAdminProduct.mockImplementation((id) => Promise.resolve(kombos.find((kombo) => kombo.id === id)));
}

function card(name) {
  return screen.getByRole('article', { name });
}

describe('AdminProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminProducts.mockResolvedValue({ content: [BURGER, FRIES, KOMBO], page: { number: 0, totalPages: 1 } });
  });

  it('shows every product and kombo, the deactivated ones in grey', async () => {
    renderApp('/admin/products', { user: ADMIN });

    expect(await screen.findByRole('heading', { name: 'Hamburguesa clásica' })).toBeInTheDocument();
    expect(within(card('Hamburguesa clásica')).getByText('Pan, Queso')).toBeInTheDocument();
    expect(within(card('Hamburguesa clásica')).getByText('Hamburguesas')).toBeInTheDocument();
    expect(within(card('Kombo clásico')).getByText('2 × Hamburguesa clásica')).toBeInTheDocument();
    expect(card('Patatas')).toHaveClass('is-inactive');
    expect(within(card('Patatas')).getByText('Desactivado')).toBeInTheDocument();
    expect(card('Hamburguesa clásica')).not.toHaveClass('is-inactive');
    // Each kind is changed in its own form
    expect(within(card('Hamburguesa clásica')).getByRole('button', { name: 'Modificar Hamburguesa clásica' }))
      .toHaveAttribute('href', '/admin/products/1');
    expect(within(card('Kombo clásico')).getByRole('button', { name: 'Modificar Kombo clásico' }))
      .toHaveAttribute('href', '/admin/combos/3');
    expect(screen.getByRole('button', { name: 'Nuevo producto' })).toHaveAttribute('href', '/admin/products/new');
    expect(screen.getByRole('button', { name: 'Nuevo kombo' })).toHaveAttribute('href', '/admin/combos/new');
  });

  it('deactivates and activates a product', async () => {
    setProductActive
      .mockResolvedValueOnce({ ...KOMBO, active: false })
      .mockResolvedValueOnce({ ...FRIES, active: true });
    renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Kombo clásico' }));
    expect(await screen.findByText('Kombo clásico ya no sale en la carta.')).toBeInTheDocument();
    expect(card('Kombo clásico')).toHaveClass('is-inactive');
    expect(setProductActive).toHaveBeenCalledWith(3, false);

    fireEvent.click(screen.getByRole('button', { name: 'Activar Patatas' }));
    expect(await screen.findByText('Patatas está de nuevo en la carta.')).toBeInTheDocument();
    expect(card('Patatas')).not.toHaveClass('is-inactive');
    expect(setProductActive).toHaveBeenLastCalledWith(2, true);
  });

  it('lists the active kombos of a product that cannot be deactivated, with a link to change each one', async () => {
    burgerInKombos(CLASSIC, FAMILY);
    const { router } = renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Hamburguesa clásica' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading', { name: 'CONFLICTO' })).toBeInTheDocument();
    expect(await dialog.findByText(/Hamburguesa clásica no se puede desactivar porque está en estos kombos activos/))
      .toBeInTheDocument();
    expect(dialog.getByText('Kombo clásico')).toBeInTheDocument();
    expect(dialog.getByText('Kombo familiar')).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Modificar Kombo familiar' })).toHaveAttribute('href', '/admin/combos/4');
    expect(card('Hamburguesa clásica')).not.toHaveClass('is-inactive');

    // The window closes when a kombo is opened
    fireEvent.click(dialog.getByRole('button', { name: 'Modificar Kombo clásico' }));
    expect(router.state.location.pathname).toBe('/admin/combos/3');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the list of kombos and shows it again when the product is deactivated again', async () => {
    burgerInKombos(CLASSIC);
    renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Hamburguesa clásica' }));
    expect(await within(await screen.findByRole('dialog')).findByText(/está en este kombo activo/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    burgerInKombos(CLASSIC);
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar Hamburguesa clásica' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(setProductActive).toHaveBeenCalledTimes(2);
  });

  it('removes the product from a kombo with a new price and then deactivates the product', async () => {
    burgerInKombos(CLASSIC);
    updateCombo.mockResolvedValue({ ...CLASSIC, price: 7.5, products: [CLASSIC.products[1]] });
    renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Hamburguesa clásica' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(await dialog.findByText('1 × Hamburguesa clásica')).toBeInTheDocument();
    const price = dialog.getByLabelText('Precio de Kombo clásico');
    expect(price).toHaveValue('9,90');
    fireEvent.change(price, { target: { value: '7,50' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Quitar Hamburguesa clásica de Kombo clásico' }));

    expect(await dialog.findByText(/ya no está en ningún kombo activo/)).toBeInTheDocument();
    expect(updateCombo).toHaveBeenCalledWith(3, {
      name: 'Kombo clásico',
      price: 7.5,
      description: 'Menú',
      products: [{ productId: 5, quantity: 2 }],
    });
    // The card of the kombo shows its new products
    expect(within(card('Kombo clásico')).getByText('2 × Refresco')).toBeInTheDocument();

    setProductActive.mockResolvedValueOnce({ ...BURGER, active: false });
    fireEvent.click(dialog.getByRole('button', { name: 'Desactivar Hamburguesa clásica' }));
    expect(await screen.findByText('Hamburguesa clásica ya no sale en la carta.')).toBeInTheDocument();
    expect(card('Hamburguesa clásica')).toHaveClass('is-inactive');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers to deactivate a kombo that would keep fewer than 2 products, and checks the price', async () => {
    burgerInKombos(CLASSIC, FAMILY);
    setProductActive.mockResolvedValueOnce({ ...FAMILY, active: false });
    renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Hamburguesa clásica' }));
    const dialog = within(await screen.findByRole('dialog'));
    const family = within(await dialog.findByRole('listitem', { name: 'Kombo familiar' }));
    expect(family.getByText('Se queda con menos de 2 productos')).toBeInTheDocument();
    expect(family.queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument();

    // A wrong price cannot be saved
    fireEvent.change(dialog.getByLabelText('Precio de Kombo clásico'), { target: { value: '0' } });
    expect(dialog.getByText(/Escribe un precio mayor que 0/)).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Quitar Hamburguesa clásica de Kombo clásico' })).toBeDisabled();

    fireEvent.click(family.getByRole('button', { name: 'Desactivar kombo Kombo familiar' }));
    await waitFor(() => expect(dialog.queryByRole('listitem', { name: 'Kombo familiar' })).not.toBeInTheDocument());
    expect(setProductActive).toHaveBeenLastCalledWith(4, false);
    expect(dialog.getByRole('listitem', { name: 'Kombo clásico' })).toBeInTheDocument();
    expect(updateCombo).not.toHaveBeenCalled();
  });

  it('shows an error when a kombo of the window cannot be loaded or changed', async () => {
    burgerInKombos(CLASSIC);
    getAdminProduct.mockRejectedValueOnce(new Error('offline'));
    updateCombo.mockRejectedValue(new Error('offline'));
    renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Hamburguesa clásica' }));
    const dialog = within(await screen.findByRole('dialog'));
    fireEvent.click(await dialog.findByRole('button', { name: 'Reintentar' }));
    fireEvent.click(await dialog.findByRole('button', { name: 'Quitar Hamburguesa clásica de Kombo clásico' }));

    expect(await dialog.findByText('No hemos podido cambiar Kombo clásico. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(dialog.getByRole('listitem', { name: 'Kombo clásico' })).toBeInTheDocument();
  });

  it('explains why a kombo with a deactivated product cannot be activated, and other errors', async () => {
    getAdminProducts.mockResolvedValue({
      content: [{ ...KOMBO, active: false }, BURGER],
      page: { number: 0, totalPages: 1 },
    });
    setProductActive
      .mockRejectedValueOnce(
        new ApiError(409, 'The combo includes deactivated products', { products: [{ id: 2, name: 'Patatas' }] }),
      )
      .mockRejectedValueOnce(new Error('offline'));
    renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Activar Kombo clásico' }));
    expect(
      await screen.findByText(
        'No se puede activar Kombo clásico porque incluye productos desactivados (Patatas). Actívalos antes.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Desactivar Hamburguesa clásica' }));
    expect(
      await screen.findByText('No hemos podido cambiar Hamburguesa clásica. Inténtalo de nuevo.'),
    ).toBeInTheDocument();
  });

  it('shows an error that can be retried', async () => {
    getAdminProducts.mockRejectedValueOnce(new Error('offline'));
    renderApp('/admin/products', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Patatas' })).toBeInTheDocument();
  });

  it('is only for the administrator', () => {
    renderApp('/admin/products', { user: EMPLOYEE });

    expect(screen.queryByRole('heading', { name: 'Productos' })).not.toBeInTheDocument();
  });
});
