import { supabase } from "./client";
import type { Room } from "./types";

// ============ CRUD Operations ============

/**
 * Create a new room
 */
export async function createRoom(code: string, hostId: string) {
  const { error } = await supabase.from("rooms").insert({
    code,
    host_id: hostId,
    status: "waiting",
    round: 0,
  });
  return { error };
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
 * Update room status
 */
export async function updateRoomStatus(roomId: string, status: Room["status"]) {
  const { error } = await supabase
    .from("rooms")
    .update({ status })
    .eq("id", roomId);
  return { error };
}

/**
 * Update room for game start
 */
export async function updateRoomForGameStart(
  roomId: string,
  round: number,
  word: string
) {
  const { error } = await supabase
    .from("rooms")
    .update({
      status: "playing" as const,
      round,
      word,
    })
    .eq("id", roomId);
  return { error };
}

/**
 * Update room for next round
 */
export async function updateRoomForNextRound(roomId: string, round: number) {
  const { error } = await supabase
    .from("rooms")
    .update({
      status: "playing" as const,
      round,
    })
    .eq("id", roomId);
  return { error };
}

/**
 * Update room for ended state
 */
export async function updateRoomEnded(roomId: string) {
  const { error } = await supabase
    .from("rooms")
    .update({ status: "ended" as const })
    .eq("id", roomId);
  return { error };
}

/**
 * Reset room to waiting state for play again
 */
export async function resetRoomToWaiting(roomId: string) {
  const { error } = await supabase
    .from("rooms")
    .update({
      status: "waiting" as const,
      word: null,
    })
    .eq("id", roomId);
  return { error };
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
