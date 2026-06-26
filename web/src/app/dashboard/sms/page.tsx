'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, SmsMessage, Device, formatDate } from '@/lib/api';

function SmsContent() {
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [messages, setMessages] = useState<SmsMessage[]>([]);
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
    if (!selectedDevice) { setLoading(false); return; }
    setLoading(true);
    api.getSms(selectedDevice).then(setMessages).finally(() => setLoading(false));
  }, [selectedDevice]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">SMS Mesajları</h1>
      {devices.length > 0 && (
        <select className="input mb-6 max-w-xs" value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.deviceName}</option>)}
        </select>
      )}
      {loading ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : messages.length === 0 ? (
        <div className="card text-gray-500">SMS kaydı yok</div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="card">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{m.address}</span>
                <span className="text-xs text-gray-500">{formatDate(m.timestamp)}</span>
              </div>
              <p className="text-gray-700">{m.body}</p>
              <span className="badge-gray mt-2">{m.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SmsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500">Yükleniyor...</div>}>
      <SmsContent />
    </Suspense>
  );
}
