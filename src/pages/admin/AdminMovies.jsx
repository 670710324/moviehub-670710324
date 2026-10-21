import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { deleteAdminMovie, getAdminMovie, getMovies } from '../../api/backend';

function AdminMovies() {
  const { token } = useAuth();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMovies(await getMovies());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMovies(); }, [loadMovies]);

  async function prepareDelete(movie) {
    setError('');
    try {
      const details = await getAdminMovie(movie.id, token);
      setPendingDelete({ ...movie, impact: details.impact });
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteAdminMovie(pendingDelete.id, token);
      setMovies(current => current.filter(movie => movie.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-xl border border-emerald-100 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">จัดการหนัง</h2>
          <p className="mt-1 text-sm text-slate-500">รายการจาก catalog หนัง ส่วนการเพิ่มและแก้ไขต้องใช้สิทธิ์ admin</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadMovies} className="rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">โหลดใหม่</button>
          <Link to="/admin/movies/new" className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600">เพิ่มหนัง</Link>
        </div>
      </div>
      {location.state?.message && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{location.state.message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-slate-500">กำลังโหลดหนัง...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-3">รหัส</th><th className="px-3 py-3">ชื่อหนัง</th><th className="px-3 py-3">แนว</th><th className="px-3 py-3">ปี</th><th className="px-3 py-3">จัดการ</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movies.map(movie => (
                <tr key={movie.id}>
                  <td className="px-3 py-3 text-slate-500">{movie.id}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{movie.titleTh || movie.title}<span className="block text-xs font-normal text-slate-500">{movie.title}</span></td>
                  <td className="px-3 py-3 text-slate-600">{movie.genre || '—'}</td>
                  <td className="px-3 py-3 text-slate-600">{movie.year || '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link to={`/admin/movies/${movie.id}/edit`} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50">แก้ไข</Link>
                      <button type="button" onClick={() => prepareDelete(movie)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!movies.length && <p className="py-6 text-center text-sm text-slate-500">ไม่พบหนังใน catalog</p>}
        </div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="ยืนยันการลบหนัง"
          confirmLabel="ลบหนัง"
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        >
          <p>ต้องการลบ <strong>{pendingDelete.titleTh || pendingDelete.title}</strong> หรือไม่?</p>
          <p className="mt-2">การลบจะลบรีวิว {pendingDelete.impact?.reviews ?? 0}, คะแนน {pendingDelete.impact?.votes ?? 0} และรายการอยากดู {pendingDelete.impact?.wishlist ?? 0} รายการที่เกี่ยวข้องด้วย</p>
          {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
        </ConfirmDialog>
      )}
    </section>
  );
}

export default AdminMovies;
