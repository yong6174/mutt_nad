'use client';

import { useWalletGuard } from '@/hooks/useWalletGuard';

export default function WalletGuardInner() {
  useWalletGuard();
  return null;
}
