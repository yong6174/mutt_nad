'use client';

import { useMemo } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';
import { MUTT_NFT_ABI } from '@/lib/contracts/abi';
import { MUTT_NFT_ADDRESS } from '@/lib/chain';

export function useMint() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const newTotalSupply = useMemo(() => {
    if (!receipt?.logs) return undefined;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: MUTT_NFT_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'Minted') {
          return Number((decoded.args as { newTotalSupply: bigint }).newTotalSupply);
        }
      } catch {
        // not our event
      }
    }
    return undefined;
  }, [receipt]);

  const mint = (tokenId: number) => {
    if (!MUTT_NFT_ADDRESS) return;
    writeContract({
      address: MUTT_NFT_ADDRESS,
      abi: MUTT_NFT_ABI,
      functionName: 'mint',
      args: [BigInt(tokenId)],
    });
  };

  return { mint, hash, isPending, isConfirming, isSuccess, newTotalSupply, error };
}
