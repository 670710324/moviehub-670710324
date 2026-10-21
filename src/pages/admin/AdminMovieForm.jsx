import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { createAdminMovie, getAdminMovie, getGenres, updateAdminMovie } from '../../api/backend';

const emptyMovie = {
  id: '',
  title: '',
  titleTh: '',
  originalTitle: '',
  originalLanguage: 'en',
  overview: '',
  overviewTh: '',
  posterPath: '',
  releaseDate: '',
  genreId: '',
};

function AdminMovieForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(emptyMovie);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [genreItems, current] = await Promise.all([
          getGenres(),
          editing ? getAdminMovie(id, token) : Promise.resolve(null),
        ]);
        if (ignore) return;
        setGenres(genreItems);
        if (current) {
          setMovie({
            id: '',
            title: current.title || '',
            titleTh: current.titleTh || '',
            originalTitle: current.originalTitle || '',
            originalLanguage: current.originalLanguage || 'en',
            overview: current.overview || '',
            overviewTh: current.overviewTh || '',
            posterPath: current.posterPath || '',
            releaseDate: current.releaseDate || '',
            genreId: current.genreId == null ? '' : String(current.genreId),
          });
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [editing, id, token]);

  function updateField(event) {
    const { name, value } = event.target;
    setMovie(current => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...(editing ? {} : { id: movie.id ? Number(movie.id) : 0 }),
      title: movie.title.trim(),
      titleTh: movie.titleTh.trim() || null,
      originalTitle: movie.originalTitle.trim(),
      originalLanguage: movie.originalLanguage.trim().toLowerCase(),
      overview: movie.overview.trim() || null,
      overviewTh: movie.overviewTh.trim() || null,
      posterPath: movie.posterPath.trim() || null,
      releaseDate: movie.releaseDate || null,
      genreId: movie.genreId ? Number(movie.genreId) : null,
    };
    try {
      if (editing) await updateAdminMovie(id, payload, token);
      else await createAdminMovie(payload, token);
      navigate('/admin/movies', { state: { message: editing ? 'บันทึกการแก้ไขหนังแล้ว' : 'เพิ่มหนังเรียบร้อยแล้ว' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';
  const field = (name, label, options = {}) => (
    <label className={`block text-sm text-slate-700 ${options.className || ''}`} htmlFor={name}>
      {label}
      {options.multiline ? (
        <textarea id={name} name={name} value={movie[name]} onChange={updateField} rows={options.rows || 3} maxLength={options.maxLength} className={inputClass} />
      ) : (
        <input id={name} name={name} type={options.type || 'text'} value={movie[name]} onChange={updateField} required={options.required} maxLength={options.maxLength} min={options.min} className={inputClass} />
      )}
    </label>
  );

  if (loading) return <p className="rounded-xl bg-white p-6 text-sm text-slate-500">กำลังโหลดข้อมูลฟอร์ม...</p>;

  return (
    <section className="rounded-xl border border-emerald-100 bg-white p-5 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{editing ? 'แก้ไขข้อมูลหนัง' : 'เพิ่มหนังใหม่'}</h2>
          <p className="mt-1 text-sm text-slate-500">ช่องที่จำเป็นและกฎข้อมูลจะถูกตรวจซ้ำโดย backend</p>
        </div>
        <Link to="/admin/movies" className="shrink-0 text-sm text-emerald-700 hover:underline">กลับรายการ</Link>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        {!editing && field('id', 'รหัสหนัง (เว้นว่างให้ระบบกำหนด)', { type: 'number', min: 0 })}
        {field('title', 'ชื่อเรื่อง *', { required: true, maxLength: 255 })}
        {field('titleTh', 'ชื่อภาษาไทย')}
        {field('originalTitle', 'ชื่อเรื่องต้นฉบับ')}
        {field('originalLanguage', 'รหัสภาษา (เช่น en, th)', { required: true, maxLength: 2 })}
        <label htmlFor="genreId" className="block text-sm text-slate-700">
          แนวหลัก
          <select id="genreId" name="genreId" value={movie.genreId} onChange={updateField} className={inputClass}>
            <option value="">ไม่ระบุ</option>
            {genres.map(genre => <option key={genre.id} value={genre.id}>{genre.nameTh || genre.nameEn} ({genre.nameEn})</option>)}
          </select>
        </label>
        {field('releaseDate', 'วันฉาย', { type: 'date' })}
        {field('posterPath', 'โปสเตอร์ (TMDB path หรือ URL เต็ม)', { className: 'md:col-span-2' })}
        {field('overview', 'เรื่องย่อต้นฉบับ', { multiline: true, className: 'md:col-span-2' })}
        {field('overviewTh', 'เรื่องย่อภาษาไทย', { multiline: true, className: 'md:col-span-2' })}
        <div className="flex gap-3 pt-2 md:col-span-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <Link to="/admin/movies" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">ยกเลิก</Link>
        </div>
      </form>
    </section>
  );
}

export default AdminMovieForm;
