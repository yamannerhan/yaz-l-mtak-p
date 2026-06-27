'use client';

import { Suspense } from 'react';
import { api, CallLog, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
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
      subtitle="Gelen, giden ve cevapsız aramalar"
      emptyTitle="Arama kaydı yok"
      emptyHint="Telefonda arama kaydı izni verilmiş olmalı. Veriler 30 saniyede bir yüklenir."
      isEmpty={page.data.length === 0}
      skeleton={<TableSkeleton />}
      {...page}
    >
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Numara</th>
              <th>Tür</th>
              <th>Süre</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {page.data.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.contactName || c.number}</td>
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
