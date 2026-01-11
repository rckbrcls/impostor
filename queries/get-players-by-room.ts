import { TypedSupabaseClient } from "@/lib/supabase/browser";

export function getPlayersByRoom(client: TypedSupabaseClient, roomId: string) {
  return client
    .from("players")
    .select(
      `
      id,
      room_id,
      client_id,
      name,
      score,
      joined_at
    `
    )
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true })
    .throwOnError();
}
