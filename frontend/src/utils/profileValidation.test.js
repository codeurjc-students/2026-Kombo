import { describe, expect, it } from 'vitest';
import {
  validateAddress,
  validateImageFile,
  validateNewUser,
  validatePasswordChange,
  validateProfile,
} from './profileValidation';

describe('validateProfile', () => {
  it('accepts a name with an empty surname and phone', () => {
    expect(validateProfile({ name: 'Ana', surname: '', phone: '' })).toEqual({});
  });

  it('asks for the name and a valid phone', () => {
    expect(validateProfile({ name: '  ', surname: '', phone: '123' })).toEqual({
      name: 'Escribe tu nombre.',
      phone: 'Escribe un teléfono de 9 a 15 cifras.',
    });
  });

  it('rejects a name or a surname that is too long', () => {
    expect(validateProfile({ name: 'a'.repeat(51), surname: 'b'.repeat(101), phone: '+34 600 123 456' })).toEqual({
      name: 'El nombre tiene como máximo 50 caracteres.',
      surname: 'Los apellidos tienen como máximo 100 caracteres.',
    });
  });
});

describe('validatePasswordChange', () => {
  it('accepts the current password and a new one of 8 characters repeated', () => {
    expect(validatePasswordChange({ currentPassword: 'old', newPassword: '12345678', repeatPassword: '12345678' })).toEqual(
      {},
    );
  });

  it('asks for the current password, a long enough new one and the same repetition', () => {
    expect(validatePasswordChange({ currentPassword: '', newPassword: 'short', repeatPassword: 'other' })).toEqual({
      currentPassword: 'Escribe tu contraseña actual.',
      newPassword: 'La contraseña nueva tiene entre 8 y 72 caracteres.',
      repeatPassword: 'Las contraseñas no coinciden.',
    });
  });
});

describe('validateAddress', () => {
  it('accepts a new address', () => {
    expect(validateAddress(' Calle Luna 2 ', ['Calle Mayor 1'])).toBeNull();
  });

  it('rejects an empty, too long or repeated address', () => {
    expect(validateAddress('  ', [])).toBe('Escribe la dirección.');
    expect(validateAddress('a'.repeat(256), [])).toBe('La dirección tiene como máximo 255 caracteres.');
    expect(validateAddress('Calle Mayor 1 ', ['Calle Mayor 1'])).toBe('Ya tienes guardada esa dirección.');
  });
});

describe('validateImageFile', () => {
  it('accepts a picture of 1 MB at most', () => {
    expect(validateImageFile({ type: 'image/webp', size: 1024 * 1024 })).toBeNull();
  });

  it('rejects no file, a file that is not a picture and a picture bigger than 1 MB', () => {
    expect(validateImageFile(null)).toBe('Elige una imagen.');
    expect(validateImageFile({ type: 'image/svg+xml', size: 100 })).toBe(
      'La foto tiene que ser una imagen JPG, PNG, GIF o WebP.',
    );
    expect(validateImageFile({ type: 'image/jpeg', size: 1024 * 1024 + 1 })).toBe('La foto ocupa más de 1 MB.');
  });
});

describe('validateNewUser', () => {
  const USER = { name: 'Luis', surname: '', email: 'luis@kombo.com', phone: '', password: 'secret-password' };

  it('accepts a user with the required fields', () => {
    expect(validateNewUser({ ...USER, repeatPassword: 'secret-password' })).toEqual({});
  });

  it('asks for the name, a valid email and the same password twice', () => {
    expect(
      validateNewUser({ ...USER, name: ' ', email: 'luis', password: 'short', repeatPassword: 'other' }),
    ).toEqual({
      name: 'Escribe el nombre.',
      email: 'Escribe un correo electrónico válido.',
      password: 'La contraseña tiene entre 8 y 72 caracteres.',
      repeatPassword: 'Las contraseñas no coinciden.',
    });
  });

  it('rejects an email that is too long', () => {
    const email = `${'a'.repeat(95)}@kombo.com`;

    expect(validateNewUser({ ...USER, email, repeatPassword: 'secret-password' })).toEqual({
      email: 'El correo electrónico tiene como máximo 100 caracteres.',
    });
  });
});
