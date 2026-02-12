'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { MUTT_NFT_ABI } from '@/lib/contracts/abi';
import { MUTT_NFT_ADDRESS } from '@/lib/chain';

const COOLDOWN_SECONDS = 300; // 5 minutes

interface CooldownState {
  remaining: number; // seconds remaining (0 = ready)
  isReady: boolean;
  label: string; // "Ready" or "4:32"
}

export function useCooldown(tokenId?: number): CooldownState & { refetch: () => void } {
  const { data, refetch } = useReadContract({
    address: MUTT_NFT_ADDRESS,
    abi: MUTT_NFT_ABI,
    functionName: 'getMutt',
    args: tokenId != null ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId != null && !!MUTT_NFT_ADDRESS },
  });

  const [remaining, setRemaining] = useState(0);

  const calcRemaining = useCallback(() => {
    if (!data) return 0;
    const muttData = data as { lastBreedTime: bigint };
    const lastBreed = Number(muttData.lastBreedTime);
    if (lastBreed === 0) return 0;
    const now = Math.floor(Date.now() / 1000);
    const diff = (lastBreed + COOLDOWN_SECONDS) - now;
    return diff > 0 ? diff : 0;
  }, [data]);

  useEffect(() => {
    setRemaining(calcRemaining());

    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r === 0) {
        clearInterval(interval);
        refetch();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calcRemaining, refetch]);

  const isReady = remaining === 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const label = isReady ? 'Ready' : `${mins}:${String(secs).padStart(2, '0')}`;

  return { remaining, isReady, label, refetch };
}
