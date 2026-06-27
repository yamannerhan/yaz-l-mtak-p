'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const LABELS: Record<string, string> = {
  calls: 'aramalar',
  sms: 'SMS',
  notifications: 'bildirimler',
  locations: 'konumlar',
  'web-history': 'internet geçmişi',
  'input-logs': 'yazılan metinler',
  media: 'medya',
  'installed-apps': 'uygulama listesi',
};

export function DataActions({
  deviceId,
  dataType,
  onChanged,
}: {
  deviceId: string;
  dataType: string;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);

  const exportData = async () => {
    setBusy('export');
    try {
      await api.exportData(deviceId, dataType);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'İndirme başarısız');
    } finally {
      setBusy(null);
    }
  };

  const deleteData = async () => {
    const label = LABELS[dataType] || dataType;
    if (!confirm(`Bu cihazın tüm ${label} verilerini silmek istediğinize emin misiniz?`)) return;
    setBusy('delete');
    try {
      await api.deleteData(dataType, deviceId);
      onChanged?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Silme başarısız');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        onClick={exportData}
        disabled={!!busy || !deviceId}
        className="btn-secondary text-xs px-3 py-2"
      >
        {busy === 'export' ? '...' : '⬇ İndir'}
      </button>
      <button
        type="button"
        onClick={deleteData}
        disabled={!!busy || !deviceId}
        className="btn-danger text-xs px-3 py-2"
      >
        {busy === 'delete' ? '...' : '🗑 Sil'}
      </button>
    </div>
  );
}
