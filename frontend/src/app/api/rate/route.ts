import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { checkPureblood } from '@/lib/bloodline';

export async function POST(req: NextRequest) {
  try {
    const { tokenId, voter, score } = await req.json();

    if (!tokenId || !voter || !score) {
      return NextResponse.json({ error: 'tokenId, voter, score required' }, { status: 400 });
    }

    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      return NextResponse.json({ error: 'Score must be 1-5 integer' }, { status: 400 });
    }

    const voterAddr = voter.toLowerCase();

    // Check mutt exists
    const { data: mutt } = await supabaseAdmin
      .from('mutts')
      .select('token_id, breeder')
      .eq('token_id', tokenId)
      .maybeSingle();

    if (!mutt) {
      return NextResponse.json({ error: 'Mutt not found' }, { status: 404 });
    }

    // No self-rating
    if (mutt.breeder.toLowerCase() === voterAddr) {
      return NextResponse.json({ error: 'Cannot rate your own Mutt' }, { status: 403 });
    }

    // Check duplicate
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('token_id', tokenId)
      .eq('voter', voterAddr)
      .maybeSingle();

    if (existingRating) {
      return NextResponse.json({ error: 'Already rated' }, { status: 409 });
    }

    // Insert rating
    await supabaseAdmin.from('ratings').insert({
      token_id: tokenId,
      voter: voterAddr,
      score,
    });

    // Recalculate average
    const { data: ratings } = await supabaseAdmin
      .from('ratings')
      .select('score')
      .eq('token_id', tokenId);

    const totalReviews = ratings?.length ?? 0;
    const avgRating = totalReviews > 0
      ? ratings!.reduce((sum, r) => sum + r.score, 0) / totalReviews
      : 0;

    await supabaseAdmin
      .from('mutts')
      .update({ avg_rating: Math.round(avgRating * 100) / 100, total_reviews: totalReviews })
      .eq('token_id', tokenId);

    // Check pureblood eligibility (retroactive)
    await checkAndUpdateBloodline(tokenId);

    // Log activity
    await supabaseAdmin.from('activities').insert({
      type: 'rating',
      actor: voterAddr,
      token_id: tokenId,
      detail: { score },
    });

    return NextResponse.json({
      success: true,
      newAvgRating: Math.round(avgRating * 100) / 100,
      totalReviews,
    });
  } catch (err) {
    console.error('Rate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkAndUpdateBloodline(tokenId: number) {
  const getMutt = async (id: number) => {
    const { data } = await supabaseAdmin
      .from('mutts')
      .select('token_id, parent_a, parent_b, avg_rating, total_reviews')
      .eq('token_id', id)
      .maybeSingle();
    if (!data) return null;
    return {
      tokenId: data.token_id,
      parentA: data.parent_a,
      parentB: data.parent_b,
      avgRating: Number(data.avg_rating),
      totalReviews: data.total_reviews,
    };
  };

  const mutt = await getMutt(tokenId);
  if (!mutt) return;

  const result = checkPureblood(mutt, (id) => {
    // Sync wrapper — for server-side this is fine since we await above
    // In practice, we need all mutts pre-fetched. Simplified for MVP.
    return null;
  });

  // For proper pureblood check, we need to pre-fetch the route
  // Fetch parents and grandparents
  const allNodes: Record<number, { tokenId: number; parentA: number; parentB: number; avgRating: number; totalReviews: number }> = {};
  allNodes[mutt.tokenId] = mutt;

  for (const parentId of [mutt.parentA, mutt.parentB]) {
    if (parentId > 0) {
      const parent = await getMutt(parentId);
      if (parent) {
        allNodes[parent.tokenId] = parent;
        if (parent.parentA > 0) {
          const gp = await getMutt(parent.parentA);
          if (gp) allNodes[gp.tokenId] = gp;
        }
      }
    }
  }

  const syncGetMutt = (id: number) => allNodes[id] ?? null;
  const pureResult = checkPureblood(mutt, syncGetMutt);

  if (pureResult.isPureblood && pureResult.route) {
    // Retroactive: update all members in the route to pureblood
    for (const memberId of pureResult.route.path) {
      await supabaseAdmin
        .from('mutts')
        .update({
          bloodline: 'pureblood',
          pureblood_route: pureResult.route,
        })
        .eq('token_id', memberId);
    }
  }
}
