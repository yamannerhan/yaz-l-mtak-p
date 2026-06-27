export type SubscriptionPlan = 'trial' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';

export function isSubscriptionActive(expiresAt: Date | null | undefined, role?: string): boolean {
  if (role === 'admin') return true;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

export function extendSubscription(plan: SubscriptionPlan, from = new Date()): Date | null {
  if (plan === 'lifetime') return null;
  const d = new Date(from);
  switch (plan) {
    case 'trial':
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setDate(d.getDate() + 1);
  }
  return d;
}

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: 'Deneme (1 gün)',
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
  lifetime: 'Süresiz',
};
