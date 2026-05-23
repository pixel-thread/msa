import { env } from "@src/env";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bxcnaomtejbbvvxybxtz.supabase.co";

const supabaseKey = env.SUPABASE_SECRET_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
