import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Shop from '../pages/Shop.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.removeItem('gazu-recently-viewed-v1');
});

test('changing to Women does not display a previously viewed blue shoe', async () => {
  localStorage.setItem('gazu-recently-viewed-v1', JSON.stringify([
    { id: 'blue-shoe', name: 'Air Jordan 1 High OG Royal', img: 'air-jordan-1-royal' },
  ]));
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ items: [], total: 0, pages: 1, mode: 'keyword' }),
  })));

  render(<MemoryRouter initialEntries={['/shop?category=Women']}><Shop /></MemoryRouter>);

  expect(await screen.findByText('0 pieces')).toBeInTheDocument();
  expect(screen.queryByText(/RECENTLY VIEWED/i)).not.toBeInTheDocument();
  expect(screen.queryByText('Air Jordan 1 High OG Royal')).not.toBeInTheDocument();
});
