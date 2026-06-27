'use client';

import { useEffect, useState } from 'react';
import { api, Device, formatDate, onlineLabel } from '@/lib/api';

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.adminDevices().then(setDevices).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (device: Device) => {
    await api.adminUpdateDevice(device.id, { isActive: !device.isActive });
    load();
  };

  const startEdit = (device: Device) => {
    setEditingId(device.id);
    setEditName(device.deviceName);
    setError('');
  };

  const saveName = async (deviceId: string) => {
    const name = editName.trim();
    if (!name) {
      setError('Cihaz adı boş olamaz');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.adminUpdateDevice(deviceId, { deviceName: name });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tüm Cihazlar</h1>
      {error && <div className="error-banner mb-4">{error}</div>}
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
                <td className="p-4">
                  {editingId === d.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="input max-w-xs"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={saving}
                      />
                      <button
                        type="button"
                        className="btn-primary text-xs px-3 py-2"
                        disabled={saving}
                        onClick={() => saveName(d.id)}
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-xs px-3 py-2"
                        disabled={saving}
                        onClick={() => setEditingId(null)}
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{d.deviceName}</span>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => startEdit(d)}
                      >
                        Düzenle
                      </button>
                    </div>
                  )}
                </td>
                <td className="p-4">{d.user?.email}</td>
                <td className="p-4">{d.apkVersion}</td>
                <td className="p-4">
                  <span className={d.isActive ? 'badge-green' : 'badge-gray'}>
                    {d.isActive ? onlineLabel(d.lastSeen) : 'Devre dışı'}
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
