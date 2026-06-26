'use client';

import { useEffect, useState } from 'react';
import { api, AdminUser } from '@/lib/api';
import { formatDate } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [error, setError] = useState('');

  const load = () => api.adminUsers().then(setUsers).catch(console.error);

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.adminCreateUser(email, password, role);
      setShowForm(false);
      setEmail('');
      setPassword('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    }
  };

  const toggleActive = async (user: AdminUser) => {
    await api.adminUpdateUser(user.id, { isActive: !user.isActive });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Kullanıcı'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4 max-w-md">
          <input className="input" type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="parent">Ebeveyn</option>
            <option value="admin">Admin</option>
          </select>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="btn-primary">Oluştur</button>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">E-posta</th>
              <th className="text-left p-4">Rol</th>
              <th className="text-left p-4">Cihaz</th>
              <th className="text-left p-4">Durum</th>
              <th className="text-left p-4">Kayıt</th>
              <th className="text-left p-4">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-4 font-medium">{u.email}</td>
                <td className="p-4">{u.role}</td>
                <td className="p-4">{u._count.devices}</td>
                <td className="p-4">
                  <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                    {u.isActive ? 'Aktif' : 'Askıda'}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{formatDate(u.createdAt)}</td>
                <td className="p-4">
                  <button className="text-sm text-primary hover:underline" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Askıya al' : 'Aktifleştir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
