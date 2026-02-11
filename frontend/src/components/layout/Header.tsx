'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NAV_ITEMS = [
  { href: '/hatch', label: 'Hatch' },
  { href: '/breed', label: 'Breed' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/my', label: 'My' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="flex justify-between items-center px-10 py-4 backdrop-blur-xl"
      style={{
        background: 'rgba(6,6,10,0.8)',
        borderBottom: '1px solid rgba(200,168,78,0.1)',
      }}
    >
      <Link href="/" className="font-display text-[22px] font-bold text-gold tracking-[4px]">
        MUTT
      </Link>

      <nav className="flex gap-8">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`font-display text-[13px] tracking-[2px] uppercase transition-colors ${
              pathname === href ? 'text-gold' : 'text-text-secondary hover:text-gold'
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
