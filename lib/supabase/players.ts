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
  const { data, error } = await supabase
    .from("players")
    .insert({
      room_id: roomId,
      client_id: clientId,
      name,
      score: 0,
    })
    .select()
    .single();
  return { data: data as Player | null, error };
}

/**
 * Remove a player from a room
 * If the room becomes empty, delete the room and all associated data
 */
export async function removePlayer(playerId: string, roomId: string) {
  const { error } = await supabase.from("players").delete().eq("id", playerId);

  if (!error) {
    // Check if room is now empty
    const { count } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (count === 0) {
      // Delete the empty room (cascade will delete games, rounds, etc.)
      await supabase.from("rooms").delete().eq("id", roomId);
    }
  }

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
    .select("*")
    .eq("room_id", roomId)
    .eq("client_id", clientId)
    .single();
  return { data: data as Player | null, error };
}

/**
 * Get player by ID
 */
export async function getPlayerById(playerId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();
  return { data: data as Player | null, error };
}

/**
 * Update player score
 */
export async function updatePlayerScore(playerId: string, score: number) {
  const { error } = await supabase
    .from("players")
    .update({ score })
    .eq("id", playerId);
  return { error };
}

/**
 * Increment player score
 */
export async function incrementPlayerScore(
  playerId: string,
  increment: number
) {
  // Get current score first
  const { data: player } = await supabase
    .from("players")
    .select("score")
    .eq("id", playerId)
    .single();

  if (player) {
    const newScore = (player.score || 0) + increment;
    const { error } = await supabase
      .from("players")
      .update({ score: newScore })
      .eq("id", playerId);
    return { error };
  }
  return { error: null };
}

/**
 * Reset all players' scores in a room
 */
export async function resetPlayersScores(roomId: string) {
  const { error } = await supabase
    .from("players")
    .update({ score: 0 })
    .eq("room_id", roomId);
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
