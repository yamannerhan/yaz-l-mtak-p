'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, AppChangeLog, Device, InstalledApp, formatDate } from '@/lib/api';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function AppsContent() {
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [changes, setChanges] = useState<AppChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed' | 'removed'>('all');

  useEffect(() => {
    api.getDevices()
      .then((d) => {
        setDevices(d);
        const fromUrl = searchParams.get('device');
        setSelectedDevice(fromUrl && d.find((x) => x.id === fromUrl) ? fromUrl : d[0]?.id || '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Cihazlar yüklenemedi'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const load = useCallback(
    async (silent = false) => {
      if (!selectedDevice) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const data = await api.getInstalledApps(selectedDevice);
        setApps(data.apps);
        setChanges(data.changes);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Veri yüklenemedi');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDevice]
  );

  useEffect(() => {
    if (selectedDevice) load();
  }, [selectedDevice, load]);

  useEffect(() => {
    if (!selectedDevice) return;
    const t = setInterval(() => load(true), 30_000);
    return () => clearInterval(t);
  }, [selectedDevice, load]);

  const filtered = apps.filter((a) => {
    if (filter === 'installed') return a.isInstalled;
    if (filter === 'removed') return !a.isInstalled;
    return true;
  });

  return (
    <PageShell
      title="Yüklü Uygulamalar"
      subtitle="Telefondaki uygulamalar ve yeni yüklenen / silinen kayıtlar"
      devices={devices}
      selectedDevice={selectedDevice}
      onDeviceChange={setSelectedDevice}
      loading={loading}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      hasDevices={devices.length > 0}
      emptyTitle="Uygulama listesi yok"
      emptyHint="Yeni APK (v1.0.8) kurulduktan sonra liste otomatik senkronize edilir."
      isEmpty={apps.length === 0 && changes.length === 0}
      extraFilters={
        <>
          <select className="input sm:max-w-[140px]" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">Tümü</option>
            <option value="installed">Yüklü</option>
            <option value="removed">Kaldırılmış</option>
          </select>
          <DataActions deviceId={selectedDevice} dataType="installed-apps" onChanged={() => load(true)} />
        </>
      }
    >
      {changes.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Son değişiklikler</h2>
          <div className="space-y-2">
            {changes.slice(0, 20).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-gray-100">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.appName || c.packageName}</p>
                  <p className="text-xs text-gray-500 truncate">{c.packageName}</p>
                </div>
                <span className={c.action === 'installed' ? 'app-chip-installed' : 'app-chip-removed'}>
                  {c.action === 'installed' ? '+ Yüklendi' : '− Silindi'}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(c.recordedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((app) => (
          <div key={app.id} className="data-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{app.appName}</p>
                <p className="text-xs text-gray-500 truncate mt-1">{app.packageName}</p>
              </div>
              <span className={app.isInstalled ? 'app-chip-installed' : 'app-chip-removed'}>
                {app.isInstalled ? 'Yüklü' : 'Silindi'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Güncelleme: {formatDate(app.updatedAt)}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default function AppsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AppsContent />
    </Suspense>
  );
}
