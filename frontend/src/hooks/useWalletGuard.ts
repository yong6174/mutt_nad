'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

/** Auto-opens RainbowKit connect modal if wallet is not connected. */
export function useWalletGuard() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
  }, [isConnected, openConnectModal]);
}
