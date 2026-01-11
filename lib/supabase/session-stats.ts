import { supabase } from "./client";
import type { Player, Vote, Round, Game } from "./types";

// ============ Types ============

export interface PlayerStats {
  playerId: string;
  playerName: string;
  score: number;
  correctVotes: number; // votes that correctly targeted the impostor
  roundsSurvivedAsImpostor: number; // rounds survived when being impostor
  timesImpostor: number; // how many times was impostor
  passedRounds: number; // votes for "next_round" action
  timesEliminated: number; // how many times was eliminated
  votesReceived: number; // total votes received as suspect
  gamesPlayed: number; // number of games participated
}

export interface SessionStats {
  players: PlayerStats[];
  bestDetective: PlayerStats | null; // most correct votes
  masterOfDisguise: PlayerStats | null; // most rounds survived as impostor
  mostIndecisive: PlayerStats | null; // most passed rounds
  mostSuspicious: PlayerStats | null; // most times eliminated
  mostAccused: PlayerStats | null; // most votes received
}

// ============ Query Functions ============

/**
 * Get all games for a room
 */
async function getGamesByRoom(roomId: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  return { data: (data as Game[]) || [], error };
}

/**
 * Get all game_players for multiple games
 */
async function getGamePlayersByGames(gameIds: string[]) {
  if (gameIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("game_players")
    .select("*, player:players(*)")
    .in("game_id", gameIds);
  return { data: data || [], error };
}

/**
 * Get all rounds for multiple games
 */
async function getRoundsByGames(gameIds: string[]) {
  if (gameIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .in("game_id", gameIds);
  return { data: (data as Round[]) || [], error };
}

/**
 * Get all votes for multiple rounds
 */
async function getVotesByRounds(roundIds: string[]) {
  if (roundIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .in("round_id", roundIds);
  return { data: (data as Vote[]) || [], error };
}

/**
 * Get comprehensive session statistics for all players in a room
 */
export async function getSessionStats(
  roomId: string,
  players: Player[],
): Promise<{ data: SessionStats | null; error: Error | null }> {
  try {
    // 1. Get all games in this room
    const { data: games, error: gamesError } = await getGamesByRoom(roomId);
    if (gamesError) throw gamesError;

    const gameIds = games.map((g) => g.id);

    // 2. Get all game_players (to know who was impostor in each game)
    const { data: gamePlayers, error: gpError } =
      await getGamePlayersByGames(gameIds);
    if (gpError) throw gpError;

    // 3. Get all rounds (to know eliminations and round counts)
    const { data: rounds, error: roundsError } =
      await getRoundsByGames(gameIds);
    if (roundsError) throw roundsError;

    const roundIds = rounds.map((r) => r.id);

    // 4. Get all votes
    const { data: votes, error: votesError } = await getVotesByRounds(roundIds);
    if (votesError) throw votesError;

    // 5. Build player stats
    const playerStatsMap = new Map<string, PlayerStats>();

    // Initialize all players
    for (const player of players) {
      playerStatsMap.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        score: player.score ?? 0,
        correctVotes: 0,
        roundsSurvivedAsImpostor: 0,
        timesImpostor: 0,
        passedRounds: 0,
        timesEliminated: 0,
        votesReceived: 0,
        gamesPlayed: 0,
      });
    }

    // Build a map of game -> impostor player id
    const gameImpostorMap = new Map<string, string>();
    for (const gp of gamePlayers) {
      if (gp.is_impostor) {
        gameImpostorMap.set(gp.game_id, gp.player_id);
      }
      // Count games played
      const stats = playerStatsMap.get(gp.player_id);
      if (stats) {
        stats.gamesPlayed++;
      }
    }

    // Count times each player was impostor
    for (const gp of gamePlayers) {
      if (gp.is_impostor) {
        const stats = playerStatsMap.get(gp.player_id);
        if (stats) {
          stats.timesImpostor++;
        }
      }
    }

    // Build round -> game map
    const roundGameMap = new Map<string, string>();
    for (const round of rounds) {
      roundGameMap.set(round.id, round.game_id);
    }

    // Count eliminations and rounds survived as impostor
    for (const round of rounds) {
      const impostorId = gameImpostorMap.get(round.game_id);

      // If someone was eliminated this round
      if (round.eliminated_player_id) {
        const stats = playerStatsMap.get(round.eliminated_player_id);
        if (stats) {
          stats.timesEliminated++;
        }
      }

      // Count rounds survived for impostor (if not eliminated in this round)
      if (impostorId && round.eliminated_player_id !== impostorId) {
        const stats = playerStatsMap.get(impostorId);
        if (stats) {
          stats.roundsSurvivedAsImpostor++;
        }
      }
    }

    // Analyze votes
    for (const vote of votes) {
      const gameId = roundGameMap.get(vote.round_id);
      if (!gameId) continue;

      const impostorId = gameImpostorMap.get(gameId);
      const voterStats = playerStatsMap.get(vote.voter_id);

      // Count action votes (passed rounds)
      if (vote.is_action_vote && vote.action_vote === "next_round") {
        if (voterStats) {
          voterStats.passedRounds++;
        }
      }

      // Count correct votes (voted for the actual impostor)
      if (!vote.is_action_vote && vote.target_player_id === impostorId) {
        if (voterStats) {
          voterStats.correctVotes++;
        }
      }

      // Count votes received
      if (!vote.is_action_vote && vote.target_player_id) {
        const targetStats = playerStatsMap.get(vote.target_player_id);
        if (targetStats) {
          targetStats.votesReceived++;
        }
      }
    }

    // Convert map to array
    const playerStats = Array.from(playerStatsMap.values());

    // Find special rankings (only if there are players with non-zero values)
    const bestDetective =
      playerStats
        .filter((p) => p.correctVotes > 0)
        .sort((a, b) => b.correctVotes - a.correctVotes)[0] || null;

    const masterOfDisguise =
      playerStats
        .filter((p) => p.roundsSurvivedAsImpostor > 0)
        .sort(
          (a, b) => b.roundsSurvivedAsImpostor - a.roundsSurvivedAsImpostor,
        )[0] || null;

    const mostIndecisive =
      playerStats
        .filter((p) => p.passedRounds > 0)
        .sort((a, b) => b.passedRounds - a.passedRounds)[0] || null;

    const mostSuspicious =
      playerStats
        .filter((p) => p.timesEliminated > 0)
        .sort((a, b) => b.timesEliminated - a.timesEliminated)[0] || null;

    const mostAccused =
      playerStats
        .filter((p) => p.votesReceived > 0)
        .sort((a, b) => b.votesReceived - a.votesReceived)[0] || null;

    return {
      data: {
        players: playerStats.sort((a, b) => b.score - a.score),
        bestDetective,
        masterOfDisguise,
        mostIndecisive,
        mostSuspicious,
        mostAccused,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
