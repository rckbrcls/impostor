import { supabase } from "./client";
import type { Vote } from "./types";

// ============ CRUD Operations ============

/**
 * Get all votes for a room and round
 */
export async function getVotesByRoomAndRound(roomId: string, round: number) {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("room_id", roomId)
    .eq("round", round);
  return { data: (data as Vote[]) || [], error };
}

/**
 * Upsert a vote
 */
export async function upsertVote(
  roomId: string,
  round: number,
  voterId: string,
  impostorVote: string | null,
  actionVote: "next_round" | "end_game" | null
) {
  const { error } = await supabase.from("votes").upsert(
    {
      room_id: roomId,
      round,
      voter_id: voterId,
      impostor_vote: impostorVote,
      action_vote: actionVote,
    },
    {
      onConflict: "room_id,round,voter_id",
    }
  );
  return { error };
}

/**
 * Delete all votes in a room
 */
export async function deleteVotesByRoomId(roomId: string) {
  const { error } = await supabase.from("votes").delete().eq("room_id", roomId);
  return { error };
}

/**
 * Delete votes by a specific voter in a room
 */
export async function deleteVotesByVoter(roomId: string, voterId: string) {
  const { count, error } = await supabase
    .from("votes")
    .delete()
    .eq("room_id", roomId)
    .eq("voter_id", voterId);
  return { count, error };
}

// ============ Realtime Subscriptions ============

/**
 * Subscribe to vote changes for a room and round
 */
export function subscribeToVotes(
  roomId: string,
  round: number,
  callback: () => void
) {
  const channel = supabase
    .channel(`votes-${roomId}-${round}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
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
