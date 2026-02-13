'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBreed, useApproveBreedToken, useBreedTokenAllowance, useBreedTokenBalance } from '@/hooks/useBreed';
import { useCooldown } from '@/hooks/useCooldown';
import { useSync } from '@/hooks/useSync';
import { WalletGuard } from '@/components/WalletGuard';
import { supabase } from '@/lib/db';
import { isMockMode, MOCK_MUTTS } from '@/lib/mock';
import type { BloodlineGrade } from '@/types';

interface MuttSlot {
  tokenId: number;
  personality: string;
  bloodline: BloodlineGrade;
  image?: string;
  breedCost?: string;
}

const BLOODLINE_LABEL: Record<BloodlineGrade, string> = {
  mutt: 'Mutt',
  halfblood: 'Halfblood',
  pureblood: 'Pureblood',
  sacred28: 'Sacred 28',
};

export default function BreedPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-text-secondary font-display">Loading...</div>}>
      <BreedContent />
    </Suspense>
  );
}

function BreedContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get('partner');
  const { breed, isPending: txPending, isConfirming, isSuccess, tokenId: onChainTokenId, error: txError } = useBreed();
  const { sync, syncing, synced } = useSync();
  const { approve, isPending: approvePending, isSuccess: approveSuccess } = useApproveBreedToken();
  const { data: allowance, refetch: refetchAllowance } = useBreedTokenAllowance(address);
  const { data: tokenBalance } = useBreedTokenBalance(address);

  const [myMutt, setMyMutt] = useState<MuttSlot | null>(null);
  const [myMutts, setMyMutts] = useState<MuttSlot[]>([]);
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [partner, setPartner] = useState<MuttSlot | null>(null);
  const { isReady: cooldownReady, label: cooldownLabel } = useCooldown(myMutt?.tokenId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MuttSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    personalityType: string;
    personalityDesc: string;
    traits: { color: string; expression: string; accessory: string };
  } | null>(null);
  const [error, setError] = useState('');
  const pendingBreedRef = useRef<{
    personalityType: string;
    personalityDesc: string;
    traits: { color: string; expression: string; accessory: string };
    nonce?: number;
  } | null>(null);

  const fetchMutt = useCallback(async (id: number): Promise<MuttSlot | null> => {
    try {
      const res = await fetch(`/api/mutt/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        tokenId: data.tokenId,
        personality: data.personality,
        bloodline: data.bloodline,
        image: data.image,
        breedCost: data.onChain?.breedCost,
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (partnerId) {
      fetchMutt(parseInt(partnerId)).then((m) => m && setPartner(m));
    }
  }, [partnerId, fetchMutt]);

  // Load user's owned mutts
  useEffect(() => {
    if (!address) return;
    const addr = address.toLowerCase();

    if (isMockMode()) {
      const mocks = Object.values(MOCK_MUTTS).map((m) => ({
        tokenId: m.token_id,
        personality: m.personality,
        bloodline: m.bloodline as BloodlineGrade,
        image: m.image,
        breedCost: '0',
      }));
      setMyMutts(mocks);
      if (!myMutt && mocks.length > 0) setMyMutt(mocks[0]);
      return;
    }

    (async () => {
      const { data: holdings } = await supabase
        .from('holdings')
        .select('token_id')
        .eq('address', addr)
        .gt('balance', 0);

      if (!holdings || holdings.length === 0) return;
      const tokenIds = holdings.map((h) => h.token_id);

      const { data: muttsData } = await supabase
        .from('mutts')
        .select('token_id, personality, bloodline')
        .in('token_id', tokenIds);

      if (muttsData) {
        const slots: MuttSlot[] = muttsData.map((m) => ({
          tokenId: m.token_id,
          personality: m.personality,
          bloodline: m.bloodline as BloodlineGrade,
        }));
        setMyMutts(slots);
        if (!myMutt && slots.length > 0) setMyMutt(slots[0]);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Watch tx confirmation → sync → show result
  useEffect(() => {
    if (isSuccess && onChainTokenId && pendingBreedRef.current && !synced && !syncing) {
      sync(address!, onChainTokenId, 'breed');
    }
  }, [isSuccess, onChainTokenId, address, sync, synced, syncing]);

  useEffect(() => {
    if (synced && pendingBreedRef.current) {
      setResult(pendingBreedRef.current);
      setLoading(false);
    }
  }, [synced]);

  useEffect(() => {
    if (txError) {
      setError(txError.message.slice(0, 100));
      setLoading(false);
      // Clean up pending action on tx reject (pass nonce for precise deletion)
      if (address) {
        fetch('/api/pending/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, nonce: pendingBreedRef.current?.nonce }),
        }).catch(() => {});
      }
    }
  }, [txError, address]);

  // After approve tx succeeds, refetch allowance
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  const breedCostBn = partner?.breedCost ? BigInt(partner.breedCost) : 0n;
  const needsApproval = breedCostBn > 0n && (allowance ?? 0n) < breedCostBn;
  const insufficientBalance = breedCostBn > 0n && (tokenBalance ?? 0n) < breedCostBn;

  const handleApprove = () => {
    approve();
  };

  const handleBreed = async () => {
    if (!isMockMode() && (!isConnected || !address)) {
      setError('Please connect your wallet first');
      return;
    }
    if (!myMutt || !partner) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/breed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address || '0x0000000000000000000000000000000000000000',
          parentA: myMutt.tokenId,
          parentB: partner.tokenId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Breeding failed');
        setLoading(false);
        return;
      }

      // Mock mode: skip contract, show result directly
      if (isMockMode()) {
        setResult({
          personalityType: data.personalityType,
          personalityDesc: data.personalityDesc,
          traits: data.traits,
        });
        setLoading(false);
        return;
      }

      pendingBreedRef.current = {
        personalityType: data.personalityType,
        personalityDesc: data.personalityDesc,
        traits: data.traits,
        nonce: data.nonce,
      };

      breed(
        myMutt.tokenId,
        partner.tokenId,
        data.personality,
        data.signature as `0x${string}`,
      );
    } catch {
      setError('Network error');
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const id = parseInt(searchQuery);
    if (!isNaN(id)) {
      const m = await fetchMutt(id);
      setSearchResults(m ? [m] : []);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <div
          className="text-center relative"
          style={{
            padding: '48px 32px',
            border: '3px solid #c8a84e',
            background: 'linear-gradient(135deg, #1a1610 0%, #12100c 50%, #0e0c08 100%)',
            boxShadow: '0 0 60px rgba(200,168,78,0.15)',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ inset: '6px', border: '1px solid rgba(200,168,78,0.15)' }}
          />
          <h2 className="font-display text-2xl text-gold tracking-[3px] mb-6">A New Mutt is Born!</h2>
          <div className="text-7xl mb-4">{'\u{1F423}'}</div>
          <p className="font-display text-xl tracking-[2px] mb-1" style={{ color: '#d4c5a0' }}>
            {result.personalityType}
          </p>
          <p className="text-sm italic mb-5" style={{ color: '#6a5f4a' }}>
            &ldquo;{result.personalityDesc}&rdquo;
          </p>
          <div className="flex gap-2 justify-center">
            {Object.values(result.traits).map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-[11px]"
                style={{ border: '1px solid rgba(200,168,78,0.2)', color: '#8a7d65' }}
              >
                {t}
              </span>
            ))}
          </div>
          <Link
            href="/my"
            className="inline-block mt-8 px-8 py-3 border border-gold text-gold font-display text-sm tracking-[2px] uppercase hover:bg-gold hover:text-[#06060a] transition-colors"
          >
            View Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <WalletGuard />
      <h1 className="text-center font-display text-[32px] text-gold tracking-[3px] mb-2">
        Breeding Chamber
      </h1>
      <p className="text-center text-sm italic mb-12" style={{ color: '#6a5f4a' }}>
        Combine two identities. Create something new.
      </p>

      {/* Arena */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-start">
        <SlotCard label="Your Mutt" mutt={myMutt} onClear={() => { setMyMutt(null); setShowMyPicker(true); }} />

        {/* Center */}
        <div className="flex flex-col items-center gap-6 py-10">
          <span className="font-display text-4xl text-gold">{'\u00D7'}</span>

          {myMutt && partner && (
            <div
              className="p-4 text-center min-w-48"
              style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}
            >
              <p className="font-display text-[10px] tracking-[2px] uppercase mb-3" style={{ color: '#6a5f4a' }}>
                Predicted Offspring
              </p>
              <MbtiPreview parentA={myMutt.personality} parentB={partner.personality} />
              <p className="text-[10px] mt-2" style={{ color: '#3a3028' }}>+ 10% mutation chance</p>
            </div>
          )}

          {breedCostBn > 0n && (
            <div className="p-3 text-center" style={{ border: '1px solid rgba(200,168,78,0.15)' }}>
              <p className="font-display text-[10px] tracking-[2px] uppercase" style={{ color: '#6a5f4a' }}>
                Breed Cost
              </p>
              <p className="text-lg text-gold mt-1">
                {(Number(breedCostBn) / 1e18).toFixed(2)} MUTT
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#3a3028' }}>incl. 10% platform fee</p>
              {insufficientBalance && (
                <p className="text-[11px] text-red-400 mt-1">Insufficient MUTT balance</p>
              )}
            </div>
          )}

          {/* Cooldown */}
          {myMutt && !cooldownReady && (
            <div className="p-3 text-center" style={{ border: '1px solid rgba(200,168,78,0.15)' }}>
              <p className="font-display text-[10px] tracking-[2px] uppercase" style={{ color: '#6a5f4a' }}>
                Cooldown
              </p>
              <p className="text-lg font-display mt-1" style={{ color: '#cd7f32' }}>
                {cooldownLabel}
              </p>
            </div>
          )}

          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={approvePending || !!insufficientBalance}
              className="px-12 py-4 border-2 border-gold text-gold font-display font-semibold tracking-[3px] uppercase disabled:opacity-30 relative overflow-hidden group bg-transparent"
            >
              <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
              <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
                {approvePending ? 'Approving...' : 'Approve MUTT'}
              </span>
            </button>
          ) : (
            <button
              onClick={handleBreed}
              disabled={!myMutt || !partner || loading || !!insufficientBalance || !cooldownReady}
              className="px-12 py-4 border-2 border-gold text-gold font-display font-semibold tracking-[3px] uppercase disabled:opacity-30 relative overflow-hidden group bg-transparent"
              style={{ boxShadow: myMutt && partner && cooldownReady ? '0 0 30px rgba(200,168,78,0.3)' : 'none' }}
            >
              <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
              <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
                {txPending ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : syncing ? 'Syncing...' : loading ? 'Preparing...' : '\u2726 BREED \u2726'}
              </span>
            </button>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <SlotCard label="Partner Mutt" mutt={partner} onClear={() => setPartner(null)} />
      </div>

      {/* My Mutts Picker */}
      {(showMyPicker || !myMutt) && myMutts.length > 0 && (
        <div
          className="mt-10 p-6"
          style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}
        >
          <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-4">Select Your Mutt</h3>
          <div className="grid grid-cols-4 gap-3">
            {myMutts.filter((m) => m.tokenId !== partner?.tokenId).map((m) => (
              <button
                key={m.tokenId}
                onClick={() => { setMyMutt(m); setShowMyPicker(false); }}
                className="p-3 text-center transition-colors hover:border-gold"
                style={{
                  border: m.tokenId === myMutt?.tokenId ? '2px solid #c8a84e' : '1px solid rgba(200,168,78,0.12)',
                  background: 'rgba(6,6,10,0.6)',
                }}
              >
                <div className="text-3xl mb-2 opacity-50">?</div>
                <p className="font-display text-xs tracking-[1px]" style={{ color: '#d4c5a0' }}>
                  Mutt #{String(m.tokenId).padStart(4, '0')}
                </p>
                <p className="text-[11px] text-gold tracking-[1px]">{m.personality}</p>
                <p className="text-[10px] mt-1" style={{ color: '#6a5f4a' }}>{BLOODLINE_LABEL[m.bloodline]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div
        className="mt-10 p-6"
        style={{ border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(12,11,8,0.8)' }}
      >
        <h3 className="font-display text-xs text-gold tracking-[2px] uppercase mb-4">Find a Partner</h3>
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-4 py-2.5 text-sm focus:outline-none placeholder:text-text-muted"
            style={{
              background: 'rgba(6,6,10,0.8)',
              border: '1px solid rgba(200,168,78,0.15)',
              color: '#d4c5a0',
            }}
            placeholder="Search by token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 border border-gold text-gold font-display text-sm tracking-[1px] hover:bg-gold hover:text-[#06060a] transition-colors"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {searchResults.filter((m) => m.tokenId !== myMutt?.tokenId).map((m) => (
              <button
                key={m.tokenId}
                onClick={() => setPartner(m)}
                className="p-3 text-center transition-colors hover:border-gold"
                style={{ border: '1px solid rgba(200,168,78,0.12)', background: 'rgba(6,6,10,0.6)' }}
              >
                <div className="text-3xl mb-2 opacity-50">?</div>
                <p className="font-display text-xs tracking-[1px]" style={{ color: '#d4c5a0' }}>
                  Mutt #{String(m.tokenId).padStart(4, '0')}
                </p>
                <p className="text-[11px] text-gold tracking-[1px]">{m.personality}</p>
                <p className="text-[10px] mt-1" style={{ color: '#6a5f4a' }}>
                  {m.breedCost && Number(m.breedCost) > 0 ? `${(Number(m.breedCost) / 1e18).toFixed(2)} MUTT` : 'Free'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SlotCard({
  label,
  mutt,
  onClear,
}: {
  label: string;
  mutt: MuttSlot | null;
  onClear: () => void;
}) {
  return (
    <div
      className="p-6 text-center min-h-[360px] flex flex-col items-center justify-center"
      style={{
        border: mutt ? '2px solid #c8a84e' : '2px solid rgba(200,168,78,0.15)',
        background: 'linear-gradient(135deg, #1a1610 0%, #12100c 50%, #0e0c08 100%)',
        boxShadow: mutt ? '0 0 30px rgba(200,168,78,0.08)' : 'none',
      }}
    >
      <p className="font-display text-[11px] tracking-[2px] uppercase mb-4" style={{ color: '#6a5f4a' }}>
        {label}
      </p>
      {mutt ? (
        <>
          <div className="text-6xl mb-3 opacity-50">?</div>
          <p className="font-display text-lg tracking-[1px] mb-1" style={{ color: '#d4c5a0' }}>
            Mutt #{String(mutt.tokenId).padStart(4, '0')}
          </p>
          <p className="text-sm text-gold tracking-[2px] mb-2">{mutt.personality}</p>
          <p className="text-[11px]" style={{ color: '#6a5f4a' }}>{BLOODLINE_LABEL[mutt.bloodline]}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="mt-3 px-4 py-1.5 text-[11px] transition-colors hover:border-gold"
            style={{ border: '1px solid rgba(200,168,78,0.15)', color: '#6a5f4a' }}
          >
            Change
          </button>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4" style={{ color: 'rgba(200,168,78,0.15)' }}>+</div>
          <p className="text-sm" style={{ color: '#3a3028' }}>Select a Mutt</p>
        </>
      )}
    </div>
  );
}

const MBTI_AXES = [
  { idx: 0, a: 'E', b: 'I' },
  { idx: 1, a: 'S', b: 'N' },
  { idx: 2, a: 'T', b: 'F' },
  { idx: 3, a: 'J', b: 'P' },
] as const;

function MbtiPreview({ parentA, parentB }: { parentA: string; parentB: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {MBTI_AXES.map(({ idx, a, b }) => {
        const pa = parentA[idx]?.toUpperCase();
        const pb = parentB[idx]?.toUpperCase();
        const pctA = pa === pb ? (pa === a ? 90 : 10) : 50;
        return (
          <div key={a} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-3 text-right font-mono" style={{ color: pctA >= 50 ? '#c8a84e' : '#3a3028' }}>{a}</span>
            <div className="flex-1 h-1.5 relative" style={{ background: 'rgba(200,168,78,0.1)' }}>
              <div
                className="absolute left-0 top-0 h-full"
                style={{ width: `${pctA}%`, background: '#c8a84e', opacity: 0.6 }}
              />
            </div>
            <span className="w-3 font-mono" style={{ color: pctA < 50 ? '#c8a84e' : '#3a3028' }}>{b}</span>
            <span className="w-8 text-right font-mono" style={{ color: '#6a5f4a' }}>{pctA}%</span>
          </div>
        );
      })}
    </div>
  );
}
