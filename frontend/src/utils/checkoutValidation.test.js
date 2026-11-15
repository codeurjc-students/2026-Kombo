import { describe, expect, it } from 'vitest';
import { validateCheckout } from './checkoutValidation';

const VALID = {
  deliveryType: 'TAKE_AWAY',
  address: '',
  name: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '600 123 456',
  paymentMethod: 'CARD',
  cardNumber: '4111 1111 1111 1111',
  cardExpiry: '12/30',
  cardCvv: '123',
};
const TODAY = new Date(2026, 10, 15);

describe('validateCheckout', () => {
  it('accepts a complete form', () => {
    expect(validateCheckout(VALID, TODAY)).toEqual({});
  });

  it('requires the contact data', () => {
    const errors = validateCheckout({ ...VALID, name: ' ', email: 'ana@', phone: '12' }, TODAY);

    expect(Object.keys(errors)).toEqual(['name', 'email', 'phone']);
  });

  it('requires the address only for home deliveries', () => {
    expect(validateCheckout({ ...VALID, deliveryType: 'DELIVERY' }, TODAY)).toEqual({
      address: 'Escribe la dirección de entrega.',
    });
    expect(validateCheckout({ ...VALID, deliveryType: 'DELIVERY', address: 'Calle Mayor 1' }, TODAY)).toEqual({});
  });

  it('checks the simulated card only when paying by card', () => {
    const wrongCard = { ...VALID, cardNumber: '4111', cardExpiry: '13/30', cardCvv: '12' };

    expect(Object.keys(validateCheckout(wrongCard, TODAY))).toEqual(['cardNumber', 'cardExpiry', 'cardCvv']);
    expect(validateCheckout({ ...wrongCard, paymentMethod: 'CASH' }, TODAY)).toEqual({});
  });

  it('accepts a card until the end of its month and rejects an expired one', () => {
    expect(validateCheckout({ ...VALID, cardExpiry: '11/26' }, TODAY)).toEqual({});
    expect(validateCheckout({ ...VALID, cardExpiry: '10/26' }, TODAY)).toEqual({
      cardExpiry: 'La tarjeta está caducada.',
    });
  });
});
