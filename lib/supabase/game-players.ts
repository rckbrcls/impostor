import { supabase } from "./client";
import type { GamePlayer, Player } from "./types";

// ============ Types ============

export interface GamePlayerWithPlayer extends GamePlayer {
  player: Player;
}

// ============ CRUD Operations ============

/**
 * Create game_players for all players in a room
 */
export async function createGamePlayers(gameId: string, playerIds: string[]) {
  const gamePlayers = playerIds.map((playerId) => ({
    game_id: gameId,
    player_id: playerId,
    is_impostor: false,
  }));

  const { error } = await supabase.from("game_players").insert(gamePlayers);
  return { error };
}

/**
 * Set a player as the impostor for a game
 */
export async function setImpostor(gameId: string, playerId: string) {
  const { error } = await supabase
    .from("game_players")
    .update({ is_impostor: true })
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  return { error };
}

/**
 * Get all game_players for a game with player info
 */
export async function getGamePlayers(gameId: string) {
  const { data, error } = await supabase
    .from("game_players")
    .select("*, player:players(*)")
    .eq("game_id", gameId);
  return { data: (data as GamePlayerWithPlayer[]) || [], error };
}

/**
 * Get a specific game_player
 */
export async function getGamePlayer(gameId: string, playerId: string) {
  const { data, error } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .single();
  return { data: data as GamePlayer | null, error };
}

/**
 * Check if a player is the impostor in a game
 */
export async function isPlayerImpostor(gameId: string, playerId: string) {
  const { data, error } = await supabase
    .from("game_players")
    .select("is_impostor")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .single();
  return { isImpostor: data?.is_impostor ?? false, error };
}

// ============ Realtime Subscriptions ============

/**
 * Subscribe to game_players changes for a game
 */
export function subscribeToGamePlayers(gameId: string, callback: () => void) {
  const channel = supabase
    .channel(`game-players-${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_players",
        filter: `game_id=eq.${gameId}`,
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
