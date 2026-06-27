'use client';

import { Suspense } from 'react';
import { api, CallLog, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';

const typeLabel: Record<string, string> = {
  INCOMING: 'Gelen',
  OUTGOING: 'Giden',
  MISSED: 'Cevapsız',
};

function CallsContent() {
  const page = useDevicePage<CallLog>(api.getCalls);

  return (
    <PageShell
      title="Aramalar"
      subtitle="İsim ve numara birlikte — düzenli liste"
      emptyTitle="Arama kaydı yok"
      emptyHint="Arama kaydı izni verilmiş olmalı."
      isEmpty={page.data.length === 0}
      skeleton={<TableSkeleton />}
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="calls" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="space-y-3 lg:hidden">
        {page.data.map((c) => (
          <article key={c.id} className="call-card">
            <div className="flex justify-between gap-2 mb-2">
              <span className="badge-gray">{typeLabel[c.type] || c.type}</span>
              <span className="text-xs text-gray-500">{formatDate(c.timestamp)}</span>
            </div>
            <p className="font-semibold text-lg">{c.contactName || 'Bilinmeyen'}</p>
            <p className="font-mono text-indigo-700 mt-1">{c.number}</p>
            <p className="text-sm text-gray-500 mt-2">Süre: {c.durationSeconds} sn</p>
          </article>
        ))}
      </div>

      <div className="data-table-wrap hidden lg:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>İsim</th>
              <th>Numara</th>
              <th>Tür</th>
              <th>Süre</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {page.data.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold">{c.contactName || 'Bilinmeyen'}</td>
                <td className="font-mono text-indigo-700">{c.number}</td>
                <td>{typeLabel[c.type] || c.type}</td>
                <td>{c.durationSeconds}s</td>
                <td className="text-gray-500 whitespace-nowrap">{formatDate(c.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default function CallsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CallsContent />
    </Suspense>
  );
}
