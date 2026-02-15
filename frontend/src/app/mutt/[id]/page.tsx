'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { RatingDisplay } from '@/components/rating/RatingDisplay';
import { StarRating } from '@/components/rating/StarRating';
import { useSetBreedCost } from '@/hooks/useSetBreedCost';
import { useMint } from '@/hooks/useMint';
import { getPersonalityByType } from '@/lib/personality';
import type { MBTI } from '@/types';
import { useSync } from '@/hooks/useSync';
import { useApproveBreedToken, useBreedTokenAllowance, useBreedTokenBalance } from '@/hooks/useBreed';
import { supabase } from '@/lib/db';
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
  hasRated?: boolean;
  myRating?: number | null;
  onChain?: {
    breedCost: string;
    lastBreedTime: number;
    mintCost: string;
    maxSupply: number;
    totalSupply: number;
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
  const [isSacred, setIsSacred] = useState(false);
  const [breedCostInput, setBreedCostInput] = useState('');
  const { setBreedCost, isPending: costPending, isSuccess: costSuccess } = useSetBreedCost();
  const { mint, isPending: mintPending, isConfirming: mintConfirming, isSuccess: mintSuccess } = useMint();
  const { sync, syncing, synced: mintSynced } = useSync();
  const { approve, isPending: approvePending, isSuccess: approveSuccess } = useApproveBreedToken();
  const { data: allowance, refetch: refetchAllowance } = useBreedTokenAllowance(address);
  const { data: tokenBalance } = useBreedTokenBalance(address);

  // After approve tx succeeds, refetch allowance
  useEffect(() => {
    if (approveSuccess) refetchAllowance();
  }, [approveSuccess, refetchAllowance]);

  // After mint tx confirmed → sync
  useEffect(() => {
    if (mintSuccess && mutt && address && !mintSynced && !syncing) {
      sync(address, mutt.tokenId, 'mint');
    }
  }, [mintSuccess, mutt, address, mintSynced, syncing, sync]);

  useEffect(() => {
    const fetchMutt = async () => {
      try {
        const viewerParam = address ? `?viewer=${address}` : '';
        const res = await fetch(`/api/mutt/${params.id}${viewerParam}`);
        if (res.ok) {
          const data = await res.json();
          setMutt(data);
          if (data.hasRated) {
            setRatingSubmitted(true);
            setRatingScore(data.myRating ?? 0);
          }

          // Check Sacred 28 membership
          if (data.bloodline === 'pureblood' || data.bloodline === 'sacred28') {
            const { data: routeData } = await supabase
              .from('mutts')
              .select('token_id, pureblood_route')
              .not('pureblood_route', 'is', null);
            if (routeData) {
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
              for (const [, house] of top28) {
                if (house.memberIds.has(data.tokenId)) {
                  setIsSacred(true);
                  break;
                }
              }
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchMutt();
  }, [params.id, address]);

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

  const bl = isSacred ? BLOODLINE_DISPLAY.sacred28 : BLOODLINE_DISPLAY[mutt.bloodline];
  const isBreeder = address?.toLowerCase() === mutt.breeder.toLowerCase();
  const breedCostDisplay = mutt.onChain?.breedCost
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutt.image || getPersonalityByType(mutt.personality as MBTI).image}
            alt={`Mutt #${mutt.tokenId}`}
            className="w-full h-full object-cover"
          />
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

          {!isBreeder && ratingSubmitted && (
            <p className="mt-4 text-xs" style={{ color: '#8a7d65' }}>
              You rated {'\u2605'}{ratingScore}
            </p>
          )}
          {!isBreeder && !ratingSubmitted && (
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
                  className="flex-1 p-3 text-center flex flex-col items-center justify-center"
                  style={{ border: '1px solid rgba(200,168,78,0.08)' }}
                >
                  <p className="font-display text-[10px] uppercase tracking-[2px] mb-2" style={{ color: '#3a3028' }}>
                    Origin
                  </p>
                  <p className="font-display text-sm tracking-[2px]" style={{ color: '#6a5f4a' }}>Genesis</p>
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
            <span className="text-sm text-gold">{breedCostDisplay} MUTT</span>
          </div>

          {isBreeder && (
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(200,168,78,0.08)' }}>
              <input
                className="flex-1 px-3 py-1.5 text-xs focus:outline-none"
                style={{
                  background: 'rgba(6,6,10,0.8)',
                  border: '1px solid rgba(200,168,78,0.15)',
                  color: '#d4c5a0',
                }}
                placeholder="New cost (MUTT)"
                value={breedCostInput}
                onChange={(e) => setBreedCostInput(e.target.value)}
              />
              <button
                onClick={() => {
                  if (mutt && breedCostInput) setBreedCost(mutt.tokenId, breedCostInput);
                }}
                disabled={costPending || !breedCostInput}
                className="px-3 py-1.5 border border-gold text-gold font-display text-[11px] disabled:opacity-30 hover:bg-gold hover:text-[#06060a] transition-colors"
              >
                {costPending ? 'Setting...' : costSuccess ? 'Set!' : 'Set Cost'}
              </button>
            </div>
          )}
        </div>

        {/* Mint Section */}
        {mutt.onChain && (
          <MintSection
            mutt={mutt}
            address={address}
            allowance={allowance as bigint | undefined}
            tokenBalance={tokenBalance as bigint | undefined}
            mint={mint}
            approve={approve}
            mintPending={mintPending}
            mintConfirming={mintConfirming}
            mintSuccess={mintSuccess}
            mintSynced={mintSynced}
            syncing={syncing}
            approvePending={approvePending}
          />
        )}

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

        {/* Download Soul — owner only */}
        {address && <SoulDownload tokenId={mutt.tokenId} address={address} />}
      </div>
    </div>
  );
}

function MintSection({
  mutt,
  address,
  allowance,
  tokenBalance,
  mint,
  approve,
  mintPending,
  mintConfirming,
  mintSuccess,
  mintSynced,
  syncing,
  approvePending,
}: {
  mutt: MuttData;
  address?: `0x${string}`;
  allowance?: bigint;
  tokenBalance?: bigint;
  mint: (tokenId: number) => void;
  approve: () => void;
  mintPending: boolean;
  mintConfirming: boolean;
  mintSuccess: boolean;
  mintSynced: boolean;
  syncing: boolean;
  approvePending: boolean;
}) {
  const oc = mutt.onChain!;
  const mintCostBn = BigInt(oc.mintCost || '0');
  const isSoldOut = oc.maxSupply > 0 && oc.totalSupply >= oc.maxSupply;
  const needsApproval = mintCostBn > 0n && (allowance ?? 0n) < mintCostBn;
  const insufficientBalance = mintCostBn > 0n && (tokenBalance ?? 0n) < mintCostBn;
  const isBreeder = address?.toLowerCase() === mutt.breeder.toLowerCase();
  const supplyLabel = oc.maxSupply === 0 ? `${oc.totalSupply}` : `${oc.totalSupply} / ${oc.maxSupply}`;
  const progressPct = oc.maxSupply > 0 ? Math.min((oc.totalSupply / oc.maxSupply) * 100, 100) : 0;

  return (
    <div
      className="p-5"
      style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}
    >
      <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-3">Adopt (Mint)</h3>

      <div className="flex justify-between mb-2">
        <span className="text-xs" style={{ color: '#6a5f4a' }}>Mint Cost</span>
        <span className="text-sm text-gold">
          {mintCostBn === 0n ? 'Free' : `${(Number(mintCostBn) / 1e18).toFixed(2)} MUTT`}
        </span>
      </div>

      <div className="flex justify-between mb-2">
        <span className="text-xs" style={{ color: '#6a5f4a' }}>Supply</span>
        <span className="text-xs" style={{ color: '#8a7d65' }}>
          {supplyLabel}{oc.maxSupply === 0 ? ' (unlimited)' : ''}
        </span>
      </div>

      {oc.maxSupply > 0 && (
        <div className="w-full h-1.5 mb-3" style={{ background: 'rgba(200,168,78,0.1)' }}>
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: isSoldOut ? '#cd7f32' : '#c8a84e' }}
          />
        </div>
      )}

      {isBreeder && (
        <p className="text-[10px] text-center mb-2" style={{ color: '#6a5f4a' }}>
          You are the breeder — 90% fee returns to you
        </p>
      )}

      {mintSuccess && mintSynced ? (
        <p className="text-sm text-center py-2" style={{ color: '#7dba7d' }}>
          Minted successfully!
        </p>
      ) : isSoldOut ? (
        <p className="text-sm text-center py-2" style={{ color: '#cd7f32' }}>Sold out</p>
      ) : insufficientBalance ? (
        <button
          disabled
          className="w-full py-2.5 border border-gold text-gold font-display text-xs tracking-[2px] uppercase opacity-30"
        >
          Insufficient MUTT balance
        </button>
      ) : needsApproval ? (
        <button
          onClick={approve}
          disabled={approvePending}
          className="w-full py-2.5 border border-gold text-gold font-display text-xs tracking-[2px] uppercase disabled:opacity-30 hover:bg-gold hover:text-[#06060a] transition-colors"
        >
          {approvePending ? 'Approving...' : 'Approve MUTT'}
        </button>
      ) : (
        <button
          onClick={() => mint(mutt.tokenId)}
          disabled={mintPending || mintConfirming || syncing}
          className="w-full py-2.5 border-2 border-gold text-gold font-display text-xs tracking-[2px] uppercase disabled:opacity-30 relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
          <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
            {mintPending ? 'Confirm in Wallet...' : mintConfirming ? 'Confirming...' : syncing ? 'Syncing...' : 'Mint (Adopt)'}
          </span>
        </button>
      )}
    </div>
  );
}

function SoulDownload({ tokenId, address }: { tokenId: number; address: `0x${string}` }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [soulData, setSoulData] = useState<{ identity: string; soul: string } | null>(null);

  const fetchSoul = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/mutt/${tokenId}/soul?address=${address.toLowerCase()}`);
      if (res.status === 403) {
        setError('Only owners can download soul files');
        return;
      }
      if (!res.ok) {
        setError('Failed to generate soul');
        return;
      }
      const data = await res.json();
      setSoulData(data);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const download = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!soulData) {
    return (
      <div className="p-5" style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}>
        <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-3">Export Soul</h3>
        <p className="text-[11px] mb-3" style={{ color: '#6a5f4a' }}>
          Download this Mutt&apos;s personality files to use with your AI agent.
        </p>
        <button
          onClick={fetchSoul}
          disabled={loading}
          className="w-full py-2.5 border border-gold text-gold font-display text-xs tracking-[2px] uppercase disabled:opacity-30 hover:bg-gold hover:text-[#06060a] transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Soul Files'}
        </button>
        {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-5" style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}>
      <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-3">Export Soul</h3>
      <p className="text-[11px] mb-4" style={{ color: '#7dba7d' }}>
        Soul files ready. Download and use with your AI agent.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => download(soulData.soul, `SOUL-${tokenId}.md`)}
          className="flex-1 py-2.5 border border-gold text-gold font-display text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-[#06060a] transition-colors"
        >
          SOUL.md
        </button>
        <button
          onClick={() => download(soulData.identity, `IDENTITY-${tokenId}.md`)}
          className="flex-1 py-2.5 border border-gold text-gold font-display text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-[#06060a] transition-colors"
        >
          IDENTITY.md
        </button>
      </div>
    </div>
  );
}
