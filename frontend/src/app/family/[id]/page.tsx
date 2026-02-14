'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/db';
import type { BloodlineGrade } from '@/types';

interface TreeNode {
  tokenId: number;
  personality: string;
  personalityDesc?: string;
  bloodline: BloodlineGrade;
  avgRating: number;
  totalReviews: number;
  parentA: number;
  parentB: number;
  image?: string;
  isSacred?: boolean;
}

export default function FamilyTreePage() {
  const params = useParams();
  const [current, setCurrent] = useState<TreeNode | null>(null);
  const [parents, setParents] = useState<(TreeNode | null)[]>([null, null]);
  const [grandparents, setGrandparents] = useState<(TreeNode | null)[]>([null, null, null, null]);
  const [sacredIds, setSacredIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNode = async (id: number): Promise<TreeNode | null> => {
      try {
        const res = await fetch(`/api/mutt/${id}`);
        if (!res.ok) return null;
        const d = await res.json();
        return {
          tokenId: d.tokenId,
          personality: d.personality,
          personalityDesc: d.personalityDesc,
          bloodline: d.bloodline,
          avgRating: d.avgRating,
          totalReviews: d.totalReviews,
          parentA: d.parentA,
          parentB: d.parentB,
          image: d.image,
        };
      } catch {
        return null;
      }
    };

    const load = async () => {
      const cur = await fetchNode(Number(params.id));
      if (!cur) { setLoading(false); return; }
      setCurrent(cur);

      const [pA, pB] = await Promise.all([
        cur.parentA > 0 ? fetchNode(cur.parentA) : null,
        cur.parentB > 0 ? fetchNode(cur.parentB) : null,
      ]);
      setParents([pA, pB]);

      const gps = await Promise.all([
        pA?.parentA ? fetchNode(pA.parentA) : null,
        pA?.parentB ? fetchNode(pA.parentB) : null,
        pB?.parentA ? fetchNode(pB.parentA) : null,
        pB?.parentB ? fetchNode(pB.parentB) : null,
      ]);
      setGrandparents(gps);

      // Fetch sacred 28 membership
      const { data: routeData } = await supabase
        .from('mutts')
        .select('token_id, pureblood_route')
        .not('pureblood_route', 'is', null);

      if (routeData) {
        // Build house list, sort by avg, take top 28
        const houseMap = new Map<number, { avgRating: number; memberIds: Set<number> }>();
        for (const m of routeData) {
          const route = m.pureblood_route as { path: number[]; avgRating: number } | null;
          if (!route?.path?.length) continue;
          const childId = route.path[0];
          if (!houseMap.has(childId)) {
            houseMap.set(childId, { avgRating: route.avgRating, memberIds: new Set() });
          }
          const house = houseMap.get(childId)!;
          for (const id of route.path) house.memberIds.add(id);
        }
        const top28 = Array.from(houseMap.entries())
          .sort((a, b) => b[1].avgRating - a[1].avgRating)
          .slice(0, 28);
        const ids = new Set<number>();
        for (const [, house] of top28) {
          for (const id of house.memberIds) ids.add(id);
        }
        setSacredIds(ids);
      }

      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) return <div className="text-center py-20 font-display" style={{ color: '#6a5f4a' }}>Loading...</div>;
  if (!current) return <div className="text-center py-20 font-display" style={{ color: '#6a5f4a' }}>Mutt not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-center font-display text-[32px] text-gold tracking-[3px] mb-2">Family Tree</h1>
      <p className="text-center text-sm italic mb-12" style={{ color: '#6a5f4a' }}>
        Mutt #{String(current.tokenId).padStart(4, '0')} &mdash; 3 Generations
      </p>

      <div className="flex flex-col items-center gap-2">
        {/* Grandparents — two groups aligned under each parent */}
        {(parents[0] || parents[1]) && (
          <>
            <p className="font-display text-[10px] tracking-[2px] uppercase mb-2" style={{ color: '#3a3028' }}>
              Grandparents
            </p>
            <div className="flex gap-16 justify-center">
              {/* Parent A's parents */}
              <div className="flex gap-4 justify-center">
                {parents[0] && parents[0].parentA === 0 ? (
                  <OriginCard />
                ) : (
                  <>
                    {grandparents[0] && <NodeCard node={grandparents[0]} sacredIds={sacredIds} />}
                    {grandparents[1] && <NodeCard node={grandparents[1]} sacredIds={sacredIds} />}
                  </>
                )}
              </div>
              {/* Parent B's parents */}
              <div className="flex gap-4 justify-center">
                {parents[1] && parents[1].parentA === 0 ? (
                  <OriginCard />
                ) : (
                  <>
                    {grandparents[2] && <NodeCard node={grandparents[2]} sacredIds={sacredIds} />}
                    {grandparents[3] && <NodeCard node={grandparents[3]} sacredIds={sacredIds} />}
                  </>
                )}
              </div>
            </div>
            <Connector />
          </>
        )}

        {/* Parents */}
        <p className="font-display text-[10px] tracking-[2px] uppercase mb-2" style={{ color: '#3a3028' }}>
          Parents
        </p>
        <div className="flex gap-28 justify-center">
          {parents.map((p, i) => (
            <NodeCard key={i} node={p} isGenesis={p !== null && p.parentA === 0} sacredIds={sacredIds} />
          ))}
        </div>

        <Connector />

        {/* Current */}
        <p className="font-display text-[10px] tracking-[2px] uppercase mb-2" style={{ color: '#3a3028' }}>
          Current
        </p>
        <NodeCard node={current} highlight sacredIds={sacredIds} />
      </div>

      {/* Pureblood / Sacred route info */}
      {(current.bloodline === 'pureblood' || current.bloodline === 'sacred28' || sacredIds.has(current.tokenId)) && (
        <div
          className="mt-10 p-6 text-center relative overflow-hidden"
          style={{
            border: '1px solid rgba(200,168,78,0.4)',
            background: 'linear-gradient(135deg, rgba(26,22,16,0.95) 0%, rgba(18,16,12,0.95) 100%)',
            boxShadow: '0 0 40px rgba(200,168,78,0.08), inset 0 0 30px rgba(200,168,78,0.03)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(200,168,78,0.06) 0%, transparent 70%)' }}
          />
          <p className="font-display text-[13px] tracking-[3px] uppercase mb-3" style={{ color: '#e8d48a' }}>
            {sacredIds.has(current.tokenId)
              ? '\u2726 Sacred 28 Bloodline \u2726'
              : '\u2726 Pureblood Route \u2726'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[current, parents[0], ...grandparents.filter(Boolean)].filter(Boolean).map((node, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: '#4a4030' }}>{'\u2192'}</span>}
                <span className="font-display text-sm" style={{ color: '#d4c5a0' }}>
                  #{String(node!.tokenId).padStart(4, '0')}
                </span>
              </span>
            ))}
          </div>
          <p className="text-[10px] mt-3 font-display tracking-[2px]" style={{ color: '#6a5f4a' }}>
            &ldquo;Purebloods are earned, not born.&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

function NodeCard({ node, highlight, isGenesis, sacredIds }: { node: TreeNode | null; highlight?: boolean; isGenesis?: boolean; sacredIds?: Set<number> }) {
  if (!node) return null;

  const isSacred = sacredIds?.has(node.tokenId) ?? false;
  const isPure = isSacred || node.bloodline === 'pureblood' || node.bloodline === 'sacred28';
  const imgSrc = node.image || '/images/mbti/analyst.png';

  // Extract name from personality_desc ("Name — Description")
  const name = node.personalityDesc?.split(' — ')[0] || `Mutt #${String(node.tokenId).padStart(4, '0')}`;

  return (
    <Link
      href={`/mutt/${node.tokenId}`}
      className="w-40 p-4 text-center relative transition-all duration-300 hover:scale-105 group"
      style={{
        border: highlight
          ? '2px solid #c8a84e'
          : isPure
            ? '2px solid rgba(200,168,78,0.6)'
            : '1px solid rgba(200,168,78,0.12)',
        background: isPure
          ? 'linear-gradient(135deg, #2a2210 0%, #1a1508 50%, #12100c 100%)'
          : 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
        boxShadow: highlight
          ? '0 0 30px rgba(200,168,78,0.25), inset 0 0 20px rgba(200,168,78,0.05)'
          : isPure
            ? '0 0 15px rgba(200,168,78,0.12), inset 0 0 10px rgba(200,168,78,0.03)'
            : 'none',
      }}
    >
      {/* Pureblood corner glow */}
      {isPure && (
        <>
          <span className="absolute -top-2 -right-2 text-sm">{'\u{1F451}'}</span>
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(200,168,78,0.08) 0%, transparent 60%)',
            }}
          />
        </>
      )}
      {isGenesis && (
        <span className="absolute -top-2 -left-2 font-display text-[9px] tracking-[1px] px-1.5 py-0.5"
          style={{ background: 'rgba(12,11,8,0.9)', border: '1px solid rgba(200,168,78,0.2)', color: '#6a5f4a' }}>
          GEN0
        </span>
      )}
      <div className="flex justify-center mb-2 relative">
        <Image
          src={imgSrc}
          alt={node.personality}
          width={56}
          height={56}
          className={isPure ? 'opacity-90 drop-shadow-[0_0_8px_rgba(200,168,78,0.3)]' : 'opacity-70'}
        />
      </div>
      <p className="font-display text-[12px] tracking-[1px] mb-0.5" style={{ color: isPure ? '#e8d48a' : '#d4c5a0' }}>
        {name}
      </p>
      <p className="font-display text-[11px] tracking-[1px]" style={{ color: '#8a7d5a' }}>
        #{String(node.tokenId).padStart(4, '0')}
      </p>
      <p className="text-[10px] text-gold tracking-[1px]">{node.personality}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className="text-[11px]" style={{ color: isPure ? '#e8d48a' : '#6a5f4a' }}>
          {'\u2605'} {node.avgRating.toFixed(1)}
        </span>
        <span className="text-[9px]" style={{ color: '#4a4030' }}>({node.totalReviews})</span>
      </div>
      {isPure && (
        <p className="font-display text-[8px] tracking-[2px] uppercase mt-1.5"
          style={{ color: isSacred ? '#e8d48a' : '#c8a84e' }}>
          {isSacred ? '\u2726 Sacred 28 \u2726' : 'Pureblood'}
        </p>
      )}
    </Link>
  );
}

function OriginCard() {
  return (
    <div
      className="w-40 p-4 text-center flex flex-col items-center justify-center"
      style={{
        border: '1px solid rgba(200,168,78,0.08)',
        background: 'linear-gradient(135deg, #14120e 0%, #0c0b08 100%)',
      }}
    >
      <p className="font-display text-[10px] uppercase tracking-[2px] mb-2" style={{ color: '#3a3028' }}>
        Origin
      </p>
      <p className="font-display text-sm tracking-[2px]" style={{ color: '#4a4030' }}>Genesis</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-3">
      <div className="w-0.5 h-8" style={{ background: 'rgba(200,168,78,0.15)' }} />
    </div>
  );
}
