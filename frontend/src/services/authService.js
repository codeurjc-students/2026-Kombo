import { ApiError, apiFetch } from './httpClient';

const AUTH_PATH = '/api/v1/auth';

// Logs in; the server sends the session cookie and answers with the user
export function login(email, password) {
  return apiFetch(`${AUTH_PATH}/login`, { method: 'POST', body: { email, password } });
}

export function logout() {
  return apiFetch(`${AUTH_PATH}/logout`, { method: 'POST' });
}

// Returns the logged in user, or null if there is no valid session
export async function getCurrentUser() {
  try {
    return await apiFetch(`${AUTH_PATH}/me`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
