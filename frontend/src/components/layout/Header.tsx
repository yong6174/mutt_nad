'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NAV_ITEMS = [
  { href: '/hatch', label: 'Hatch' },
  { href: '/breed', label: 'Breed' },
  { href: '/explore', label: 'Explore' },
  { href: '/leaderboard', label: 'Sacred 28' },
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
      <Link href="/" className="flex items-center gap-2">
        <Image src="/images/logo.webp" alt="Mutt" width={48} height={48} className="rounded-full" />
        <span className="font-display text-[22px] font-bold text-gold tracking-[4px]">MUTT</span>
      </Link>

      <nav className="flex gap-8">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`font-display text-[15px] font-semibold tracking-[2px] uppercase transition-colors ${
              pathname === href ? 'text-gold' : 'text-gold-dim hover:text-gold'
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
