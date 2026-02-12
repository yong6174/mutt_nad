'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/db';
import { isMockMode, MOCK_MUTTS } from '@/lib/mock';
import type { BloodlineGrade } from '@/types';

interface HouseMember {
  tokenId: number;
  personality: string;
  avgRating: number;
  totalReviews: number;
}

interface House {
  childTokenId: number;
  name: string;
  route: number[];
  routeAvgRating: number;
  routeReviews: number;
  members: HouseMember[];
}

interface LeaderboardMutt {
  tokenId: number;
  personality: string;
  bloodline: BloodlineGrade;
  avgRating: number;
  totalReviews: number;
  breeder: string;
}

type Tab = 'sacred28' | 'purebloods' | 'all';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('sacred28');
  const [houses, setHouses] = useState<House[]>([]);
  const [allMutts, setAllMutts] = useState<LeaderboardMutt[]>([]);
  const [expandedHouse, setExpandedHouse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (isMockMode()) {
        // Mock houses from pureblood mock mutts
        const mockHouses: House[] = [
          {
            childTokenId: 42,
            name: 'House of Mutt #0042',
            route: [42, 12, 15],
            routeAvgRating: 4.63,
            routeReviews: 31,
            members: [
              { tokenId: 42, personality: 'ENFP', avgRating: 4.8, totalReviews: 12 },
              { tokenId: 12, personality: 'INTJ', avgRating: 4.6, totalReviews: 9 },
              { tokenId: 15, personality: 'INFJ', avgRating: 4.5, totalReviews: 10 },
            ],
          },
          {
            childTokenId: 40,
            name: 'House of Mutt #0040',
            route: [40, 8, 9],
            routeAvgRating: 4.43,
            routeReviews: 33,
            members: [
              { tokenId: 40, personality: 'INFP', avgRating: 4.9, totalReviews: 15 },
              { tokenId: 8, personality: 'ENFJ', avgRating: 4.3, totalReviews: 11 },
              { tokenId: 9, personality: 'ISFP', avgRating: 4.1, totalReviews: 7 },
            ],
          },
        ];
        setHouses(mockHouses);

        const mocks = Object.values(MOCK_MUTTS)
          .sort((a, b) => b.avg_rating - a.avg_rating)
          .map((m) => ({
            tokenId: m.token_id,
            personality: m.personality,
            bloodline: m.bloodline as BloodlineGrade,
            avgRating: m.avg_rating,
            totalReviews: m.total_reviews,
            breeder: m.breeder,
          }));
        setAllMutts(mocks);
        setLoading(false);
        return;
      }

      // Fetch houses (pureblood routes)
      const { data: routeData } = await supabase
        .from('mutts')
        .select('token_id, personality, avg_rating, total_reviews, pureblood_route, bloodline')
        .not('pureblood_route', 'is', null);

      if (routeData) {
        // Group by child token (first element of path)
        const houseMap = new Map<number, House>();

        for (const m of routeData) {
          const route = m.pureblood_route as { path: number[]; avgRating: number; totalReviews: number } | null;
          if (!route?.path?.length) continue;

          const childId = route.path[0];
          if (!houseMap.has(childId)) {
            houseMap.set(childId, {
              childTokenId: childId,
              name: `House of Mutt #${String(childId).padStart(4, '0')}`,
              route: route.path,
              routeAvgRating: route.avgRating,
              routeReviews: route.totalReviews,
              members: [],
            });
          }

          const house = houseMap.get(childId)!;
          // Add member if part of this route
          if (route.path.includes(m.token_id)) {
            const exists = house.members.some((mem) => mem.tokenId === m.token_id);
            if (!exists) {
              house.members.push({
                tokenId: m.token_id,
                personality: m.personality,
                avgRating: Number(m.avg_rating),
                totalReviews: m.total_reviews,
              });
            }
          }
        }

        // Sort houses by route avg rating desc
        const sorted = Array.from(houseMap.values())
          .sort((a, b) => b.routeAvgRating - a.routeAvgRating || b.routeReviews - a.routeReviews);

        setHouses(sorted);
      }

      // Fetch all mutts for "All Mutts" tab
      const { data: allData } = await supabase
        .from('mutts')
        .select('token_id, personality, bloodline, avg_rating, total_reviews, breeder')
        .order('avg_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(50);

      if (allData) {
        setAllMutts(
          allData.map((m) => ({
            tokenId: m.token_id,
            personality: m.personality,
            bloodline: m.bloodline as BloodlineGrade,
            avgRating: Number(m.avg_rating),
            totalReviews: m.total_reviews,
            breeder: m.breeder,
          })),
        );
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const displayHouses = tab === 'sacred28' ? houses.slice(0, 28) : houses;

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
            onClick={() => { setTab(t); setExpandedHouse(null); }}
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

      {loading ? (
        <div className="text-center py-12 font-display" style={{ color: '#6a5f4a' }}>Loading...</div>
      ) : tab === 'all' ? (
        /* ── All Mutts tab ── */
        allMutts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {allMutts.map((m, i) => (
              <MuttRow key={m.tokenId} mutt={m} rank={i + 1} />
            ))}
          </div>
        )
      ) : (
        /* ── House tabs (Sacred 28 / Purebloods) ── */
        displayHouses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {displayHouses.map((house, i) => {
              const rank = i + 1;
              const isSacred = tab === 'sacred28' || rank <= 28;
              const isExpanded = expandedHouse === house.childTokenId;

              return (
                <div key={house.childTokenId}>
                  <button
                    onClick={() => setExpandedHouse(isExpanded ? null : house.childTokenId)}
                    className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-[rgba(200,168,78,0.03)]"
                    style={{
                      border: rank <= 3
                        ? '1px solid rgba(200,168,78,0.5)'
                        : '1px solid rgba(200,168,78,0.12)',
                      background: 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
                      boxShadow: rank === 1 ? '0 0 24px rgba(200,168,78,0.12)' : 'none',
                    }}
                  >
                    {/* Rank */}
                    <span
                      className="w-10 text-center font-display text-xl font-bold"
                      style={{
                        color: rank === 1 ? '#e8d48a' : rank === 2 ? '#b0b0b0' : rank === 3 ? '#cd7f32' : '#c8a84e',
                      }}
                    >
                      {rank}
                    </span>

                    {/* House info */}
                    <div className="flex-1">
                      <p style={{ color: '#d4c5a0' }}>
                        <span className="font-display tracking-[1px]">{house.name}</span>
                        {isSacred && (
                          <span className="font-display text-xs tracking-[2px] ml-2" style={{ color: '#e8d48a' }}>
                            SACRED
                          </span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: '#6a5f4a' }}>
                        {house.members.length} members {'\u00B7'} {house.route.map((id) => `#${id}`).join(' \u2192 ')}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="text-right">
                      <p className="text-lg text-gold font-display">{'\u2605'} {house.routeAvgRating.toFixed(2)}</p>
                      <p className="text-[11px]" style={{ color: '#6a5f4a' }}>{house.routeReviews} reviews</p>
                    </div>

                    {/* Expand indicator */}
                    <span
                      className="font-display text-sm transition-transform"
                      style={{
                        color: '#6a5f4a',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    >
                      {'\u25B6'}
                    </span>
                  </button>

                  {/* Expanded members */}
                  {isExpanded && (
                    <div
                      className="flex flex-col gap-1 py-2 px-4"
                      style={{
                        borderLeft: '2px solid rgba(200,168,78,0.2)',
                        borderRight: '1px solid rgba(200,168,78,0.06)',
                        borderBottom: '1px solid rgba(200,168,78,0.06)',
                        marginLeft: '20px',
                        background: 'rgba(12,11,8,0.6)',
                      }}
                    >
                      {house.members
                        .sort((a, b) => {
                          const idxA = house.route.indexOf(a.tokenId);
                          const idxB = house.route.indexOf(b.tokenId);
                          return idxA - idxB;
                        })
                        .map((member, mi) => {
                          const gen = mi === 0 ? 'Child' : mi <= 2 ? 'Parent' : 'Grandparent';
                          return (
                            <Link
                              key={member.tokenId}
                              href={`/mutt/${member.tokenId}`}
                              className="flex items-center gap-3 p-3 transition-colors hover:bg-[rgba(200,168,78,0.03)]"
                            >
                              <span className="text-lg opacity-40">?</span>
                              <div className="flex-1">
                                <span className="font-display text-sm tracking-[1px]" style={{ color: '#d4c5a0' }}>
                                  Mutt #{String(member.tokenId).padStart(4, '0')}
                                </span>
                                <span className="text-xs ml-2" style={{ color: '#6a5f4a' }}>
                                  {member.personality} {'\u00B7'} {gen}
                                </span>
                              </div>
                              <span className="text-sm text-gold font-display">
                                {'\u2605'} {member.avgRating.toFixed(2)}
                              </span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12" style={{ border: '1px solid rgba(200,168,78,0.08)' }}>
      <p className="text-sm" style={{ color: '#6a5f4a' }}>No entries found in this category</p>
    </div>
  );
}

function MuttRow({ mutt, rank }: { mutt: LeaderboardMutt; rank: number }) {
  return (
    <Link
      href={`/mutt/${mutt.tokenId}`}
      className="flex items-center gap-4 p-4 transition-colors hover:bg-[rgba(200,168,78,0.03)]"
      style={{
        border: rank <= 3 ? '1px solid rgba(200,168,78,0.4)' : '1px solid rgba(200,168,78,0.1)',
        background: 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
        boxShadow: rank === 1 ? '0 0 20px rgba(200,168,78,0.1)' : 'none',
      }}
    >
      <span
        className="w-10 text-center font-display text-xl font-bold"
        style={{
          color: rank === 1 ? '#e8d48a' : rank === 2 ? '#b0b0b0' : rank === 3 ? '#cd7f32' : '#c8a84e',
        }}
      >
        {rank}
      </span>
      <div className="text-3xl opacity-50">?</div>
      <div className="flex-1">
        <p style={{ color: '#d4c5a0' }}>
          <span className="font-display tracking-[1px]">
            Mutt #{String(mutt.tokenId).padStart(4, '0')}
          </span>
          {(mutt.bloodline === 'pureblood' || mutt.bloodline === 'sacred28') && (
            <span className="font-display text-xs text-gold tracking-[2px] ml-2">
              {mutt.bloodline === 'sacred28' ? 'SACRED' : 'PURE'}
            </span>
          )}
        </p>
        <p className="text-xs" style={{ color: '#6a5f4a' }}>
          {mutt.personality} {'\u00B7'} {mutt.breeder.slice(0, 6)}...{mutt.breeder.slice(-4)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg text-gold font-display">{'\u2605'} {mutt.avgRating.toFixed(2)}</p>
        <p className="text-[11px]" style={{ color: '#6a5f4a' }}>{mutt.totalReviews} reviews</p>
      </div>
    </Link>
  );
}
