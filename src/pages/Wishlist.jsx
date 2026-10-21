import { useEffect, useState } from 'react';
import MovieGrid from '../components/MovieGrid';
import { useAuth } from '../auth/AuthContext';
import { getMovies, getWishlist } from '../api/backend';

// หน้า "รายการที่อยากดู" ของสมาชิกที่ login อยู่ (เส้นทาง /me/wishlist ครอบด้วย ProtectedRoute แล้ว)
function Wishlist() {
  const { member, token } = useAuth();
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const [wishlist, catalog] = await Promise.all([getWishlist(token), getMovies()]);
        if (!Array.isArray(wishlist?.items)) {
          throw new Error('รูปแบบข้อมูลรายการที่อยากดูจาก API ไม่ถูกต้อง');
        }
        const moviesById = new Map(catalog.map(movie => [String(movie.id), movie]));
        const savedMovies = wishlist.items
          .map(item => {
            const id = item && typeof item === 'object' ? item.id ?? item.movieId : item;
            return id == null ? null : moviesById.get(String(id));
          })
          .filter(Boolean);
        if (!ignore) {
          setMovies(savedMovies);
          setStatus('success');
        }
      } catch (err) {
        if (!ignore) {
          setError(err);
          setStatus('error');
        }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">รายการที่อยากดูของ {member?.displayName}</h1>
      <p className="mb-6 text-sm text-slate-500">กดปุ่มหัวใจในหน้าหนังเพื่อเพิ่มเรื่องเข้ามาที่นี่</p>
      <MovieGrid movies={movies} status={status} error={error}
                 onRetry={() => setReloadKey(key => key + 1)} />
    </div>
  );
}

export default Wishlist;
