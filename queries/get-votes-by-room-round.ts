import { TypedSupabaseClient } from "@/lib/supabase/browser";

export function getVotesByRoomRound(
  client: TypedSupabaseClient,
  roomId: string,
  round: number
) {
  return client
    .from("votes")
    .select(
      `
      id,
      room_id,
      round,
      voter_id,
      impostor_vote,
      action_vote,
      created_at
    `
    )
    .eq("room_id", roomId)
    .eq("round", round)
    .throwOnError();
}
