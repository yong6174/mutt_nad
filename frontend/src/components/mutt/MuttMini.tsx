'use client';

import Link from 'next/link';
import type { BloodlineGrade } from '@/types';

interface MuttMiniProps {
  tokenId: number;
  personality: string;
  bloodline: BloodlineGrade;
  image?: string;
  onClick?: () => void;
}

const BLOODLINE_LABEL: Record<BloodlineGrade, string> = {
  mutt: 'Mutt',
  halfblood: 'Halfblood',
  pureblood: 'Pureblood',
  sacred28: 'Sacred 28',
};

export function MuttMini({ tokenId, personality, bloodline, image, onClick }: MuttMiniProps) {
  const content = (
    <div className="w-44 p-4 border border-border-primary bg-bg-secondary text-center hover:border-gold transition-colors cursor-pointer">
      <div className="w-28 h-28 bg-bg-tertiary border border-border-primary mx-auto mb-3 flex items-center justify-center text-5xl">
        {image ? (
          <img src={image} alt={`Mutt #${tokenId}`} className="w-full h-full object-cover" />
        ) : (
          <span className="opacity-40">?</span>
        )}
      </div>
      <p className="text-sm text-text-primary mb-1">Mutt #{String(tokenId).padStart(4, '0')}</p>
      <p className="text-xs text-gold tracking-wide">{personality}</p>
      <span className="inline-block mt-2 px-2 py-0.5 text-[10px] tracking-wide uppercase border border-border-secondary text-text-secondary">
        {BLOODLINE_LABEL[bloodline]}
      </span>
    </div>
  );

  if (onClick) {
    return <button onClick={onClick}>{content}</button>;
  }

  return <Link href={`/mutt/${tokenId}`}>{content}</Link>;
}
