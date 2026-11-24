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

  it('asks only for the name of the customer in a counter order, without card data', () => {
    const counterOrder = { ...VALID, email: '', phone: '', cardNumber: '', cardExpiry: '', cardCvv: '' };

    expect(validateCheckout(counterOrder, TODAY, { counter: true })).toEqual({});
    expect(validateCheckout({ ...counterOrder, name: ' ', phone: '12' }, TODAY, { counter: true })).toEqual({
      name: 'Escribe el nombre del cliente.',
      phone: 'Escribe un teléfono de 9 a 15 cifras.',
    });
  });

  it('requires the phone only for home deliveries, also in counter orders', () => {
    expect(validateCheckout({ ...VALID, phone: ' ' }, TODAY)).toEqual({});
    expect(validateCheckout({ ...VALID, deliveryType: 'EAT_IN', phone: '' }, TODAY)).toEqual({});

    const delivery = { ...VALID, deliveryType: 'DELIVERY', address: 'Calle Mayor 1', phone: '' };
    const phoneError = { phone: 'Escribe un teléfono de 9 a 15 cifras.' };
    expect(validateCheckout(delivery, TODAY)).toEqual(phoneError);
    expect(validateCheckout({ ...delivery, email: '', paymentMethod: 'CASH' }, TODAY, { counter: true })).toEqual(
      phoneError,
    );
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
