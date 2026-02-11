'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import type { BloodlineGrade } from '@/types';

const MOCK_MY_MUTTS = [
  { tokenId: 42, personality: 'ENFP', bloodline: 'pureblood' as BloodlineGrade, avgRating: 4.8, breedCost: '0.1', status: 'ready' as const },
  { tokenId: 201, personality: 'INFJ', bloodline: 'mutt' as BloodlineGrade, avgRating: 4.2, breedCost: '0.05', status: 'cooldown' as const, cooldownLeft: '3:42' },
  { tokenId: 315, personality: 'ISTP', bloodline: 'halfblood' as BloodlineGrade, avgRating: 3.9, breedCost: '0', status: 'ready' as const },
];

const MOCK_ACTIVITIES = [
  { id: 1, icon: '\u{1F9EC}', text: 'Bred #0042 \u00D7 #0089 \u2192 #0201 born', detail: 'Paid 0.1 MON', time: '2 hours ago' },
  { id: 2, icon: '\u2B50', text: 'Mutt #0042 received a \u26055 rating', detail: 'From 0x7d3f...a2c1', time: '5 hours ago' },
  { id: 3, icon: '\u{1F95A}', text: 'Genesis Hatch \u2192 #0042 born', detail: 'ENFP \u00B7 Identity submitted', time: '2 days ago' },
  { id: 4, icon: '\u{1F4B0}', text: 'Earned 0.09 MON from breed fee', detail: 'Someone bred with #0042', time: '1 day ago' },
];

const BLOODLINE_LABEL: Record<BloodlineGrade, string> = {
  mutt: 'Mutt',
  halfblood: 'Halfblood',
  pureblood: 'Pureblood',
  sacred28: 'Sacred 28',
};

export default function MyPage() {
  const { address } = useAccount();

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="font-display text-[32px] text-gold tracking-[3px] mb-2">My Collection</h1>
      <p className="text-sm font-mono mb-8" style={{ color: '#6a5f4a' }}>
        {address || '0x0000...0000 (Mock Mode)'}
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-8">
        {[
          { val: '3', label: 'Mutts Owned' },
          { val: '7', label: 'Breeds Done' },
          { val: '1', label: 'Purebloods' },
          { val: '0.3', label: 'MON Earned' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 p-4 text-center"
            style={{ border: '1px solid rgba(200,168,78,0.12)', background: 'rgba(12,11,8,0.8)' }}
          >
            <div className="font-display text-2xl text-gold">{s.val}</div>
            <div className="font-display text-[11px] uppercase tracking-[2px] mt-1" style={{ color: '#6a5f4a' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* My Mutts Grid */}
      <div className="mb-10">
        <h2
          className="font-display text-sm text-gold tracking-[2px] uppercase pb-2 mb-4"
          style={{ borderBottom: '1px solid rgba(200,168,78,0.12)' }}
        >
          My Mutts
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {MOCK_MY_MUTTS.map((m) => (
            <Link
              key={m.tokenId}
              href={`/mutt/${m.tokenId}`}
              className="p-4 text-center relative transition-all duration-300 hover:-translate-y-1"
              style={{
                border: '1px solid rgba(200,168,78,0.12)',
                background: 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
              }}
            >
              {/* Status badge */}
              <span
                className="absolute top-2 right-2 px-2 py-0.5 font-display text-[9px] tracking-[1px] uppercase"
                style={{
                  border: `1px solid ${m.status === 'ready' ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)'}`,
                  color: m.status === 'ready' ? '#34d399' : '#f87171',
                }}
              >
                {m.status === 'ready' ? 'Ready' : m.cooldownLeft}
              </span>

              <div className="text-5xl mb-2 opacity-50">?</div>
              <p className="font-display text-sm tracking-[1px] mb-1" style={{ color: '#d4c5a0' }}>
                Mutt #{String(m.tokenId).padStart(4, '0')}
              </p>
              <p className="text-xs text-gold tracking-[2px] mb-2">{m.personality}</p>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: '#6a5f4a' }}>{BLOODLINE_LABEL[m.bloodline]}</span>
                <span style={{ color: '#8a7d65' }}>{'\u2605'} {m.avgRating}</span>
              </div>

              {/* Breed cost */}
              <div className="absolute bottom-2 right-2">
                <span
                  className="px-2 py-0.5 text-[9px]"
                  style={{ border: '1px solid rgba(200,168,78,0.1)', color: '#3a3028' }}
                >
                  {m.breedCost === '0' ? 'Free' : `${m.breedCost} MON`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div>
        <h2
          className="font-display text-sm text-gold tracking-[2px] uppercase pb-2 mb-4"
          style={{ borderBottom: '1px solid rgba(200,168,78,0.12)' }}
        >
          Activity
        </h2>
        <div className="flex flex-col gap-2">
          {MOCK_ACTIVITIES.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3"
              style={{ border: '1px solid rgba(200,168,78,0.06)', background: 'rgba(12,11,8,0.8)' }}
            >
              <span className="text-xl">{a.icon}</span>
              <div className="flex-1">
                <p className="text-sm" style={{ color: '#d4c5a0' }}>{a.text}</p>
                <p className="text-[11px]" style={{ color: '#6a5f4a' }}>{a.detail}</p>
              </div>
              <span className="text-[11px]" style={{ color: '#3a3028' }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
