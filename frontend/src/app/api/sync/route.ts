import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { createPublicClient, http } from 'viem';
import { activeChain, MUTT_NFT_ADDRESS } from '@/lib/chain';
import { MUTT_NFT_ABI } from '@/lib/contracts/abi';
import { INDEX_MBTI } from '@/types';
import { isMockMode } from '@/lib/mock';
import { getPersonalityByType } from '@/lib/personality';
import type { MBTI } from '@/types';

const client = createPublicClient({
  chain: activeChain,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const { address, tokenId, action } = await req.json();

    if (!address || tokenId == null || !action) {
      return NextResponse.json({ error: 'address, tokenId, action required' }, { status: 400 });
    }

    if (!['hatch', 'breed', 'mint'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const addr = address.toLowerCase() as string;

    // Mock mode — skip on-chain verification
    if (isMockMode()) {
      return NextResponse.json({ success: true, tokenId, balance: 1 });
    }

    const contractAddr = MUTT_NFT_ADDRESS;
    if (!contractAddr || contractAddr === '0x') {
      return NextResponse.json({ error: 'Contract not configured' }, { status: 500 });
    }

    // 1. Verify on-chain ownership
    const balance = await client.readContract({
      address: contractAddr,
      abi: MUTT_NFT_ABI,
      functionName: 'balanceOf',
      args: [addr as `0x${string}`, BigInt(tokenId)],
    }) as bigint;

    if (balance === 0n) {
      return NextResponse.json({ error: 'No on-chain balance' }, { status: 403 });
    }

    // 2. Check holdings — prevent double sync
    const { data: existingHolding } = await supabaseAdmin
      .from('holdings')
      .select('balance')
      .eq('address', addr)
      .eq('token_id', tokenId)
      .maybeSingle();

    const dbBalance = existingHolding?.balance ?? 0;
    if (Number(balance) <= dbBalance) {
      return NextResponse.json({ error: 'Already synced' }, { status: 409 });
    }

    // 3. Read on-chain mutt data
    const onChainData = await client.readContract({
      address: contractAddr,
      abi: MUTT_NFT_ABI,
      functionName: 'getMutt',
      args: [BigInt(tokenId)],
    }) as {
      personality: number;
      parentA: bigint;
      parentB: bigint;
      breeder: `0x${string}`;
      breedCost: bigint;
      lastBreedTime: bigint;
      mintCost: bigint;
      maxSupply: bigint;
      totalSupply: bigint;
    };

    // 4. Handle hatch/breed — transfer pending_action to mutts
    if (action === 'hatch' || action === 'breed') {
      // Find matching pending_action
      const { data: pending } = await supabaseAdmin
        .from('pending_actions')
        .select('*')
        .eq('address', addr)
        .eq('action', action)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        const mbti = pending.personality_type;
        const traits = pending.traits as { color: string; expression: string; accessory: string } | null;

        // Determine bloodline: genesis = mutt, bred = halfblood (upgraded to pureblood via rating)
        const parentA = Number(onChainData.parentA);
        const parentB = Number(onChainData.parentB);
        const bloodline = (parentA === 0 && parentB === 0) ? 'mutt' : 'halfblood';

        // Insert into mutts (idempotent — skip if exists)
        const pInfo = getPersonalityByType(mbti as MBTI);
        const { error: insertErr } = await supabaseAdmin.from('mutts').upsert({
          token_id: tokenId,
          personality: mbti,
          personality_desc: pending.personality_desc,
          identity: pending.identity,
          bloodline,
          color: traits?.color || 'gray',
          expression: traits?.expression || 'neutral',
          accessory: traits?.accessory || 'none',
          image: pInfo.image,
          parent_a: parentA,
          parent_b: parentB,
          breeder: onChainData.breeder.toLowerCase(),
          mint_cost: onChainData.mintCost.toString(),
          max_supply: Number(onChainData.maxSupply),
          total_supply: Number(onChainData.totalSupply),
        }, { onConflict: 'token_id' });

        if (insertErr) {
          console.error('mutts upsert error:', insertErr);
        }

        // Delete pending_action
        await supabaseAdmin.from('pending_actions').delete().eq('id', pending.id);
      } else {
        // No pending action found — maybe already synced, create from on-chain data
        const mbti = INDEX_MBTI[onChainData.personality] || 'ENFP';
        const fallbackPInfo = getPersonalityByType(mbti as MBTI);
        const parentA = Number(onChainData.parentA);
        const parentB = Number(onChainData.parentB);
        const fallbackBloodline = (parentA === 0 && parentB === 0) ? 'mutt' : 'halfblood';
        const fallbackDesc = fallbackBloodline === 'mutt'
          ? 'A mysterious creature born from pure chaos'
          : 'Born from the union of two wandering souls';
        await supabaseAdmin.from('mutts').upsert({
          token_id: tokenId,
          personality: mbti,
          personality_desc: fallbackDesc,
          identity: null,
          bloodline: fallbackBloodline,
          color: 'gray',
          expression: 'neutral',
          accessory: 'none',
          image: fallbackPInfo.image,
          parent_a: parentA,
          parent_b: parentB,
          breeder: onChainData.breeder.toLowerCase(),
          mint_cost: onChainData.mintCost.toString(),
          max_supply: Number(onChainData.maxSupply),
          total_supply: Number(onChainData.totalSupply),
        }, { onConflict: 'token_id' });
      }
    }

    // 5. Handle mint — update totalSupply
    if (action === 'mint') {
      await supabaseAdmin.from('mutts').update({
        total_supply: Number(onChainData.totalSupply),
      }).eq('token_id', tokenId);
    }

    // 6. Upsert holdings
    await supabaseAdmin.from('holdings').upsert({
      address: addr,
      token_id: tokenId,
      balance: Number(balance),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'address,token_id' });

    // 7. Log activity with enriched detail
    await supabaseAdmin.from('activities').insert({
      type: action,
      actor: addr,
      token_id: tokenId,
      detail: {
        action,
        tokenId,
        personality: onChainData.personality,
        parentA: Number(onChainData.parentA),
        parentB: Number(onChainData.parentB),
      },
    });

    return NextResponse.json({
      success: true,
      tokenId,
      balance: Number(balance),
    });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
