import { supabase } from "./client";
import type { Player } from "./types";

// ============ CRUD Operations ============

/**
 * Add a player to a room
 */
export async function addPlayer(
  roomId: string,
  clientId: string,
  name: string
) {
  const { error } = await supabase.from("players").insert({
    room_id: roomId,
    client_id: clientId,
    name,
    is_impostor: false,
    score: 0,
  });
  return { error };
}

/**
 * Get all players in a room
 */
export async function getPlayersByRoomId(roomId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });
  return { data: (data as Player[]) || [], error };
}

/**
 * Get a specific player by room and client ID
 */
export async function getPlayerByRoomAndClient(
  roomId: string,
  clientId: string
) {
  const { data, error } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("client_id", clientId)
    .single();
  return { data: data as { id: string } | null, error };
}

/**
 * Update player as impostor
 */
export async function updatePlayerAsImpostor(playerId: string) {
  const { error } = await supabase
    .from("players")
    .update({ is_impostor: true })
    .eq("id", playerId);
  return { error };
}

/**
 * Reset all players impostor and eliminated status in a room
 */
export async function resetPlayersForNewRound(roomId: string) {
  const { error } = await supabase
    .from("players")
    .update({ is_impostor: false, is_eliminated: false })
    .eq("room_id", roomId);
  return { error };
}

/**
 * Reset all players for a new game (including score)
 */
export async function resetPlayersForNewGame(roomId: string) {
  const { error } = await supabase
    .from("players")
    .update({ score: 0, is_impostor: false, is_eliminated: false })
    .eq("room_id", roomId);
  return { error };
}

/**
 * Eliminate a player
 */
export async function eliminatePlayer(playerId: string) {
  const { error } = await supabase
    .from("players")
    .update({ is_eliminated: true })
    .eq("id", playerId);
  return { error };
}

// ============ Realtime Subscriptions ============

/**
 * Subscribe to player changes in a room
 */
export function subscribeToPlayers(roomId: string, callback: () => void) {
  const channel = supabase
    .channel(`players-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
        filter: `room_id=eq.${roomId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
