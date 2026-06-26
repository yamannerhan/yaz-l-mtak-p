'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, CallLog, Device, formatDate } from '@/lib/api';

function CallsContent() {
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDevices().then((d) => {
      setDevices(d);
      const fromUrl = searchParams.get('device');
      const id = fromUrl && d.find((x) => x.id === fromUrl) ? fromUrl : d[0]?.id || '';
      setSelectedDevice(id);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!selectedDevice) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getCalls(selectedDevice).then(setCalls).finally(() => setLoading(false));
  }, [selectedDevice]);

  const typeLabel: Record<string, string> = {
    INCOMING: 'Gelen',
    OUTGOING: 'Giden',
    MISSED: 'Cevapsız',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Aramalar</h1>
      {devices.length > 0 && (
        <select
          className="input mb-6 max-w-xs"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.deviceName}</option>
          ))}
        </select>
      )}
      {loading ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : calls.length === 0 ? (
        <div className="card text-gray-500">Arama kaydı yok</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4">Numara</th>
                <th className="text-left p-4">Tür</th>
                <th className="text-left p-4">Süre</th>
                <th className="text-left p-4">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{c.contactName || c.number}</td>
                  <td className="p-4">{typeLabel[c.type] || c.type}</td>
                  <td className="p-4">{c.durationSeconds}s</td>
                  <td className="p-4 text-gray-500">{formatDate(c.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CallsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500">Yükleniyor...</div>}>
      <CallsContent />
    </Suspense>
  );
}
