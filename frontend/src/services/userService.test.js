import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './httpClient';
import { getUser, getUsers, signUp } from './userService';

vi.mock('./httpClient', () => ({ apiFetch: vi.fn() }));

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
});
