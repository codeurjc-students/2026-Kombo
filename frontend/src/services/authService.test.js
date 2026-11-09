import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser, login, logout } from './authService';
import { ApiError, apiFetch } from './httpClient';

vi.mock('./httpClient', async (importOriginal) => ({ ...(await importOriginal()), apiFetch: vi.fn() }));

describe('authService', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it('logs in with the email and the password', async () => {
    apiFetch.mockResolvedValue({ id: 2 });

    expect(await login('customer@kombo.com', 'customer')).toEqual({ id: 2 });
    expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'customer@kombo.com', password: 'customer' },
    });
  });

  it('logs out', async () => {
    apiFetch.mockResolvedValue(null);

    await logout();

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/logout', { method: 'POST' });
  });

  it('returns the current user', async () => {
    apiFetch.mockResolvedValue({ id: 2 });

    expect(await getCurrentUser()).toEqual({ id: 2 });
  });

  it('returns null when there is no session', async () => {
    apiFetch.mockRejectedValue(new ApiError(401, 'Authentication required'));

    expect(await getCurrentUser()).toBeNull();
  });

  it('throws other errors', async () => {
    apiFetch.mockRejectedValue(new ApiError(500, 'Server error'));

    await expect(getCurrentUser()).rejects.toThrow('Server error');
  });
});
