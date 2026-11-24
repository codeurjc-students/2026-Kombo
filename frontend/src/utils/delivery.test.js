import { describe, expect, it } from 'vitest';
import { canBeCancelledByCustomer, cancellationFeeFor, paymentStatus } from './delivery';

const ORDER = { paymentMethod: 'CARD', paid: true, status: 'IN_PREPARATION', total: 21 };

// The prices are written with a non-breaking space before the euro sign
function text(order) {
  return paymentStatus(order).replaceAll(' ', ' ');
}

describe('delivery', () => {
  it('shows whether the order is paid', () => {
    expect(text(ORDER)).toBe('Tarjeta - Pagado');
    expect(text({ ...ORDER, paymentMethod: 'CASH', paid: false })).toBe('Efectivo - Pendiente de pago');
  });

  it('shows the money given back of a cancelled order', () => {
    expect(text({ ...ORDER, status: 'CANCELLED', cancellationFee: 0 })).toBe('Tarjeta - Devuelto');
    // Orders cancelled before the fee existed have none
    expect(text({ ...ORDER, paymentMethod: 'CASH', status: 'CANCELLED', cancellationFee: null })).toBe(
      'Efectivo - Devuelto',
    );
    expect(text({ ...ORDER, status: 'CANCELLED', cancellationFee: 16.8 })).toBe(
      'Tarjeta - Devuelto 4,20 € (cobrado 16,80 €)',
    );
    expect(text({ ...ORDER, paymentMethod: 'CASH', paid: false, status: 'CANCELLED' })).toBe('Efectivo - No cobrado');
  });

  it('calculates the cancellation fee only for paid orders that are ready, like the server', () => {
    expect(cancellationFeeFor({ ...ORDER, status: 'READY', total: 12.35 }, 80)).toBe(9.88);
    expect(cancellationFeeFor({ ...ORDER, status: 'READY', paid: false }, 80)).toBe(0);
    expect(cancellationFeeFor(ORDER, 80)).toBe(0);
  });

  it('lets the customer cancel only orders in preparation or ready', () => {
    expect(canBeCancelledByCustomer(ORDER)).toBe(true);
    expect(canBeCancelledByCustomer({ ...ORDER, status: 'READY' })).toBe(true);
    expect(canBeCancelledByCustomer({ ...ORDER, status: 'DELIVERED' })).toBe(false);
    expect(canBeCancelledByCustomer({ ...ORDER, status: 'CANCELLED' })).toBe(false);
  });
});
