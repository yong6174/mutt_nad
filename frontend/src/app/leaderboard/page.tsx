'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BloodlineGrade } from '@/types';

// Mock data — replaced with Supabase queries in Phase 5
const MOCK_HOUSES = [
  {
    rank: 1,
    name: 'House of Mutt #0003',
    personality: 'ENTJ',
    memberCount: 5,
    avgRating: 4.92,
    totalReviews: 28,
    members: [
      { tokenId: 3, personality: 'ENTJ', role: 'Grandparent', avgRating: 4.9, bloodline: 'pureblood' as BloodlineGrade },
      { tokenId: 12, personality: 'INTJ', role: 'Parent', avgRating: 4.8, bloodline: 'pureblood' as BloodlineGrade },
      { tokenId: 42, personality: 'ENFP', role: 'Current', avgRating: 4.8, bloodline: 'pureblood' as BloodlineGrade },
    ],
  },
  {
    rank: 2,
    name: 'House of Mutt #0008',
    personality: 'INFJ',
    memberCount: 4,
    avgRating: 4.88,
    totalReviews: 24,
    members: [],
  },
  {
    rank: 3,
    name: 'House of Mutt #0015',
    personality: 'ENFJ',
    memberCount: 5,
    avgRating: 4.85,
    totalReviews: 22,
    members: [],
  },
  {
    rank: 4,
    name: 'House of Mutt #0021',
    personality: 'ISTP',
    memberCount: 3,
    avgRating: 4.82,
    totalReviews: 19,
    members: [],
  },
  {
    rank: 5,
    name: 'House of Mutt #0005',
    personality: 'INFP',
    memberCount: 4,
    avgRating: 4.79,
    totalReviews: 17,
    members: [],
  },
];

type Tab = 'sacred28' | 'purebloods' | 'all';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('sacred28');
  const [expandedRank, setExpandedRank] = useState<number | null>(1);

  const RANK_COLORS: Record<number, string> = { 1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-amber-600' };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-center text-3xl text-gold mb-2">The Sacred 28</h1>
      <p className="text-center text-sm text-text-secondary italic mb-10">
        &quot;Only the worthy bear the mark of the Sacred.&quot;
      </p>

      {/* Tabs */}
      <div className="flex justify-center gap-1 mb-8">
        {(['sacred28', 'purebloods', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2.5 text-sm tracking-wide border ${
              tab === t ? 'border-gold text-gold bg-[#12110a]' : 'border-border-primary text-text-secondary'
            }`}
          >
            {t === 'sacred28' ? 'Sacred 28' : t === 'purebloods' ? 'Purebloods' : 'All Mutts'}
          </button>
        ))}
      </div>

      {/* House List */}
      <div className="flex flex-col gap-3">
        {MOCK_HOUSES.map((house) => (
          <div
            key={house.rank}
            className={`border bg-bg-secondary overflow-hidden ${house.rank <= 3 ? 'border-gold' : 'border-border-primary'}`}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedRank(expandedRank === house.rank ? null : house.rank)}
              className="w-full flex items-center gap-4 p-4 hover:bg-[#12110a] transition-colors"
            >
              <span className={`w-10 text-center text-xl font-bold ${RANK_COLORS[house.rank] || 'text-gold'}`}>
                {house.rank}
              </span>
              <div className="text-3xl opacity-50">?</div>
              <div className="flex-1 text-left">
                <p className="text-base text-text-primary">
                  {house.name}
                  <span className="text-xs text-gold ml-2">SACRED</span>
                </p>
                <p className="text-xs text-text-secondary">
                  {house.personality} · {house.memberCount} members
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg text-gold">★ {house.avgRating.toFixed(2)}</p>
                <p className="text-[11px] text-text-secondary">{house.totalReviews} reviews</p>
              </div>
              <span className="text-text-muted text-lg w-6 text-center">
                {expandedRank === house.rank ? '▾' : '▸'}
              </span>
            </button>

            {/* Members */}
            {expandedRank === house.rank && house.members.length > 0 && (
              <div className="border-t border-bg-tertiary p-4 bg-[#08080c]">
                {house.members.map((m) => (
                  <Link
                    key={m.tokenId}
                    href={`/mutt/${m.tokenId}`}
                    className="flex items-center gap-3 py-2 border-b border-bg-tertiary last:border-b-0 hover:opacity-80"
                  >
                    <div className="text-2xl opacity-50">?</div>
                    <div className="flex-1">
                      <p className="text-sm text-text-primary">Mutt #{String(m.tokenId).padStart(4, '0')}</p>
                      <p className="text-[11px] text-gold">{m.personality} · {m.role}</p>
                    </div>
                    <p className="text-sm text-gold-dim">★ {m.avgRating}</p>
                    <span className="text-sm">👑</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
