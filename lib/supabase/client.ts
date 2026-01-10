import { createClient } from "@supabase/supabase-js";

// IMPORTANTE: Configure estas variáveis no arquivo .env.local
// NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
// NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";

// Criar cliente apenas se as credenciais estiverem configuradas
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as ReturnType<typeof createClient>);
