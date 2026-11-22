// Common HTTP client of the REST API.
// credentials: 'include' sends the httpOnly session cookie, which JavaScript cannot read.

// problem: the whole ProblemDetail of the answer, with the extra properties of some errors (for example the names
// of the kombos that prevent deactivating a product)
export class ApiError extends Error {
  constructor(status, message, problem = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

// Empty in the browser (same origin, or Vite's proxy in development).
// Tests set VITE_API_URL to call the backend directly.
export function apiUrl(path) {
  return `${import.meta.env.VITE_API_URL ?? ''}${path}`;
}

// body is sent as JSON, except FormData (file uploads), which the browser sends as multipart/form-data
// with its own Content-Type header
export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(apiUrl(path), {
    method,
    headers,
    credentials: 'include',
    body: body === undefined || isForm ? body : JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const problem = await readProblem(response);
    throw new ApiError(response.status, problem.detail ?? `Error ${response.status}`, problem);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

// The REST API answers errors in ProblemDetail format: { status, title, detail } and sometimes more properties
async function readProblem(response) {
  try {
    return (await response.json()) ?? {};
  } catch {
    return {};
  }
}
