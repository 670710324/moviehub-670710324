import {
  apiFetch,
  createAdminMovie,
  deleteAdminMovie,
  getAdminStats,
  getWishlist,
  login,
  addToWishlist,
  removeFromWishlist,
  postReview,
  setMemberRole,
} from './backend';

function fakeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  process.env.REACT_APP_API_URL = 'https://moviehub-api.test/';
  global.fetch = jest.fn();
});

test('GET ธรรมดาไม่มี body หรือ Authorization และคืน object ที่แปลงแล้ว', async () => {
  fetch.mockResolvedValue(fakeResponse(200, { items: [{ id: 1 }] }));

  await expect(apiFetch('/api/movies')).resolves.toEqual({ items: [{ id: 1 }] });
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('https://moviehub-api.test/api/movies');
  expect(options.method).toBe('GET');
  expect(options.body).toBeUndefined();
  expect(options.headers.Authorization).toBeUndefined();
});

test('ส่ง Bearer token และ body JSON ในคำขอที่ต้อง login', async () => {
  fetch.mockResolvedValue(fakeResponse(201, { id: 7 }));

  await postReview(969681, 'สนุกมาก ฉากแอ็กชันดี', 'abc123');

  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('https://moviehub-api.test/api/movies/969681/reviews');
  expect(options.method).toBe('POST');
  expect(options.headers.Authorization).toBe(`Bearer ${'abc123'}`);
  expect(options.headers['Content-Type']).toBe('application/json');
  expect(options.body).toBe(JSON.stringify({ text: 'สนุกมาก ฉากแอ็กชันดี' }));
});

test('204 คืน null โดยไม่เรียก res.json()', async () => {
  const res = fakeResponse(204, null);
  res.json = jest.fn();
  fetch.mockResolvedValue(res);

  const data = await apiFetch('/api/me/wishlist/1', { method: 'DELETE', token: 'abc' });

  expect(data).toBeNull();
  expect(res.json).not.toHaveBeenCalled();
});

test('อ่าน Go error envelope และแนบ code กับ status ใน Error', async () => {
  fetch.mockResolvedValue(fakeResponse(401, {
    error: { code: 'BAD_CREDENTIALS', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
  }));

  await expect(login('a@b.c', 'wrong')).rejects.toThrow('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  const err = await login('a@b.c', 'wrong').catch(error => error);
  expect(err.status).toBe(401);
  expect(err.code).toBe('BAD_CREDENTIALS');
});

test('ยังอ่าน error รูปแบบ string จาก mock เก่าได้', async () => {
  fetch.mockResolvedValue(fakeResponse(409, { error: 'อีเมลนี้ถูกใช้แล้ว' }));
  await expect(login('a@b.c', 'wrong')).rejects.toThrow('อีเมลนี้ถูกใช้แล้ว');
});

test('admin API แนบ Bearer token และส่ง method, path, body ถูกต้อง', async () => {
  fetch
    .mockResolvedValueOnce(fakeResponse(200, { movies: 1 }))
    .mockResolvedValueOnce(fakeResponse(200, { id: 8, role: 'admin' }))
    .mockResolvedValueOnce(fakeResponse(201, { id: 99 }));

  await getAdminStats('admin-jwt');
  await setMemberRole(8, 'admin', 'admin-jwt');
  await createAdminMovie({ id: 0, title: 'New movie' }, 'admin-jwt');

  expect(fetch.mock.calls[0][0]).toBe('https://moviehub-api.test/api/admin/stats');
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${'admin-jwt'}`);
  expect(fetch.mock.calls[1][0]).toBe('https://moviehub-api.test/api/admin/members/8/role');
  expect(fetch.mock.calls[1][1]).toMatchObject({
    method: 'PUT',
    headers: { Authorization: `Bearer ${'admin-jwt'}` },
    body: JSON.stringify({ role: 'admin' }),
  });
  expect(fetch.mock.calls[2][0]).toBe('https://moviehub-api.test/api/admin/movies');
  expect(fetch.mock.calls[2][1]).toMatchObject({
    method: 'POST',
    headers: { Authorization: `Bearer ${'admin-jwt'}` },
    body: JSON.stringify({ id: 0, title: 'New movie' }),
  });
});

test('ลบหนังด้วย DELETE และจัดการ 204 response', async () => {
  fetch.mockResolvedValue(fakeResponse(204, null));

  await expect(deleteAdminMovie(22, 'admin-jwt')).resolves.toBeNull();

  expect(fetch.mock.calls[0][0]).toBe('https://moviehub-api.test/api/admin/movies/22');
  expect(fetch.mock.calls[0][1]).toMatchObject({
    method: 'DELETE',
    headers: { Authorization: `Bearer ${'admin-jwt'}` },
  });
});

test('PUT wishlist ส่ง JSON object ที่ backend Go ต้องอ่าน', async () => {
  fetch.mockResolvedValue(fakeResponse(204, null));
  await addToWishlist(18, 'member-jwt');

  expect(fetch.mock.calls[0][1]).toMatchObject({
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${'member-jwt'}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
});

test('wishlist ใช้ MovieHub API URL และแนบ token ให้ GET และ DELETE', async () => {
  fetch
    .mockResolvedValueOnce(fakeResponse(200, { items: [{ id: 18 }] }))
    .mockResolvedValueOnce(fakeResponse(204, null));

  await getWishlist('member-jwt');
  await removeFromWishlist(18, 'member-jwt');

  expect(fetch.mock.calls[0]).toEqual([
    'https://moviehub-api.test/api/me/wishlist',
    expect.objectContaining({
      method: 'GET',
      headers: { Authorization: 'Bearer member-jwt' },
    }),
  ]);
  expect(fetch.mock.calls[1]).toEqual([
    'https://moviehub-api.test/api/me/wishlist/18',
    expect.objectContaining({
      method: 'DELETE',
      headers: { Authorization: 'Bearer member-jwt' },
    }),
  ]);
});

test('ไม่เรียก relative URL หรือ mock เมื่อไม่ได้ตั้ง REACT_APP_API_URL', async () => {
  delete process.env.REACT_APP_API_URL;

  await expect(apiFetch('/api/movies')).rejects.toThrow('ยังไม่ได้ตั้งค่า REACT_APP_API_URL');
  expect(fetch).not.toHaveBeenCalled();
});

test('non-JSON error ได้ข้อความที่อ่านเข้าใจได้แทน SyntaxError', async () => {
  fetch.mockResolvedValue({
    ok: false,
    status: 404,
    json: () => Promise.reject(new SyntaxError('Unexpected token <')),
  });

  await expect(apiFetch('/api/movies')).rejects.toThrow('server ไม่ได้ตอบเป็น JSON');
});
