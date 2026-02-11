'use client';

import { useState, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

type HatchState = 'input' | 'summoning' | 'hatching' | 'result';

interface HatchResult {
  personalityType: string;
  personalityDesc: string;
  traits: { color: string; expression: string; accessory: string };
  tokenId?: number;
}

export default function HatchPage() {
  const { address, isConnected } = useAccount();
  const [identity, setIdentity] = useState('');
  const [state, setState] = useState<HatchState>('input');
  const [result, setResult] = useState<HatchResult | null>(null);
  const [error, setError] = useState('');
  const [showBurst, setShowBurst] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [eggImgError, setEggImgError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const showResultCard = useCallback(() => {
    setShowBurst(true);
    setTimeout(() => {
      setState('result');
      setTimeout(() => setCardVisible(true), 100);
    }, 400);
  }, []);

  const handleHatch = async () => {
    if (!address) return;
    setError('');
    setShowBurst(false);
    setCardVisible(false);
    setState('summoning');

    let hatchResult: HatchResult | null = null;
    let videoComplete = false;

    const finalize = () => {
      if (!hatchResult || !videoComplete) return;
      setResult(hatchResult);
      showResultCard();
    };

    // 2s: swap egg to video
    const swapTimer = setTimeout(() => {
      setState((prev) => (prev === 'summoning' ? 'hatching' : prev));
      const video = videoRef.current;
      if (video) {
        video.onended = () => {
          videoComplete = true;
          finalize();
        };
        video.play().catch(() => {
          videoComplete = true;
          finalize();
        });
      } else {
        videoComplete = true;
        finalize();
      }
    }, 2000);

    // 8s: fallback
    const fallbackTimer = setTimeout(() => {
      videoComplete = true;
      finalize();
    }, 8000);

    // API call
    try {
      const res = await fetch('/api/hatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, identity: identity.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        clearTimeout(swapTimer);
        clearTimeout(fallbackTimer);
        setError(data.error || 'Hatch failed');
        setState('input');
        return;
      }

      hatchResult = {
        personalityType: data.personalityType,
        personalityDesc: data.personalityDesc,
        traits: data.traits,
        tokenId: data.tokenId,
      };
      finalize();
    } catch {
      clearTimeout(swapTimer);
      clearTimeout(fallbackTimer);
      setError('Network error');
      setState('input');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center">
        <h1 className="font-display text-[32px] text-gold tracking-[3px] mb-2">Genesis Hatch</h1>
        <p className="text-sm italic mb-8" style={{ color: '#6a5f4a' }}>
          Connect your wallet to hatch your companion.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <>
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
            className="block w-full py-[18px] border-2 border-gold text-gold font-display text-base font-semibold tracking-[3px] uppercase relative overflow-hidden group bg-transparent"
          >
            <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
            <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
              {'\u{1F95A}'} Hatch My Mutt
            </span>
          </button>
          <p className="text-center mt-3 text-xs" style={{ color: '#3a3028' }}>
            Gas fee only &middot; One per wallet
          </p>

          {error && <p className="text-center mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* ===== STATE 2: Hatching (egg -> video) ===== */}
      <div
        className={`flex-col items-center justify-center min-h-[70vh] px-6 py-10 ${
          state === 'summoning' || state === 'hatching' ? 'flex' : 'hidden'
        }`}
      >
        <div className="w-[280px] h-[360px] flex items-center justify-center mb-6 relative">
          {/* Egg */}
          <div className={state === 'summoning' ? 'block' : 'hidden'}>
            {!eggImgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/images/egg.webp"
                alt="Egg"
                className="max-w-full max-h-full object-contain"
                style={{ animation: 'egg-float 3s ease-in-out infinite' }}
                onError={() => setEggImgError(true)}
              />
            ) : (
              <div className="text-8xl" style={{ animation: 'egg-float 3s ease-in-out infinite' }}>
                {'\u{1F95A}'}
              </div>
            )}
          </div>

          {/* Video */}
          <video
            ref={videoRef}
            className={`max-w-full max-h-full object-contain ${
              state === 'hatching' ? 'block' : 'hidden'
            }`}
            playsInline
            muted
          >
            <source src="/videos/hatch.mp4" type="video/mp4" />
          </video>
        </div>

        <p
          className="font-display text-sm tracking-[3px] uppercase"
          style={{ color: '#6a5f4a', animation: 'pulse-text 1.5s ease-in-out infinite' }}
        >
          {state === 'summoning' ? 'Summoning...' : 'Hatching...'}
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
          {/* Inner border */}
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
      </div>
    </>
  );
}
