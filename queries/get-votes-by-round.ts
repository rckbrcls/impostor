import { TypedSupabaseClient } from "@/lib/supabase/browser";
import { Vote } from "@/lib/supabase/types";

export async function getVotesByRound(
  client: TypedSupabaseClient,
  roundId: string,
) {
  const { data, error } = await client
    .from("votes")
    .select("*")
    .eq("round_id", roundId);

  return { data: (data as Vote[]) || [], error };
}
