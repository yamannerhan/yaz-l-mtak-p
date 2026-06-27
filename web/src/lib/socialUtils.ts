import { NotificationItem } from './api';

export const SOCIAL_APPS: Record<string, { name: string; icon: string; color: string }> = {
  'com.whatsapp': { name: 'WhatsApp', icon: '💚', color: 'from-emerald-500 to-green-600' },
  'com.whatsapp.w4b': { name: 'WhatsApp Business', icon: '💼', color: 'from-emerald-600 to-teal-600' },
  'org.telegram.messenger': { name: 'Telegram', icon: '✈️', color: 'from-sky-500 to-blue-600' },
  'com.instagram.android': { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600' },
  'com.facebook.katana': { name: 'Facebook', icon: '👤', color: 'from-blue-600 to-indigo-600' },
  'com.facebook.orca': { name: 'Messenger', icon: '💬', color: 'from-blue-500 to-violet-600' },
};

export function isValidSocialMessage(n: NotificationItem) {
  const text = (n.text || '').trim();
  const title = (n.title || '').trim();
  if (!text && !title) return false;
  if (text.length < 2 && title.length < 2) return false;
  if (title === 'Sohbet görünümü' && text.length < 12) return false;
  const junk = ['bilgi', 'info', 'android', 'sistem', 'null', 'undefined'];
  const lower = `${title} ${text}`.toLowerCase();
  if (junk.some((j) => lower === j)) return false;
  return true;
}

export function matchSocialApp(pkg: string) {
  const key = Object.keys(SOCIAL_APPS).find((k) => pkg.startsWith(k));
  return key ? SOCIAL_APPS[key] : { name: 'Diğer', icon: '📱', color: 'from-gray-500 to-gray-600' };
}

export function groupSocialMessages(messages: NotificationItem[]) {
  const filtered = messages.filter(isValidSocialMessage);
  const byApp = new Map<string, Map<string, NotificationItem[]>>();

  for (const n of filtered) {
    const appKey = Object.keys(SOCIAL_APPS).find((k) => n.appPackage.startsWith(k)) || n.appPackage;
    if (!byApp.has(appKey)) byApp.set(appKey, new Map());
    const chats = byApp.get(appKey)!;
    const sender = (n.title || 'Bilinmeyen').trim();
    if (!chats.has(sender)) chats.set(sender, []);
    const list = chats.get(sender)!;
    const dup = list.some((m) => m.text === n.text && m.title === n.title);
    if (!dup) list.push(n);
  }

  return byApp;
}
