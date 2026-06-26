'use client';

import { useEffect, useState } from 'react';
import { api, WebHistoryItem, Device, formatDate } from '@/lib/api';

export default function WebHistoryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [entries, setEntries] = useState<WebHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDevices().then((d) => {
      setDevices(d);
      setSelectedDevice(d[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!selectedDevice) { setLoading(false); return; }
    setLoading(true);
    api.getWebHistory(selectedDevice).then(setEntries).finally(() => setLoading(false));
  }, [selectedDevice]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">İnternet Geçmişi</h1>
      <p className="text-sm text-gray-500 mb-6">Ziyaret edilen siteler ve adresler</p>
      {devices.length > 0 && (
        <select className="input mb-6 max-w-xs" value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.deviceName}</option>)}
        </select>
      )}
      {loading ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : entries.length === 0 ? (
        <div className="card text-gray-500">Kayıt yok. Erişilebilirlik iznini açın.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="card py-3">
              <div className="flex justify-between gap-4">
                <a href={e.url.startsWith('http') ? e.url : `https://${e.url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all font-medium">
                  {e.url}
                </a>
                <span className="text-xs text-gray-500 shrink-0">{formatDate(e.timestamp)}</span>
              </div>
              {e.title && <p className="text-sm text-gray-600 mt-1">{e.title}</p>}
              <span className="badge-gray mt-2">{e.browserName || e.browserPackage}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
