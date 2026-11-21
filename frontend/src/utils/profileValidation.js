// Validation of the forms of the profile settings. Each function returns an object with a message (in Spanish)
// for each wrong field; an empty object means the form is valid. The server validates the data again.
import { PHONE } from './checkoutValidation';

// Same limits as the server (ProfileUpdateDTO and PasswordChangeDTO)
const MAX_NAME = 50;
const MAX_SURNAME = 100;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

// profile: { name, surname, phone }; the surname and the phone are optional
export function validateProfile(profile) {
  const errors = {};
  const name = profile.name.trim();
  if (!name) {
    errors.name = 'Escribe tu nombre.';
  } else if (name.length > MAX_NAME) {
    errors.name = `El nombre tiene como máximo ${MAX_NAME} caracteres.`;
  }
  if (profile.surname.trim().length > MAX_SURNAME) {
    errors.surname = `Los apellidos tienen como máximo ${MAX_SURNAME} caracteres.`;
  }
  const phone = profile.phone.trim();
  if (phone && !PHONE.test(phone)) {
    errors.phone = 'Escribe un teléfono de 9 a 15 cifras.';
  }
  return errors;
}

// passwords: { currentPassword, newPassword, repeatPassword }
export function validatePasswordChange(passwords) {
  const errors = {};
  if (!passwords.currentPassword) {
    errors.currentPassword = 'Escribe tu contraseña actual.';
  }
  if (passwords.newPassword.length < MIN_PASSWORD || passwords.newPassword.length > MAX_PASSWORD) {
    errors.newPassword = `La contraseña nueva tiene entre ${MIN_PASSWORD} y ${MAX_PASSWORD} caracteres.`;
  }
  if (passwords.repeatPassword !== passwords.newPassword) {
    errors.repeatPassword = 'Las contraseñas no coinciden.';
  }
  return errors;
}

// Same size as the column of the database
const MAX_ADDRESS = 255;

// A new saved address: not empty, not too long and not saved already
export function validateAddress(address, savedAddresses) {
  const value = address.trim();
  if (!value) {
    return 'Escribe la dirección.';
  }
  if (value.length > MAX_ADDRESS) {
    return `La dirección tiene como máximo ${MAX_ADDRESS} caracteres.`;
  }
  if (savedAddresses.includes(value)) {
    return 'Ya tienes guardada esa dirección.';
  }
  return null;
}

// Types and size accepted by the server (ImageService), which also checks the content of the file
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const MAX_IMAGE_SIZE = 1024 * 1024;

export function validateImageFile(file) {
  if (!file) {
    return 'Elige una imagen.';
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return 'La foto tiene que ser una imagen JPG, PNG, GIF o WebP.';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'La foto ocupa más de 1 MB.';
  }
  return null;
}
