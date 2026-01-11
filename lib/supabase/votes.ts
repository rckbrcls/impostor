import { supabase } from "./client";
import type { Vote } from "./types";

// ============ CRUD Operations ============

/**
 * Get all votes for a round
 */
export async function getVotesByRound(roundId: string) {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("round_id", roundId);
  return { data: (data as Vote[]) || [], error };
}

/**
 * Submit a player vote
 */
export async function submitPlayerVote(
  roundId: string,
  voterId: string,
  targetPlayerId: string
) {
  const { error } = await supabase.from("votes").upsert(
    {
      round_id: roundId,
      voter_id: voterId,
      target_player_id: targetPlayerId,
      action_vote: null,
      is_action_vote: false,
    },
    {
      onConflict: "round_id,voter_id",
    }
  );
  return { error };
}

/**
 * Submit an action vote (next_round or end_game)
 */
export async function submitActionVote(
  roundId: string,
  voterId: string,
  action: "next_round" | "end_game"
) {
  const { error } = await supabase.from("votes").upsert(
    {
      round_id: roundId,
      voter_id: voterId,
      target_player_id: null,
      action_vote: action,
      is_action_vote: true,
    },
    {
      onConflict: "round_id,voter_id",
    }
  );
  return { error };
}

/**
 * Delete a vote
 */
export async function deleteVote(roundId: string, voterId: string) {
  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("round_id", roundId)
    .eq("voter_id", voterId);
  return { error };
}

/**
 * Calculate vote results for a round
 */
export async function calculateVoteResults(roundId: string) {
  const { data: votes, error } = await getVotesByRound(roundId);

  if (error || !votes.length) {
    return { result: null, error };
  }

  // Count player votes
  const playerVotes: Record<string, number> = {};
  // Count action votes
  const actionVotes: Record<string, number> = { next_round: 0, end_game: 0 };

  for (const vote of votes) {
    if (vote.is_action_vote && vote.action_vote) {
      actionVotes[vote.action_vote]++;
    } else if (vote.target_player_id) {
      playerVotes[vote.target_player_id] =
        (playerVotes[vote.target_player_id] || 0) + 1;
    }
  }

  // Find majority
  const maxPlayerVotes = Math.max(0, ...Object.values(playerVotes));
  const maxActionVotes = Math.max(actionVotes.next_round, actionVotes.end_game);

  // If action votes win
  if (maxActionVotes > maxPlayerVotes) {
    const majorityAction =
      actionVotes.next_round > actionVotes.end_game ? "next_round" : "end_game";
    return {
      result: {
        type: "action" as const,
        action: majorityAction as "next_round" | "end_game",
      },
      error: null,
    };
  }

  // If player votes win
  if (maxPlayerVotes > maxActionVotes) {
    const eliminatedPlayerId = Object.entries(playerVotes).find(
      ([, count]) => count === maxPlayerVotes
    )?.[0];

    if (eliminatedPlayerId) {
      return {
        result: {
          type: "player" as const,
          eliminatedPlayerId,
        },
        error: null,
      };
    }
  }

  // Tie - no elimination, continue
  return { result: null, error: null };
}

// ============ Realtime Subscriptions ============

/**
 * Subscribe to vote changes for a round
 */
export function subscribeToVotes(roundId: string, callback: () => void) {
  const channel = supabase
    .channel(`votes-${roundId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `round_id=eq.${roundId}`,
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
