'use client';

import { useEffect, useState } from 'react';
import { api, MediaItem, Device, formatDate, mediaFullUrl } from '@/lib/api';

const typeLabels: Record<string, string> = {
  screenshot: 'Ekran Görüntüsü',
  camera_front: 'Ön Kamera',
  camera_back: 'Arka Kamera',
};

export default function MediaPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [filter, setFilter] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
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
    api.getMedia(selectedDevice, filter || undefined).then(setMedia).finally(() => setLoading(false));
  }, [selectedDevice, filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Ekran ve Kamera</h1>
      <p className="text-sm text-gray-500 mb-6">Periyodik ekran görüntüsü ve kamera fotoğrafları</p>
      <div className="flex gap-4 mb-6 flex-wrap">
        {devices.length > 0 && (
          <select className="input max-w-xs" value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.deviceName}</option>)}
          </select>
        )}
        <select className="input max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tümü</option>
          <option value="screenshot">Ekran</option>
          <option value="camera_front">Ön Kamera</option>
          <option value="camera_back">Arka Kamera</option>
        </select>
      </div>
      {loading ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : media.length === 0 ? (
        <div className="card text-gray-500">Medya kaydı yok. Erişilebilirlik ve kamera izni gerekli.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {media.map((m) => (
            <div key={m.id} className="card p-0 overflow-hidden">
              <img
                src={mediaFullUrl(m.fileUrl)}
                alt={m.type}
                className="w-full h-48 object-cover bg-gray-100"
              />
              <div className="p-4">
                <span className="badge-gray">{typeLabels[m.type] || m.type}</span>
                <p className="text-xs text-gray-500 mt-2">{formatDate(m.timestamp)}</p>
                <a href={mediaFullUrl(m.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline mt-1 inline-block">
                  Büyük aç
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
