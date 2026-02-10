'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NAV_ITEMS = [
  { href: '/hatch', label: 'Hatch' },
  { href: '/breed', label: 'Breed' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex justify-between items-center px-10 py-4 border-b border-border-primary bg-bg-secondary">
      <Link href="/" className="text-2xl font-bold text-gold tracking-widest">
        MUTT
      </Link>

      <nav className="flex gap-8">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm tracking-wide uppercase transition-colors ${
              pathname === href
                ? 'text-gold border-b-2 border-gold pb-0.5'
                : 'text-gold-dim hover:text-gold'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <ConnectButton
        showBalance={false}
        chainStatus="none"
        accountStatus="avatar"
      />
    </header>
  );
}
