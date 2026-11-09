import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getUsers } from '../services/userService';
import { ADMIN, CUSTOMER, renderApp } from '../test-utils';

vi.mock('../services/userService', () => ({ getUsers: vi.fn() }));

describe('UsersPage', () => {
  it('lists the users page by page', async () => {
    getUsers
      .mockResolvedValueOnce({ content: [ADMIN], page: { number: 0, totalPages: 2 } })
      .mockResolvedValueOnce({ content: [CUSTOMER], page: { number: 1, totalPages: 2 } });
    renderApp('/admin/users', { user: ADMIN });

    expect(await screen.findByText('admin@kombo.com')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next', { selector: '.visually-hidden' }).closest('a, button'));

    expect(await screen.findByText('customer@kombo.com')).toBeInTheDocument();
    expect(getUsers).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('shows an error that can be retried', async () => {
    getUsers.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ content: [ADMIN], page: { number: 0, totalPages: 1 } });
    renderApp('/admin/users', { user: ADMIN });

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('admin@kombo.com')).toBeInTheDocument();
  });
});
