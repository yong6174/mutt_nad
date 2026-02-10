import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { createPublicClient, http } from 'viem';
import { monadTestnet } from '@/lib/chain';

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const MUTT_ABI = [
  {
    name: 'getMutt',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'personality', type: 'uint8' },
        { name: 'parentA', type: 'uint256' },
        { name: 'parentB', type: 'uint256' },
        { name: 'breeder', type: 'address' },
        { name: 'breedCost', type: 'uint256' },
        { name: 'lastBreedTime', type: 'uint256' },
      ],
    }],
  },
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenId = parseInt(id);

    if (isNaN(tokenId) || tokenId <= 0) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    // Fetch off-chain data
    const { data: mutt } = await supabaseAdmin
      .from('mutts')
      .select('*')
      .eq('token_id', tokenId)
      .maybeSingle();

    if (!mutt) {
      return NextResponse.json({ error: 'Mutt not found' }, { status: 404 });
    }

    // Try to fetch on-chain data
    let onChain = null;
    try {
      const contractAddr = process.env.NEXT_PUBLIC_MUTT_NFT_ADDRESS as `0x${string}`;
      if (contractAddr && contractAddr !== '0x') {
        const data = await client.readContract({
          address: contractAddr,
          abi: MUTT_ABI,
          functionName: 'getMutt',
          args: [BigInt(tokenId)],
        });
        onChain = {
          parentA: Number(data.parentA),
          parentB: Number(data.parentB),
          breeder: data.breeder,
          breedCost: data.breedCost.toString(),
          lastBreedTime: Number(data.lastBreedTime),
        };
      }
    } catch {
      // Contract not deployed or token doesn't exist on-chain
    }

    return NextResponse.json({
      tokenId: mutt.token_id,
      personality: mutt.personality,
      personalityDesc: mutt.personality_desc,
      identity: mutt.identity,
      bloodline: mutt.bloodline,
      avgRating: Number(mutt.avg_rating),
      totalReviews: mutt.total_reviews,
      traits: {
        color: mutt.color,
        expression: mutt.expression,
        accessory: mutt.accessory,
      },
      image: mutt.image,
      parentA: mutt.parent_a,
      parentB: mutt.parent_b,
      breeder: mutt.breeder,
      onChain,
    });
  } catch (err) {
    console.error('Mutt fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
