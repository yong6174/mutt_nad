'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import type { BloodlineGrade } from '@/types';

// Mock data — replaced with Supabase + on-chain queries in Phase 5
const MOCK_MY_MUTTS = [
  { tokenId: 42, personality: 'ENFP', bloodline: 'pureblood' as BloodlineGrade, avgRating: 4.8, breedCost: '0.1', status: 'ready' as const },
  { tokenId: 201, personality: 'INFJ', bloodline: 'mutt' as BloodlineGrade, avgRating: 4.2, breedCost: '0.05', status: 'cooldown' as const, cooldownLeft: '3:42' },
  { tokenId: 315, personality: 'ISTP', bloodline: 'halfblood' as BloodlineGrade, avgRating: 3.9, breedCost: '0', status: 'ready' as const },
];

const MOCK_ACTIVITIES = [
  { id: 1, icon: '🧬', text: 'Bred #0042 × #0089 → #0201 born', detail: 'Paid 0.1 MON', time: '2 hours ago' },
  { id: 2, icon: '⭐', text: 'Mutt #0042 received a ★5 rating', detail: 'From 0x7d3f...a2c1', time: '5 hours ago' },
  { id: 3, icon: '🥚', text: 'Genesis Hatch → #0042 born', detail: 'ENFP · Identity submitted', time: '2 days ago' },
  { id: 4, icon: '💰', text: 'Earned 0.09 MON from breed fee', detail: 'Someone bred with #0042', time: '1 day ago' },
];

const BLOODLINE_LABEL: Record<BloodlineGrade, string> = {
  mutt: 'Mutt',
  halfblood: 'Halfblood',
  pureblood: 'Pureblood',
  sacred28: 'Sacred 28',
};

export default function MyPage() {
  const { address, isConnected } = useAccount();
  const [editingCost, setEditingCost] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-3xl text-gold mb-2">My Collection</h1>
      <p className="text-sm text-text-secondary font-mono mb-8">
        {address || '0x0000...0000 (Mock Mode)'}
      </p>

      {/* Stats */}
      <div className="flex gap-6 mb-8">
        <StatBox val="3" label="Mutts Owned" />
        <StatBox val="7" label="Breeds Done" />
        <StatBox val="1" label="Purebloods" />
        <StatBox val="0.3" label="MON Earned" />
      </div>

      {/* My Mutts Grid */}
      <h2 className="text-sm text-gold tracking-widest uppercase mb-4 pb-2 border-b border-border-primary">
        My Mutts
      </h2>
      <div className="grid grid-cols-3 gap-4 mb-10">
        {MOCK_MY_MUTTS.map((m) => (
          <Link
            key={m.tokenId}
            href={`/mutt/${m.tokenId}`}
            className="border border-border-primary bg-bg-secondary p-4 text-center relative hover:border-gold transition-colors"
          >
            {/* Status badge */}
            <span
              className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] tracking-wide uppercase border ${
                m.status === 'ready' ? 'border-emerald-500 text-emerald-500' : 'border-red-400 text-red-400'
              }`}
            >
              {m.status === 'ready' ? 'Ready' : m.cooldownLeft}
            </span>

            <div className="text-5xl mb-2 opacity-50">?</div>
            <p className="text-sm text-text-primary mb-1">Mutt #{String(m.tokenId).padStart(4, '0')}</p>
            <p className="text-xs text-gold tracking-wide mb-2">{m.personality}</p>
            <div className="flex justify-between text-[11px]">
              <span className="text-text-secondary">{BLOODLINE_LABEL[m.bloodline]}</span>
              <span className="text-gold-dim">★ {m.avgRating}</span>
            </div>

            {/* Breed cost edit */}
            <div className="absolute bottom-2 right-2">
              <span className="px-2 py-0.5 border border-border-secondary text-[9px] text-text-secondary">
                {m.breedCost === '0' ? 'Free' : `${m.breedCost} MON`}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Activity */}
      <h2 className="text-sm text-gold tracking-widest uppercase mb-4 pb-2 border-b border-border-primary">
        Activity
      </h2>
      <div className="flex flex-col gap-2">
        {MOCK_ACTIVITIES.map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 border border-bg-tertiary bg-bg-secondary">
            <span className="text-xl">{a.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary">{a.text}</p>
              <p className="text-[11px] text-text-secondary">{a.detail}</p>
            </div>
            <span className="text-[11px] text-text-muted">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex-1 p-4 border border-border-primary bg-bg-secondary text-center">
      <div className="text-2xl text-gold">{val}</div>
      <div className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
