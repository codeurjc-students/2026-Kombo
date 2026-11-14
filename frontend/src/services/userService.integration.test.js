import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login } from './authService';
import { ApiError } from './httpClient';
import { signUp } from './userService';

// Integration test: real service and real REST API (backend running with the sample data).
// Every run signs up a new email, so the test can be repeated against the same database.
describe('userService with the real REST API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  it('signs up a new customer who can then log in', async () => {
    const email = `client-test-${Date.now()}@example.com`;

    const user = await signUp({ name: 'Ana', surname: 'Martín', email, phone: '600123456', password: 'secret-password' });

    expect(user).toMatchObject({ name: 'Ana', email, role: 'CUSTOMER' });
    expect(user).not.toHaveProperty('password');
    expect(await login(email, 'secret-password')).toMatchObject({ id: user.id });
  });

  it('rejects an email that is already registered with 409', async () => {
    const error = await signUp({ name: 'Lucía', email: 'customer@kombo.com', password: 'secret-password' }).catch(
      (err) => err,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
  });
});
