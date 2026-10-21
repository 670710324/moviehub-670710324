import { NavLink, Outlet } from 'react-router-dom';

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm transition ${isActive
    ? 'bg-emerald-500 font-medium text-white'
    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`;

function AdminLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-600">MovieHub Backoffice</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">จัดการระบบ</h1>
      </div>
      <nav aria-label="เมนูผู้ดูแล" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-emerald-100 bg-white p-2">
        <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
        <NavLink to="/admin/members" className={navClass}>สมาชิก</NavLink>
        <NavLink to="/admin/movies" className={navClass}>หนัง</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}

export default AdminLayout;
