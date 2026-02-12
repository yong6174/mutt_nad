'use client';

import dynamic from 'next/dynamic';

const WalletGuardInner = dynamic(
  () => import('./WalletGuardInner').then((m) => m.default),
  { ssr: false },
);

export function WalletGuard() {
  return <WalletGuardInner />;
}
