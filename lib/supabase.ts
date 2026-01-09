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

// Types for database tables
export interface Room {
  id: string;
  code: string;
  word: string | null;
  host_id: string;
  status: "waiting" | "playing" | "voting" | "ended";
  round: number;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  client_id: string;
  name: string;
  is_impostor: boolean;
  is_eliminated: boolean;
  score: number;
  joined_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  round: number;
  voter_id: string;
  impostor_vote: string | null;
  action_vote: "next_round" | "end_game" | null;
  created_at: string;
}
