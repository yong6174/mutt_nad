'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { RatingDisplay } from '@/components/rating/RatingDisplay';
import { StarRating } from '@/components/rating/StarRating';
import type { BloodlineGrade } from '@/types';

interface MuttData {
  tokenId: number;
  personality: string;
  personalityDesc: string;
  bloodline: BloodlineGrade;
  avgRating: number;
  totalReviews: number;
  traits: { color: string; expression: string; accessory: string };
  image: string;
  parentA: number;
  parentB: number;
  breeder: string;
  onChain?: {
    breedCost: string;
    lastBreedTime: number;
  };
}

const BLOODLINE_DISPLAY: Record<BloodlineGrade, { label: string; className: string }> = {
  mutt: { label: 'Mutt', className: 'text-text-secondary' },
  halfblood: { label: 'Halfblood', className: 'text-red-400' },
  pureblood: { label: 'Pureblood', className: 'text-gold' },
  sacred28: { label: 'Sacred 28', className: 'text-yellow-300' },
};

export default function MuttProfilePage() {
  const params = useParams();
  const { address } = useAccount();
  const [mutt, setMutt] = useState<MuttData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    const fetchMutt = async () => {
      try {
        const res = await fetch(`/api/mutt/${params.id}`);
        if (res.ok) {
          setMutt(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchMutt();
  }, [params.id]);

  const handleRate = async () => {
    if (!address || !mutt || ratingScore === 0) return;
    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: mutt.tokenId, voter: address, score: ratingScore }),
      });
      if (res.ok) {
        const data = await res.json();
        setMutt({ ...mutt, avgRating: data.newAvgRating, totalReviews: data.totalReviews });
        setRatingSubmitted(true);
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-secondary">Loading...</div>;
  }

  if (!mutt) {
    return <div className="text-center py-20 text-text-secondary">Mutt not found</div>;
  }

  const bl = BLOODLINE_DISPLAY[mutt.bloodline];
  const isOwner = address?.toLowerCase() === mutt.breeder.toLowerCase();
  const breedCostMON = mutt.onChain?.breedCost
    ? (Number(mutt.onChain.breedCost) / 1e18).toFixed(4)
    : '0';

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 grid grid-cols-[320px_1fr] gap-10">
      {/* Pokemon Card */}
      <div className="border-3 border-gold bg-bg-secondary p-6 relative" style={{ boxShadow: '0 0 40px rgba(200,168,78,0.1)' }}>
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl text-gold">Mutt #{String(mutt.tokenId).padStart(4, '0')}</span>
          <span className="px-3 py-1 border border-gold text-gold text-xs tracking-widest">{mutt.personality}</span>
        </div>

        <div className="w-full h-70 bg-bg-tertiary border border-border-primary flex items-center justify-center text-8xl mb-4">
          {mutt.image ? (
            <img src={mutt.image} alt={`Mutt #${mutt.tokenId}`} className="w-full h-full object-cover" />
          ) : (
            <span className="opacity-40">?</span>
          )}
        </div>

        <p className="text-xs text-text-secondary italic text-center mb-4 p-2 border border-bg-tertiary">
          &quot;{mutt.personalityDesc}&quot;
        </p>

        <div className="flex gap-2 justify-center mb-4">
          <span className="px-2 py-1 border border-border-secondary text-[11px] text-gold-dim">{mutt.traits.color}</span>
          <span className="px-2 py-1 border border-border-secondary text-[11px] text-gold-dim">{mutt.traits.expression}</span>
          <span className="px-2 py-1 border border-border-secondary text-[11px] text-gold-dim">{mutt.traits.accessory}</span>
        </div>

        <div className={`text-center pt-2 border-t border-border-primary text-sm ${bl.className}`}>
          {bl.label}
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex flex-col gap-6">
        {/* Rating */}
        <div className="p-5 border border-border-primary bg-bg-secondary">
          <h3 className="text-xs text-gold tracking-widest uppercase mb-3">Reputation</h3>
          <RatingDisplay avgRating={mutt.avgRating} totalReviews={mutt.totalReviews} />

          {!isOwner && !ratingSubmitted && (
            <div className="mt-4">
              <p className="text-xs text-text-secondary mb-2">Rate this Mutt:</p>
              <div className="flex items-center gap-2">
                <StarRating value={ratingScore} onChange={setRatingScore} />
                <button
                  onClick={handleRate}
                  disabled={ratingScore === 0}
                  className="px-4 py-1.5 border border-gold text-gold text-xs disabled:opacity-30"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Parents */}
        <div className="p-5 border border-border-primary bg-bg-secondary">
          <h3 className="text-xs text-gold tracking-widest uppercase mb-3">Parents</h3>
          <div className="flex gap-4">
            {mutt.parentA > 0 ? (
              <Link href={`/mutt/${mutt.parentA}`} className="flex-1 p-3 border border-border-primary text-center hover:border-gold transition-colors">
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Parent A</p>
                <p className="text-3xl my-2 opacity-50">?</p>
                <p className="text-xs text-gold-dim">Mutt #{String(mutt.parentA).padStart(4, '0')}</p>
              </Link>
            ) : (
              <div className="flex-1 p-3 border border-border-primary text-center">
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Origin</p>
                <p className="text-3xl my-2">🥚</p>
                <p className="text-xs text-text-secondary">Genesis</p>
              </div>
            )}
            {mutt.parentB > 0 ? (
              <Link href={`/mutt/${mutt.parentB}`} className="flex-1 p-3 border border-border-primary text-center hover:border-gold transition-colors">
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Parent B</p>
                <p className="text-3xl my-2 opacity-50">?</p>
                <p className="text-xs text-gold-dim">Mutt #{String(mutt.parentB).padStart(4, '0')}</p>
              </Link>
            ) : (
              <div className="flex-1 p-3 border border-border-primary text-center">
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Origin</p>
                <p className="text-3xl my-2">🥚</p>
                <p className="text-xs text-text-secondary">Genesis</p>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-5 border border-border-primary bg-bg-secondary">
          <h3 className="text-xs text-gold tracking-widest uppercase mb-3">Details</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-text-secondary">Breeder</span>
            <span className="text-xs text-gold-dim font-mono">
              {mutt.breeder.slice(0, 6)}...{mutt.breeder.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-secondary">Breed Cost</span>
            <span className="text-sm text-text-primary">{breedCostMON} MON</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/breed?partner=${mutt.tokenId}`}
            className="flex-1 py-3.5 text-center bg-gold text-bg-primary font-bold tracking-wide"
          >
            Breed with this Mutt
          </Link>
          <Link
            href={`/family/${mutt.tokenId}`}
            className="flex-1 py-3.5 text-center border border-gold text-gold tracking-wide"
          >
            Family Tree
          </Link>
        </div>
      </div>
    </div>
  );
}
