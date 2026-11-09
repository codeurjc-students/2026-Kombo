import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './httpClient';
import { getUser, getUserOrders, getUsers } from './userService';

vi.mock('./httpClient', () => ({ apiFetch: vi.fn() }));

describe('userService', () => {
  beforeEach(() => {
    apiFetch.mockReset().mockResolvedValue({});
  });

  it('calls the users endpoints', async () => {
    await getUsers({ page: 2 });
    await getUser(5);
    await getUserOrders(5, { page: 1 });

    expect(apiFetch.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/users?page=2&size=10',
      '/api/v1/users/5',
      '/api/v1/users/5/orders?page=1&size=5',
    ]);
  });
});
