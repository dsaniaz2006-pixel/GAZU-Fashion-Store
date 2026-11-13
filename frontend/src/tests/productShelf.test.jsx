import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StorefrontContext } from '../context/StorefrontContext.jsx';
import ProductShelf from '../components/ui/skincare-product-shelf.jsx';
import ProductDetail from '../pages/ProductDetail.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useFetch } from '../hooks/useFetch.js';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }));
vi.mock('../context/CartContext.jsx', () => ({ useCart: vi.fn() }));
vi.mock('../hooks/useFetch.js', () => ({ useFetch: vi.fn() }));

const record = { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011', name: 'Relaxed Cotton Tee', category: 'Men', type: 'T-Shirts', color: 'Stone', img: 'photo-1521572163474-6864f9cf17ab', description: 'Classic cotton tee.', pricePaise: 129900, price: 1299, rating: 4, reviewCount: 2, quantity: 3, active: true, inStock: true, available: true };
const storefront = { user: { id: 'u1' }, wishlist: [], toggleWish: vi.fn(), addToCart: vi.fn(async () => {}), setSelected: vi.fn() };
function mount(component) { return render(<MemoryRouter><StorefrontContext.Provider value={storefront}>{component}</StorefrontContext.Provider></MemoryRouter>); }
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Product Shelf interaction', () => {
  it('opens real inventory data and returns to the shelf without changing routes', () => {
    mount(<ProductShelf products={[record]} />);
    fireEvent.click(screen.getByRole('button', { name: `Explore ${record.name}` }));
    expect(screen.getByRole('heading', { name: record.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Item details & reviews/i })).toHaveAttribute('href', `/product/${record.id}`);
    fireEvent.click(screen.getByRole('button', { name: /Back to shelf/ }));
    expect(screen.getByRole('button', { name: `Explore ${record.name}` })).toBeInTheDocument();
  });

  it('uses GAZU wishlist and bag actions rather than demo cosmetics', async () => {
    mount(<ProductShelf products={[record]} />);
    fireEvent.click(screen.getByRole('button', { name: /Save Relaxed Cotton Tee to wishlist/ }));
    expect(storefront.toggleWish).toHaveBeenCalledWith(record);
    fireEvent.click(screen.getByRole('button', { name: `Explore ${record.name}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to bag' }));
    await waitFor(() => expect(storefront.addToCart).toHaveBeenCalledWith(record));
  });
});

describe('Real product detail', () => {
  it('sends selected quantity through existing cart API client', async () => {
    const add = vi.fn(async () => []);
    useAuth.mockReturnValue({ user: { id: 'u1' } });
    useCart.mockReturnValue({ busy: false, add });
    useFetch.mockImplementation((path) => path.includes('/reviews?') ? { loading: false, error: '', data: { items: [], pages: 0 } } : { loading: false, error: '', data: record });
    render(<MemoryRouter initialEntries={[`/product/${record.id}`]}><Routes><Route path="/product/:id" element={<ProductDetail />} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    fireEvent.click(screen.getByRole('button', { name: /ADD TO BAG/i }));
    await waitFor(() => expect(add).toHaveBeenCalledWith(expect.objectContaining({ id: record.id }), 2, ""));
    expect(screen.getByText(/2 items added/)).toBeInTheDocument();
  });
});
