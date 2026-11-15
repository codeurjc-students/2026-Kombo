import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSettings, updateDeliveryCost } from '../services/settingsService';
import { ADMIN, CUSTOMER, renderApp } from '../test-utils';

vi.mock('../services/settingsService', () => ({ getSettings: vi.fn(), updateDeliveryCost: vi.fn() }));

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    getSettings.mockReset().mockResolvedValue({ deliveryCost: 2.5, freeDeliveryThreshold: 25 });
    updateDeliveryCost.mockReset().mockResolvedValue({ deliveryCost: 3.2, freeDeliveryThreshold: 25 });
  });

  it('lets the administrator change the delivery cost', async () => {
    renderApp('/admin/settings', { user: ADMIN });
    const input = await screen.findByLabelText('Gastos de envío a domicilio');
    expect(input).toHaveValue(2.5);

    fireEvent.change(input, { target: { value: '3.20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/Gastos de envío guardados: 3,20.€/)).toBeInTheDocument();
    expect(updateDeliveryCost).toHaveBeenCalledWith(3.2);
  });

  it('shows an error when the cost cannot be saved or loaded', async () => {
    updateDeliveryCost.mockRejectedValue(new Error('offline'));
    const { router } = renderApp('/admin/settings', { user: ADMIN });
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('No hemos podido guardar los gastos de envío.')).toBeInTheDocument();
    router.dispose();
  });

  it('shows an error when the settings cannot be loaded', async () => {
    getSettings.mockRejectedValue(new Error('offline'));
    renderApp('/admin/settings', { user: ADMIN });

    expect(await screen.findByText('No hemos podido cargar los ajustes.')).toBeInTheDocument();
  });

  it('is only for the administrator', () => {
    renderApp('/admin/settings', { user: CUSTOMER });

    expect(screen.queryByLabelText('Gastos de envío a domicilio')).not.toBeInTheDocument();
  });
});
