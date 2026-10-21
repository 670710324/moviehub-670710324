import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// ครอบหน้าที่ต้อง login: ถ้ายังไม่ได้ login ส่งไปหน้า /login แล้วจำไว้ว่ามาจากไหน
function ProtectedRoute({ children, requiredRole }) {
  const { isLoggedIn, member } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (requiredRole && member?.role !== requiredRole) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="mt-2 text-sm text-slate-500">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }
  return children;
}

export default ProtectedRoute;
