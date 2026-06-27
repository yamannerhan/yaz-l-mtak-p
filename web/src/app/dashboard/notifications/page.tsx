'use client';

import { Suspense } from 'react';
import { api, NotificationItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

function NotificationsContent() {
  const page = useDevicePage<NotificationItem>(api.getNotifications);

  return (
    <PageShell
      title="Bildirimler"
      subtitle="WhatsApp, Telegram, Instagram ve diğer uygulama bildirimleri"
      emptyTitle="Bildirim kaydı yok"
      emptyHint="Telefonda Ayarlar → Bildirim erişimi → Aile Takip uygulamasını AÇIN. Sonra WhatsApp/Telegram'da mesaj gelsin."
      isEmpty={page.data.length === 0}
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="notifications" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {page.data.map((n) => (
          <article key={n.id} className="message-card">
            <div className="message-card-meta border-0 pt-0 mt-0 mb-2">
              <span className="font-semibold text-indigo-700">{n.appName || n.appPackage}</span>
              <span className="ml-auto">{formatDate(n.timestamp)}</span>
            </div>
            {n.title && <p className="font-semibold text-gray-900 mb-2">{n.title}</p>}
            {n.text && <p className="message-card-text">{n.text}</p>}
          </article>
        ))}
      </div>
    </PageShell>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <NotificationsContent />
    </Suspense>
  );
}
