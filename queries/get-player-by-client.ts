import { TypedSupabaseClient } from "@/lib/supabase/browser";

export function getPlayerByClient(
  client: TypedSupabaseClient,
  roomId: string,
  clientId: string
) {
  return client
    .from("players")
    .select(
      `
      id,
      room_id,
      client_id,
      name,
      is_impostor,
      is_eliminated,
      score,
      joined_at
    `
    )
    .eq("room_id", roomId)
    .eq("client_id", clientId)
    .throwOnError()
    .maybeSingle();
}
