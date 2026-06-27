'use client';

import { Suspense } from 'react';
import { api, NotificationItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
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
      {...page}
    >
      <div className="space-y-3">
        {page.data.map((n) => (
          <div key={n.id} className="data-card">
            <div className="flex justify-between gap-3 mb-2">
              <span className="font-medium truncate">{n.appName || n.appPackage}</span>
              <span className="text-xs text-gray-500 shrink-0">{formatDate(n.timestamp)}</span>
            </div>
            {n.title && <p className="font-medium text-sm">{n.title}</p>}
            {n.text && <p className="text-gray-700 mt-1 text-sm break-words">{n.text}</p>}
          </div>
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
