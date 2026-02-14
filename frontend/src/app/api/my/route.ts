import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ mutts: [], activities: [] });
  }

  const addr = address.toLowerCase();

  const [holdingsRes, activitiesRes] = await Promise.all([
    supabaseAdmin
      .from('holdings')
      .select('token_id, balance')
      .eq('address', addr)
      .gt('balance', 0)
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('activities')
      .select('*')
      .eq('actor', addr)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  let mutts: Array<{
    tokenId: number;
    personality: string;
    bloodline: string;
    avgRating: number;
    breedCost: string;
    isBreeder: boolean;
  }> = [];

  if (holdingsRes.data && holdingsRes.data.length > 0) {
    const tokenIds = holdingsRes.data.map((h) => h.token_id);
    const { data: muttsData } = await supabaseAdmin
      .from('mutts')
      .select('token_id, personality, bloodline, avg_rating, breeder')
      .in('token_id', tokenIds);

    if (muttsData) {
      mutts = muttsData.map((m) => ({
        tokenId: m.token_id,
        personality: m.personality,
        bloodline: m.bloodline,
        avgRating: Number(m.avg_rating),
        breedCost: '0',
        isBreeder: m.breeder === addr,
      }));
    }
  }

  return NextResponse.json({
    mutts,
    activities: activitiesRes.data || [],
  });
}
