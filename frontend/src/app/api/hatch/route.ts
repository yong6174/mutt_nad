import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { signHatch } from '@/lib/server/signer';
import { analyzeIdentity, randomMbti, randomName } from '@/lib/server/llm';
import { MBTI_INDEX, type MBTI } from '@/types';
import { createPublicClient, http } from 'viem';
import { activeChain, MUTT_NFT_ADDRESS } from '@/lib/chain';
import { isMockMode } from '@/lib/mock';

const MOCK_TYPES = ['ENFP', 'INTJ', 'INFP', 'ENTJ', 'ISFJ', 'ENTP', 'INFJ', 'ISTP'] as const;
const MOCK_DESCS: Record<string, string> = {
  ENFP: 'A chaotic fox spirit who thrives on exploration and spontaneous adventures',
  INTJ: 'A master strategist who sees ten moves ahead in every game',
  INFP: 'A dreamy wanderer who sees beauty in the forgotten corners of the world',
  ENTJ: 'A commanding presence who leads with vision and strategic brilliance',
  ISFJ: 'A gentle guardian who protects the weak with quiet determination',
  ENTP: 'A restless inventor who questions everything and fears nothing',
  INFJ: 'A quiet oracle who speaks in riddles and reads the stars',
  ISTP: 'A lone wolf engineer who builds wonders from scrap and silence',
};
const MOCK_TRAITS = [
  { color: 'golden', expression: 'mischievous', accessory: 'star pendant' },
  { color: 'obsidian', expression: 'calculating', accessory: 'rune book' },
  { color: 'violet', expression: 'dreamy', accessory: 'moon circlet' },
  { color: 'crimson', expression: 'fierce', accessory: 'war banner' },
];

const client = createPublicClient({
  chain: activeChain,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const { address, identity } = await req.json();

    // Mock mode
    if (isMockMode()) {
      const mbti = MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)];
      const traits = MOCK_TRAITS[Math.floor(Math.random() * MOCK_TRAITS.length)];
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json({
        personality: MBTI_INDEX[mbti as MBTI],
        personalityType: mbti,
        personalityDesc: MOCK_DESCS[mbti] || 'A mysterious creature born from chaos',
        traits,
        tokenId: Math.floor(Math.random() * 9000) + 1000,
        signature: '0x' + '0'.repeat(130),
        nonce: 0,
      });
    }

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
    let name: string;
    let description: string;
    let traits: { color: string; expression: string; accessory: string };

    if (identity && identity.trim().length > 0) {
      try {
        const result = await analyzeIdentity(identity);
        mbti = result.mbti;
        name = result.name;
        description = result.description;
        traits = result.traits;
      } catch {
        // LLM unavailable — fallback to random
        mbti = randomMbti();
        name = randomName();
        description = 'A mysterious creature born from pure chaos';
        traits = { color: 'gray', expression: 'curious', accessory: 'none' };
      }
    } else {
      mbti = randomMbti();
      name = randomName();
      description = 'A mysterious creature born from pure chaos';
      traits = { color: 'gray', expression: 'curious', accessory: 'none' };
    }

    const personalityIndex = MBTI_INDEX[mbti as MBTI];

    // Get nonce from contract
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
      // Contract not deployed yet, use 0
    }

    // Sign
    const signature = await signHatch(addr, personalityIndex, nonce);

    // Delete stale pending_actions for same address+action (prevent duplicates)
    await supabaseAdmin.from('pending_actions').delete().eq('address', addr).eq('action', 'hatch');

    // Save to pending_actions (will be committed to mutts via /api/sync after on-chain tx)
    const { error: dbError } = await supabaseAdmin.from('pending_actions').insert({
      nonce: Number(nonce),
      address: addr,
      action: 'hatch',
      personality: personalityIndex,
      personality_type: mbti,
      personality_desc: `${name} — ${description}`,
      traits,
      identity: identity || null,
    });

    if (dbError) {
      console.error('pending_actions insert error:', dbError);
    }

    return NextResponse.json({
      personality: personalityIndex,
      personalityType: mbti,
      personalityDesc: `${name} — ${description}`,
      name,
      traits,
      signature,
      nonce: Number(nonce),
    });
  } catch (err) {
    console.error('Hatch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
