'use client';

import { useState } from 'react';
import { api, DeviceCommand, mediaFullUrl } from '@/lib/api';

const COMMANDS = [
  { type: 'screenshot' as const, label: 'Ekran görüntüsü', icon: '📸' },
  { type: 'camera_front' as const, label: 'Ön kamera', icon: '🤳' },
  { type: 'camera_back' as const, label: 'Arka kamera', icon: '📷' },
  { type: 'location' as const, label: 'Anlık konum', icon: '📍' },
];

export function LiveControl({ deviceId }: { deviceId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<DeviceCommand | null>(null);
  const [error, setError] = useState('');

  const runCommand = async (type: typeof COMMANDS[number]['type']) => {
    setLoading(type);
    setError('');
    setResult(null);
    try {
      const cmd = await api.createCommand(deviceId, type);
      let current = cmd;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        current = await api.getCommand(deviceId, cmd.id);
        if (current.status !== 'pending') break;
      }
      setResult(current);
      if (current.status === 'failed') {
        setError(current.errorMsg || 'Komut başarısız');
      } else if (current.status === 'pending') {
        setError('Telefon henüz yanıt vermedi. Biraz sonra tekrar deneyin.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Komut gönderilemedi');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="data-card">
      <h3 className="font-semibold mb-1">Canlı kontrol</h3>
      <p className="text-sm text-gray-500 mb-4">
        İstediğiniz zaman ekran, kamera veya konum alın
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COMMANDS.map((cmd) => (
          <button
            key={cmd.type}
            type="button"
            disabled={!!loading}
            onClick={() => runCommand(cmd.type)}
            className="btn-secondary flex flex-col items-center gap-1 py-3 text-xs sm:text-sm"
          >
            <span className="text-xl">{cmd.icon}</span>
            {loading === cmd.type ? 'Bekleniyor...' : cmd.label}
          </button>
        ))}
      </div>

      {error && <div className="error-banner mt-4">{error}</div>}

      {result?.status === 'completed' && result.resultUrl && (
        <div className="mt-4">
          <img
            src={mediaFullUrl(result.resultUrl)}
            alt="Sonuç"
            className="w-full max-h-96 object-contain rounded-xl border bg-gray-100"
          />
        </div>
      )}

      {result?.status === 'completed' && result.resultLat != null && result.resultLng != null && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="font-mono text-sm mb-2">
            {result.resultLat.toFixed(6)}, {result.resultLng.toFixed(6)}
          </p>
          <a
            href={`https://maps.google.com/?q=${result.resultLat},${result.resultLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block text-sm"
          >
            Haritada aç →
          </a>
        </div>
      )}
    </div>
  );
}
