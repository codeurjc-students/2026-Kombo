import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './httpClient';
import {
  changeMyPassword,
  deleteMyAccount,
  deleteMyImage,
  getUser,
  getUsers,
  myImageUrl,
  signUp,
  updateMyAddresses,
  updateMyProfile,
  uploadMyImage,
} from './userService';

vi.mock('./httpClient', () => ({ apiFetch: vi.fn(), apiUrl: (path) => path }));

describe('userService', () => {
  beforeEach(() => {
    apiFetch.mockReset().mockResolvedValue({});
  });

  it('calls the users endpoints', async () => {
    await getUsers({ page: 2 });
    await getUser(5);

    expect(apiFetch.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/users?page=2&size=10',
      '/api/v1/users/5',
    ]);
  });

  it('sends the sign up with POST', async () => {
    const user = { name: 'Ana', email: 'ana@example.com', password: 'secret-password' };

    await signUp(user);

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users', { method: 'POST', body: user });
  });

  it('sends the personal data and the password of the logged in user with PUT', async () => {
    const profile = { name: 'Ana', surname: '', phone: '611222333' };
    const passwords = { currentPassword: 'secret-password', newPassword: 'new-secret-password' };

    await updateMyProfile(profile);
    await changeMyPassword(passwords);

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/api/v1/users/me', { method: 'PUT', body: profile });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/api/v1/users/me/password', { method: 'PUT', body: passwords });
  });

  it('sends the whole list of addresses with PUT', async () => {
    await updateMyAddresses(['Calle Mayor 1']);

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/addresses', {
      method: 'PUT',
      body: { addresses: ['Calle Mayor 1'] },
    });
  });

  it('uploads the picture in the field "image" and deletes it', async () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' });

    await uploadMyImage(file);
    await deleteMyImage();

    const [path, options] = apiFetch.mock.calls[0];
    expect(path).toBe('/api/v1/users/me/image');
    expect(options.method).toBe('PUT');
    expect(options.body.get('image')).toBe(file);
    expect(apiFetch).toHaveBeenLastCalledWith('/api/v1/users/me/image', { method: 'DELETE' });
  });

  it('builds the URL of the picture with its id', () => {
    expect(myImageUrl(7)).toBe('/api/v1/users/me/image?v=7');
  });

  it('deletes the account with DELETE', async () => {
    await deleteMyAccount();

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me', { method: 'DELETE' });
  });
});
