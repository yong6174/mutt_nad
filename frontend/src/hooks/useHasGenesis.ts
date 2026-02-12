'use client';

import { useReadContract } from 'wagmi';
import { MUTT_NFT_ABI } from '@/lib/contracts/abi';
import { MUTT_NFT_ADDRESS } from '@/lib/chain';

export function useHasGenesis(address?: `0x${string}`) {
  return useReadContract({
    address: MUTT_NFT_ADDRESS,
    abi: MUTT_NFT_ABI,
    functionName: 'hasGenesis',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!MUTT_NFT_ADDRESS },
  });
}
