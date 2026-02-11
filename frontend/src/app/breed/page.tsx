'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
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
    <Suspense fallback={<div className="text-center py-20 text-text-secondary">Loading...</div>}>
      <BreedContent />
    </Suspense>
  );
}

function BreedContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get('partner');

  const [myMutt, setMyMutt] = useState<MuttSlot | null>(null);
  const [partner, setPartner] = useState<MuttSlot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MuttSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    personalityType: string;
    personalityDesc: string;
    traits: { color: string; expression: string; accessory: string };
  } | null>(null);
  const [error, setError] = useState('');

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

  // Load partner from URL param
  useEffect(() => {
    if (partnerId) {
      fetchMutt(parseInt(partnerId)).then((m) => m && setPartner(m));
    }
  }, [partnerId, fetchMutt]);

  // Auto-load mock mutt for "Your Mutt" slot
  useEffect(() => {
    if (!myMutt) {
      fetchMutt(42).then((m) => m && setMyMutt(m));
    }
  }, [fetchMutt, myMutt]);

  const handleBreed = async () => {
    const walletAddr = address || '0x0000000000000000000000000000000000000000';
    if (!myMutt || !partner) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/breed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddr,
          parentA: myMutt.tokenId,
          parentB: partner.tokenId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Breeding failed');
        return;
      }

      setResult({
        personalityType: data.personalityType,
        personalityDesc: data.personalityDesc,
        traits: data.traits,
      });
    } catch {
      setError('Network error');
    } finally {
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
        <div className="text-center p-10 border-2 border-gold bg-bg-secondary">
          <h2 className="text-2xl text-gold mb-6">A New Mutt is Born!</h2>
          <div className="text-7xl mb-4">🐣</div>
          <p className="text-xl text-text-primary mb-1">{result.personalityType}</p>
          <p className="text-sm text-text-secondary italic">&quot;{result.personalityDesc}&quot;</p>
          <div className="flex gap-3 justify-center mt-4">
            <span className="px-3 py-1 border border-border-secondary text-xs text-gold-dim">{result.traits.color}</span>
            <span className="px-3 py-1 border border-border-secondary text-xs text-gold-dim">{result.traits.expression}</span>
            <span className="px-3 py-1 border border-border-secondary text-xs text-gold-dim">{result.traits.accessory}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <h1 className="text-center text-3xl text-gold mb-2">Breeding Chamber</h1>
      <p className="text-center text-sm text-text-secondary mb-12">
        Combine two identities. Create something new.
      </p>

      {/* Arena */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-start">
        {/* My Mutt */}
        <SlotCard label="Your Mutt" mutt={myMutt} onClear={() => setMyMutt(null)} />

        {/* Center */}
        <div className="flex flex-col items-center gap-6 py-10">
          <span className="text-5xl text-gold">×</span>

          {myMutt && partner && (
            <div className="p-4 border border-border-primary bg-bg-secondary text-center min-w-40">
              <p className="text-[10px] text-text-secondary tracking-widest uppercase mb-2">Predicted Offspring</p>
              <p className="text-sm text-text-primary">AI Analyzed</p>
              <p className="text-[11px] text-text-secondary mt-1">+ 10% mutation chance</p>
            </div>
          )}

          {partner?.breedCost && (
            <div className="p-3 border border-border-primary text-center">
              <p className="text-[10px] text-text-secondary tracking-wide">Breed Cost</p>
              <p className="text-lg text-gold mt-1">
                {(Number(partner.breedCost) / 1e18).toFixed(4)} MON
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">incl. 10% platform fee</p>
            </div>
          )}

          <button
            onClick={handleBreed}
            disabled={!myMutt || !partner || loading}
            className="px-12 py-4 bg-gold text-bg-primary font-bold tracking-widest uppercase disabled:opacity-30"
            style={{ boxShadow: myMutt && partner ? '0 0 30px rgba(200,168,78,0.3)' : 'none' }}
          >
            {loading ? 'Breeding...' : 'BREED'}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* Partner */}
        <SlotCard label="Partner Mutt" mutt={partner} onClear={() => setPartner(null)} />
      </div>

      {/* Search */}
      <div className="mt-10 p-6 border border-border-primary bg-bg-secondary">
        <h3 className="text-xs text-gold tracking-widest uppercase mb-4">Find a Partner</h3>
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-4 py-2.5 bg-bg-primary border border-border-primary text-text-primary text-sm focus:outline-none focus:border-gold placeholder:text-text-muted"
            placeholder="Search by token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 border border-gold text-gold text-sm"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {searchResults.map((m) => (
              <button
                key={m.tokenId}
                onClick={() => setPartner(m)}
                className="p-3 border border-border-primary text-center hover:border-gold transition-colors"
              >
                <div className="text-3xl mb-2 opacity-50">?</div>
                <p className="text-xs text-text-primary">Mutt #{String(m.tokenId).padStart(4, '0')}</p>
                <p className="text-[11px] text-gold">{m.personality}</p>
                <p className="text-[10px] text-text-secondary mt-1">
                  {m.breedCost ? `${(Number(m.breedCost) / 1e18).toFixed(4)} MON` : 'Free'}
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
    <div className={`border-2 bg-bg-secondary p-6 text-center min-h-[360px] flex flex-col items-center justify-center ${mutt ? 'border-gold' : 'border-border-primary'}`}>
      <p className="text-[11px] text-text-secondary tracking-widest uppercase mb-4">{label}</p>
      {mutt ? (
        <>
          <div className="text-6xl mb-3 opacity-50">?</div>
          <p className="text-lg text-text-primary mb-1">Mutt #{String(mutt.tokenId).padStart(4, '0')}</p>
          <p className="text-sm text-gold tracking-wide mb-2">{mutt.personality}</p>
          <p className="text-[11px] text-text-secondary">{BLOODLINE_LABEL[mutt.bloodline]}</p>
          <button onClick={onClear} className="mt-3 px-4 py-1.5 border border-border-secondary text-text-secondary text-[11px]">
            Change
          </button>
        </>
      ) : (
        <>
          <div className="text-5xl text-border-primary mb-4">+</div>
          <p className="text-sm text-text-muted">Select a Mutt</p>
        </>
      )}
    </div>
  );
}
