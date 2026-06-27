'use client';

import { useEffect, useState } from 'react';
import { api, AdminUser, formatDate } from '@/lib/api';

const PLANS = [
  { id: 'trial', label: 'Deneme (1 gün)' },
  { id: 'daily', label: 'Günlük' },
  { id: 'weekly', label: 'Haftalık' },
  { id: 'monthly', label: 'Aylık' },
  { id: 'yearly', label: 'Yıllık' },
  { id: 'lifetime', label: 'Süresiz' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [plan, setPlan] = useState('trial');
  const [menuPin, setMenuPin] = useState('8255');
  const [error, setError] = useState('');

  const load = () => api.adminUsers().then(setUsers).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.adminCreateUser(email, password, role, plan, menuPin);
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

  const renewPlan = async (user: AdminUser, subscriptionPlan: string) => {
    await api.adminUpdateUser(user.id, { subscriptionPlan });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Kullanıcı'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4 max-w-lg">
          <input className="input" type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="parent">Ebeveyn</option>
            <option value="admin">Admin</option>
          </select>
          <select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <input className="input" placeholder="Menü PIN (4-8 hane)" value={menuPin} onChange={(e) => setMenuPin(e.target.value)} maxLength={8} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="btn-primary">Oluştur</button>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">E-posta</th>
              <th className="text-left p-4">Plan</th>
              <th className="text-left p-4">Bitiş</th>
              <th className="text-left p-4">PIN</th>
              <th className="text-left p-4">Cihaz</th>
              <th className="text-left p-4">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-4 font-medium">{u.email}</td>
                <td className="p-4">
                  <select
                    className="input text-xs py-1"
                    value={u.subscriptionPlan || 'trial'}
                    onChange={(e) => renewPlan(u, e.target.value)}
                  >
                    {PLANS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-gray-500">
                  {u.subscriptionExpiresAt ? formatDate(u.subscriptionExpiresAt) : 'Süresiz'}
                </td>
                <td className="p-4 font-mono">{u.menuPin || '-'}</td>
                <td className="p-4">{u._count.devices}</td>
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
