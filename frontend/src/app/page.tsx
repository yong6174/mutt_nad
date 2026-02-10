export default function Home() {
  return (
    <div className="text-center py-32">
      <p className="text-sm tracking-widest uppercase text-gold-dim border border-border-secondary inline-block px-4 py-1 mb-6">
        On-Chain Companion Breeding
      </p>
      <h1 className="text-6xl font-bold text-gold mb-4" style={{ textShadow: '0 0 40px rgba(200,168,78,0.3)' }}>
        Hatch. Breed. Chaos.
      </h1>
      <p className="text-lg text-text-secondary italic mb-12">
        &quot;Purebloods are earned, not born.&quot;
      </p>
      <a
        href="/hatch"
        className="inline-block px-12 py-4 bg-gold text-bg-primary font-bold text-lg tracking-widest uppercase"
        style={{ boxShadow: '0 0 30px rgba(200,168,78,0.3)' }}
      >
        Hatch Your Mutt
      </a>
    </div>
  );
}
