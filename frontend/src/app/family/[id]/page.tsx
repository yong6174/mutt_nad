'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { BloodlineGrade } from '@/types';

interface TreeNode {
  tokenId: number;
  personality: string;
  bloodline: BloodlineGrade;
  avgRating: number;
  totalReviews: number;
  parentA: number;
  parentB: number;
  image?: string;
}

export default function FamilyTreePage() {
  const params = useParams();
  const [current, setCurrent] = useState<TreeNode | null>(null);
  const [parents, setParents] = useState<(TreeNode | null)[]>([null, null]);
  const [grandparents, setGrandparents] = useState<(TreeNode | null)[]>([null, null, null, null]);
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
        {/* Grandparents — only show if at least one parent is NOT genesis */}
        {(() => {
          // parentA is genesis if parentA.parentA === 0 (no grandparents on that side)
          const pAIsGenesis = !parents[0] || parents[0].parentA === 0;
          const pBIsGenesis = !parents[1] || parents[1].parentA === 0;
          const hasAnyGrandparent = !pAIsGenesis || !pBIsGenesis;

          if (!hasAnyGrandparent) return null;

          // Filter: only show grandparents that actually exist (from non-genesis parents)
          const visibleGps: TreeNode[] = [];
          if (!pAIsGenesis) {
            if (grandparents[0]) visibleGps.push(grandparents[0]);
            if (grandparents[1]) visibleGps.push(grandparents[1]);
          }
          if (!pBIsGenesis) {
            if (grandparents[2]) visibleGps.push(grandparents[2]);
            if (grandparents[3]) visibleGps.push(grandparents[3]);
          }

          if (visibleGps.length === 0) return null;

          return (
            <>
              <p className="font-display text-[10px] tracking-[2px] uppercase mb-2" style={{ color: '#3a3028' }}>
                Grandparents
              </p>
              <div className="flex gap-6 justify-center">
                {visibleGps.map((gp, i) => (
                  <NodeCard key={i} node={gp} />
                ))}
              </div>
              <Connector />
            </>
          );
        })()}

        {/* Parents */}
        <p className="font-display text-[10px] tracking-[2px] uppercase mb-2" style={{ color: '#3a3028' }}>
          Parents
        </p>
        <div className="flex gap-28 justify-center">
          {parents.map((p, i) => (
            <NodeCard key={i} node={p} isGenesis={p !== null && p.parentA === 0} />
          ))}
        </div>

        <Connector />

        {/* Current */}
        <p className="font-display text-[10px] tracking-[2px] uppercase mb-2" style={{ color: '#3a3028' }}>
          Current
        </p>
        <NodeCard node={current} highlight />
      </div>

      {/* Pureblood route info */}
      {(current.bloodline === 'pureblood' || current.bloodline === 'sacred28') && (
        <div
          className="mt-8 p-4 text-center"
          style={{ border: '1px solid rgba(200,168,78,0.3)', background: 'rgba(18,17,10,0.8)' }}
        >
          <p className="font-display text-[11px] text-gold tracking-[2px] uppercase mb-2">Pureblood Route</p>
          <p className="text-sm" style={{ color: '#d4c5a0' }}>
            #{String(current.tokenId).padStart(4, '0')}
            {parents[0] && ` \u2192 #${String(parents[0].tokenId).padStart(4, '0')}`}
            {grandparents[0] && ` \u2192 #${String(grandparents[0].tokenId).padStart(4, '0')}`}
          </p>
        </div>
      )}
    </div>
  );
}

function NodeCard({ node, highlight, isGenesis }: { node: TreeNode | null; highlight?: boolean; isGenesis?: boolean }) {
  if (!node) return null;

  const isPure = node.bloodline === 'pureblood' || node.bloodline === 'sacred28';
  const imgSrc = node.image || '/images/mbti/analyst.png';

  return (
    <Link
      href={`/mutt/${node.tokenId}`}
      className="w-36 p-3 text-center relative transition-colors hover:border-gold"
      style={{
        border: highlight
          ? '2px solid #c8a84e'
          : isPure
            ? '2px solid rgba(200,168,78,0.5)'
            : '1px solid rgba(200,168,78,0.12)',
        background: 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
        boxShadow: highlight ? '0 0 20px rgba(200,168,78,0.15)' : 'none',
      }}
    >
      {isPure && <span className="absolute -top-2 -right-2 text-sm">{'\u{1F451}'}</span>}
      {isGenesis && (
        <span className="absolute -top-2 -left-2 font-display text-[9px] tracking-[1px] px-1.5 py-0.5"
          style={{ background: 'rgba(12,11,8,0.9)', border: '1px solid rgba(200,168,78,0.2)', color: '#6a5f4a' }}>
          GEN0
        </span>
      )}
      <div className="flex justify-center mb-1">
        <Image src={imgSrc} alt={node.personality} width={48} height={48} className="opacity-70" />
      </div>
      <p className="font-display text-[11px] tracking-[1px]" style={{ color: '#d4c5a0' }}>
        Mutt #{String(node.tokenId).padStart(4, '0')}
      </p>
      <p className="text-[10px] text-gold tracking-[1px]">{node.personality}</p>
      <p className="text-[10px] mt-1" style={{ color: '#6a5f4a' }}>
        {'\u2605'} {node.avgRating.toFixed(1)} ({node.totalReviews})
      </p>
    </Link>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-3">
      <div className="w-0.5 h-8" style={{ background: 'rgba(200,168,78,0.15)' }} />
    </div>
  );
}
