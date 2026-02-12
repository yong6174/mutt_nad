'use client';

import { useReadContract } from 'wagmi';
import { MUTT_NFT_ABI } from '@/lib/contracts/abi';
import { MUTT_NFT_ADDRESS } from '@/lib/chain';

export function useGetMutt(tokenId?: number) {
  return useReadContract({
    address: MUTT_NFT_ADDRESS,
    abi: MUTT_NFT_ABI,
    functionName: 'getMutt',
    args: tokenId != null ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId != null && !!MUTT_NFT_ADDRESS },
  });
}
