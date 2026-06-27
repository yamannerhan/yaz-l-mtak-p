import { Device } from '@/lib/api';
import { LoadingSkeleton } from './LoadingSkeleton';

interface PageShellProps {
  title: string;
  subtitle?: string;
  devices: Device[];
  selectedDevice: string;
  onDeviceChange: (id: string) => void;
  loading: boolean;
  refreshing: boolean;
  error: string;
  onRefresh: () => void;
  hasDevices: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  isEmpty: boolean;
  children: React.ReactNode;
  extraFilters?: React.ReactNode;
  skeleton?: React.ReactNode;
}

export function PageShell({
  title,
  subtitle,
  devices,
  selectedDevice,
  onDeviceChange,
  loading,
  refreshing,
  error,
  onRefresh,
  hasDevices,
  emptyTitle = 'Kayıt yok',
  emptyHint,
  isEmpty,
  children,
  extraFilters,
  skeleton,
}: PageShellProps) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing || loading || !hasDevices}
          className="btn-secondary shrink-0 text-sm flex items-center gap-2"
        >
          <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
          <span className="hidden sm:inline">{refreshing ? 'Güncelleniyor...' : 'Yenile'}</span>
        </button>
      </div>

      {hasDevices ? (
        <div className="toolbar">
          <select
            className="input flex-1 min-w-0 sm:max-w-xs"
            value={selectedDevice}
            onChange={(e) => onDeviceChange(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.deviceName}
              </option>
            ))}
          </select>
          {extraFilters}
          <span className="text-xs text-gray-400 hidden sm:inline">5 sn otomatik yenileme</span>
        </div>
      ) : !loading ? (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h2>Henüz bağlı cihaz yok</h2>
          <p>APK kurulumunda e-posta ve şifrenizi girin. Veriler 5 saniyede bir senkronize edilir.</p>
        </div>
      ) : (
        <LoadingSkeleton rows={2} />
      )}

      {error && <div className="error-banner">{error}</div>}

      {hasDevices && loading && (skeleton || <LoadingSkeleton />)}

      {hasDevices && !loading && isEmpty && (
        <div className="empty-state compact">
          <div className="empty-icon">📭</div>
          <h2>{emptyTitle}</h2>
          {emptyHint && <p>{emptyHint}</p>}
        </div>
      )}

      {hasDevices && !loading && !isEmpty && children}
    </div>
  );
}
