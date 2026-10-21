import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getAdminStats } from '../../api/backend';

const cards = [
  ['movies', 'หนังทั้งหมด'],
  ['members', 'สมาชิก'],
  ['admins', 'ผู้ดูแลระบบ'],
  ['votes', 'คะแนนโหวต'],
  ['wishlistItems', 'รายการอยากดู'],
];

function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getAdminStats(token)
      .then(data => {
        if (!ignore) setStats(data);
      })
      .catch(err => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [token]);

  if (loading) return <p className="rounded-xl bg-white p-6 text-sm text-slate-500">กำลังโหลด Dashboard...</p>;
  if (error) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;

  return (
    <div className="space-y-8">
      <section aria-label="สถิติ MovieHub" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([key, label]) => (
          <article key={key} className="rounded-xl border border-emerald-100 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats[key] ?? 0}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-emerald-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">สมาชิกใหม่</h2>
            <Link to="/admin/members" className="text-sm text-emerald-700 hover:underline">ดูสมาชิกทั้งหมด</Link>
          </div>
          {stats.newestMembers?.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {stats.newestMembers.map(person => (
                <li key={person.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="truncate text-slate-800">{person.displayName} <span className="text-slate-400">({person.email})</span></span>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{person.role}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-slate-500">ยังไม่มีข้อมูลสมาชิก</p>}
        </article>

        <article className="rounded-xl border border-emerald-100 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">หนังที่ได้รับคะแนนสูง</h2>
          {stats.topVoted?.length ? (
            <ol className="mt-4 divide-y divide-slate-100">
              {stats.topVoted.map(movie => (
                <li key={movie.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="truncate text-slate-800">{movie.titleTh || movie.title}</span>
                  <span className="shrink-0 text-amber-600">★ {movie.voteAverage} ({movie.voteCount})</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-4 text-sm text-slate-500">ยังไม่มีคะแนนจากสมาชิก</p>}
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;
