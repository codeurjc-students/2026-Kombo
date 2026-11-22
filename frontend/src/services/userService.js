import { apiFetch, apiUrl } from './httpClient';

const USERS_PATH = '/api/v1/users';

// Only the administrator
export function getUsers({ page = 0, size = 10 } = {}) {
  return apiFetch(`${USERS_PATH}?${new URLSearchParams({ page, size })}`);
}

// Only the administrator: the users manage their own account with the /me paths
export function getUser(id) {
  return apiFetch(`${USERS_PATH}/${id}`);
}

// Only the administrator: creates a customer or an employee ({ name, surname, email, phone, password, role }).
// Answers with the new user.
export function createUser(user) {
  return apiFetch('/api/v1/admin/users', { method: 'POST', body: user });
}

// Only the administrator: personal data of any user ({ name, surname, phone }). Answers with the updated user.
export function updateUser(id, profile) {
  return apiFetch(`${USERS_PATH}/${id}`, { method: 'PUT', body: profile });
}

// Only the administrator: deletes any user except the administrator
export function deleteUser(id) {
  return apiFetch(`${USERS_PATH}/${id}`, { method: 'DELETE' });
}

// Only the administrator: the whole list of saved addresses of any user
export function updateUserAddresses(id, addresses) {
  return apiFetch(`${USERS_PATH}/${id}/addresses`, { method: 'PUT', body: { addresses } });
}

// Only the administrator: uploads or replaces the profile picture of any user
export function uploadUserImage(id, file) {
  const form = new FormData();
  form.append('image', file);
  return apiFetch(`${USERS_PATH}/${id}/image`, { method: 'PUT', body: form });
}

export function deleteUserImage(id) {
  return apiFetch(`${USERS_PATH}/${id}/image`, { method: 'DELETE' });
}

// Only the administrator: URL of the profile picture of any user (imageId changes the URL with each new picture)
export function userImageUrl(id, imageId) {
  return apiUrl(`${USERS_PATH}/${id}/image?v=${imageId}`);
}

// Personal data of the logged in user: { name, surname, phone }. Answers with the updated user.
export function updateMyProfile(profile) {
  return apiFetch(`${USERS_PATH}/me`, { method: 'PUT', body: profile });
}

// Password of the logged in user: { currentPassword, newPassword }. 400 if the current password is wrong.
export function changeMyPassword(passwords) {
  return apiFetch(`${USERS_PATH}/me/password`, { method: 'PUT', body: passwords });
}

// Saved addresses of the logged in user: the whole list, so it adds and deletes addresses
export function updateMyAddresses(addresses) {
  return apiFetch(`${USERS_PATH}/me/addresses`, { method: 'PUT', body: { addresses } });
}

// Uploads or replaces the profile picture (a File). Answers with the updated user and the id of the new picture.
export function uploadMyImage(file) {
  const form = new FormData();
  form.append('image', file);
  return apiFetch(`${USERS_PATH}/me/image`, { method: 'PUT', body: form });
}

export function deleteMyImage() {
  return apiFetch(`${USERS_PATH}/me/image`, { method: 'DELETE' });
}

// URL of the profile picture of the logged in user. The id of the picture changes the URL with every new picture,
// so the browser does not show the previous one.
export function myImageUrl(imageId) {
  return apiUrl(`${USERS_PATH}/me/image?v=${imageId}`);
}

// Deletes the account of the logged in user; the server also closes the session
export function deleteMyAccount() {
  return apiFetch(`${USERS_PATH}/me`, { method: 'DELETE' });
}

// Sign up of a new customer: { name, surname, email, phone, password }. Answers with the new user.
// It does not log in: the server only sends the session cookie on POST /api/v1/auth/login.
export function signUp(user) {
  return apiFetch(USERS_PATH, { method: 'POST', body: user });
}
