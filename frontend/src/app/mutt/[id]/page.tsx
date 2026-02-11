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

const BLOODLINE_DISPLAY: Record<BloodlineGrade, { label: string; color: string }> = {
  mutt: { label: 'Mutt', color: '#6a5f4a' },
  halfblood: { label: 'Halfblood', color: '#c45c5c' },
  pureblood: { label: 'Pureblood', color: '#c8a84e' },
  sacred28: { label: 'Sacred 28', color: '#e8d48a' },
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
    if (!mutt || ratingScore === 0) return;
    const voter = address || '0x0000000000000000000000000000000000000000';
    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: mutt.tokenId, voter, score: ratingScore }),
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
    return <div className="text-center py-20 font-display" style={{ color: '#6a5f4a' }}>Loading...</div>;
  }

  if (!mutt) {
    return <div className="text-center py-20 font-display" style={{ color: '#6a5f4a' }}>Mutt not found</div>;
  }

  const bl = BLOODLINE_DISPLAY[mutt.bloodline];
  const isOwner = address?.toLowerCase() === mutt.breeder.toLowerCase();
  const breedCostMON = mutt.onChain?.breedCost
    ? (Number(mutt.onChain.breedCost) / 1e18).toFixed(4)
    : '0';

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 grid grid-cols-[320px_1fr] gap-10">
      {/* Pokemon Card */}
      <div
        className="relative"
        style={{
          border: '3px solid #c8a84e',
          background: 'linear-gradient(135deg, #1a1610 0%, #12100c 50%, #0e0c08 100%)',
          padding: '24px',
          boxShadow: '0 0 40px rgba(200,168,78,0.1)',
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ inset: '6px', border: '1px solid rgba(200,168,78,0.12)' }}
        />

        <div className="flex justify-between items-center mb-4">
          <span className="font-display text-xl text-gold tracking-[2px]">
            Mutt #{String(mutt.tokenId).padStart(4, '0')}
          </span>
          <span
            className="px-3 py-1 font-display text-xs tracking-[2px]"
            style={{ border: '1px solid rgba(200,168,78,0.2)', color: '#c8a84e' }}
          >
            {mutt.personality}
          </span>
        </div>

        <div
          className="w-full h-70 flex items-center justify-center text-8xl mb-4"
          style={{ background: 'rgba(10,10,15,0.8)', border: '1px solid rgba(200,168,78,0.08)' }}
        >
          {mutt.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mutt.image} alt={`Mutt #${mutt.tokenId}`} className="w-full h-full object-cover" />
          ) : (
            <span className="opacity-40">?</span>
          )}
        </div>

        <p
          className="text-xs italic text-center p-2 mb-4"
          style={{ color: '#6a5f4a', border: '1px solid rgba(200,168,78,0.08)' }}
        >
          &ldquo;{mutt.personalityDesc}&rdquo;
        </p>

        <div className="flex gap-2 justify-center mb-4">
          {Object.values(mutt.traits).map((t) => (
            <span
              key={t}
              className="px-2 py-1 text-[11px]"
              style={{ border: '1px solid rgba(200,168,78,0.15)', color: '#8a7d65' }}
            >
              {t}
            </span>
          ))}
        </div>

        <div
          className="text-center pt-2 font-display text-sm"
          style={{ borderTop: '1px solid rgba(200,168,78,0.1)', color: bl.color }}
        >
          {bl.label}
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex flex-col gap-6">
        {/* Rating */}
        <div
          className="p-5"
          style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}
        >
          <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-3">Reputation</h3>
          <RatingDisplay avgRating={mutt.avgRating} totalReviews={mutt.totalReviews} />

          {!isOwner && !ratingSubmitted && (
            <div className="mt-4">
              <p className="text-xs mb-2" style={{ color: '#6a5f4a' }}>Rate this Mutt:</p>
              <div className="flex items-center gap-2">
                <StarRating value={ratingScore} onChange={setRatingScore} />
                <button
                  onClick={handleRate}
                  disabled={ratingScore === 0}
                  className="px-4 py-1.5 border border-gold text-gold font-display text-xs disabled:opacity-30 hover:bg-gold hover:text-[#06060a] transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Parents */}
        <div
          className="p-5"
          style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}
        >
          <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-3">Parents</h3>
          <div className="flex gap-4">
            {[
              { id: mutt.parentA, label: 'Parent A' },
              { id: mutt.parentB, label: 'Parent B' },
            ].map(({ id, label }) =>
              id > 0 ? (
                <Link
                  key={label}
                  href={`/mutt/${id}`}
                  className="flex-1 p-3 text-center transition-colors hover:border-gold"
                  style={{ border: '1px solid rgba(200,168,78,0.12)' }}
                >
                  <p className="font-display text-[10px] uppercase tracking-[2px]" style={{ color: '#3a3028' }}>
                    {label}
                  </p>
                  <p className="text-3xl my-2 opacity-50">?</p>
                  <p className="text-xs" style={{ color: '#8a7d65' }}>
                    Mutt #{String(id).padStart(4, '0')}
                  </p>
                </Link>
              ) : (
                <div
                  key={label}
                  className="flex-1 p-3 text-center"
                  style={{ border: '1px solid rgba(200,168,78,0.08)' }}
                >
                  <p className="font-display text-[10px] uppercase tracking-[2px]" style={{ color: '#3a3028' }}>
                    Origin
                  </p>
                  <p className="text-3xl my-2">{'\u{1F95A}'}</p>
                  <p className="text-xs" style={{ color: '#6a5f4a' }}>Genesis</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Details */}
        <div
          className="p-5"
          style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}
        >
          <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-3">Details</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs" style={{ color: '#6a5f4a' }}>Breeder</span>
            <span className="text-xs font-mono" style={{ color: '#8a7d65' }}>
              {mutt.breeder.slice(0, 6)}...{mutt.breeder.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: '#6a5f4a' }}>Breed Cost</span>
            <span className="text-sm text-gold">{breedCostMON} MON</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/breed?partner=${mutt.tokenId}`}
            className="flex-1 py-3.5 text-center font-display font-semibold tracking-[2px] border-2 border-gold text-gold relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
            <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
              Breed
            </span>
          </Link>
          <Link
            href={`/family/${mutt.tokenId}`}
            className="flex-1 py-3.5 text-center font-display tracking-[2px] border border-gold text-gold hover:bg-gold hover:text-[#06060a] transition-colors"
          >
            Family Tree
          </Link>
        </div>
      </div>
    </div>
  );
}
