'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/db';
import { isMockMode, MOCK_MUTTS } from '@/lib/mock';
import { useCooldown } from '@/hooks/useCooldown';
import { useSetBreedCost } from '@/hooks/useSetBreedCost';
import { useSetMintConfig } from '@/hooks/useSetMintConfig';
import type { BloodlineGrade } from '@/types';

interface MyMutt {
  tokenId: number;
  personality: string;
  bloodline: BloodlineGrade;
  avgRating: number;
  breedCost: string;
}

interface Activity {
  id: number;
  type: string;
  actor: string;
  token_id: number | null;
  detail: Record<string, unknown>;
  created_at: string;
}

const BLOODLINE_LABEL: Record<BloodlineGrade, string> = {
  mutt: 'Mutt',
  halfblood: 'Halfblood',
  pureblood: 'Pureblood',
  sacred28: 'Sacred 28',
};

const ACTIVITY_ICON: Record<string, string> = {
  hatch: '\u{1F95A}',
  breed: '\u{1F9EC}',
  rating: '\u2B50',
};

export default function MyPage() {
  const { address } = useAccount();
  const [mutts, setMutts] = useState<MyMutt[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const addr = address.toLowerCase();

    const fetchData = async () => {
      if (isMockMode()) {
        const mocks = Object.values(MOCK_MUTTS);
        setMutts(
          mocks.map((m) => ({
            tokenId: m.token_id,
            personality: m.personality,
            bloodline: m.bloodline as BloodlineGrade,
            avgRating: m.avg_rating,
            breedCost: '0',
          })),
        );
        setActivities([
          { id: 1, type: 'hatch', actor: addr, token_id: 42, detail: { personality: 'ENFP' }, created_at: new Date().toISOString() },
          { id: 2, type: 'breed', actor: addr, token_id: 41, detail: { parentA: 12, parentB: 15 }, created_at: new Date().toISOString() },
        ]);
        setLoading(false);
        return;
      }

      const [muttsRes, activitiesRes] = await Promise.all([
        supabase
          .from('mutts')
          .select('token_id, personality, bloodline, avg_rating')
          .eq('breeder', addr)
          .order('token_id', { ascending: false }),
        supabase
          .from('activities')
          .select('*')
          .eq('actor', addr)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (muttsRes.data) {
        setMutts(
          muttsRes.data.map((m) => ({
            tokenId: m.token_id,
            personality: m.personality,
            bloodline: m.bloodline as BloodlineGrade,
            avgRating: Number(m.avg_rating),
            breedCost: '0',
          })),
        );
      }

      if (activitiesRes.data) {
        setActivities(activitiesRes.data as Activity[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [address]);

  const purebloodCount = mutts.filter((m) => m.bloodline === 'pureblood' || m.bloodline === 'sacred28').length;

  if (loading) {
    return <div className="text-center py-20 font-display" style={{ color: '#6a5f4a' }}>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="font-display text-[32px] text-gold tracking-[3px] mb-2">My Collection</h1>
      <p className="text-sm font-mono mb-8" style={{ color: '#6a5f4a' }}>
        {address || 'Connect wallet to view your collection'}
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-8">
        {[
          { val: String(mutts.length), label: 'Mutts Owned' },
          { val: String(activities.filter((a) => a.type === 'breed').length), label: 'Breeds Done' },
          { val: String(purebloodCount), label: 'Purebloods' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 p-4 text-center"
            style={{ border: '1px solid rgba(200,168,78,0.12)', background: 'rgba(12,11,8,0.8)' }}
          >
            <div className="font-display text-2xl text-gold">{s.val}</div>
            <div className="font-display text-[11px] uppercase tracking-[2px] mt-1" style={{ color: '#6a5f4a' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* My Mutts Grid */}
      <div className="mb-10">
        <h2
          className="font-display text-sm text-gold tracking-[2px] uppercase pb-2 mb-4"
          style={{ borderBottom: '1px solid rgba(200,168,78,0.12)' }}
        >
          My Mutts
        </h2>

        {mutts.length === 0 ? (
          <div className="text-center py-12" style={{ border: '1px solid rgba(200,168,78,0.08)' }}>
            <p className="text-sm mb-4" style={{ color: '#6a5f4a' }}>No Mutts yet</p>
            <Link
              href="/hatch"
              className="inline-block px-6 py-2 border border-gold text-gold font-display text-sm tracking-[2px] uppercase hover:bg-gold hover:text-[#06060a] transition-colors"
            >
              Hatch Your First
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {mutts.map((m) => (
              <MuttCard key={m.tokenId} mutt={m} />
            ))}
          </div>
        )}
      </div>

      {/* Activity */}
      <div>
        <h2
          className="font-display text-sm text-gold tracking-[2px] uppercase pb-2 mb-4"
          style={{ borderBottom: '1px solid rgba(200,168,78,0.12)' }}
        >
          Activity
        </h2>

        {activities.length === 0 ? (
          <p className="text-sm py-4" style={{ color: '#6a5f4a' }}>No activity yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3"
                style={{ border: '1px solid rgba(200,168,78,0.06)', background: 'rgba(12,11,8,0.8)' }}
              >
                <span className="text-xl">{ACTIVITY_ICON[a.type] || '\u{1F4AC}'}</span>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#d4c5a0' }}>
                    {a.type === 'hatch' && `Genesis Hatch — ${(a.detail?.personality as string) || 'Unknown'}`}
                    {a.type === 'breed' && `Bred #${(a.detail?.parentA as number)?.toString().padStart(4, '0') || '?'} × #${(a.detail?.parentB as number)?.toString().padStart(4, '0') || '?'}`}
                    {a.type === 'rating' && `Rated Mutt #${a.token_id?.toString().padStart(4, '0') || '?'} — ${'\u2605'}${a.detail?.score || '?'}`}
                  </p>
                </div>
                <span className="text-[11px]" style={{ color: '#3a3028' }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MuttCard({ mutt }: { mutt: MyMutt }) {
  const router = useRouter();
  const { isReady, label } = useCooldown(mutt.tokenId);
  const { setBreedCost, isPending: costPending, isSuccess: costSuccess } = useSetBreedCost();
  const { setMintConfig, isPending: mintConfigPending, isSuccess: mintConfigSuccess } = useSetMintConfig();
  const [editing, setEditing] = useState(false);
  const [editingMint, setEditingMint] = useState(false);
  const [costInput, setCostInput] = useState('');
  const [mintCostInput, setMintCostInput] = useState('');
  const [maxSupplyInput, setMaxSupplyInput] = useState('');

  const currentCost = mutt.breedCost && Number(mutt.breedCost) > 0
    ? (Number(mutt.breedCost) / 1e18).toFixed(2)
    : '0';

  return (
    <div
      className="p-4 text-center relative transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{
        border: '1px solid rgba(200,168,78,0.12)',
        background: 'linear-gradient(135deg, #1a1610 0%, #12100c 100%)',
      }}
      onClick={() => { if (!editing && !editingMint) router.push(`/mutt/${mutt.tokenId}`); }}
    >
      {/* Cooldown badge */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 font-display text-[10px] tracking-[1px]"
        style={{
          border: `1px solid ${isReady ? 'rgba(100,200,100,0.3)' : 'rgba(200,168,78,0.2)'}`,
          color: isReady ? '#7dba7d' : '#cd7f32',
        }}
      >
        {label}
      </div>

      <div className="text-5xl mb-2 opacity-50">?</div>
      <p className="font-display text-sm tracking-[1px] mb-1" style={{ color: '#d4c5a0' }}>
        Mutt #{String(mutt.tokenId).padStart(4, '0')}
      </p>
      <p className="text-xs text-gold tracking-[2px] mb-2">{mutt.personality}</p>
      <div className="flex justify-between text-[11px]">
        <span style={{ color: '#6a5f4a' }}>{BLOODLINE_LABEL[mutt.bloodline]}</span>
        <span style={{ color: '#8a7d65' }}>{'\u2605'} {mutt.avgRating.toFixed(1)}</span>
      </div>

      {/* Breed cost row */}
      <div
        className="flex items-center justify-between mt-2 pt-2"
        style={{ borderTop: '1px solid rgba(200,168,78,0.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              className="flex-1 min-w-0 px-2 py-1 text-[11px] focus:outline-none"
              style={{
                background: 'rgba(6,6,10,0.8)',
                border: '1px solid rgba(200,168,78,0.15)',
                color: '#d4c5a0',
              }}
              placeholder="MUTT"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditing(false);
                if (e.key === 'Enter' && costInput) setBreedCost(mutt.tokenId, costInput);
              }}
            />
            <button
              onClick={() => { if (costInput) setBreedCost(mutt.tokenId, costInput); }}
              disabled={costPending || !costInput}
              className="px-2 py-1 border border-gold text-gold font-display text-[10px] disabled:opacity-30 hover:bg-gold hover:text-[#06060a] transition-colors shrink-0"
            >
              {costPending ? '...' : costSuccess ? '\u2713' : 'Set'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[10px] px-1 py-1 shrink-0"
              style={{ color: '#6a5f4a' }}
            >
              {'\u2715'}
            </button>
          </div>
        ) : (
          <>
            <span className="text-[11px]" style={{ color: '#6a5f4a' }}>
              Fee: {currentCost} MUTT
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] px-1 hover:text-gold transition-colors"
              style={{ color: '#6a5f4a' }}
              title="Edit breed cost"
            >
              {'\u270E'}
            </button>
          </>
        )}
      </div>

      {/* Mint config row */}
      <div
        className="flex items-center justify-between mt-1 pt-1"
        style={{ borderTop: '1px solid rgba(200,168,78,0.04)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {editingMint ? (
          <div className="flex items-center gap-1 w-full">
            <input
              className="flex-1 min-w-0 px-1.5 py-1 text-[10px] focus:outline-none"
              style={{
                background: 'rgba(6,6,10,0.8)',
                border: '1px solid rgba(200,168,78,0.15)',
                color: '#d4c5a0',
              }}
              placeholder="Cost"
              value={mintCostInput}
              onChange={(e) => setMintCostInput(e.target.value)}
              autoFocus
            />
            <input
              className="w-14 px-1.5 py-1 text-[10px] focus:outline-none"
              style={{
                background: 'rgba(6,6,10,0.8)',
                border: '1px solid rgba(200,168,78,0.15)',
                color: '#d4c5a0',
              }}
              placeholder="Max"
              value={maxSupplyInput}
              onChange={(e) => setMaxSupplyInput(e.target.value)}
            />
            <button
              onClick={() => {
                if (mintCostInput) setMintConfig(mutt.tokenId, mintCostInput, parseInt(maxSupplyInput) || 0);
              }}
              disabled={mintConfigPending || !mintCostInput}
              className="px-1.5 py-1 border border-gold text-gold font-display text-[9px] disabled:opacity-30 hover:bg-gold hover:text-[#06060a] transition-colors shrink-0"
            >
              {mintConfigPending ? '...' : mintConfigSuccess ? '\u2713' : 'Set'}
            </button>
            <button
              onClick={() => setEditingMint(false)}
              className="text-[10px] px-1 py-1 shrink-0"
              style={{ color: '#6a5f4a' }}
            >
              {'\u2715'}
            </button>
          </div>
        ) : (
          <>
            <span className="text-[10px]" style={{ color: '#6a5f4a' }}>
              Mint: config
            </span>
            <button
              onClick={() => setEditingMint(true)}
              className="text-[10px] px-1 hover:text-gold transition-colors"
              style={{ color: '#6a5f4a' }}
              title="Edit mint config"
            >
              {'\u270E'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
