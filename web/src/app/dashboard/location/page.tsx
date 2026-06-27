'use client';

import { Suspense } from 'react';
import { api, LocationItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function LocationContent() {
  const page = useDevicePage<LocationItem>(api.getLocations);

  return (
    <PageShell
      title="Konum"
      subtitle="GPS konum geçmişi"
      emptyTitle="Konum kaydı yok"
      emptyHint="Konum izni verilmiş olmalı. Pil optimizasyonu kapalı olmalı."
      isEmpty={page.data.length === 0}
      {...page}
    >
      <div className="space-y-3">
        {page.data.map((l) => (
          <div key={l.id} className="data-card flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="font-mono text-sm">
                {l.latitude.toFixed(6)}, {l.longitude.toFixed(6)}
              </p>
              {l.accuracy != null && (
                <p className="text-xs text-gray-500">Doğruluk: ±{l.accuracy.toFixed(0)}m</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-gray-500">{formatDate(l.timestamp)}</p>
              <a
                href={`https://maps.google.com/?q=${l.latitude},${l.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline inline-block mt-1"
              >
                Haritada aç →
              </a>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LocationContent />
    </Suspense>
  );
}
