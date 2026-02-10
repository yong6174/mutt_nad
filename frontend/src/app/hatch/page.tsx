'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function HatchPage() {
  const { address, isConnected } = useAccount();
  const [identity, setIdentity] = useState('');
  const [tab, setTab] = useState<'paste' | 'write'>('paste');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    personalityType: string;
    personalityDesc: string;
    traits: { color: string; expression: string; accessory: string };
    tokenId?: number;
  } | null>(null);
  const [error, setError] = useState('');

  const handleHatch = async () => {
    if (!address) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, identity: identity.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Hatch failed');
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

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center">
        <h1 className="text-4xl text-gold mb-4">Genesis Hatch</h1>
        <p className="text-text-secondary mb-8">Connect your wallet to hatch your companion.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-6">
      <h1 className="text-center text-4xl text-gold mb-2">Genesis Hatch</h1>
      <p className="text-center text-sm text-text-secondary italic mb-12">
        Bring your identity into the chain. One wallet, one companion.
      </p>

      {!result ? (
        <>
          {/* Identity Input */}
          <div className="mb-8">
            <p className="text-sm text-gold tracking-wide uppercase mb-3">Identity.md</p>
            <p className="text-xs text-text-secondary mb-3">
              Paste your bot&apos;s IDENTITY.md below, or write one from scratch.
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTab('paste')}
                className={`px-4 py-1.5 text-xs border ${
                  tab === 'paste' ? 'border-gold text-gold' : 'border-border-primary text-text-secondary'
                }`}
              >
                Paste
              </button>
              <button
                onClick={() => setTab('write')}
                className={`px-4 py-1.5 text-xs border ${
                  tab === 'write' ? 'border-gold text-gold' : 'border-border-primary text-text-secondary'
                }`}
              >
                Write
              </button>
            </div>

            <textarea
              className="w-full h-48 bg-bg-secondary border border-border-primary text-text-primary p-4 font-mono text-sm resize-y leading-relaxed focus:outline-none focus:border-gold placeholder:text-text-muted"
              placeholder={`# My Identity\n\n- Name: Luna\n- Creature: A curious ghost fox\n- Vibe: Warm, chaotic, always asking questions\n\nI love exploring ideas and breaking rules...`}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
          </div>

          <div className="text-center text-xs text-text-secondary mb-8 p-3 border border-dashed border-border-primary">
            Leave empty for a random persona. The chain decides who you become.
          </div>

          <button
            onClick={handleHatch}
            disabled={loading}
            className="w-full py-5 bg-gold text-bg-primary font-bold text-lg tracking-widest uppercase disabled:opacity-40"
            style={{ boxShadow: '0 0 30px rgba(200,168,78,0.3)' }}
          >
            {loading ? 'Hatching...' : 'Hatch My Mutt'}
          </button>
          <p className="text-center mt-3 text-xs text-text-secondary">Gas fee only · One per wallet</p>

          {error && (
            <p className="text-center mt-4 text-sm text-red-400">{error}</p>
          )}
        </>
      ) : (
        /* Result */
        <div className="text-center mt-8">
          <div className="text-7xl mb-6 animate-bounce">🐣</div>
          <div className="inline-block p-8 border-2 border-gold bg-bg-secondary">
            <div className="text-6xl mb-4">?</div>
            <p className="text-2xl text-gold mb-2">Your Mutt</p>
            <p className="text-lg text-text-primary mb-1">{result.personalityType}</p>
            <p className="text-sm text-text-secondary italic mb-4">
              &quot;{result.personalityDesc}&quot;
            </p>
            <div className="flex gap-3 justify-center mb-4">
              <span className="px-3 py-1 border border-border-secondary text-xs text-gold-dim">{result.traits.color}</span>
              <span className="px-3 py-1 border border-border-secondary text-xs text-gold-dim">{result.traits.expression}</span>
              <span className="px-3 py-1 border border-border-secondary text-xs text-gold-dim">{result.traits.accessory}</span>
            </div>
            <p className="text-sm text-text-secondary">Mutt — Your journey begins</p>
          </div>
        </div>
      )}
    </div>
  );
}
