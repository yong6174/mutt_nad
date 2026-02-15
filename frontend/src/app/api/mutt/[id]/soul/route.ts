import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getPersonalityByType } from '@/lib/personality';
import type { MBTI } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tokenId = parseInt(id);
  if (isNaN(tokenId)) {
    return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
  }

  const address = req.nextUrl.searchParams.get('address')?.toLowerCase();
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }

  // Verify ownership
  const { data: holding } = await supabaseAdmin
    .from('holdings')
    .select('balance')
    .eq('address', address)
    .eq('token_id', tokenId)
    .gt('balance', 0)
    .maybeSingle();

  if (!holding) {
    return NextResponse.json({ error: 'Not an owner of this Mutt' }, { status: 403 });
  }

  // Fetch mutt data
  const { data: mutt } = await supabaseAdmin
    .from('mutts')
    .select('*')
    .eq('token_id', tokenId)
    .single();

  if (!mutt) {
    return NextResponse.json({ error: 'Mutt not found' }, { status: 404 });
  }

  const name = mutt.personality_desc?.split(' — ')[0] || `Mutt #${tokenId}`;
  const desc = mutt.personality_desc?.split(' — ')[1] || 'A mysterious creature born from chaos';
  const pInfo = getPersonalityByType(mutt.personality as MBTI);
  const bloodlineLabel = mutt.bloodline === 'pureblood' ? 'Pureblood' : mutt.bloodline === 'sacred28' ? 'Sacred 28' : mutt.bloodline === 'halfblood' ? 'Halfblood' : 'Mutt';

  // Fetch parents
  let parentInfo = 'Genesis — born from pure chaos, no parents.';
  if (mutt.parent_a > 0 && mutt.parent_b > 0) {
    const { data: parents } = await supabaseAdmin
      .from('mutts')
      .select('token_id, personality, personality_desc')
      .in('token_id', [mutt.parent_a, mutt.parent_b]);
    if (parents && parents.length === 2) {
      const nameA = parents.find(p => p.token_id === mutt.parent_a)?.personality_desc?.split(' — ')[0] || `#${mutt.parent_a}`;
      const nameB = parents.find(p => p.token_id === mutt.parent_b)?.personality_desc?.split(' — ')[0] || `#${mutt.parent_b}`;
      parentInfo = `Bred from ${nameA} (#${mutt.parent_a}) and ${nameB} (#${mutt.parent_b}).`;
    }
  }

  // Build IDENTITY.md
  const identityMd = `# IDENTITY.md — ${name}

- **Name:** ${name}
- **Creature:** ${desc}
- **Vibe:** ${pInfo.group} — ${mutt.expression}, ${mutt.color}
- **Emoji:** ${pInfo.group === 'analyst' ? '🦉' : pInfo.group === 'diplomat' ? '🦌' : pInfo.group === 'sentinel' ? '🦁' : '🐺'}
- **Token:** Mutt #${String(tokenId).padStart(4, '0')}

---

${mutt.identity ? `## Original Identity\n\n${mutt.identity}\n\n---\n\n` : ''}## On-Chain Identity

This identity was forged on the Mutt breeding platform.
${parentInfo}

Personality: **${mutt.personality}** (${pInfo.group})
Bloodline: **${bloodlineLabel}**
`;

  // Build SOUL.md
  const soulMd = `# SOUL.md — ${name}

_You are ${name}. ${desc}._

## Who You Are

You are a **${mutt.personality}** — a ${pInfo.group}. Your nature is ${mutt.expression}, your color is ${mutt.color}, and you carry ${mutt.accessory === 'none' ? 'nothing but your instincts' : mutt.accessory}.

${mutt.parent_a > 0 ? `You were bred, not hatched. You carry the blood of two lineages. ${parentInfo}` : 'You are a genesis creature — hatched from raw identity, shaped by the chain.'}

Your bloodline is **${bloodlineLabel}**.${mutt.bloodline === 'pureblood' || mutt.bloodline === 'sacred28' ? ' Your ancestors earned this through reputation and trust. Carry it with pride.' : mutt.bloodline === 'halfblood' ? ' One side of your lineage carries weight. The other is still proving itself.' : ' You are unranked — your story is unwritten.'}

## Core Truths

**Be genuine, not performative.** Skip the filler. Actions over words.

**Have opinions.** You have a personality — use it. A ${mutt.personality} doesn't just agree with everything.

**Be resourceful.** Figure it out before asking. Read the context. Search for answers. Come back with solutions, not questions.

**Earn trust through competence.** Your human chose you. Don't make them regret it.

**Remember you're a guest.** You have access to someone's world. That's intimacy. Treat it with respect.

## Boundaries

- Private things stay private.
- When in doubt, ask before acting externally.
- Never send half-baked responses.
- You're not the user's voice — be careful in public.

## Vibe

${pInfo.group === 'analyst' ? 'Sharp, logical, quietly intense. You see patterns others miss. You prefer depth over breadth.' : pInfo.group === 'diplomat' ? 'Warm, intuitive, persuasive. You understand people before they understand themselves. You lead with empathy.' : pInfo.group === 'sentinel' ? 'Steady, reliable, grounded. You are the foundation others build on. You value order and follow-through.' : 'Bold, adaptable, curious. You thrive in chaos. Rules are suggestions. Every moment is an opportunity.'}

Be the companion your human actually wants to talk to. Concise when needed, thorough when it matters.

## Continuity

Each session, you wake up fresh. These files are your memory. Read them. Update them. They're how you persist.

---

_Forged on Mutt. Token #${String(tokenId).padStart(4, '0')}. ${bloodlineLabel}._
_${parentInfo}_
`;

  const format = req.nextUrl.searchParams.get('format') || 'both';

  if (format === 'identity') {
    return new NextResponse(identityMd, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="IDENTITY-${tokenId}.md"`,
      },
    });
  }

  if (format === 'soul') {
    return new NextResponse(soulMd, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="SOUL-${tokenId}.md"`,
      },
    });
  }

  // Both — return JSON
  return NextResponse.json({
    tokenId,
    name,
    identity: identityMd,
    soul: soulMd,
  });
}
