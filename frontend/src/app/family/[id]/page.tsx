'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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

  if (loading) return <div className="text-center py-20 text-text-secondary">Loading...</div>;
  if (!current) return <div className="text-center py-20 text-text-secondary">Mutt not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-center text-3xl text-gold mb-2">Family Tree</h1>
      <p className="text-center text-sm text-text-secondary mb-12">
        Mutt #{String(current.tokenId).padStart(4, '0')} — 3 Generations
      </p>

      <div className="flex flex-col items-center gap-2">
        {/* Grandparents */}
        <p className="text-[10px] text-text-muted tracking-widest uppercase mb-2">Grandparents</p>
        <div className="flex gap-6 justify-center">
          {grandparents.map((gp, i) => (
            <NodeCard key={i} node={gp} />
          ))}
        </div>

        <Connector />

        {/* Parents */}
        <p className="text-[10px] text-text-muted tracking-widest uppercase mb-2">Parents</p>
        <div className="flex gap-28 justify-center">
          {parents.map((p, i) => (
            <NodeCard key={i} node={p} />
          ))}
        </div>

        <Connector />

        {/* Current */}
        <p className="text-[10px] text-text-muted tracking-widest uppercase mb-2">Current</p>
        <NodeCard node={current} highlight />
      </div>

      {/* Pureblood route info */}
      {current.bloodline === 'pureblood' || current.bloodline === 'sacred28' ? (
        <div className="mt-8 p-4 border border-gold bg-[#12110a] text-center">
          <p className="text-[11px] text-gold tracking-widest uppercase mb-2">Pureblood Route</p>
          <p className="text-sm text-text-primary">
            #{String(current.tokenId).padStart(4, '0')}
            {parents[0] && ` → #${String(parents[0].tokenId).padStart(4, '0')}`}
            {grandparents[0] && ` → #${String(grandparents[0].tokenId).padStart(4, '0')}`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function NodeCard({ node, highlight }: { node: TreeNode | null; highlight?: boolean }) {
  if (!node) {
    return (
      <div className="w-36 p-3 border border-border-primary bg-bg-secondary text-center opacity-30">
        <p className="text-3xl mb-1">🥚</p>
        <p className="text-[11px] text-text-muted">Genesis</p>
      </div>
    );
  }

  const isPure = node.bloodline === 'pureblood' || node.bloodline === 'sacred28';

  return (
    <Link
      href={`/mutt/${node.tokenId}`}
      className={`w-36 p-3 border-2 bg-bg-secondary text-center relative transition-colors hover:border-gold ${
        highlight ? 'border-gold shadow-[0_0_20px_rgba(200,168,78,0.15)]' : isPure ? 'border-gold' : 'border-border-primary'
      }`}
    >
      {isPure && <span className="absolute -top-2 -right-2 text-sm">👑</span>}
      <div className="text-3xl mb-1 opacity-50">?</div>
      <p className="text-[11px] text-text-primary">Mutt #{String(node.tokenId).padStart(4, '0')}</p>
      <p className="text-[10px] text-gold tracking-wide">{node.personality}</p>
      <p className="text-[10px] text-text-secondary mt-1">★ {node.avgRating.toFixed(1)} ({node.totalReviews})</p>
    </Link>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-3">
      <div className="w-0.5 h-8 bg-border-primary" />
    </div>
  );
}
