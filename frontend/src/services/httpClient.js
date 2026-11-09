// Common HTTP client of the REST API.
// credentials: 'include' sends the httpOnly session cookie, which JavaScript cannot read.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Empty in the browser (same origin, or Vite's proxy in development).
// Tests set VITE_API_URL to call the backend directly.
export function apiUrl(path) {
  return `${import.meta.env.VITE_API_URL ?? ''}${path}`;
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(apiUrl(path), {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorDetail(response));
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

// The REST API answers errors in ProblemDetail format: { status, title, detail }
async function readErrorDetail(response) {
  try {
    const problem = await response.json();
    return problem.detail ?? `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
}
