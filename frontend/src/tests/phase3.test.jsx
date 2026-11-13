import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductDetail from '../pages/ProductDetail.jsx';
import Shop from '../pages/Shop.jsx';
import Stats from '../pages/Stats.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { StorefrontContext } from '../context/StorefrontContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }));
vi.mock('../context/CartContext.jsx', () => ({ useCart: () => ({ busy: false, add: vi.fn() }) }));
const product = { _id: '507f1f77bcf86cd799439011', name: 'GAZU Tee', category: 'Men', description: 'Cotton', pricePaise: 149900, quantity: 3, active: true, inStock: true, img: 'photo-1521572163474-6864f9cf17ab', rating: 4, reviewCount: 1 };
const review = { _id: '507f1f77bcf86cd799439012', user: { _id: 'u1', name: 'Buyer' }, rating: 4, comment: 'Great fit', createdAt: '2026-11-01T00:00:00Z' };
const reply = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const storefront = {
  ready: true,
  cartBusy: false,
  wishlist: [],
  addToCart: vi.fn(),
  toggleWish: vi.fn(),
  setSelected: vi.fn(),
};
const mount = (path, component) => render(
  <MemoryRouter initialEntries={[path]}>
    <StorefrontContext.Provider value={storefront}>
      <Routes>
        <Route
          path={path.split('?')[0].replace('507f1f77bcf86cd799439011', ':id')}
          element={component}
        />
      </Routes>
    </StorefrontContext.Provider>
  </MemoryRouter>
);
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });

test('reviews show authors, date, selected stars and refresh after submission', async () => {
  useAuth.mockReturnValue({ user: { id: 'u1', role: 'customer' } });
  const fetcher = vi.fn(async (url, options) => {
    if (options?.method === 'POST') return reply({ ...review });
    if (url.endsWith('/reviews?page=1')) return reply({ items: [review], pages: 1 });
    return reply(product);
  });
  vi.stubGlobal('fetch', fetcher);
  mount('/product/507f1f77bcf86cd799439011', <ProductDetail />);
  expect(await screen.findByText('Great fit')).toBeInTheDocument();
  expect(screen.getByText(/Buyer · 4\/5/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '3 stars' }));
  expect(screen.getByRole('button', { name: '3 stars' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.change(screen.getByLabelText('Your review'), { target: { value: 'Comfortable fabric' } });
  fireEvent.submit(screen.getByText('Post review').closest('form'));
  await waitFor(() => expect(fetcher.mock.calls.some(([, opt]) => opt?.method === 'POST' && JSON.parse(opt.body).rating === 3)).toBe(true));
});

test('duplicate review displays a clear conflict error without clearing comment', async () => {
  useAuth.mockReturnValue({ user: { id: 'u1', role: 'customer' } });
  vi.stubGlobal('fetch', vi.fn(async (url, options) => options?.method === 'POST' ? reply({ message: 'Duplicate' }, 409) : url.includes('/reviews?') ? reply({ items: [], pages: 0 }) : reply(product)));
  mount('/product/507f1f77bcf86cd799439011', <ProductDetail />);
  await screen.findByText(/No reviews yet/);
  fireEvent.change(screen.getByLabelText('Your review'), { target: { value: 'Excellent fitting' } });
  fireEvent.click(screen.getByText('Post review'));
  expect(await screen.findByRole('alert')).toHaveTextContent(/already reviewed/);
  expect(screen.getByLabelText('Your review')).toHaveValue('Excellent fitting');
});

test('shop uses server filtering and keeps query in navigation', async () => {
  useAuth.mockReturnValue({ user: null });
  const fetcher = vi.fn(async () => reply({ items: [product], total: 1, pages: 1 }));
  vi.stubGlobal('fetch', fetcher);
  mount('/shop', <Shop />);
  expect(await screen.findByText('1 pieces')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Men' } });
  await waitFor(() => expect(fetcher.mock.calls.some(([url]) => url.includes('category=Men'))).toBe(true));
});

test('statistics separate real collections from mock payment totals', async () => {
  useAuth.mockReturnValue({ token: 't', user: { id: 'admin', role: 'admin' } });
  vi.stubGlobal('fetch', vi.fn(async () => reply({ revenuePerDay: [{ _id: '2026-11-01', revenuePaise: 20000, orders: 1 }], mockPaymentsPerDay: [{ _id: '2026-11-01', simulatedPaise: 30000, orders: 2 }], ordersByStatus: [], topProducts: [], lowStock: [] })));
  mount('/admin/stats', <Stats />);
  expect(await screen.findByText(/₹200/)).toBeInTheDocument();
  expect(screen.getByText(/₹300/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Simulated mock payments/ })).toBeInTheDocument();
});
