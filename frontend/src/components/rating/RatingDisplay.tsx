'use client';

interface RatingDisplayProps {
  avgRating: number;
  totalReviews: number;
}

export function RatingDisplay({ avgRating, totalReviews }: RatingDisplayProps) {
  const fullStars = Math.floor(avgRating);
  const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl text-gold tracking-wider">{stars}</span>
      <span className="text-2xl text-text-primary">{avgRating.toFixed(1)}</span>
      <span className="text-xs text-text-secondary">({totalReviews} reviews)</span>
    </div>
  );
}
