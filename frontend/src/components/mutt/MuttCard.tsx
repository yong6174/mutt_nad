'use client';

import Link from 'next/link';
import type { BloodlineGrade, MBTI } from '@/types';
import { getPersonalityByType } from '@/lib/personality';

interface MuttCardProps {
  tokenId: number;
  personality: string;
  personalityDesc?: string;
  bloodline: BloodlineGrade;
  traits?: { color: string; expression: string; accessory: string };
  avgRating?: number;
  totalReviews?: number;
  image?: string;
}

const BLOODLINE_DISPLAY: Record<BloodlineGrade, { icon: string; label: string; className: string }> = {
  mutt: { icon: '', label: 'Mutt', className: 'text-text-secondary' },
  halfblood: { icon: '', label: 'Halfblood', className: 'text-red-400' },
  pureblood: { icon: '', label: 'Pureblood', className: 'text-gold' },
  sacred28: { icon: '', label: 'Sacred 28', className: 'text-yellow-300' },
};

export function MuttCard({
  tokenId,
  personality,
  personalityDesc,
  bloodline,
  traits,
  avgRating,
  totalReviews,
  image,
}: MuttCardProps) {
  const bl = BLOODLINE_DISPLAY[bloodline];

  return (
    <Link
      href={`/mutt/${tokenId}`}
      className="block border-3 border-gold bg-bg-secondary p-6 relative hover:shadow-[0_0_40px_rgba(200,168,78,0.15)] transition-shadow"
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-xl text-gold">Mutt #{String(tokenId).padStart(4, '0')}</span>
        <span className="px-3 py-1 border border-gold text-gold text-xs tracking-widest">{personality}</span>
      </div>

      <div className="w-full h-56 bg-bg-tertiary border border-border-primary flex items-center justify-center overflow-hidden mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || getPersonalityByType(personality as MBTI).image}
          alt={`Mutt #${tokenId}`}
          className="w-full h-full object-cover"
        />
      </div>

      {personalityDesc && (
        <p className="text-xs text-text-secondary italic text-center mb-4 px-2 py-2 border border-bg-tertiary">
          &quot;{personalityDesc}&quot;
        </p>
      )}

      {traits && (
        <div className="flex gap-2 justify-center mb-4">
          <span className="px-2 py-1 border border-border-secondary text-[11px] text-gold-dim">{traits.color}</span>
          <span className="px-2 py-1 border border-border-secondary text-[11px] text-gold-dim">{traits.expression}</span>
          <span className="px-2 py-1 border border-border-secondary text-[11px] text-gold-dim">{traits.accessory}</span>
        </div>
      )}

      <div className="text-center pt-2 border-t border-border-primary flex justify-between items-center">
        <span className={`text-sm ${bl.className}`}>{bl.icon} {bl.label}</span>
        {avgRating !== undefined && (
          <span className="text-xs text-gold-dim">
            ★ {avgRating.toFixed(1)} ({totalReviews})
          </span>
        )}
      </div>
    </Link>
  );
}
