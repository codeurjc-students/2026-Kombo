import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './httpClient';
import {
  changeMyPassword,
  createUser,
  deleteMyAccount,
  deleteMyImage,
  deleteUser,
  deleteUserImage,
  getUser,
  getUsers,
  myImageUrl,
  signUp,
  updateMyAddresses,
  updateMyProfile,
  updateUser,
  updateUserAddresses,
  uploadMyImage,
  uploadUserImage,
  userImageUrl,
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

  it('calls the endpoints of the administrator to manage any user', async () => {
    const user = { name: 'Luis', email: 'luis@kombo.com', password: 'secret-password', role: 'EMPLOYEE' };
    const profile = { name: 'Luis', surname: '', phone: '' };
    const file = new File(['x'], 'photo.png', { type: 'image/png' });

    await createUser(user);
    await updateUser(5, profile);
    await updateUserAddresses(5, ['Calle Mayor 1']);
    await uploadUserImage(5, file);
    await deleteUserImage(5);
    await deleteUser(5);

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/api/v1/admin/users', { method: 'POST', body: user });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/api/v1/users/5', { method: 'PUT', body: profile });
    expect(apiFetch).toHaveBeenNthCalledWith(3, '/api/v1/users/5/addresses', {
      method: 'PUT',
      body: { addresses: ['Calle Mayor 1'] },
    });
    const [path, options] = apiFetch.mock.calls[3];
    expect(path).toBe('/api/v1/users/5/image');
    expect(options.body.get('image')).toBe(file);
    expect(apiFetch).toHaveBeenNthCalledWith(5, '/api/v1/users/5/image', { method: 'DELETE' });
    expect(apiFetch).toHaveBeenNthCalledWith(6, '/api/v1/users/5', { method: 'DELETE' });
    expect(userImageUrl(5, 7)).toBe('/api/v1/users/5/image?v=7');
  });
});
