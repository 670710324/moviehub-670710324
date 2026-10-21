import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MovieActions from './MovieActions';
import { useAuth } from '../auth/AuthContext';
import { addToWishlist, getWishlist, removeFromWishlist } from '../api/backend';

jest.mock('../auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/backend');

beforeEach(() => {
  useAuth.mockReturnValue({ isLoggedIn: true, token: 'member-jwt' });
  getWishlist.mockResolvedValue({ items: [] });
});

function renderActions(movieId = 42) {
  return render(<MemoryRouter><MovieActions movieId={movieId} /></MemoryRouter>);
}

test('เพิ่มหนังเมื่อ API สำเร็จ แล้วค่อยเปลี่ยนหัวใจ', async () => {
  const user = userEvent.setup();
  let resolveAdd;
  addToWishlist.mockReturnValue(new Promise(resolve => { resolveAdd = resolve; }));
  renderActions();

  const button = await screen.findByRole('button', { name: '🤍 เพิ่มเข้ารายการที่อยากดู' });
  await user.click(button);

  expect(addToWishlist).toHaveBeenCalledWith(42, 'member-jwt');
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent('🤍 เพิ่มเข้ารายการที่อยากดู');

  resolveAdd({ movieId: 42 });
  expect(await screen.findByRole('button', { name: '❤️ อยู่ในรายการที่อยากดูแล้ว' })).toBeEnabled();
});

test('เอาหนังออกจาก wishlist เมื่อ DELETE สำเร็จ', async () => {
  const user = userEvent.setup();
  getWishlist.mockResolvedValue({ items: [{ id: 42 }] });
  removeFromWishlist.mockResolvedValue(null);
  renderActions();

  await user.click(await screen.findByRole('button', { name: '❤️ อยู่ในรายการที่อยากดูแล้ว' }));

  expect(removeFromWishlist).toHaveBeenCalledWith(42, 'member-jwt');
  expect(await screen.findByRole('button', { name: '🤍 เพิ่มเข้ารายการที่อยากดู' })).toBeEnabled();
});

test('โหลดสถานะ wishlist เดิมเมื่อเปิดรายละเอียดหนัง', async () => {
  getWishlist.mockResolvedValue({ items: [{ movieId: '42' }] });
  renderActions();

  expect(await screen.findByRole('button', { name: '❤️ อยู่ในรายการที่อยากดูแล้ว' })).toBeEnabled();
});

test('API error แสดงข้อความและไม่เปลี่ยนสถานะหัวใจ', async () => {
  const user = userEvent.setup();
  addToWishlist.mockRejectedValue(new Error('บันทึก wishlist ไม่สำเร็จ'));
  renderActions();

  const button = await screen.findByRole('button', { name: '🤍 เพิ่มเข้ารายการที่อยากดู' });
  await user.click(button);

  expect(await screen.findByRole('alert')).toHaveTextContent('บันทึก wishlist ไม่สำเร็จ');
  expect(screen.getByRole('button', { name: '🤍 เพิ่มเข้ารายการที่อยากดู' })).toBeEnabled();
});

test('DELETE error แสดงข้อความและคงสถานะหัวใจเดิม', async () => {
  const user = userEvent.setup();
  getWishlist.mockResolvedValue({ items: [{ id: 42 }] });
  removeFromWishlist.mockRejectedValue(new Error('ลบ wishlist ไม่สำเร็จ'));
  renderActions();

  await user.click(await screen.findByRole('button', { name: '❤️ อยู่ในรายการที่อยากดูแล้ว' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('ลบ wishlist ไม่สำเร็จ');
  expect(screen.getByRole('button', { name: '❤️ อยู่ในรายการที่อยากดูแล้ว' })).toBeEnabled();
});

test('โหลดสถานะเดิมไม่สำเร็จ แสดง error และให้ลองโหลดใหม่', async () => {
  const user = userEvent.setup();
  getWishlist
    .mockRejectedValueOnce(new Error('โหลด wishlist ไม่สำเร็จ'))
    .mockResolvedValueOnce({ items: [{ id: 42 }] });
  renderActions();

  expect(await screen.findByRole('alert')).toHaveTextContent('โหลด wishlist ไม่สำเร็จ');
  await user.click(screen.getByRole('button', { name: 'ลองโหลดสถานะใหม่' }));

  expect(await screen.findByRole('button', { name: '❤️ อยู่ในรายการที่อยากดูแล้ว' })).toBeEnabled();
});
