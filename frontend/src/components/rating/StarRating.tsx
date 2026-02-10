'use client';

import { useState } from 'react';

interface StarRatingProps {
  value?: number;
  onChange?: (score: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 'text-lg w-7 h-7', md: 'text-2xl w-9 h-9', lg: 'text-3xl w-11 h-11' };

export function StarRating({ value = 0, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sizeClass = SIZES[size];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${sizeClass} border transition-colors ${
              filled
                ? 'text-gold border-gold'
                : 'text-text-muted border-border-secondary'
            } ${readonly ? 'cursor-default' : 'cursor-pointer hover:text-gold hover:border-gold'} bg-transparent`}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => onChange?.(star)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
