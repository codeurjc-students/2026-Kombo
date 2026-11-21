import { vi } from 'vitest';
import { login } from './services/authService';
import { signUp } from './services/userService';

// Only for the integration tests. In a browser, the session cookie is kept and sent by the browser;
// Node.js has no cookie store, so this signs up a new customer, logs in, keeps the session cookie of the
// answer and adds it to every following request. Each run uses a new email, so the tests can be repeated
// against the same database without changing the sample users. Returns the logged in user.
export async function startCustomerSession(prefix) {
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
  const password = 'secret-password';
  // A new session replaces the one of a previous call
  vi.unstubAllGlobals();
  await signUp({ name: 'Ana', surname: 'Pruebas', email, phone: '600123456', password });
  return startSession(email, password);
}

// Logs in with an existing user (for example the sample employee) and keeps the session cookie, as above
export async function startSession(email, password) {
  vi.unstubAllGlobals();
  const realFetch = globalThis.fetch;
  let cookie = null;
  vi.stubGlobal('fetch', async (url, options = {}) => {
    const headers = new Headers(options.headers);
    if (cookie) {
      headers.set('Cookie', cookie);
    }
    const response = await realFetch(url, { ...options, headers });
    const session = response.headers.getSetCookie?.().find((value) => value.includes('='));
    if (session) {
      cookie = session.split(';')[0];
    }
    return response;
  });
  return login(email, password);
}
