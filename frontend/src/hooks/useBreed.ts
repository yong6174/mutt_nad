'use client';

import { useMemo } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { decodeEventLog } from 'viem';
import { MUTT_NFT_ABI, ERC20_ABI } from '@/lib/contracts/abi';
import { MUTT_NFT_ADDRESS, MUTT_TOKEN_ADDRESS } from '@/lib/chain';

export function useBreed() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const tokenId = useMemo(() => {
    if (!receipt?.logs) return undefined;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: MUTT_NFT_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'Bred') {
          return Number((decoded.args as { newTokenId: bigint }).newTokenId);
        }
      } catch {
        // not our event
      }
    }
    return undefined;
  }, [receipt]);

  const breed = (
    parentA: number,
    parentB: number,
    personality: number,
    signature: `0x${string}`,
  ) => {
    if (!MUTT_NFT_ADDRESS) return;
    writeContract({
      address: MUTT_NFT_ADDRESS,
      abi: MUTT_NFT_ABI,
      functionName: 'breed',
      args: [BigInt(parentA), BigInt(parentB), personality, signature],
    });
  };

  return { breed, hash, isPending, isConfirming, isSuccess, tokenId, error };
}

/** Hook to approve MUTT ERC-20 token spend for the MuttNFT contract */
export function useApproveBreedToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = () => {
    if (!MUTT_TOKEN_ADDRESS || !MUTT_NFT_ADDRESS) return;
    writeContract({
      address: MUTT_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [MUTT_NFT_ADDRESS, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn],
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

/** Hook to read MUTT token allowance for the MuttNFT contract */
export function useBreedTokenAllowance(owner?: `0x${string}`) {
  return useReadContract({
    address: MUTT_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && MUTT_NFT_ADDRESS ? [owner, MUTT_NFT_ADDRESS] : undefined,
    query: { enabled: !!owner && !!MUTT_TOKEN_ADDRESS && !!MUTT_NFT_ADDRESS },
  });
}

/** Hook to read MUTT token balance */
export function useBreedTokenBalance(owner?: `0x${string}`) {
  return useReadContract({
    address: MUTT_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner && !!MUTT_TOKEN_ADDRESS },
  });
}
