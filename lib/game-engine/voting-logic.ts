import { Vote, GamePlayerWithPlayer, Player } from "@/lib/supabase";

export interface VotingOutcome {
  action: "next_round" | "end_game" | "eliminate";
  mostVotedPlayer: {
    player: Player;
    wasImpostor: boolean;
  } | null;
}

export function calculateVotingOutcome(
  votes: Vote[],
  gamePlayers: GamePlayerWithPlayer[],
): VotingOutcome {
  const playerVotes: Record<string, number> = {};
  let nextRoundVotes = 0;
  let endGameVotes = 0;

  for (const vote of votes) {
    if (vote.is_action_vote) {
      if (vote.action_vote === "next_round") nextRoundVotes++;
      else if (vote.action_vote === "end_game") endGameVotes++;
    } else if (vote.target_player_id) {
      playerVotes[vote.target_player_id] =
        (playerVotes[vote.target_player_id] || 0) + 1;
    }
  }

  // Find max votes among players and identify ties
  let maxPlayerVotes = 0;
  let tiedPlayers: string[] = [];

  for (const [playerId, count] of Object.entries(playerVotes)) {
    if (count > maxPlayerVotes) {
      maxPlayerVotes = count;
      tiedPlayers = [playerId];
    } else if (count === maxPlayerVotes) {
      tiedPlayers.push(playerId);
    }
  }

  // Determine absolute max votes across all options
  const absoluteMax = Math.max(endGameVotes, nextRoundVotes, maxPlayerVotes);

  let action: "next_round" | "end_game" | "eliminate";
  let mostVotedId: string | null = null;

  // Priority 1: End Game (Wins ties against everyone)
  if (endGameVotes === absoluteMax) {
    action = "end_game";
  }
  // Priority 2: Next Round (Wins ties against players)
  else if (nextRoundVotes === absoluteMax) {
    action = "next_round";
  }
  // Priority 3: Eliminate Player (Only if strictly higher than actions AND no ties between players)
  else {
    // By Logic: maxPlayerVotes === absoluteMax AND endGameVotes < absoluteMax AND nextRoundVotes < absoluteMax

    if (tiedPlayers.length > 1) {
      // Tie between players -> No one eliminated -> Next Round
      action = "next_round";
    } else {
      action = "eliminate";
      mostVotedId = tiedPlayers[0];
    }
  }

  let mostVotedPlayer: { player: Player; wasImpostor: boolean } | null = null;

  // Only set mostVotedPlayer for display if we are actually eliminating someone
  if (action === "eliminate" && mostVotedId) {
    const votedGp = gamePlayers.find((gp) => gp.player_id === mostVotedId);
    if (votedGp && votedGp.player) {
      mostVotedPlayer = {
        player: votedGp.player,
        wasImpostor: votedGp.is_impostor ?? false,
      };
    }
  }

  return { action, mostVotedPlayer };
}
