'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/db';
import { isMockMode, MOCK_MUTTS } from '@/lib/mock';
import type { BloodlineGrade } from '@/types';

interface HouseMember {
  tokenId: number;
  personality: string;
  avgRating: number;
  totalReviews: number;
  image?: string;
  personalityDesc?: string;
}

interface House {
  childTokenId: number;
  name: string;
  route: number[];
  routeAvgRating: number;
  routeReviews: number;
  members: HouseMember[];
  image?: string;
  childName?: string;
}

interface LeaderboardMutt {
  tokenId: number;
  personality: string;
  bloodline: BloodlineGrade;
  avgRating: number;
  totalReviews: number;
  breeder: string;
  image?: string;
  personalityDesc?: string;
}

type Tab = 'sacred28' | 'purebloods' | 'all';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('sacred28');
  const [houses, setHouses] = useState<House[]>([]);
  const [allMutts, setAllMutts] = useState<LeaderboardMutt[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (isMockMode()) {
        const mockHouses: House[] = [
          {
            childTokenId: 42, name: 'House of Mutt #0042', route: [42, 12, 15],
            routeAvgRating: 4.63, routeReviews: 31, image: '/images/mbti/diplomat.png',
            members: [
              { tokenId: 42, personality: 'ENFP', avgRating: 4.8, totalReviews: 12 },
              { tokenId: 12, personality: 'INTJ', avgRating: 4.6, totalReviews: 9 },
            ],
          },
        ];
        setHouses(mockHouses);
        setLoading(false);
        return;
      }

      // Fetch houses
      const { data: routeData } = await supabase
        .from('mutts')
        .select('token_id, personality, personality_desc, avg_rating, total_reviews, pureblood_route, bloodline, image')
        .not('pureblood_route', 'is', null);

      if (routeData) {
        const houseMap = new Map<number, House>();

        for (const m of routeData) {
          const route = m.pureblood_route as { path: number[]; avgRating: number; totalReviews: number } | null;
          if (!route?.path?.length) continue;

          const childId = route.path[0];
          if (!houseMap.has(childId)) {
            const childName = m.token_id === childId
              ? (m.personality_desc?.split(' — ')[0] || `Mutt #${String(childId).padStart(4, '0')}`)
              : `Mutt #${String(childId).padStart(4, '0')}`;
            const childImage = m.token_id === childId ? m.image : undefined;

            houseMap.set(childId, {
              childTokenId: childId,
              name: `House of ${childName}`,
              childName,
              route: route.path,
              routeAvgRating: route.avgRating,
              routeReviews: route.totalReviews,
              members: [],
              image: childImage || undefined,
            });
          }

          const house = houseMap.get(childId)!;

          // Update house image/name from the child token
          if (m.token_id === childId) {
            house.image = m.image || house.image;
            house.childName = m.personality_desc?.split(' — ')[0] || house.childName;
            house.name = `House of ${house.childName}`;
          }

          if (route.path.includes(m.token_id)) {
            const exists = house.members.some((mem) => mem.tokenId === m.token_id);
            if (!exists) {
              house.members.push({
                tokenId: m.token_id,
                personality: m.personality,
                avgRating: Number(m.avg_rating),
                totalReviews: m.total_reviews,
                image: m.image || undefined,
                personalityDesc: m.personality_desc || undefined,
              });
            }
          }
        }

        const sorted = Array.from(houseMap.values())
          .sort((a, b) => b.routeAvgRating - a.routeAvgRating || b.routeReviews - a.routeReviews);

        setHouses(sorted);
      }

      // Fetch all mutts
      const { data: allData } = await supabase
        .from('mutts')
        .select('token_id, personality, personality_desc, bloodline, avg_rating, total_reviews, breeder, image')
        .order('avg_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(50);

      if (allData) {
        setAllMutts(
          allData.map((m) => ({
            tokenId: m.token_id,
            personality: m.personality,
            personalityDesc: m.personality_desc,
            bloodline: m.bloodline as BloodlineGrade,
            avgRating: Number(m.avg_rating),
            totalReviews: m.total_reviews,
            breeder: m.breeder,
            image: m.image || undefined,
          })),
        );
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const sacred28 = houses.slice(0, 28);

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-center font-display text-[36px] text-gold tracking-[4px] mb-2">The Sacred 28</h1>
      <p className="text-center text-sm italic mb-10" style={{ color: '#6a5f4a' }}>
        &ldquo;Only the worthy bear the mark of the Sacred.&rdquo;
      </p>

      {/* Tabs */}
      <div className="flex justify-center gap-1 mb-10">
        {(['sacred28', 'purebloods', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedHouse(null); }}
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
      ) : tab === 'sacred28' ? (
        /* ══════ SACRED 28 — Gallery ══════ */
        sacred28.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {/* Top 3 — Tarot Cards */}
            <div className="flex justify-center gap-6 mb-10">
              {sacred28.slice(0, 3).map((house, i) => (
                <TarotCard key={house.childTokenId} house={house} rank={i + 1}
                  isSelected={selectedHouse === house.childTokenId}
                  onClick={() => setSelectedHouse(selectedHouse === house.childTokenId ? null : house.childTokenId)}
                />
              ))}
            </div>

            {/* Selected house detail */}
            {selectedHouse && (
              <HouseDetail house={houses.find(h => h.childTokenId === selectedHouse)!} />
            )}

            {/* Rest — Crest Grid */}
            {sacred28.length > 3 && (
              <>
                <div className="flex items-center gap-4 mb-6 mt-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(200,168,78,0.12)' }} />
                  <span className="font-display text-[10px] tracking-[3px] uppercase" style={{ color: '#4a4030' }}>
                    Houses IV — XXVIII
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(200,168,78,0.12)' }} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sacred28.slice(3).map((house, i) => (
                    <CrestCard key={house.childTokenId} house={house} rank={i + 4}
                      isSelected={selectedHouse === house.childTokenId}
                      onClick={() => setSelectedHouse(selectedHouse === house.childTokenId ? null : house.childTokenId)}
                    />
                  ))}
                </div>
                {selectedHouse && sacred28.findIndex(h => h.childTokenId === selectedHouse) >= 3 && (
                  <HouseDetail house={houses.find(h => h.childTokenId === selectedHouse)!} />
                )}
              </>
            )}
          </div>
        )
      ) : tab === 'purebloods' ? (
        /* ══════ Purebloods — List ══════ */
        houses.length === 0 ? <EmptyState /> : (
          <div className="flex flex-col gap-3">
            {houses.map((house, i) => (
              <HouseRow key={house.childTokenId} house={house} rank={i + 1} isSacred={i < 28} />
            ))}
          </div>
        )
      ) : (
        /* ══════ All Mutts ══════ */
        allMutts.length === 0 ? <EmptyState /> : (
          <div className="flex flex-col gap-3">
            {allMutts.map((m, i) => (
              <MuttRow key={m.tokenId} mutt={m} rank={i + 1} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* ─── Tarot Card (Top 3) ─── */
function TarotCard({ house, rank, isSelected, onClick }: {
  house: House; rank: number; isSelected: boolean; onClick: () => void;
}) {
  const medals = ['', '\u2726', '\u2726', '\u2726'];
  const metalColors = ['', '#ffd700', '#c0c0c0', '#cd7f32'];
  const imgSrc = house.image || '/images/mbti/analyst.png';

  return (
    <button
      onClick={onClick}
      className="relative w-48 group transition-all duration-500"
      style={{
        perspective: '800px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="relative p-5 text-center transition-all duration-300 group-hover:-translate-y-1"
        style={{
          border: `2px solid ${metalColors[rank]}`,
          background: 'linear-gradient(180deg, #1e1a12 0%, #14120c 40%, #0c0b08 100%)',
          boxShadow: isSelected
            ? `0 0 40px rgba(200,168,78,0.3), 0 0 80px rgba(200,168,78,0.1), inset 0 1px 0 rgba(200,168,78,0.15)`
            : `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,168,78,0.1)`,
        }}
      >
        {/* Top ornament */}
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${metalColors[rank]}, transparent)` }}
        />

        {/* Rank */}
        <p className="font-display text-[11px] tracking-[3px] uppercase mb-3"
          style={{ color: metalColors[rank] }}>
          {medals[rank]} {rank === 1 ? 'I' : rank === 2 ? 'II' : 'III'} {medals[rank]}
        </p>

        {/* Image with glow */}
        <div className="flex justify-center mb-3 relative">
          <div className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{ background: metalColors[rank] }} />
          <Image src={imgSrc} alt={house.name} width={80} height={80}
            className="relative drop-shadow-[0_0_12px_rgba(200,168,78,0.3)]" />
        </div>

        {/* House name */}
        <p className="font-display text-[13px] tracking-[1px] mb-1" style={{ color: '#e8d48a' }}>
          {house.childName || `Mutt #${house.childTokenId}`}
        </p>
        <p className="font-display text-[10px] tracking-[2px] uppercase mb-3" style={{ color: '#6a5f4a' }}>
          {house.name}
        </p>

        {/* Rating */}
        <div className="py-2" style={{ borderTop: '1px solid rgba(200,168,78,0.15)' }}>
          <p className="font-display text-xl" style={{ color: metalColors[rank] }}>
            {'\u2605'} {house.routeAvgRating.toFixed(2)}
          </p>
          <p className="text-[10px]" style={{ color: '#4a4030' }}>
            {house.members.length} bloodline {'\u00B7'} {house.routeReviews} reviews
          </p>
        </div>

        {/* Route chain */}
        <div className="mt-2 flex items-center justify-center gap-1">
          {house.route.map((id, ri) => (
            <span key={id} className="flex items-center gap-1">
              {ri > 0 && <span className="text-[8px]" style={{ color: '#3a3028' }}>{'\u2192'}</span>}
              <span className="text-[9px] font-display" style={{ color: '#6a5f4a' }}>#{id}</span>
            </span>
          ))}
        </div>

        {/* Bottom ornament */}
        <div className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${metalColors[rank]}40, transparent)` }}
        />
      </div>
    </button>
  );
}

/* ─── Crest Card (4-28) ─── */
function CrestCard({ house, rank, isSelected, onClick }: {
  house: House; rank: number; isSelected: boolean; onClick: () => void;
}) {
  const imgSrc = house.image || '/images/mbti/analyst.png';
  const romanRank = toRoman(rank);

  return (
    <button
      onClick={onClick}
      className="relative p-3 text-center transition-all duration-200 hover:-translate-y-0.5 group"
      style={{
        border: isSelected ? '1px solid rgba(200,168,78,0.5)' : '1px solid rgba(200,168,78,0.12)',
        background: isSelected
          ? 'linear-gradient(135deg, #1e1a12 0%, #12100c 100%)'
          : 'linear-gradient(135deg, #16140e 0%, #0e0d0a 100%)',
        boxShadow: isSelected ? '0 0 20px rgba(200,168,78,0.1)' : 'none',
      }}
    >
      <p className="font-display text-[9px] tracking-[2px] mb-2" style={{ color: '#4a4030' }}>
        {romanRank}
      </p>
      <div className="flex justify-center mb-2">
        <Image src={imgSrc} alt={house.name} width={40} height={40} className="opacity-60 group-hover:opacity-80 transition-opacity" />
      </div>
      <p className="font-display text-[11px] tracking-[1px] truncate" style={{ color: '#d4c5a0' }}>
        {house.childName || `#${house.childTokenId}`}
      </p>
      <p className="font-display text-[12px] mt-1" style={{ color: '#c8a84e' }}>
        {'\u2605'} {house.routeAvgRating.toFixed(2)}
      </p>
    </button>
  );
}

/* ─── House Detail (expanded) ─── */
function HouseDetail({ house }: { house: House }) {
  return (
    <div
      className="mt-4 mb-6 p-5 relative overflow-hidden"
      style={{
        border: '1px solid rgba(200,168,78,0.25)',
        background: 'linear-gradient(135deg, rgba(26,22,16,0.95) 0%, rgba(14,13,10,0.95) 100%)',
        boxShadow: '0 0 30px rgba(200,168,78,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(200,168,78,0.04) 0%, transparent 60%)' }}
      />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-display text-lg tracking-[1px]" style={{ color: '#e8d48a' }}>{house.name}</p>
          <p className="text-xs" style={{ color: '#6a5f4a' }}>
            Bloodline: {house.route.map(id => `#${id}`).join(' → ')}
          </p>
        </div>
        <Link
          href={`/family/${house.childTokenId}`}
          className="px-4 py-2 font-display text-[11px] tracking-[2px] uppercase transition-colors hover:bg-[rgba(200,168,78,0.1)]"
          style={{ border: '1px solid rgba(200,168,78,0.25)', color: '#c8a84e' }}
        >
          Family Tree
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {house.members
          .sort((a, b) => house.route.indexOf(a.tokenId) - house.route.indexOf(b.tokenId))
          .map((m, i) => {
            const gen = i === 0 ? 'Heir' : i === 1 ? 'Parent' : 'Elder';
            const mName = m.personalityDesc?.split(' — ')[0] || `#${m.tokenId}`;
            return (
              <Link
                key={m.tokenId}
                href={`/mutt/${m.tokenId}`}
                className="flex-shrink-0 w-32 p-3 text-center transition-all hover:-translate-y-0.5"
                style={{
                  border: '1px solid rgba(200,168,78,0.15)',
                  background: 'rgba(12,11,8,0.6)',
                }}
              >
                <div className="flex justify-center mb-1">
                  <Image src={m.image || '/images/mbti/analyst.png'} alt={m.personality} width={36} height={36} className="opacity-70" />
                </div>
                <p className="font-display text-[10px] tracking-[1px] truncate" style={{ color: '#d4c5a0' }}>{mName}</p>
                <p className="text-[9px]" style={{ color: '#6a5f4a' }}>{m.personality} · {gen}</p>
                <p className="text-[10px] mt-1 text-gold">{'\u2605'} {m.avgRating.toFixed(2)}</p>
              </Link>
            );
          })}
      </div>
    </div>
  );
}

/* ─── House Row (purebloods tab) ─── */
function HouseRow({ house, rank, isSacred }: { house: House; rank: number; isSacred: boolean }) {
  const imgSrc = house.image || '/images/mbti/analyst.png';
  return (
    <Link
      href={`/family/${house.childTokenId}`}
      className="flex items-center gap-4 p-4 transition-colors hover:bg-[rgba(200,168,78,0.03)]"
      style={{
        border: rank <= 3 ? '1px solid rgba(200,168,78,0.5)' : '1px solid rgba(200,168,78,0.12)',
        background: 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
        boxShadow: rank === 1 ? '0 0 24px rgba(200,168,78,0.12)' : 'none',
      }}
    >
      <span className="w-10 text-center font-display text-xl font-bold"
        style={{ color: rank === 1 ? '#e8d48a' : rank === 2 ? '#b0b0b0' : rank === 3 ? '#cd7f32' : '#c8a84e' }}>
        {rank}
      </span>
      <Image src={imgSrc} alt={house.name} width={36} height={36} className="opacity-70" />
      <div className="flex-1">
        <p style={{ color: '#d4c5a0' }}>
          <span className="font-display tracking-[1px]">{house.name}</span>
          {isSacred && (
            <span className="font-display text-xs tracking-[2px] ml-2" style={{ color: '#e8d48a' }}>SACRED</span>
          )}
        </p>
        <p className="text-xs" style={{ color: '#6a5f4a' }}>
          {house.members.length} bloodline {'\u00B7'} {house.route.map(id => `#${id}`).join(' → ')}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg text-gold font-display">{'\u2605'} {house.routeAvgRating.toFixed(2)}</p>
        <p className="text-[11px]" style={{ color: '#6a5f4a' }}>{house.routeReviews} reviews</p>
      </div>
    </Link>
  );
}

/* ─── Mutt Row (all tab) ─── */
function MuttRow({ mutt, rank }: { mutt: LeaderboardMutt; rank: number }) {
  const mName = mutt.personalityDesc?.split(' — ')[0] || `Mutt #${String(mutt.tokenId).padStart(4, '0')}`;
  const imgSrc = mutt.image || '/images/mbti/analyst.png';
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
      <span className="w-10 text-center font-display text-xl font-bold"
        style={{ color: rank === 1 ? '#e8d48a' : rank === 2 ? '#b0b0b0' : rank === 3 ? '#cd7f32' : '#c8a84e' }}>
        {rank}
      </span>
      <Image src={imgSrc} alt={mutt.personality} width={36} height={36} className="opacity-60" />
      <div className="flex-1">
        <p style={{ color: '#d4c5a0' }}>
          <span className="font-display tracking-[1px]">{mName}</span>
          {(mutt.bloodline === 'pureblood' || mutt.bloodline === 'sacred28') && (
            <span className="font-display text-xs text-gold tracking-[2px] ml-2">PURE</span>
          )}
        </p>
        <p className="text-xs" style={{ color: '#6a5f4a' }}>
          {mutt.personality} {'\u00B7'} #{mutt.tokenId}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg text-gold font-display">{'\u2605'} {mutt.avgRating.toFixed(2)}</p>
        <p className="text-[11px]" style={{ color: '#6a5f4a' }}>{mutt.totalReviews} reviews</p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16" style={{ border: '1px solid rgba(200,168,78,0.08)' }}>
      <p className="font-display text-lg mb-2" style={{ color: '#3a3028' }}>{'\u2726'}</p>
      <p className="text-sm" style={{ color: '#6a5f4a' }}>No houses have proven their worth yet</p>
      <p className="text-xs mt-1" style={{ color: '#3a3028' }}>Breed. Rate. Earn your bloodline.</p>
    </div>
  );
}

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let r = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { r += syms[i]; n -= vals[i]; }
  }
  return r;
}
