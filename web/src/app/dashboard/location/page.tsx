'use client';

import { useEffect, useState } from 'react';
import { api, LocationItem, Device, formatDate } from '@/lib/api';

export default function LocationPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [locations, setLocations] = useState<LocationItem[]>([]);
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
    api.getLocations(selectedDevice).then(setLocations).finally(() => setLoading(false));
  }, [selectedDevice]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Konum</h1>
      {devices.length > 0 && (
        <select className="input mb-6 max-w-xs" value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.deviceName}</option>)}
        </select>
      )}
      {loading ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : locations.length === 0 ? (
        <div className="card text-gray-500">Konum kaydı yok</div>
      ) : (
        <div className="space-y-3">
          {locations.map((l) => (
            <div key={l.id} className="card flex justify-between items-center">
              <div>
                <p className="font-mono text-sm">
                  {l.latitude.toFixed(6)}, {l.longitude.toFixed(6)}
                </p>
                {l.accuracy && <p className="text-xs text-gray-500">Doğruluk: ±{l.accuracy.toFixed(0)}m</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{formatDate(l.timestamp)}</p>
                <a
                  href={`https://maps.google.com/?q=${l.latitude},${l.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm hover:underline"
                >
                  Haritada aç
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
