'use client';

import { Suspense } from 'react';
import { api, ContactItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function ContactsContent() {
  const page = useDevicePage<ContactItem>(api.getContacts);

  return (
    <PageShell
      title="Rehber"
      subtitle="Telefondaki kişiler ve numaralar"
      emptyTitle="Rehber boş"
      emptyHint="Rehber izni verilmiş olmalı (APK v1.1.0)."
      isEmpty={page.data.length === 0}
      skeleton={<LoadingSkeleton rows={4} />}
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="contacts" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {page.data.map((c) => (
          <article key={c.id} className="data-card">
            <p className="font-semibold text-lg">{c.name}</p>
            <p className="font-mono text-indigo-700 mt-1">{c.phoneNumber}</p>
            <p className="text-xs text-gray-400 mt-2">Güncelleme: {formatDate(c.updatedAt)}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ContactsContent />
    </Suspense>
  );
}
