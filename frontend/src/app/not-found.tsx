import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <h1 className="font-display text-[48px] text-gold tracking-[4px] mb-4">404</h1>
      <p className="text-sm mb-8" style={{ color: '#6a5f4a' }}>
        This page does not exist in the Mutt universe.
      </p>
      <Link
        href="/"
        className="px-8 py-3 border border-gold text-gold font-display text-sm tracking-[2px] uppercase hover:bg-gold hover:text-[#06060a] transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
