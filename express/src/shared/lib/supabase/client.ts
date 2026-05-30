import { env } from '@src/env';
import { createClient } from '@supabase/supabase-js';

/** Singleton Supabase admin client initialized from environment config. */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
