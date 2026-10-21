import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function Secret() { return <h1>หน้าลับ</h1>; }
function LoginPage() { return <h1>หน้า Login</h1>; }

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/me/wishlist" element={<ProtectedRoute><Secret /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => localStorage.clear());

test('ยังไม่ login ต้องถูกพาไปหน้า Login', () => {
  renderAt('/me/wishlist');
  expect(screen.getByRole('heading', { name: 'หน้า Login' })).toBeInTheDocument();
  expect(screen.queryByText('หน้าลับ')).not.toBeInTheDocument();
});

test('มี token ใน localStorage แล้ว ต้องเห็นหน้าลับ', () => {
  localStorage.setItem('moviehub.token', 'member-token');
  localStorage.setItem('moviehub.member', JSON.stringify({ id: 1, role: 'member' }));
  renderAt('/me/wishlist');
  expect(screen.getByRole('heading', { name: 'หน้าลับ' })).toBeInTheDocument();
});

test('session ที่ข้อมูลสมาชิกเสียหายถูกล้างและต้อง login ใหม่', () => {
  localStorage.setItem('moviehub.token', 'broken-token');
  localStorage.setItem('moviehub.member', '{invalid-json');
  renderAt('/me/wishlist');
  expect(screen.getByRole('heading', { name: 'หน้า Login' })).toBeInTheDocument();
  expect(localStorage.getItem('moviehub.token')).toBeNull();
});

test('member ห้ามเข้าหน้า admin แม้มี token', () => {
  localStorage.setItem('moviehub.token', 'member-token');
  localStorage.setItem('moviehub.member', JSON.stringify({ id: 2, role: 'member' }));
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Secret /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByRole('heading', { name: 'ไม่มีสิทธิ์เข้าถึงหน้านี้' })).toBeInTheDocument();
  expect(screen.queryByText('หน้าลับ')).not.toBeInTheDocument();
});

test('admin เข้า route ที่จำกัด role ได้', () => {
  localStorage.setItem('moviehub.token', 'admin-token');
  localStorage.setItem('moviehub.member', JSON.stringify({ id: 3, role: 'admin' }));
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Secret /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('หน้าลับ')).toBeInTheDocument();
});
