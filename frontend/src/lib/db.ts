import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Server-side (API Routes)
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

// Client-side (read-only)
export const supabase = createClient(SUPABASE_URL, ANON_KEY);
