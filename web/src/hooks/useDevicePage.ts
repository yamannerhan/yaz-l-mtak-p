'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Device } from '@/lib/api';

const POLL_MS = 5_000;

export function useDevicePage<T>(fetchData: (deviceId: string) => Promise<T[]>) {
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDevices()
      .then((d) => {
        setDevices(d);
        const fromUrl = searchParams.get('device');
        const id = fromUrl && d.find((x) => x.id === fromUrl) ? fromUrl : d[0]?.id || '';
        setSelectedDevice(id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Cihazlar yüklenemedi'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const loadData = useCallback(
    async (silent = false) => {
      if (!selectedDevice) {
        setData([]);
        return;
      }
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const result = await fetchData(selectedDevice);
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Veri yüklenemedi');
        setData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDevice, fetchData]
  );

  useEffect(() => {
    if (!selectedDevice) return;
    loadData();
  }, [selectedDevice, loadData]);

  useEffect(() => {
    if (!selectedDevice) return;
    const timer = setInterval(() => loadData(true), POLL_MS);
    return () => clearInterval(timer);
  }, [selectedDevice, loadData]);

  return {
    devices,
    selectedDevice,
    setSelectedDevice,
    onDeviceChange: setSelectedDevice,
    data,
    loading,
    refreshing,
    error,
    refresh: () => loadData(true),
    onRefresh: () => loadData(true),
    hasDevices: devices.length > 0,
  };
}
