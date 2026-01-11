import { supabase } from "./client";
import type { Round } from "./types";

// ============ CRUD Operations ============

/**
 * Create a new round for a game
 */
export async function createRound(gameId: string, roundNumber: number) {
  const { data, error } = await supabase
    .from("rounds")
    .insert({
      game_id: gameId,
      round_number: roundNumber,
    })
    .select()
    .single();
  return { data: data as Round | null, error };
}

/**
 * Get current round for a game
 */
export async function getCurrentRound(gameId: string, roundNumber: number) {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("game_id", gameId)
    .eq("round_number", roundNumber)
    .single();
  return { data: data as Round | null, error };
}

/**
 * Get round by ID
 */
export async function getRoundById(roundId: string) {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .single();
  return { data: data as Round | null, error };
}

/**
 * Update round with eliminated player
 */
export async function updateRoundEliminated(
  roundId: string,
  eliminatedPlayerId: string
) {
  const { error } = await supabase
    .from("rounds")
    .update({ eliminated_player_id: eliminatedPlayerId })
    .eq("id", roundId);
  return { error };
}

/**
 * Update round with majority action
 */
export async function updateRoundMajorityAction(
  roundId: string,
  majorityAction: "next_round" | "end_game"
) {
  const { error } = await supabase
    .from("rounds")
    .update({ majority_action: majorityAction })
    .eq("id", roundId);
  return { error };
}

/**
 * Get all rounds for a game
 */
export async function getRoundsByGame(gameId: string) {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("game_id", gameId)
    .order("round_number", { ascending: true });
  return { data: (data as Round[]) || [], error };
}

// ============ Realtime Subscriptions ============

/**
 * Subscribe to round changes
 */
export function subscribeToRound(
  roundId: string,
  callback: (round: Round) => void
) {
  const channel = supabase
    .channel(`round-${roundId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rounds",
        filter: `id=eq.${roundId}`,
      },
      (payload) => {
        callback(payload.new as Round);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
