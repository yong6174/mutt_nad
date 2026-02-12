'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { MUTT_NFT_ABI } from '@/lib/contracts/abi';
import { MUTT_NFT_ADDRESS } from '@/lib/chain';

export function useSetMintConfig() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setMintConfig = (tokenId: number, costInEther: string, maxSupply: number) => {
    if (!MUTT_NFT_ADDRESS) return;
    writeContract({
      address: MUTT_NFT_ADDRESS,
      abi: MUTT_NFT_ABI,
      functionName: 'setMintConfig',
      args: [BigInt(tokenId), parseEther(costInEther), BigInt(maxSupply)],
    });
  };

  return { setMintConfig, hash, isPending, isConfirming, isSuccess, error };
}
