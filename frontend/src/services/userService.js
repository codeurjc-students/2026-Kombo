import { apiFetch } from './httpClient';

const USERS_PATH = '/api/v1/users';

// Only the administrator
export function getUsers({ page = 0, size = 10 } = {}) {
  return apiFetch(`${USERS_PATH}?${new URLSearchParams({ page, size })}`);
}

export function getUser(id) {
  return apiFetch(`${USERS_PATH}/${id}`);
}

// Order history of a user, the most recent first
export function getUserOrders(id, { page = 0, size = 10 } = {}) {
  return apiFetch(`${USERS_PATH}/${id}/orders?${new URLSearchParams({ page, size })}`);
}

// Sign up of a new customer: { name, surname, email, phone, password }. Answers with the new user.
// It does not log in: the server only sends the session cookie on POST /api/v1/auth/login.
export function signUp(user) {
  return apiFetch(USERS_PATH, { method: 'POST', body: user });
}
