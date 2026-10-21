import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { addToWishlist, getWishlist, putVote, removeFromWishlist } from '../api/backend';

// แถบปุ่มใต้ชื่อหนัง: ให้คะแนน 1 ถึง 10 และปุ่มเพิ่มเข้า wishlist (ต้อง login)
function MovieActions({ movieId }) {
  const { isLoggedIn, token } = useAuth();
  const [myScore, setMyScore] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let ignore = false;
    async function loadWishlist() {
      setWishlistLoading(true);
      setWishlistLoaded(false);
      setWishlistError(null);
      try {
        const data = await getWishlist(token);
        if (!Array.isArray(data?.items)) {
          throw new Error('รูปแบบข้อมูลรายการที่อยากดูจาก API ไม่ถูกต้อง');
        }
        const saved = data.items.some(item => {
          const id = item && typeof item === 'object' ? item.id ?? item.movieId : item;
          return id != null && String(id) === String(movieId);
        });
        if (!ignore) {
          setInWishlist(saved);
          setWishlistLoaded(true);
        }
      } catch (err) {
        if (!ignore) setWishlistError(err);
      } finally {
        if (!ignore) setWishlistLoading(false);
      }
    }
    loadWishlist();

    return () => { ignore = true; };
  }, [movieId, token, reloadKey]);

  if (!isLoggedIn) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        <Link to="/login" className="text-emerald-600 hover:underline">เข้าสู่ระบบ</Link> เพื่อให้คะแนนและเพิ่มเข้ารายการที่อยากดู
      </p>
    );
  }

  async function handleVote(score) {
    try {
      await putVote(movieId, score, token);
      setMyScore(score);
      setMessage(null);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleWishlist() {
    setWishlistLoading(true);
    setWishlistError(null);
    try {
      if (inWishlist) {
        await removeFromWishlist(movieId, token);
        setInWishlist(false);
      } else {
        await addToWishlist(movieId, token);
        setInWishlist(true);
      }
      setWishlistLoaded(true);
    } catch (err) {
      setWishlistError(err);
    } finally {
      setWishlistLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-2 text-sm text-slate-500">ให้คะแนน</span>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => handleVote(n)}
                  className={'h-8 w-8 rounded-lg border text-sm ' +
                    (myScore === n ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50')}>
            {n}
          </button>
        ))}
      </div>
      <button onClick={handleWishlist} disabled={!wishlistLoaded || wishlistLoading}
              className={'rounded-lg border px-4 py-2 text-sm ' +
                (inWishlist ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50') +
                (!wishlistLoaded || wishlistLoading ? ' cursor-wait opacity-60' : '')}>
        {!wishlistLoaded
          ? 'กำลังโหลดสถานะ...'
          : inWishlist ? '❤️ อยู่ในรายการที่อยากดูแล้ว' : '🤍 เพิ่มเข้ารายการที่อยากดู'}
      </button>
      {wishlistError && (
        <div>
          <p role="alert" className="text-sm text-red-600">{wishlistError.message}</p>
          {!wishlistLoaded && (
            <button type="button" onClick={() => setReloadKey(key => key + 1)}
                    className="mt-1 text-sm text-emerald-700 hover:underline">
              ลองโหลดสถานะใหม่
            </button>
          )}
        </div>
      )}
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  );
}

export default MovieActions;
