import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getAdminMembers, setMemberRole } from '../../api/backend';

function AdminMembers() {
  const { token, member } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingChange, setPendingChange] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMembers(await getAdminMembers(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  async function confirmRoleChange() {
    setSaving(true);
    setError('');
    try {
      const updated = await setMemberRole(pendingChange.id, pendingChange.role, token);
      setMembers(current => current.map(person => person.id === updated.id ? updated : person));
      setPendingChange(null);
    } catch (err) {
      setPendingChange(null);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-emerald-100 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">สมาชิก</h2>
          <p className="mt-1 text-sm text-slate-500">เปลี่ยนบทบาทสมาชิกได้ โดยไม่สามารถเปลี่ยนบทบาทของบัญชีตัวเอง</p>
        </div>
        <button type="button" onClick={loadMembers} className="rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">โหลดใหม่</button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-slate-500">กำลังโหลดสมาชิก...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-3">ชื่อ</th><th className="px-3 py-3">อีเมล</th><th className="px-3 py-3">สมัครเมื่อ</th><th className="px-3 py-3">บทบาท</th><th className="px-3 py-3">จัดการ</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(person => {
                const isSelf = String(person.id) === String(member?.id);
                const role = person.role === 'admin' ? 'member' : 'admin';
                return (
                  <tr key={person.id}>
                    <td className="px-3 py-3 font-medium text-slate-800">{person.displayName}{isSelf && <span className="ml-2 text-xs text-slate-400">(คุณ)</span>}</td>
                    <td className="px-3 py-3 text-slate-600">{person.email}</td>
                    <td className="px-3 py-3 text-slate-600">{person.createdAt ? new Date(person.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{person.role}</span></td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => setPendingChange({ id: person.id, name: person.displayName, from: person.role, role })}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        เปลี่ยนเป็น {role}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!members.length && <p className="py-6 text-center text-sm text-slate-500">ไม่พบสมาชิก</p>}
        </div>
      )}
      {pendingChange && (
        <ConfirmDialog
          title="ยืนยันการเปลี่ยนบทบาท"
          confirmLabel="เปลี่ยนบทบาท"
          busy={saving}
          onCancel={() => setPendingChange(null)}
          onConfirm={confirmRoleChange}
        >
          เปลี่ยนบทบาทของ <strong>{pendingChange.name}</strong> จาก {pendingChange.from} เป็น {pendingChange.role}?
        </ConfirmDialog>
      )}
    </section>
  );
}

export default AdminMembers;
