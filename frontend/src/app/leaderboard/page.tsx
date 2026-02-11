'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BloodlineGrade } from '@/types';

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

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-center font-display text-[32px] text-gold tracking-[3px] mb-2">The Sacred 28</h1>
      <p className="text-center text-sm italic mb-10" style={{ color: '#6a5f4a' }}>
        &ldquo;Only the worthy bear the mark of the Sacred.&rdquo;
      </p>

      {/* Tabs */}
      <div className="flex justify-center gap-1 mb-8">
        {(['sacred28', 'purebloods', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-6 py-2.5 font-display text-sm tracking-[1px] transition-colors"
            style={{
              border: tab === t ? '1px solid #c8a84e' : '1px solid rgba(200,168,78,0.12)',
              color: tab === t ? '#c8a84e' : '#6a5f4a',
              background: tab === t ? 'rgba(18,17,10,0.8)' : 'transparent',
            }}
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
            className="overflow-hidden"
            style={{
              border: house.rank <= 3 ? '1px solid rgba(200,168,78,0.4)' : '1px solid rgba(200,168,78,0.1)',
              background: 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
            }}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedRank(expandedRank === house.rank ? null : house.rank)}
              className="w-full flex items-center gap-4 p-4 transition-colors hover:bg-[rgba(200,168,78,0.03)]"
            >
              <span
                className="w-10 text-center font-display text-xl font-bold"
                style={{
                  color: house.rank === 1 ? '#e8d48a' : house.rank === 2 ? '#b0b0b0' : house.rank === 3 ? '#cd7f32' : '#c8a84e',
                }}
              >
                {house.rank}
              </span>
              <div className="text-3xl opacity-50">?</div>
              <div className="flex-1 text-left">
                <p style={{ color: '#d4c5a0' }}>
                  <span className="font-display tracking-[1px]">{house.name}</span>
                  <span className="font-display text-xs text-gold tracking-[2px] ml-2">SACRED</span>
                </p>
                <p className="text-xs" style={{ color: '#6a5f4a' }}>
                  {house.personality} {'\u00B7'} {house.memberCount} members
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg text-gold font-display">{'\u2605'} {house.avgRating.toFixed(2)}</p>
                <p className="text-[11px]" style={{ color: '#6a5f4a' }}>{house.totalReviews} reviews</p>
              </div>
              <span className="text-lg w-6 text-center" style={{ color: '#3a3028' }}>
                {expandedRank === house.rank ? '\u25BE' : '\u25B8'}
              </span>
            </button>

            {/* Members */}
            {expandedRank === house.rank && house.members.length > 0 && (
              <div
                className="p-4"
                style={{ borderTop: '1px solid rgba(200,168,78,0.08)', background: 'rgba(6,6,10,0.6)' }}
              >
                {house.members.map((m) => (
                  <Link
                    key={m.tokenId}
                    href={`/mutt/${m.tokenId}`}
                    className="flex items-center gap-3 py-2 hover:opacity-80"
                    style={{ borderBottom: '1px solid rgba(200,168,78,0.05)' }}
                  >
                    <div className="text-2xl opacity-50">?</div>
                    <div className="flex-1">
                      <p className="font-display text-sm tracking-[1px]" style={{ color: '#d4c5a0' }}>
                        Mutt #{String(m.tokenId).padStart(4, '0')}
                      </p>
                      <p className="text-[11px] text-gold">
                        {m.personality} {'\u00B7'} {m.role}
                      </p>
                    </div>
                    <p className="text-sm" style={{ color: '#8a7d65' }}>{'\u2605'} {m.avgRating}</p>
                    <span className="text-sm">{'\u{1F451}'}</span>
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
