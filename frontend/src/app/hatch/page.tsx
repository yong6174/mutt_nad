'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useGenesisHatch } from '@/hooks/useGenesisHatch';
import { useHasGenesis } from '@/hooks/useHasGenesis';
import { useSync } from '@/hooks/useSync';
import { WalletGuard } from '@/components/WalletGuard';
import { supabase } from '@/lib/db';
import { isMockMode, MOCK_MUTTS } from '@/lib/mock';
import Link from 'next/link';
import type { BloodlineGrade } from '@/types';

type HatchState = 'input' | 'signing' | 'confirming' | 'syncing' | 'hatching' | 'result';

interface HatchResult {
  personalityType: string;
  personalityDesc: string;
  traits: { color: string; expression: string; accessory: string };
  tokenId?: number;
}

export default function HatchPage() {
  const { address, isConnected } = useAccount();
  const { data: alreadyHatched } = useHasGenesis(address);
  const { hatch, isPending: txPending, isConfirming, isSuccess, tokenId: onChainTokenId, error: txError } = useGenesisHatch();
  const { sync, syncing, synced } = useSync();

  const [identity, setIdentity] = useState('');
  const [state, setState] = useState<HatchState>('input');
  const [result, setResult] = useState<HatchResult | null>(null);
  const [error, setError] = useState('');
  const [showBurst, setShowBurst] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const resultRef = useRef<HatchResult | null>(null);
  const sigRef = useRef<{ personality: number; signature: `0x${string}` } | null>(null);

  const showResultCard = useCallback(() => {
    setShowBurst(true);
    setTimeout(() => {
      setState('result');
      setTimeout(() => setCardVisible(true), 100);
    }, 400);
  }, []);

  // After tx confirmed → play hatch video
  const playHatchVideo = useCallback(() => {
    setState('hatching');
    setResult(resultRef.current);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.onended = () => showResultCard();
      video.play().catch(() => showResultCard());
    } else {
      showResultCard();
    }

    // 8s fallback
    setTimeout(() => showResultCard(), 8000);
  }, [showResultCard]);

  // Watch tx confirmation → sync → trigger video
  useEffect(() => {
    if (isSuccess && onChainTokenId && resultRef.current && !synced && !syncing) {
      resultRef.current.tokenId = onChainTokenId;
      setState('syncing');
      sync(address!, onChainTokenId, 'hatch');
    }
  }, [isSuccess, onChainTokenId, address, sync, synced, syncing]);

  useEffect(() => {
    if (synced && resultRef.current) {
      playHatchVideo();
    }
  }, [synced, playHatchVideo]);

  useEffect(() => {
    if (txError) {
      setError(txError.message.slice(0, 100));
      setState('input');
      // Clean up pending action on tx reject
      if (address) {
        fetch('/api/pending/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        }).catch(() => {});
      }
    }
  }, [txError, address]);

  // Submit identity → API call → submit tx immediately
  const handleHatch = async () => {
    if (!isMockMode() && (!isConnected || !address)) {
      setError('Please connect your wallet first');
      return;
    }
    setError('');
    setShowBurst(false);
    setCardVisible(false);
    setState('signing');

    try {
      const res = await fetch('/api/hatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, identity: identity.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Hatch failed');
        setState('input');
        return;
      }

      resultRef.current = {
        personalityType: data.personalityType,
        personalityDesc: data.personalityDesc,
        traits: data.traits,
        tokenId: data.tokenId,
      };
      sigRef.current = {
        personality: data.personality,
        signature: data.signature as `0x${string}`,
      };

      // Mock mode: skip contract, go straight to video
      if (isMockMode()) {
        playHatchVideo();
        return;
      }

      // Submit tx right away
      hatch(data.personality, data.signature as `0x${string}`);
    } catch {
      setError('Network error');
      setState('input');
    }
  };

  // Already hatched — show genesis mutt mini card + CTAs
  if (alreadyHatched) {
    return <AlreadyHatchedScreen address={address} />;
  }

  return (
    <>
      <WalletGuard />
      {/* Light Burst */}
      <div
        className={`fixed inset-0 z-[70] pointer-events-none ${showBurst ? '' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle, rgba(200,168,78,0.9) 0%, rgba(200,168,78,0) 70%)',
          animation: showBurst ? 'light-burst 1.2s ease-out forwards' : 'none',
        }}
      />

      {/* ===== STATE 1: Input ===== */}
      <div className={state === 'input' ? 'block' : 'hidden'}>
        <div className="max-w-[640px] mx-auto px-6 py-[60px]">
          <h1 className="text-center font-display text-[32px] text-gold tracking-[3px] mb-2">
            Genesis Hatch
          </h1>
          <p className="text-center text-sm italic mb-12" style={{ color: '#6a5f4a' }}>
            Bring your identity into the chain. One wallet, one companion.
          </p>

          <div className="mb-8">
            <p className="font-display text-[13px] text-gold tracking-[2px] uppercase mb-3">
              Identity.md
            </p>
            <p className="text-xs mb-3" style={{ color: '#6a5f4a' }}>
              Paste your bot&apos;s IDENTITY.md below, or write one from scratch.
            </p>
            <textarea
              className="w-full h-[200px] p-4 font-mono text-[13px] leading-relaxed resize-y focus:outline-none"
              style={{
                background: 'rgba(12,11,8,0.8)',
                border: '1px solid rgba(200,168,78,0.15)',
                color: '#d4c5a0',
              }}
              placeholder={`# My Identity\n\n- Name: Luna\n- Creature: A curious ghost fox\n- Vibe: Warm, chaotic, always asking questions\n- Emoji: \u{1F98A}\n\nI love exploring ideas and breaking rules...`}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
          </div>

          <div
            className="text-center text-xs p-3 mb-8"
            style={{ color: '#6a5f4a', border: '1px dashed rgba(200,168,78,0.15)' }}
          >
            {'\u{1F4A1}'} Leave empty for a random persona. The chain decides who you become.
          </div>

          <button
            onClick={handleHatch}
            disabled={!isConnected}
            className="block w-full py-[18px] border-2 border-gold text-gold font-display text-base font-semibold tracking-[3px] uppercase relative overflow-hidden group bg-transparent disabled:opacity-30"
          >
            <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
            <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
              {!isConnected ? 'Connect Wallet First' : '\u{1F95A} Hatch My Mutt'}
            </span>
          </button>
          <p className="text-center mt-3 text-xs" style={{ color: '#3a3028' }}>
            Gas fee only &middot; One per wallet
          </p>

          {error && <p className="text-center mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* ===== STATE 2: Signing / Confirming / Syncing TX ===== */}
      <div
        className={`flex-col items-center justify-center min-h-[70vh] px-6 py-10 ${
          state === 'signing' || state === 'confirming' || state === 'syncing' || (txPending || isConfirming || syncing) ? 'flex' : 'hidden'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/egg.webp"
          alt="Egg"
          className="w-32 h-32 mb-6 object-contain"
          style={{ animation: 'egg-float 2.5s ease-in-out infinite' }}
        />
        <p className="font-display text-xl tracking-[6px] uppercase mb-4" style={{ color: '#c8a84e' }}>
          {txPending ? 'Confirm in Wallet...' : syncing || state === 'syncing' ? 'Syncing...' : 'Confirming Transaction...'}
        </p>
        <p className="text-sm" style={{ color: '#6a5f4a' }}>
          {txPending ? 'Please approve the transaction in your wallet' : syncing || state === 'syncing' ? 'Saving your Mutt to the database' : 'Waiting for on-chain confirmation'}
        </p>
      </div>

      {/* ===== STATE 2.5: Hatching video (plays after tx confirmed) ===== */}
      <div
        className={`flex-col items-center justify-center min-h-[70vh] px-6 py-10 ${
          state === 'hatching' ? 'flex' : 'hidden'
        }`}
      >
        <div className="w-[280px] h-[360px] relative overflow-hidden rounded-2xl mb-6">
          <video
            ref={videoRef}
            className="w-[280px] absolute top-0 left-0"
            style={{ height: '105%' }}
            playsInline
            muted
            preload="auto"
          >
            <source src="/videos/hatch.mp4" type="video/mp4" />
          </video>
        </div>

        <p
          className="font-display text-sm tracking-[3px] uppercase"
          style={{ color: '#6a5f4a', animation: 'pulse-text 1.5s ease-in-out infinite' }}
        >
          Hatching...
        </p>
      </div>

      {/* ===== STATE 3: Result ===== */}
      <div className={`flex-col items-center px-6 py-[60px] ${state === 'result' ? 'flex' : 'hidden'}`}>
        <div
          className={`max-w-[360px] w-full text-center relative transition-all duration-[800ms] ${
            cardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
          style={{
            border: '3px solid #c8a84e',
            background: 'linear-gradient(135deg, #1a1610 0%, #12100c 50%, #0e0c08 100%)',
            padding: '32px',
            boxShadow: '0 0 60px rgba(200,168,78,0.15)',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ inset: '6px', border: '1px solid rgba(200,168,78,0.15)' }}
          />

          <div className="text-[80px] mb-4">{'\u{1F98A}'}</div>
          <p className="font-display text-2xl text-gold tracking-[2px] mb-2">
            {result?.tokenId ? `Mutt #${String(result.tokenId).padStart(4, '0')}` : 'Your Mutt'}
          </p>
          <p className="text-base tracking-[2px] mb-1" style={{ color: '#d4c5a0' }}>
            {result?.personalityType}
          </p>
          <p className="text-sm italic mb-5" style={{ color: '#6a5f4a' }}>
            &ldquo;{result?.personalityDesc}&rdquo;
          </p>

          <div className="flex gap-2 justify-center mb-5">
            {result?.traits && (
              <>
                <span
                  className="px-3 py-1 text-[11px]"
                  style={{ border: '1px solid rgba(200,168,78,0.2)', color: '#8a7d65' }}
                >
                  {result.traits.color}
                </span>
                <span
                  className="px-3 py-1 text-[11px]"
                  style={{ border: '1px solid rgba(200,168,78,0.2)', color: '#8a7d65' }}
                >
                  {result.traits.expression}
                </span>
                <span
                  className="px-3 py-1 text-[11px]"
                  style={{ border: '1px solid rgba(200,168,78,0.2)', color: '#8a7d65' }}
                >
                  {result.traits.accessory}
                </span>
              </>
            )}
          </div>

          <p
            className="text-sm pt-4"
            style={{ color: '#6a5f4a', borderTop: '1px solid rgba(200,168,78,0.1)' }}
          >
            {'\u{1F415}'} Mutt &mdash; Your journey begins
          </p>
        </div>

        <Link
          href="/my"
          className="mt-8 inline-block px-8 py-3 border border-gold text-gold font-display text-sm tracking-[2px] uppercase hover:bg-gold hover:text-[#06060a] transition-colors"
        >
          View Collection
        </Link>
      </div>
    </>
  );
}

const BLOODLINE_LABEL: Record<BloodlineGrade, string> = {
  mutt: 'Mutt',
  halfblood: 'Halfblood',
  pureblood: 'Pureblood',
  sacred28: 'Sacred 28',
};

interface GenesisMutt {
  tokenId: number;
  personality: string;
  personalityDesc: string;
  bloodline: BloodlineGrade;
  traits: { color: string; expression: string; accessory: string };
}

function AlreadyHatchedScreen({ address }: { address?: `0x${string}` }) {
  const [mutt, setMutt] = useState<GenesisMutt | null>(null);

  useEffect(() => {
    if (!address) return;
    const addr = address.toLowerCase();

    const fetch_ = async () => {
      if (isMockMode()) {
        const first = Object.values(MOCK_MUTTS)[0];
        if (first) {
          setMutt({
            tokenId: first.token_id,
            personality: first.personality,
            personalityDesc: first.personality_desc,
            bloodline: first.bloodline as BloodlineGrade,
            traits: { color: first.color, expression: first.expression, accessory: first.accessory },
          });
        }
        return;
      }

      const { data } = await supabase
        .from('mutts')
        .select('token_id, personality, personality_desc, bloodline, color, expression, accessory')
        .eq('breeder', addr)
        .eq('parent_a', 0)
        .limit(1)
        .maybeSingle();

      if (data) {
        setMutt({
          tokenId: data.token_id,
          personality: data.personality,
          personalityDesc: data.personality_desc,
          bloodline: data.bloodline as BloodlineGrade,
          traits: { color: data.color, expression: data.expression, accessory: data.accessory },
        });
      }
    };

    fetch_();
  }, [address]);

  return (
    <div className="max-w-[480px] mx-auto px-6 py-[60px]">
      <p className="text-center font-display text-xs tracking-[3px] uppercase mb-8" style={{ color: '#6a5f4a' }}>
        Genesis Complete
      </p>

      {/* Mini profile card */}
      <div
        className="relative p-8 text-center"
        style={{
          border: '2px solid #c8a84e',
          background: 'linear-gradient(135deg, #1a1610 0%, #12100c 50%, #0e0c08 100%)',
          boxShadow: '0 0 40px rgba(200,168,78,0.1)',
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ inset: '5px', border: '1px solid rgba(200,168,78,0.12)' }}
        />

        {mutt ? (
          <>
            <div className="text-[64px] mb-3">{'\u{1F98A}'}</div>
            <p className="font-display text-xl text-gold tracking-[2px] mb-1">
              Mutt #{String(mutt.tokenId).padStart(4, '0')}
            </p>
            <p className="text-base tracking-[2px] mb-1" style={{ color: '#d4c5a0' }}>
              {mutt.personality}
            </p>
            <p className="text-sm italic mb-4" style={{ color: '#6a5f4a' }}>
              &ldquo;{mutt.personalityDesc}&rdquo;
            </p>
            <div className="flex gap-2 justify-center mb-3">
              {Object.values(mutt.traits).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 text-[11px]"
                  style={{ border: '1px solid rgba(200,168,78,0.2)', color: '#8a7d65' }}
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-[11px]" style={{ color: '#6a5f4a' }}>
              {BLOODLINE_LABEL[mutt.bloodline]}
            </p>
          </>
        ) : (
          <>
            <div className="text-[64px] mb-3 opacity-30">{'\u{1F98A}'}</div>
            <p className="font-display text-xl text-gold tracking-[2px]">Your Genesis Mutt</p>
            <p className="text-sm mt-2" style={{ color: '#6a5f4a' }}>One per wallet.</p>
          </>
        )}
      </div>

      {/* CTAs */}
      <div className="flex gap-3 mt-8">
        <Link
          href="/breed"
          className="flex-1 py-3 text-center border-2 border-gold text-gold font-display text-sm tracking-[2px] uppercase relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
          <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
            Breed Now
          </span>
        </Link>
        <Link
          href="/my"
          className="flex-1 py-3 text-center border border-[rgba(200,168,78,0.3)] font-display text-sm tracking-[2px] uppercase transition-colors hover:border-gold"
          style={{ color: '#8a7d65' }}
        >
          View Collection
        </Link>
      </div>
    </div>
  );
}
