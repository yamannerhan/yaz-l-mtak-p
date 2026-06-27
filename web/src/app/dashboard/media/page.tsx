'use client';

import { Suspense, useCallback, useState } from 'react';
import { api, MediaItem, formatDate, mediaFullUrl } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const typeLabels: Record<string, string> = {
  screenshot: 'Ekran Görüntüsü',
  camera_front: 'Ön Kamera',
  camera_back: 'Arka Kamera',
};

function MediaContent() {
  const [filter, setFilter] = useState('');
  const fetchMedia = useCallback(
    (deviceId: string) => api.getMedia(deviceId, filter || undefined),
    [filter]
  );
  const page = useDevicePage<MediaItem>(fetchMedia);

  return (
    <PageShell
      title="Ekran ve Kamera"
      subtitle="Periyodik ekran görüntüsü ve kamera fotoğrafları"
      emptyTitle="Medya kaydı yok"
      emptyHint="Erişilebilirlik ve kamera izni gerekli."
      isEmpty={page.data.length === 0}
      extraFilters={
        <>
          <select className="input max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tümü</option>
            <option value="screenshot">Ekran</option>
            <option value="camera_front">Ön Kamera</option>
            <option value="camera_back">Arka Kamera</option>
          </select>
          <DataActions deviceId={page.selectedDevice} dataType="media" onChanged={page.onRefresh} />
        </>
      }
      {...page}
    >
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {page.data.map((m) => (
          <div key={m.id} className="data-card p-0 overflow-hidden">
            <img
              src={mediaFullUrl(m.fileUrl)}
              alt={m.type}
              className="w-full h-44 sm:h-48 object-cover bg-gray-100"
              loading="lazy"
            />
            <div className="p-4">
              <span className="badge-gray">{typeLabels[m.type] || m.type}</span>
              <p className="text-xs text-gray-500 mt-2">{formatDate(m.timestamp)}</p>
              <a
                href={mediaFullUrl(m.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline mt-2 inline-block"
              >
                Büyük aç →
              </a>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MediaContent />
    </Suspense>
  );
}
