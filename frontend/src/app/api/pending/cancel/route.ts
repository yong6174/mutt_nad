import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { address, nonce } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'address required' }, { status: 400 });
    }

    const addr = address.toLowerCase();

    if (nonce) {
      // Delete specific pending action by nonce
      await supabaseAdmin
        .from('pending_actions')
        .delete()
        .eq('address', addr)
        .eq('nonce', nonce);
    } else {
      // Delete all stale pending actions for this address (>30min old)
      await supabaseAdmin
        .from('pending_actions')
        .delete()
        .eq('address', addr)
        .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Pending cancel error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
