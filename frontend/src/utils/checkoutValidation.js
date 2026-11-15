// Validation of the checkout form. Returns an object with a message (in Spanish) for each wrong field;
// an empty object means the form is valid. The server validates the order again.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same pattern as the server (OrderRequestDTO) and the sign up form
const PHONE = /^\+?[0-9 ]{9,15}$/;
const CARD_NUMBER = /^[0-9]{16}$/;
const EXPIRY = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
const CVV = /^[0-9]{3}$/;

// form: { deliveryType, address, name, email, phone, paymentMethod, cardNumber, cardExpiry, cardCvv }
export function validateCheckout(form, today = new Date()) {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = 'Escribe tu nombre.';
  }
  if (!EMAIL.test(form.email.trim())) {
    errors.email = 'Escribe un correo electrónico válido.';
  }
  if (!PHONE.test(form.phone.trim())) {
    errors.phone = 'Escribe un teléfono de 9 a 15 cifras.';
  }
  if (form.deliveryType === 'DELIVERY' && !form.address.trim()) {
    errors.address = 'Escribe la dirección de entrega.';
  }
  if (form.paymentMethod === 'CARD') {
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
