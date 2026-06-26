'use client';

import { useEffect, useState } from 'react';
import { api, Device, formatDate, isOnline } from '@/lib/api';

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);

  const load = () => api.adminDevices().then(setDevices).catch(console.error);

  useEffect(() => { load(); }, []);

  const toggleActive = async (device: Device) => {
    await api.adminUpdateDevice(device.id, !device.isActive);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tüm Cihazlar</h1>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Cihaz</th>
              <th className="text-left p-4">E-posta</th>
              <th className="text-left p-4">Sürüm</th>
              <th className="text-left p-4">Durum</th>
              <th className="text-left p-4">Son Görülme</th>
              <th className="text-left p-4">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="p-4 font-medium">{d.deviceName}</td>
                <td className="p-4">{d.user?.email}</td>
                <td className="p-4">{d.apkVersion}</td>
                <td className="p-4">
                  <span className={isOnline(d.lastSeen) ? 'badge-green' : 'badge-gray'}>
                    {d.isActive ? (isOnline(d.lastSeen) ? 'Çevrimiçi' : 'Çevrimdışı') : 'Devre dışı'}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{d.lastSeen ? formatDate(d.lastSeen) : '-'}</td>
                <td className="p-4">
                  <button className="text-sm text-primary hover:underline" onClick={() => toggleActive(d)}>
                    {d.isActive ? 'Devre dışı bırak' : 'Aktifleştir'}
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
