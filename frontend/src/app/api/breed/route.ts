import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { signBreed } from '@/lib/server/signer';
import { analyzeBreeding, mbtiGeneticFallback, randomMbti } from '@/lib/server/llm';
import { MBTI_INDEX, type MBTI } from '@/types';
import { createPublicClient, http } from 'viem';
import { activeChain, MUTT_NFT_ADDRESS } from '@/lib/chain';
import { isMockMode } from '@/lib/mock';

const client = createPublicClient({
  chain: activeChain,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const { address, parentA, parentB } = await req.json();

    if (!address || parentA == null || parentB == null) {
      return NextResponse.json({ error: 'address, parentA, parentB required' }, { status: 400 });
    }

    if (parentA === parentB) {
      return NextResponse.json({ error: 'Cannot breed with self' }, { status: 400 });
    }

    // Mock mode
    if (isMockMode()) {
      const types = ['ENFP', 'INTJ', 'INFP', 'ENTJ', 'ISFJ', 'ENTP'] as const;
      const mbti = types[Math.floor(Math.random() * types.length)];
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({
        personality: MBTI_INDEX[mbti as MBTI],
        personalityType: mbti,
        personalityDesc: 'Born from the union of two wandering souls',
        traits: { color: 'silver', expression: 'curious', accessory: 'none' },
        signature: '0x' + '0'.repeat(130),
        nonce: 0,
      });
    }

    const addr = address.toLowerCase() as `0x${string}`;

    // Fetch parent data from DB
    const { data: pA } = await supabaseAdmin
      .from('mutts')
      .select('*')
      .eq('token_id', parentA)
      .maybeSingle();

    const { data: pB } = await supabaseAdmin
      .from('mutts')
      .select('*')
      .eq('token_id', parentB)
      .maybeSingle();

    if (!pA || !pB) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Determine offspring personality
    let mbti: string;
    let description: string;
    let traits: { color: string; expression: string; accessory: string };

    const hasIdentityA = pA.identity && pA.identity.trim().length > 0;
    const hasIdentityB = pB.identity && pB.identity.trim().length > 0;

    if (hasIdentityA || hasIdentityB) {
      // At least one parent has identity — use LLM
      try {
        const result = await analyzeBreeding(
          pA.identity || '',
          pA.personality,
          pB.identity || '',
          pB.personality
        );
        mbti = result.mbti;
        description = result.description;
        traits = result.traits;
      } catch {
        // LLM unavailable — fallback to genetic
        mbti = mbtiGeneticFallback(pA.personality, pB.personality);
        description = 'Born from the union of two wandering souls';
        traits = { color: 'gray', expression: 'neutral', accessory: 'none' };
      }
    } else {
      // Both empty — genetic fallback
      mbti = mbtiGeneticFallback(pA.personality, pB.personality);
      description = 'Born from the union of two wandering souls';
      traits = { color: 'gray', expression: 'neutral', accessory: 'none' };
    }

    const personalityIndex = MBTI_INDEX[mbti as MBTI];

    // Get nonce
    let nonce = 0n;
    try {
      const contractAddr = MUTT_NFT_ADDRESS;
      if (contractAddr && contractAddr !== '0x') {
        nonce = await client.readContract({
          address: contractAddr,
          abi: [{ name: 'nonces', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }],
          functionName: 'nonces',
          args: [addr],
        }) as bigint;
      }
    } catch {
      // Contract not deployed
    }

    // Sign
    const signature = await signBreed(
      addr,
      BigInt(parentA),
      BigInt(parentB),
      personalityIndex,
      nonce
    );

    // Save to pending_actions (will be committed to mutts via /api/sync after on-chain tx)
    await supabaseAdmin.from('pending_actions').insert({
      nonce: Number(nonce),
      address: addr,
      action: 'breed',
      personality: personalityIndex,
      personality_type: mbti,
      personality_desc: description,
      traits,
      identity: null,
      parent_a: parentA,
      parent_b: parentB,
    });

    return NextResponse.json({
      personality: personalityIndex,
      personalityType: mbti,
      personalityDesc: description,
      traits,
      signature,
      nonce: Number(nonce),
    });
  } catch (err) {
    console.error('Breed error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
