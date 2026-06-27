'use client';

import { Suspense } from 'react';
import { api, SmsMessage, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
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
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="sms" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {page.data.map((m) => (
          <article key={m.id} className="message-card">
            <div className="message-card-meta border-0 pt-0 mt-0 mb-2">
              <span className="font-semibold text-sky-700">{m.address}</span>
              <span className="badge-gray">{m.type}</span>
              <span className="ml-auto">{formatDate(m.timestamp)}</span>
            </div>
            <p className="message-card-text">{m.body}</p>
          </article>
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
