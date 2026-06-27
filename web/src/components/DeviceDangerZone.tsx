'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function DeviceDangerZone({ deviceId, deviceName }: { deviceId: string; deviceName: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [menuPin, setMenuPin] = useState('8255');

  useEffect(() => {
    api.me().then((u) => {
      if (u.menuPin) setMenuPin(u.menuPin);
    }).catch(() => {});
  }, []);

  const verifyPin = () => {
    const entered = prompt('Kendini imha için PIN kodunu girin:');
    if (entered === null) return false;
    if (entered.trim() !== menuPin) {
      alert('Yanlış PIN');
      return false;
    }
    return true;
  };

  const selfDestruct = async () => {
    if (!verifyPin()) return;
    const ok = confirm(
      `"${deviceName}" cihazından Sistem uygulamasını tamamen kaldırmak istiyor musunuz?\n\nBu işlem geri alınamaz.`
    );
    if (!ok) return;
    setLoading(true);
    setMessage('');
    try {
      const cmd = await api.createCommand(deviceId, 'self_destruct');
      let current = cmd;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        current = await api.getCommand(deviceId, cmd.id);
        if (current.status !== 'pending') break;
      }
      if (current.status === 'completed') {
        setMessage('Komut gönderildi. Telefonda kaldırma ekranı açılacak.');
      } else {
        setMessage(current.errorMsg || 'Komut tamamlanamadı.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Komut gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllServerData = async () => {
    if (!confirm(`"${deviceName}" için paneldeki TÜM verileri silmek istiyor musunuz?`)) return;
    setLoading(true);
    try {
      await api.deleteData('all', deviceId);
      setMessage('Paneldeki tüm veriler silindi.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Silme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const exportAll = async () => {
    setLoading(true);
    try {
      await api.exportData(deviceId, 'all');
      setMessage('Tüm veriler indirildi.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'İndirme başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="danger-zone">
      <h3 className="font-semibold text-red-700 mb-1">Tehlikeli işlemler</h3>
      <p className="text-sm text-gray-500 mb-4">
        Kendini imha PIN gerektirir (varsayılan: admin panelden ayarlanır)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button type="button" disabled={loading} onClick={exportAll} className="btn-secondary text-sm">
          Tüm verileri indir
        </button>
        <button type="button" disabled={loading} onClick={deleteAllServerData} className="btn-danger text-sm">
          Tüm verileri sil
        </button>
        <button type="button" disabled={loading} onClick={selfDestruct} className="btn-destruct text-sm">
          {loading ? 'Gönderiliyor...' : 'Kendini imha et'}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
