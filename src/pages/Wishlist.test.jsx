import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Wishlist from './Wishlist';
import { useAuth } from '../auth/AuthContext';
import { getMovies, getWishlist } from '../api/backend';

jest.mock('../auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/backend');

const CATALOG = [
  { id: 11, title: 'API Movie One', titleTh: null, year: 2024, poster: null },
  { id: 22, title: 'API Movie Two', titleTh: null, year: 2025, poster: null },
];

beforeEach(() => {
  useAuth.mockReturnValue({ member: { displayName: 'Movie Fan' }, token: 'member-jwt' });
  getMovies.mockResolvedValue(CATALOG);
  getWishlist.mockResolvedValue({ items: [{ id: 22 }] });
});

function renderWishlist() {
  return render(<MemoryRouter><Wishlist /></MemoryRouter>);
}

test('โหลด wishlist ของสมาชิกและจับคู่การ์ดกับหนังจาก API ด้วย ID', async () => {
  renderWishlist();

  expect(await screen.findByText('API Movie Two')).toBeInTheDocument();
  expect(screen.queryByText('API Movie One')).not.toBeInTheDocument();
  expect(getWishlist).toHaveBeenCalledWith('member-jwt');
  expect(getMovies).toHaveBeenCalledTimes(1);
});

test('แสดง error และลองโหลดหน้า wishlist ใหม่ได้', async () => {
  const user = userEvent.setup();
  getWishlist
    .mockRejectedValueOnce(new Error('API wishlist ไม่พร้อม'))
    .mockResolvedValueOnce({ items: [{ id: 11 }] });
  renderWishlist();

  expect(await screen.findByRole('alert')).toHaveTextContent('API wishlist ไม่พร้อม');
  await user.click(screen.getByRole('button', { name: 'ลองใหม่' }));

  expect(await screen.findByText('API Movie One')).toBeInTheDocument();
});
