import { describe, expect, it, vi } from 'vitest';
import { login } from './authService';
import { ApiError } from './httpClient';

// Integration test: real service and real REST API (backend running with the sample data).
// Node.js has no cookie store, so only the answers of the log in are checked here.
describe('authService with the real REST API', () => {
  it('logs in with a sample user', async () => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');

    const user = await login('customer@kombo.com', 'customer');

    expect(user).toMatchObject({ email: 'customer@kombo.com', role: 'CUSTOMER' });
    expect(user).not.toHaveProperty('password');
  });

  it('rejects a wrong password with 401', async () => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');

    const error = await login('customer@kombo.com', 'wrong').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
  });
});
