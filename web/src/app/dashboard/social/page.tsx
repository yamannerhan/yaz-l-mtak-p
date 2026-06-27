'use client';

import { Suspense, useMemo } from 'react';
import { api, NotificationItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { groupSocialMessages, matchSocialApp } from '@/lib/socialUtils';

function SocialContent() {
  const page = useDevicePage<NotificationItem>(api.getSocial);
  const grouped = useMemo(() => groupSocialMessages(page.data), [page.data]);

  return (
    <PageShell
      title="Sosyal Medya"
      subtitle="WhatsApp, Telegram, Instagram — kişi kişi ayrı sohbet kutuları"
      emptyTitle="Sosyal medya kaydı yok"
      emptyHint="Bildirim ve erişilebilirlik izni açık olmalı."
      isEmpty={page.data.length === 0}
      skeleton={<LoadingSkeleton rows={4} />}
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="notifications" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([appKey, chats]) => {
          const meta = matchSocialApp(appKey);
          const total = Array.from(chats.values()).reduce((s, m) => s + m.length, 0);
          return (
            <section key={appKey} className="social-section">
              <div className={`social-app-header bg-gradient-to-r ${meta.color}`}>
                <span className="text-3xl">{meta.icon}</span>
                <div>
                  <h2 className="font-bold text-xl">{meta.name}</h2>
                  <p className="text-sm text-white/85">{chats.size} kişi · {total} mesaj</p>
                </div>
              </div>

              <div className="chat-grid">
                {Array.from(chats.entries()).map(([sender, messages]) => (
                  <div key={sender} className="chat-room">
                    <div className="chat-room-header">
                      <span className="chat-avatar">{sender.charAt(0).toUpperCase()}</span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{sender}</p>
                        <p className="text-xs text-gray-500">Gönderen / Alıcı</p>
                      </div>
                      <span className="chat-count">{messages.length}</span>
                    </div>
                    <div className="chat-room-body">
                      {messages.map((m) => (
                        <div key={m.id} className="chat-msg">
                          <p className="message-card-text">{m.text || m.title}</p>
                          <p className="text-[10px] text-gray-400 mt-1 text-right">{formatDate(m.timestamp)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SocialContent />
    </Suspense>
  );
}
