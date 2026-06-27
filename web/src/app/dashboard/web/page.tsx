'use client';

import { Suspense } from 'react';
import { api, WebHistoryItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function WebContent() {
  const page = useDevicePage<WebHistoryItem>(api.getWebHistory);

  return (
    <PageShell
      title="İnternet Geçmişi"
      subtitle="Ziyaret edilen siteler ve adresler"
      emptyTitle="İnternet kaydı yok"
      emptyHint="Telefonda Ayarlar → Erişilebilirlik → Aile Takip servisini AÇIN. Chrome'da gezinince kayıtlar gelir."
      isEmpty={page.data.length === 0}
      {...page}
    >
      <div className="space-y-2">
        {page.data.map((e) => (
          <div key={e.id} className="data-card py-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <a
                href={e.url.startsWith('http') ? e.url : `https://${e.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all font-medium text-sm"
              >
                {e.url}
              </a>
              <span className="text-xs text-gray-500 shrink-0">{formatDate(e.timestamp)}</span>
            </div>
            {e.title && <p className="text-sm text-gray-600 mt-1">{e.title}</p>}
            <span className="badge-gray mt-2">{e.browserName || e.browserPackage}</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default function WebHistoryPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <WebContent />
    </Suspense>
  );
}
