import { TypedSupabaseClient } from "@/lib/supabase/browser";

export async function getCurrentRound(
  client: TypedSupabaseClient,
  gameId: string,
  roundNumber: number,
) {
  const { data, error } = await client
    .from("rounds")
    .select("*")
    .eq("game_id", gameId)
    .eq("round_number", roundNumber)
    .maybeSingle();

  return { data, error };
}
