import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSettings, updateSettings } from '../services/settingsService';
import { ADMIN, CUSTOMER, renderApp } from '../test-utils';

vi.mock('../services/settingsService', () => ({ getSettings: vi.fn(), updateSettings: vi.fn() }));

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    getSettings
      .mockReset()
      .mockResolvedValue({ deliveryCost: 2.5, freeDeliveryThreshold: 25, cancellationFeePercent: 80 });
    updateSettings
      .mockReset()
      .mockResolvedValue({ deliveryCost: 3.2, freeDeliveryThreshold: 25, cancellationFeePercent: 60 });
  });

  it('lets the administrator change the delivery cost and the cancellation fee', async () => {
    renderApp('/admin/settings', { user: ADMIN });
    const input = await screen.findByLabelText('Gastos de envío a domicilio');
    const fee = screen.getByLabelText('Gasto de cancelación de un pedido listo');
    expect(input).toHaveValue(2.5);
    expect(fee).toHaveValue(80);

    fireEvent.change(input, { target: { value: '3.20' } });
    fireEvent.change(fee, { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText(/Ajustes guardados: envío de 3,20.€ y gasto de cancelación del 60 %/),
    ).toBeInTheDocument();
    expect(updateSettings).toHaveBeenCalledWith({ deliveryCost: 3.2, cancellationFeePercent: 60 });
  });

  it('shows an error when the cost cannot be saved or loaded', async () => {
    updateSettings.mockRejectedValue(new Error('offline'));
    const { router } = renderApp('/admin/settings', { user: ADMIN });
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('No hemos podido guardar los ajustes.')).toBeInTheDocument();
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
