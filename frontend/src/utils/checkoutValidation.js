// Validation of the checkout form. Returns an object with a message (in Spanish) for each wrong field;
// an empty object means the form is valid. The server validates the order again.

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same pattern as the server (OrderRequestDTO, SignUpRequestDTO and ProfileUpdateDTO)
export const PHONE = /^\+?[0-9 ]{9,15}$/;
const CARD_NUMBER = /^[0-9]{16}$/;
const EXPIRY = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
const CVV = /^[0-9]{3}$/;

// form: { deliveryType, address, name, email, phone, paymentMethod, cardNumber, cardExpiry, cardCvv }
// counter: an employee places the order at the counter. The email is not required (it is checked if it is written)
// and a card is paid with the card reader, so there are no card data.
// The phone is required for home deliveries, whoever places the order; otherwise it is checked if it is written.
export function validateCheckout(form, today = new Date(), { counter = false } = {}) {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = counter ? 'Escribe el nombre del cliente.' : 'Escribe tu nombre.';
  }
  const email = form.email.trim();
  if ((!counter || email) && !EMAIL.test(email)) {
    errors.email = 'Escribe un correo electrónico válido.';
  }
  const phone = form.phone.trim();
  if ((form.deliveryType === 'DELIVERY' || phone) && !PHONE.test(phone)) {
    errors.phone = 'Escribe un teléfono de 9 a 15 cifras.';
  }
  if (form.deliveryType === 'DELIVERY' && !form.address.trim()) {
    errors.address = 'Escribe la dirección de entrega.';
  }
  if (form.paymentMethod === 'CARD' && !counter) {
    Object.assign(errors, validateCard(form, today));
  }
  return errors;
}

// Simulated payment: the card data is only checked here and never sent to the server
function validateCard(form, today) {
  const errors = {};
  if (!CARD_NUMBER.test(form.cardNumber.replaceAll(' ', ''))) {
    errors.cardNumber = 'El número de tarjeta tiene 16 cifras.';
  }
  const expiry = EXPIRY.exec(form.cardExpiry.trim());
  if (!expiry) {
    errors.cardExpiry = 'Escribe la caducidad como MM/AA.';
  } else {
    // The card is valid until the last day of its month
    const lastDay = new Date(2000 + Number(expiry[2]), Number(expiry[1]), 0, 23, 59, 59);
    if (lastDay < today) {
      errors.cardExpiry = 'La tarjeta está caducada.';
    }
  }
  if (!CVV.test(form.cardCvv.trim())) {
    errors.cardCvv = 'El CVV tiene 3 cifras.';
  }
  return errors;
}
