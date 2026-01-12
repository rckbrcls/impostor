import { TypedSupabaseClient } from "@/lib/supabase/browser";
import { GamePlayerWithPlayer } from "@/lib/supabase/game-players";

export async function getGamePlayers(
  client: TypedSupabaseClient,
  gameId: string,
) {
  const { data, error } = await client
    .from("game_players")
    .select("*, player:players(*)")
    .eq("game_id", gameId);

  return { data: (data as unknown as GamePlayerWithPlayer[]) || [], error };
}
