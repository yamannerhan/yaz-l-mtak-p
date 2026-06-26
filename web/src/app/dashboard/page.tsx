'use client';

import { useEffect, useState } from 'react';
import { api, Device, isOnline, formatDate } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDevices()
      .then(setDevices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {devices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">Henüz bağlı cihaz yok</p>
          <p className="text-sm text-gray-400">
            APK&apos;yı telefona kurun ve kurulumda bu hesabın e-postasını girin
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <div key={device.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{device.deviceName}</h3>
                  <p className="text-sm text-gray-500">v{device.apkVersion}</p>
                </div>
                <span className={isOnline(device.lastSeen) ? 'badge-green' : 'badge-gray'}>
                  {isOnline(device.lastSeen) ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Son görülme: {device.lastSeen ? formatDate(device.lastSeen) : 'Hiç'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/dashboard/calls?device=${device.id}`} className="btn-secondary text-xs">
                  Aramalar
                </Link>
                <Link href={`/dashboard/sms?device=${device.id}`} className="btn-secondary text-xs">
                  SMS
                </Link>
                <Link href={`/dashboard/notifications?device=${device.id}`} className="btn-secondary text-xs">
                  Bildirimler
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
