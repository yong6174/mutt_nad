'use client';

import { useState, useCallback } from 'react';

interface SyncResult {
  success: boolean;
  tokenId: number;
  balance: number;
}

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SyncResult | null>(null);

  const sync = useCallback(async (address: string, tokenId: number, action: 'hatch' | 'breed' | 'mint') => {
    setSyncing(true);
    setError(null);
    setSynced(false);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, tokenId, action }),
      });

      const result = await res.json();

      if (!res.ok) {
        // 409 = already synced, treat as success
        if (res.status === 409) {
          setSynced(true);
          setData({ success: true, tokenId, balance: 1 });
          return;
        }
        setError(result.error || 'Sync failed');
        return;
      }

      setData(result);
      setSynced(true);
    } catch {
      setError('Sync network error');
    } finally {
      setSyncing(false);
    }
  }, []);

  return { sync, syncing, synced, error, data };
}
