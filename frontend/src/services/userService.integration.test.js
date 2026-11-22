// @vitest-environment node
// Node.js environment (not jsdom): its fetch only accepts its own FormData and File for the uploads
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser, login } from './authService';
import { ApiError } from './httpClient';
import { startCustomerSession, startSession } from '../test-session';
import {
  changeMyPassword,
  createUser,
  deleteMyAccount,
  deleteMyImage,
  deleteUser,
  deleteUserImage,
  getUser,
  myImageUrl,
  signUp,
  updateMyAddresses,
  updateMyProfile,
  updateUser,
  updateUserAddresses,
  uploadMyImage,
  uploadUserImage,
  userImageUrl,
} from './userService';

// First bytes of a JPEG file: the server checks the signature of the picture, not its name
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

// Integration test: real service and real REST API (backend running with the sample data).
// Every run signs up a new email, so the test can be repeated against the same database.
describe('userService with the real REST API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', process.env.KOMBO_BACKEND_URL ?? 'https://localhost');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('changes the personal data of the logged in user but not the email', async () => {
    const user = await startCustomerSession('client-profile');

    const updated = await updateMyProfile({ name: 'Ana María', surname: '', phone: '611222333' });

    expect(updated).toMatchObject({ id: user.id, name: 'Ana María', surname: null, phone: '611222333', email: user.email });
  });

  it('changes the password, which is then needed to log in', async () => {
    const user = await startCustomerSession('client-password');

    await changeMyPassword({ currentPassword: 'secret-password', newPassword: 'new-secret-password' });

    expect(await login(user.email, 'new-secret-password')).toMatchObject({ id: user.id });
    const error = await login(user.email, 'secret-password').catch((err) => err);
    expect(error.status).toBe(401);
  });

  it('rejects a wrong current password with 400', async () => {
    await startCustomerSession('client-wrong-password');

    const error = await changeMyPassword({ currentPassword: 'wrong-password', newPassword: 'new-secret-password' }).catch(
      (err) => err,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
  });

  it('adds and deletes saved addresses', async () => {
    await startCustomerSession('client-addresses');

    expect((await updateMyAddresses(['Calle Mayor 1', 'Calle Luna 2'])).addresses).toEqual([
      'Calle Mayor 1',
      'Calle Luna 2',
    ]);
    expect((await updateMyAddresses(['Calle Luna 2'])).addresses).toEqual(['Calle Luna 2']);
    expect((await getCurrentUser()).addresses).toEqual(['Calle Luna 2']);
  });

  it('uploads, reads and deletes the profile picture', async () => {
    await startCustomerSession('client-picture');

    const user = await uploadMyImage(new File([JPEG], 'photo.jpg', { type: 'image/jpeg' }));

    expect(user.imageId).toEqual(expect.any(Number));
    const response = await fetch(myImageUrl(user.imageId));
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(JPEG);

    await deleteMyImage();
    expect((await getCurrentUser()).imageId).toBeNull();
  });

  it('rejects a file that is not a picture with 400', async () => {
    await startCustomerSession('client-not-picture');

    const error = await uploadMyImage(new File(['<svg></svg>'], 'photo.jpg', { type: 'image/jpeg' })).catch(
      (err) => err,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
  });

  it('deletes the account, which cannot log in again', async () => {
    const user = await startCustomerSession('client-delete');

    await deleteMyAccount();

    const error = await login(user.email, 'secret-password').catch((err) => err);
    expect(error.status).toBe(401);
  });

  it('the administrator creates an employee, changes their data and picture and deletes them', async () => {
    await startSession('admin@kombo.com', 'admin');
    const email = `employee-test-${Date.now()}@kombo.com`;

    const employee = await createUser({ name: 'Luis', email, password: 'secret-password', role: 'EMPLOYEE' });
    expect(employee).toMatchObject({ name: 'Luis', email, role: 'EMPLOYEE' });

    const profile = { name: 'Luis Miguel', surname: 'Gómez', phone: '600123456' };
    expect(await updateUser(employee.id, profile)).toMatchObject({ name: 'Luis Miguel', email });
    const withPicture = await uploadUserImage(employee.id, new File([JPEG], 'photo.jpg', { type: 'image/jpeg' }));
    const response = await fetch(userImageUrl(employee.id, withPicture.imageId));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(JPEG);
    await deleteUserImage(employee.id);
    expect((await getUser(employee.id)).imageId).toBeNull();

    await deleteUser(employee.id);
    const error = await getUser(employee.id).catch((err) => err);
    expect(error.status).toBe(404);
  });

  it('the administrator creates a customer and changes their addresses, but not another administrator', async () => {
    await startSession('admin@kombo.com', 'admin');
    const email = `customer-test-${Date.now()}@example.com`;

    const customer = await createUser({ name: 'Ana', email, password: 'secret-password', role: 'CUSTOMER' });
    expect((await updateUserAddresses(customer.id, ['Calle Mayor 1'])).addresses).toEqual(['Calle Mayor 1']);
    await deleteUser(customer.id);

    const error = await createUser({ name: 'Ana', email, password: 'secret-password', role: 'ADMIN' }).catch(
      (err) => err,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
  });

  it('a customer cannot create users', async () => {
    await startCustomerSession('client-create-user');

    const user = { name: 'Ana', email: 'other@example.com', password: 'secret-password', role: 'EMPLOYEE' };
    const error = await createUser(user).catch((err) => err);
    expect(error.status).toBe(403);
  });
});
