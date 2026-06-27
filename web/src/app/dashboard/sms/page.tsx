'use client';

import { Suspense } from 'react';
import { api, SmsMessage, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function SmsContent() {
  const page = useDevicePage<SmsMessage>(api.getSms);

  return (
    <PageShell
      title="SMS Mesajları"
      subtitle="Gelen ve giden SMS kayıtları"
      emptyTitle="SMS kaydı yok"
      emptyHint="SMS okuma izni verilmiş olmalı."
      isEmpty={page.data.length === 0}
      {...page}
    >
      <div className="space-y-3">
        {page.data.map((m) => (
          <div key={m.id} className="data-card">
            <div className="flex justify-between gap-3 mb-2">
              <span className="font-medium truncate">{m.address}</span>
              <span className="text-xs text-gray-500 shrink-0">{formatDate(m.timestamp)}</span>
            </div>
            <p className="text-gray-700 text-sm break-words">{m.body}</p>
            <span className="badge-gray mt-2">{m.type}</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default function SmsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SmsContent />
    </Suspense>
  );
}
