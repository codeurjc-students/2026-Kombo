import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import { useAuth } from './AuthContext';
import AuthProvider from './AuthProvider';

vi.mock('../services/authService');

function Probe() {
  const auth = useAuth();
  return (
    <>
      <p>{auth.loading ? 'loading' : (auth.user?.name ?? 'anonymous')}</p>
      <button type="button" onClick={() => auth.login('employee@kombo.com', 'employee')}>login</button>
      <button type="button" onClick={() => auth.logout()}>logout</button>
    </>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('asks the server for the current user when it starts', async () => {
    authService.getCurrentUser.mockResolvedValue({ name: 'Lucía' });
    render(<AuthProvider><Probe /></AuthProvider>);

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('Lucía')).toBeInTheDocument();
  });

  it('logs in and logs out', async () => {
    authService.getCurrentUser.mockResolvedValue(null);
    authService.login.mockResolvedValue({ name: 'Carlos' });
    authService.logout.mockResolvedValue(null);
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText('anonymous');

    fireEvent.click(screen.getByRole('button', { name: 'login' }));
    expect(await screen.findByText('Carlos')).toBeInTheDocument();
    expect(authService.login).toHaveBeenCalledWith('employee@kombo.com', 'employee');

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('treats a failed session check as anonymous', async () => {
    authService.getCurrentUser.mockRejectedValue(new Error('offline'));
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
  });

  it('fails when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useAuth must be used inside an AuthProvider');
  });
});
