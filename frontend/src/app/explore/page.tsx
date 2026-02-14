'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExplorePage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const go = () => {
    const id = parseInt(input.trim(), 10);
    if (!id || id < 1) {
      setError('Enter a valid Mutt ID');
      return;
    }
    router.push(`/mutt/${id}`);
  };

  return (
    <div className="max-w-xl mx-auto py-20 px-6 text-center">
      <h1 className="font-display text-[32px] text-gold tracking-[3px] mb-2">Explore</h1>
      <p className="text-sm italic mb-10" style={{ color: '#6a5f4a' }}>
        Look up any Mutt by its token ID
      </p>

      <div className="flex gap-3 justify-center">
        <input
          type="number"
          min={1}
          placeholder="Token ID (e.g. 42)"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          className="w-48 px-4 py-3 font-display text-center tracking-[1px] text-gold outline-none"
          style={{
            background: 'rgba(12,11,8,0.8)',
            border: '1px solid rgba(200,168,78,0.25)',
          }}
        />
        <button
          onClick={go}
          className="px-6 py-3 font-display text-sm tracking-[2px] uppercase transition-colors hover:bg-[rgba(200,168,78,0.15)]"
          style={{
            border: '1px solid #c8a84e',
            color: '#c8a84e',
            background: 'rgba(18,17,10,0.8)',
          }}
        >
          View
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm" style={{ color: '#a04040' }}>{error}</p>
      )}
    </div>
  );
}
