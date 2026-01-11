import { supabase } from "./client";
import type { Game } from "./types";

// ============ CRUD Operations ============

/**
 * Create a new game for a room
 */
export async function createGame(roomId: string, word: string) {
  const { data, error } = await supabase
    .from("games")
    .insert({
      room_id: roomId,
      word,
      status: "voting",
      current_round: 1,
    })
    .select()
    .single();
  return { data: data as Game | null, error };
}

/**
 * Get active game for a room (most recent non-ended game)
 */
export async function getActiveGame(roomId: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("room_id", roomId)
    .neq("status", "ended")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return { data: data as Game | null, error };
}

/**
 * Get game by ID
 */
export async function getGameById(gameId: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  return { data: data as Game | null, error };
}

/**
 * Update game status
 */
export async function updateGameStatus(gameId: string, status: Game["status"]) {
  const { error } = await supabase
    .from("games")
    .update({ status })
    .eq("id", gameId);
  return { error };
}

/**
 * Update game current round
 */
export async function updateGameRound(gameId: string, currentRound: number) {
  const { error } = await supabase
    .from("games")
    .update({ current_round: currentRound })
    .eq("id", gameId);
  return { error };
}

/**
 * End a game
 */
export async function endGame(gameId: string) {
  const { error } = await supabase
    .from("games")
    .update({ status: "ended" as const })
    .eq("id", gameId);
  return { error };
}

// ============ Realtime Subscriptions ============

/**
 * Subscribe to game changes
 */
export function subscribeToGame(
  gameId: string,
  callback: (game: Game) => void
) {
  const channel = supabase
    .channel(`game-${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      },
      (payload) => {
        callback(payload.new as Game);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
