'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MUTT_NFT_ABI } from '@/lib/contracts/abi';
import { MUTT_NFT_ADDRESS } from '@/lib/chain';

export function useGenesisHatch() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const hatch = (personality: number, signature: `0x${string}`) => {
    if (!MUTT_NFT_ADDRESS) return;
    writeContract({
      address: MUTT_NFT_ADDRESS,
      abi: MUTT_NFT_ABI,
      functionName: 'genesisHatch',
      args: [personality, signature],
    });
  };

  return { hatch, hash, isPending, isConfirming, isSuccess, error };
}
