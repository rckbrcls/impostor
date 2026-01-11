import { supabase } from "./client";
import type { Room } from "./types";

// ============ CRUD Operations ============

/**
 * Create a new room
 */
export async function createRoom(code: string, hostId: string) {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      code,
      host_id: hostId,
    })
    .select()
    .single();
  return { data: data as Room | null, error };
}

/**
 * Get room by code
 */
export async function getRoomByCode(code: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  return { data: data as Room | null, error };
}

/**
 * Get room ID by code
 */
export async function getRoomIdByCode(code: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", code)
    .single();
  return { data: data as { id: string } | null, error };
}

/**
 * Update room host
 */
export async function updateRoomHost(roomId: string, hostId: string) {
  const { error } = await supabase
    .from("rooms")
    .update({ host_id: hostId })
    .eq("id", roomId);
  return { error };
}

/**
 * Delete a room and all associated data
 */
export async function deleteRoom(roomId: string) {
  // Cascade delete will handle games, rounds, votes, game_players
  // Delete players
  await supabase.from("players").delete().eq("room_id", roomId);
  // Delete the room
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  return { error };
}

// ============ Realtime Subscriptions ============

/**
 * Subscribe to room changes
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room) => void
) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload.new as Room);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
