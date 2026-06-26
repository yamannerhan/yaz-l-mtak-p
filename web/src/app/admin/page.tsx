'use client';

import { useEffect, useState } from 'react';
import { api, AdminStats } from '@/lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.adminStats().then(setStats).catch(console.error);
  }, []);

  const cards = stats
    ? [
        { label: 'Ebeveyn Hesapları', value: stats.userCount },
        { label: 'Toplam Cihaz', value: stats.deviceCount },
        { label: 'Aktif Cihaz (24s)', value: stats.activeDevices },
        { label: 'Arama Kayıtları', value: stats.callCount },
        { label: 'SMS Kayıtları', value: stats.smsCount },
        { label: 'Bildirim Kayıtları', value: stats.notificationCount },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sistem İstatistikleri</h1>
      {!stats ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="card">
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-3xl font-bold mt-2">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
