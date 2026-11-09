import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './httpClient';

describe('httpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the session cookie and returns the JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 1 }) }));

    const body = await apiFetch('/api/v1/auth/me');

    expect(body).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/me', expect.objectContaining({ method: 'GET', credentials: 'include' }));
  });

  it('sends the body as JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }));

    await apiFetch('/api/v1/auth/login', { method: 'POST', body: { email: 'a@b.c' } });

    const options = fetch.mock.calls[0][1];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"email":"a@b.c"}');
  });

  it('returns null for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

    expect(await apiFetch('/api/v1/auth/logout', { method: 'POST' })).toBeNull();
  });

  it('throws an ApiError with the status and the detail of the ProblemDetail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403, json: () => Promise.resolve({ detail: 'Access denied' }) }),
    );

    const error = await apiFetch('/api/v1/users').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(403);
    expect(error.message).toBe('Access denied');
  });

  it('throws an ApiError when the error has no JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.reject(new Error()) }));

    await expect(apiFetch('/api/v1/products')).rejects.toThrow('Error 502');
  });
});
