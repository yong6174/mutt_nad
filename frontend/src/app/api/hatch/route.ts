import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { signHatch } from '@/lib/server/signer';
import { analyzeIdentity, randomMbti } from '@/lib/server/llm';
import { MBTI_INDEX, type MBTI } from '@/types';
import { createPublicClient, http } from 'viem';
import { monadTestnet } from '@/lib/chain';

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const { address, identity } = await req.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const addr = address.toLowerCase() as `0x${string}`;

    // Check if already hatched in DB
    const { data: existing } = await supabaseAdmin
      .from('mutts')
      .select('token_id')
      .eq('breeder', addr)
      .eq('parent_a', 0)
      .eq('parent_b', 0)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already hatched' }, { status: 409 });
    }

    // Determine personality
    let mbti: string;
    let description: string;
    let traits: { color: string; expression: string; accessory: string };

    if (identity && identity.trim().length > 0) {
      const result = await analyzeIdentity(identity);
      mbti = result.mbti;
      description = result.description;
      traits = result.traits;
    } else {
      mbti = randomMbti();
      description = 'A mysterious creature born from pure chaos';
      traits = { color: 'gray', expression: 'curious', accessory: 'none' };
    }

    const personalityIndex = MBTI_INDEX[mbti as MBTI];

    // Get nonce from contract
    let nonce = 0n;
    try {
      const contractAddr = process.env.NEXT_PUBLIC_MUTT_NFT_ADDRESS as `0x${string}`;
      if (contractAddr && contractAddr !== '0x') {
        nonce = await client.readContract({
          address: contractAddr,
          abi: [{ name: 'nonces', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }],
          functionName: 'nonces',
          args: [addr],
        }) as bigint;
      }
    } catch {
      // Contract not deployed yet, use 0
    }

    // Sign
    const signature = await signHatch(addr, personalityIndex, nonce);

    // Save to DB
    const { error: dbError } = await supabaseAdmin.from('mutts').insert({
      token_id: Date.now(), // placeholder, updated after on-chain confirm
      personality: mbti,
      personality_desc: description,
      identity: identity || null,
      bloodline: 'mutt',
      color: traits.color,
      expression: traits.expression,
      accessory: traits.accessory,
      image: `/images/${mbti.toLowerCase()}.png`,
      parent_a: 0,
      parent_b: 0,
      breeder: addr,
    });

    if (dbError) {
      console.error('DB insert error:', dbError);
    }

    // Log activity
    await supabaseAdmin.from('activities').insert({
      type: 'hatch',
      actor: addr,
      detail: { personality: mbti },
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
    console.error('Hatch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
