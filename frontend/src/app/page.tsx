import Link from 'next/link';
import { MuttMini } from '@/components/mutt/MuttMini';

// Mock data for static display — will be replaced with live data in Phase 5
const MOCK_FEED = [
  { tokenId: 42, personality: 'ENFP', bloodline: 'mutt' as const },
  { tokenId: 41, personality: 'ISTJ', bloodline: 'halfblood' as const },
  { tokenId: 40, personality: 'INFP', bloodline: 'pureblood' as const },
  { tokenId: 39, personality: 'ENTJ', bloodline: 'mutt' as const },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section
        className="text-center py-32 px-10"
        style={{ background: 'radial-gradient(ellipse at center, #1a1520 0%, #0a0a0f 70%)' }}
      >
        <p className="text-sm tracking-widest uppercase text-gold-dim border border-border-secondary inline-block px-4 py-1 mb-6">
          On-Chain Companion Breeding
        </p>
        <h1
          className="text-6xl font-bold text-gold mb-4"
          style={{ textShadow: '0 0 40px rgba(200,168,78,0.3)' }}
        >
          Hatch. Breed. Chaos.
        </h1>
        <p className="text-lg text-text-secondary italic mb-12">
          &quot;Purebloods are earned, not born.&quot;
        </p>
        <Link
          href="/hatch"
          className="inline-block px-12 py-4 bg-gold text-bg-primary font-bold text-lg tracking-widest uppercase"
          style={{ boxShadow: '0 0 30px rgba(200,168,78,0.3)' }}
        >
          Hatch Your Mutt
        </Link>
      </section>

      {/* 3 Steps */}
      <section className="flex justify-center gap-15 py-20 px-10 border-t border-bg-tertiary">
        <Step icon="🥚" title="Hatch" desc="Bring your Identity. Mint your companion. Every Mutt starts as a mongrel." />
        <span className="text-3xl text-border-secondary self-center">→</span>
        <Step icon="🧬" title="Breed" desc="Combine two identities. The offspring inherits traits from both parents." />
        <span className="text-3xl text-border-secondary self-center">→</span>
        <Step icon="👑" title="Rise" desc="Earn ratings. Build reputation. Three generations of excellence makes a Pureblood." />
      </section>

      {/* Recent Feed */}
      <section className="py-16 px-10 border-t border-bg-tertiary">
        <h2 className="text-center text-2xl text-gold tracking-widest mb-10">Recently Hatched</h2>
        <div className="flex justify-center gap-6 flex-wrap">
          {MOCK_FEED.map((m) => (
            <MuttMini key={m.tokenId} {...m} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="flex justify-center gap-16 py-10 border-t border-bg-tertiary">
        <Stat num="--" label="Total Mutts" />
        <Stat num="--" label="Purebloods" />
        <Stat num="28" label="Sacred Houses" />
      </section>
    </div>
  );
}

function Step({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center max-w-60">
      <div className="w-16 h-16 rounded-full border-2 border-border-secondary mx-auto mb-4 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <h3 className="text-lg text-gold mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl text-gold">{num}</div>
      <div className="text-xs text-text-secondary uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
