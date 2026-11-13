import React from 'react';
import { vi, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

function AuthProbe() {
  const auth = useAuth();
  return <>
    <div data-testid="ready">{String(auth.ready)}</div>
    <div data-testid="identity">{auth.user?.id || 'guest'}</div>
    <div data-testid="notice">{auth.message}</div>
    <button onClick={() => api('/orders').catch(() => {})}>Fetch protected orders</button>
  </>;
}

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

test('expired startup session is cleared silently and guest browsing stays ready', async () => {
  sessionStorage.setItem('gazu-token', 'expired-token');
  const fetcher = vi.fn(async (url) => {
    expect(url).toContain('/auth/me');
    return response(401, { message: 'Please sign in again.' });
  });
  vi.stubGlobal('fetch', fetcher);
  render(<AuthProvider><AuthProbe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
  expect(screen.getByTestId('identity')).toHaveTextContent('guest');
  expect(screen.getByTestId('notice')).toBeEmptyDOMElement();
  expect(sessionStorage.getItem('gazu-token')).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('a later authenticated API 401 logs out quietly without a homepage notice', async () => {
  sessionStorage.setItem('gazu-token', 'valid-at-startup');
  vi.stubGlobal('fetch', vi.fn(async (url) => url.endsWith('/auth/me')
    ? response(200, { user: { id: 'buyer1', name: 'Buyer' } })
    : response(401, { message: 'Please sign in again.' })));
  render(<AuthProvider><AuthProbe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId('identity')).toHaveTextContent('buyer1'));
  fireEvent.click(screen.getByRole('button', { name: 'Fetch protected orders' }));
  await waitFor(() => expect(screen.getByTestId('identity')).toHaveTextContent('guest'));
  expect(screen.getByTestId('notice')).toBeEmptyDOMElement();
  expect(sessionStorage.getItem('gazu-token')).toBeNull();
});
