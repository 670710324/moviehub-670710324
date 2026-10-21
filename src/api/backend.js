const BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('server ไม่ได้ตอบเป็น JSON');
  }

  if (!res.ok) {
    const message = typeof data?.error === 'string'
      ? data.error
      : data?.error?.message;
    const error = new Error(message || `server ตอบกลับ ${res.status}`);
    error.status = res.status;
    error.code = data?.error?.code;
    throw error;
  }
  return data;
}

// ---------- สมาชิก ----------
export function register(email, password, displayName) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
  });
}
export function login(email, password) {
  return apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
}
export function getMe(token) {
  return apiFetch('/api/me', { token });
}

// ---------- รีวิว ----------
export function getReviews(movieId) {
  return apiFetch(`/api/movies/${movieId}/reviews`);
}
export function postReview(movieId, text, token) {
  return apiFetch(`/api/movies/${movieId}/reviews`, { method: 'POST', body: { text }, token });
}

// ---------- คะแนน ----------
export function putVote(movieId, score, token) {
  return apiFetch(`/api/movies/${movieId}/vote`, { method: 'PUT', body: { score }, token });
}

// ---------- Wishlist ----------
export function getWishlist(token) {
  return apiFetch('/api/me/wishlist', { token });
}
export function addToWishlist(movieId, token) {
  return apiFetch(`/api/me/wishlist/${movieId}`, { method: 'PUT', body: {}, token });
}
export function removeFromWishlist(movieId, token) {
  return apiFetch(`/api/me/wishlist/${movieId}`, { method: 'DELETE', token });
}

// ---------- หนัง ----------
export async function getMovies() {
  const data = await apiFetch('/api/movies');
  return data.items;
}
export async function getMovie(movieId) {
  return apiFetch(`/api/movies/${movieId}`);
}

// ---------- หลังบ้าน ----------
export function getAdminStats(token) {
  return apiFetch('/api/admin/stats', { token });
}
export async function getAdminMembers(token) {
  const data = await apiFetch('/api/admin/members', { token });
  return data.items;
}
export function setMemberRole(memberId, role, token) {
  return apiFetch(`/api/admin/members/${memberId}/role`, {
    method: 'PUT',
    body: { role },
    token,
  });
}
export async function getGenres() {
  const data = await apiFetch('/api/genres');
  return data.items;
}
export function getAdminMovie(movieId, token) {
  return apiFetch(`/api/admin/movies/${movieId}`, { token });
}
export function createAdminMovie(movie, token) {
  return apiFetch('/api/admin/movies', { method: 'POST', body: movie, token });
}
export function updateAdminMovie(movieId, movie, token) {
  return apiFetch(`/api/admin/movies/${movieId}`, { method: 'PUT', body: movie, token });
}
export function deleteAdminMovie(movieId, token) {
  return apiFetch(`/api/admin/movies/${movieId}`, { method: 'DELETE', token });
}
