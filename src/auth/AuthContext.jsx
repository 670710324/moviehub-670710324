import { createContext, useContext, useState } from 'react';
import * as api from '../api/backend';

// Context = "กล่องกลาง" ที่ component ไหนในแอปก็เอื้อมมาหยิบได้ ไม่ต้องส่ง props ต่อกันเป็นทอด ๆ
// เราใส่สถานะ login ไว้ในนี้ เพราะ Navbar, MovieDetail, Wishlist ต้องรู้เหมือนกันหมดว่าใครล็อกอินอยู่
const AuthContext = createContext(null);

const TOKEN_KEY = 'moviehub.token';
const MEMBER_KEY = 'moviehub.member';

function readSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawMember = localStorage.getItem(MEMBER_KEY);
  if (!token || !rawMember) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
    return { token: null, member: null };
  }

  try {
    const member = JSON.parse(rawMember);
    if (!member || typeof member !== 'object' || Array.isArray(member)) {
      throw new Error('Invalid stored member');
    }
    return { token, member };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
    return { token: null, member: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const { token, member } = session;

  function remember({ token, member }) {
    setSession({ token, member });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  }

  async function login(email, password) {
    const data = await api.login(email, password);   // ถ้าผิด backend.js จะ throw
    remember(data);
  }

  async function register(email, password, displayName) {
    await api.register(email, password, displayName);
    await login(email, password);                    // สมัครเสร็จล็อกอินให้เลย
  }

  function logout() {
    setSession({ token: null, member: null });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
  }

  const value = { token, member, isLoggedIn: Boolean(token), login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook สั้น ๆ ให้ทุกหน้าเรียก useAuth() แทนที่จะต้อง import Context เอง
export function useAuth() {
  return useContext(AuthContext);
}
