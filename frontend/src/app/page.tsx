'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/db';
import { isMockMode } from '@/lib/mock';

const MOCK_FEED = [
  { tokenId: 42, personality: 'ENFP', bloodline: 'Mutt' },
  { tokenId: 41, personality: 'ISTJ', bloodline: 'Halfblood' },
  { tokenId: 40, personality: 'INFP', bloodline: 'Pureblood' },
  { tokenId: 39, personality: 'ENTJ', bloodline: 'Mutt' },
];

const BLOODLINE_ICON: Record<string, string> = {
  mutt: '\u{1F415}',
  halfblood: '\u{1FA78}',
  pureblood: '\u{1F451}',
  sacred28: '\u{1F31F}',
};

interface FeedItem {
  tokenId: number;
  personality: string;
  bloodline: string;
}

type Scene = 'magic' | 'accelerating' | 'letter';

export default function LandingPage() {
  const [scene, setScene] = useState<Scene>('magic');
  const [showBurst, setShowBurst] = useState(false);
  const [letterVisible, setLetterVisible] = useState(false);
  const [circleImgError, setCircleImgError] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; left: string; dur: string; delay: string; size: string }>
  >([]);
  const [stats, setStats] = useState({ total: 0, purebloods: 0, sacred: 0 });
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        dur: `${8 + Math.random() * 12}s`,
        delay: `${Math.random() * 10}s`,
        size: `${1 + Math.random() * 2}px`,
      }))
    );

    // Fetch real stats + recent feed
    if (!isMockMode()) {
      (async () => {
        const [totalRes, pureRes, sacredRes, feedRes] = await Promise.all([
          supabase.from('mutts').select('token_id', { count: 'exact', head: true }),
          supabase.from('mutts').select('token_id', { count: 'exact', head: true }).eq('bloodline', 'pureblood'),
          supabase.from('mutts').select('token_id', { count: 'exact', head: true }).eq('bloodline', 'sacred28'),
          supabase.from('mutts').select('token_id, personality, bloodline').order('created_at', { ascending: false }).limit(8),
        ]);
        setStats({
          total: totalRes.count ?? 0,
          purebloods: pureRes.count ?? 0,
          sacred: sacredRes.count ?? 0,
        });
        if (feedRes.data && feedRes.data.length > 0) {
          setFeed(feedRes.data.map((m) => ({ tokenId: m.token_id, personality: m.personality, bloodline: m.bloodline })));
        }
      })();
    }
  }, []);

  const handleActivate = useCallback(() => {
    if (scene !== 'magic') return;
    setScene('accelerating');

    setTimeout(() => setShowBurst(true), 1200);

    setTimeout(() => {
      setScene('letter');
      setTimeout(() => setLetterVisible(true), 100);
    }, 1800);
  }, [scene]);

  return (
    <>
      {/* ===== MAGIC CIRCLE OVERLAY ===== */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
          scene === 'letter' ? 'opacity-0 pointer-events-none' : 'cursor-pointer'
        }`}
        style={{ background: '#06060a' }}
        onClick={handleActivate}
      >
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                background: 'rgba(200,168,78,0.3)',
                animation: `particle-float ${p.dur} linear infinite`,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        {/* Text above circle */}
        <div className="text-center pointer-events-none mb-8">
          <h1
            className="font-display text-[42px] tracking-[6px] leading-tight mb-4 font-semibold"
            style={{
              background: 'linear-gradient(180deg, #f5e6a3 0%, #c8a84e 40%, #a07830 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(200,168,78,0.5)) drop-shadow(0 0 50px rgba(200,168,78,0.25))',
            }}
          >
            Hatch. Breed.
            <br />
            Chaos.
          </h1>
          <p
            className="font-display text-xs tracking-[4px] uppercase"
            style={{ color: '#6a5f4a', animation: 'pulse-hint 2s ease-in-out infinite' }}
          >
            tap to enter
          </p>
        </div>

        {/* Magic Circle + Aura Layers */}
        <div className="relative w-[400px] h-[400px]">
          {/* Aura Layer 1: Glow (behind everything) */}
          <div
            className="absolute inset-[-30%] pointer-events-none overflow-hidden rounded-full"
            style={{
              mixBlendMode: 'lighten',
              animation: 'aura-pulse 6s ease-in-out infinite',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/glow.png" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Aura Layer 2: Dust (slow counter-clockwise) */}
          <div
            className="absolute inset-[-40%] pointer-events-none overflow-hidden rounded-full"
            style={{
              mixBlendMode: 'lighten',
              animation: 'spin-reverse 50s linear infinite',
              opacity: 0.7,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/dust.png" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Aura Layer 3: Light rays (subtle breathing) */}
          <div
            className="absolute inset-[-15%] pointer-events-none overflow-hidden rounded-full"
            style={{
              mixBlendMode: 'lighten',
              animation: 'aura-breathe 4s ease-in-out infinite',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/light.png" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Magic Circle (on top) */}
          <div
            className="absolute w-full h-full overflow-hidden rounded-full"
            style={{
              mixBlendMode: 'lighten',
              animation:
                scene === 'accelerating'
                  ? 'spin-fast 2s linear infinite'
                  : 'spin-slow 40s linear infinite, breathe 5s ease-in-out infinite',
              opacity: scene === 'accelerating' ? 1 : undefined,
            }}
          >
            {!circleImgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/images/magic-circle.webp"
                alt=""
                className="w-full h-full object-contain"
                onError={() => setCircleImgError(true)}
              />
            ) : (
              <MagicCircleSVG />
            )}
          </div>
        </div>
      </div>

      {/* ===== LIGHT BURST ===== */}
      <div
        className={`fixed inset-0 z-[70] pointer-events-none ${showBurst ? '' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle, rgba(200,168,78,0.9) 0%, rgba(200,168,78,0) 70%)',
          animation: showBurst ? 'light-burst 1.2s ease-out forwards' : 'none',
        }}
      />

      {/* ===== LETTER SCENE ===== */}
      <div
        className={`transition-opacity duration-1000 ${
          scene === 'letter' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Letter Card */}
        <section className="flex justify-center px-6 py-20" style={{ minHeight: '100vh' }}>
          <div
            className={`max-w-[560px] w-full relative transition-all duration-1000 ${
              letterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
            }`}
            style={{
              background: 'linear-gradient(135deg, #1a1610 0%, #12100c 50%, #0e0c08 100%)',
              border: '1px solid rgba(200,168,78,0.3)',
              boxShadow: '0 0 80px rgba(200,168,78,0.05)',
              padding: '60px 48px',
              animation: letterVisible ? 'letter-float 4s ease-in-out infinite' : 'none',
            }}
          >
            {/* Inner double border */}
            <div
              className="absolute pointer-events-none"
              style={{ inset: '8px', border: '1px solid rgba(200,168,78,0.1)' }}
            />

            <div className="text-center text-5xl mb-8">{'\u26A1'}</div>

            <p className="font-display text-sm tracking-[3px] uppercase mb-6" style={{ color: '#8a7d65' }}>
              Dear Wanderer,
            </p>

            <div className="text-[19px] leading-[1.9] mb-8" style={{ color: '#c4b68a' }}>
              You have been chosen to enter{' '}
              <em className="text-gold italic">the bloodlines</em>.
              <br /><br />
              Every great house began with a single mutt.
              Every pureblood was once&hellip;{' '}
              <span className="font-semibold" style={{ color: '#e8d48a' }}>nothing</span>.
              <br /><br />
              Hatch your companion. Breed your legacy.
              Three generations of excellence &mdash; that is the price of purity.
            </div>

            <div
              className="text-center text-[22px] italic text-gold font-display tracking-[1px] py-6 my-10"
              style={{
                borderTop: '1px solid rgba(200,168,78,0.15)',
                borderBottom: '1px solid rgba(200,168,78,0.15)',
              }}
            >
              &ldquo;Purebloods are earned, not born.&rdquo;
            </div>

            <p className="text-right italic text-[15px] mb-12" style={{ color: '#6a5f4a' }}>
              &mdash; The Sacred 28 Council
            </p>

            <Link
              href="/hatch"
              className="block w-full text-center py-[18px] border-2 border-gold text-gold font-display text-base font-semibold tracking-[4px] uppercase relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] z-0" />
              <span className="relative z-10 group-hover:text-[#06060a] transition-colors duration-[400ms]">
                {'\u2726'} Hatch Your Mutt {'\u2726'}
              </span>
            </Link>
          </div>
        </section>

        {/* Feed Section */}
        <section className="py-20 px-10" style={{ borderTop: '1px solid rgba(200,168,78,0.08)' }}>
          <div className="text-center mb-12">
            <h2 className="font-display text-xl text-gold tracking-[4px] font-normal">
              Recently Hatched
            </h2>
            <div className="w-[60px] h-px mx-auto mt-4" style={{ background: 'rgba(200,168,78,0.3)' }} />
          </div>
          <div className="flex justify-center gap-5 flex-wrap max-w-[900px] mx-auto">
            {(feed.length > 0 ? feed : MOCK_FEED).map((m) => (
              <Link
                key={m.tokenId}
                href={`/mutt/${m.tokenId}`}
                className="w-[180px] p-5 text-center transition-all duration-300 hover:-translate-y-1"
                style={{
                  border: '1px solid rgba(200,168,78,0.12)',
                  background: 'rgba(12,11,8,0.8)',
                }}
              >
                <div
                  className="w-[100px] h-[100px] mx-auto mb-3 flex items-center justify-center text-[42px]"
                  style={{
                    background: 'rgba(26,21,16,0.8)',
                    border: '1px solid rgba(200,168,78,0.1)',
                  }}
                >
                  {BLOODLINE_ICON[m.bloodline] || '\u{1F415}'}
                </div>
                <p className="font-display text-[13px] text-text-primary tracking-[1px] mb-1">
                  Mutt #{String(m.tokenId).padStart(4, '0')}
                </p>
                <p className="text-xs text-gold tracking-[2px]">{m.personality}</p>
                <span
                  className="inline-block mt-2.5 px-2.5 py-[3px] text-[10px] tracking-[1px] uppercase"
                  style={{ border: '1px solid rgba(200,168,78,0.15)', color: '#6a5f4a' }}
                >
                  {BLOODLINE_ICON[m.bloodline] || '\u{1F415}'} {m.bloodline}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section
          className="flex justify-center gap-[60px] py-12 px-10"
          style={{ borderTop: '1px solid rgba(200,168,78,0.08)' }}
        >
          {[
            { num: stats.total > 0 ? stats.total.toLocaleString() : '0', label: 'Total Mutts' },
            { num: stats.purebloods > 0 ? stats.purebloods.toLocaleString() : '0', label: 'Purebloods' },
            { num: stats.sacred > 0 ? stats.sacred.toLocaleString() : '0', label: 'Sacred Houses' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl text-gold font-normal">{s.num}</div>
              <div
                className="font-display text-[11px] uppercase tracking-[2px] mt-1"
                style={{ color: '#4a4535' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function MagicCircleSVG() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(200,168,78,0.6)" strokeWidth="1" />
      <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(200,168,78,0.4)" strokeWidth="0.5" />
      <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(200,168,78,0.5)" strokeWidth="1" />
      <circle cx="200" cy="200" r="100" fill="none" stroke="rgba(200,168,78,0.3)" strokeWidth="0.5" />
      <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(200,168,78,0.4)" strokeWidth="1" />
      <line x1="200" y1="10" x2="200" y2="50" stroke="rgba(200,168,78,0.3)" strokeWidth="0.5" />
      <line x1="200" y1="350" x2="200" y2="390" stroke="rgba(200,168,78,0.3)" strokeWidth="0.5" />
      <line x1="10" y1="200" x2="50" y2="200" stroke="rgba(200,168,78,0.3)" strokeWidth="0.5" />
      <line x1="350" y1="200" x2="390" y2="200" stroke="rgba(200,168,78,0.3)" strokeWidth="0.5" />
      <polygon
        points="200,50 230,150 340,150 250,210 280,320 200,250 120,320 150,210 60,150 170,150"
        fill="none"
        stroke="rgba(200,168,78,0.3)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
