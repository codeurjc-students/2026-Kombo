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
export function getUserOrders(id, { page = 0, size = 5 } = {}) {
  return apiFetch(`${USERS_PATH}/${id}/orders?${new URLSearchParams({ page, size })}`);
}
