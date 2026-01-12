/**
 * Game Loop Transitions
 *
 * Centralized functions for performing state transitions.
 * All transitions are validated before execution.
 */

import {
  createGame,
  createGamePlayers,
  setImpostor,
  createRound,
  updateGameStatus,
  updateGameRound,
  updateRoomStatus,
  updateRoundEliminated,
  getActiveGame,
  getCurrentRound,
  getGamePlayers,
  getPlayersByRoomId,
  setPlayerEliminated,
  endGame as dbEndGame,
} from "@/lib/supabase";
import type { Game, Room, Round, Player } from "@/lib/supabase/types";
import type { GamePlayerWithPlayer } from "@/lib/supabase/game-players";
import type { TransitionResult, GamePhase, RoomPhase } from "./types";
import {
  validateGameTransition,
  validateRoomTransition,
  formatTransitionError,
} from "./state-machine";

// ============ Room Transitions ============

/**
 * Start a new game in the room
 * Room: waiting → playing
 * Game: creates new game with status "reveal"
 */
export async function startGame(
  room: Room,
  word: string,
  players: Player[],
): Promise<TransitionResult> {
  // Validate room transition
  const roomError = validateRoomTransition(room.status as RoomPhase, "playing");
  if (roomError) {
    return {
      success: false,
      error: formatTransitionError(roomError, room.status, "playing"),
    };
  }

  // Validate minimum players
  if (players.length < 3) {
    return {
      success: false,
      error: "At least 3 players are required to start",
    };
  }

  try {
    // 1. Create the game
    const { data: game, error: gameError } = await createGame(room.id, word);
    if (gameError || !game) {
      return { success: false, error: "Failed to create game" };
    }

    // 2. Create game players
    const { error: gpError } = await createGamePlayers(
      game.id,
      players.map((p) => p.id),
    );
    if (gpError) {
      return { success: false, error: "Failed to create game players" };
    }

    // 3. Randomly select impostor
    const impostorIndex = Math.floor(Math.random() * players.length);
    const { error: impostorError } = await setImpostor(
      game.id,
      players[impostorIndex].id,
    );
    if (impostorError) {
      return { success: false, error: "Failed to set impostor" };
    }

    // 4. Create first round
    const { error: roundError } = await createRound(game.id, 1);
    if (roundError) {
      return { success: false, error: "Failed to create round" };
    }

    // 5. Update room status
    const { error: roomUpdateError } = await updateRoomStatus(
      room.id,
      "playing",
    );
    if (roomUpdateError) {
      return { success: false, error: "Failed to update room status" };
    }

    return { success: true, newPhase: "reveal" };
  } catch {
    return { success: false, error: "Unexpected error starting game" };
  }
}

/**
 * End the current session
 * Room: playing → game_finished
 */
export async function endSession(room: Room): Promise<TransitionResult> {
  const error = validateRoomTransition(
    room.status as RoomPhase,
    "game_finished",
  );
  if (error) {
    return {
      success: false,
      error: formatTransitionError(error, room.status, "game_finished"),
    };
  }

  try {
    const { error: updateError } = await updateRoomStatus(
      room.id,
      "game_finished",
    );
    if (updateError) {
      return { success: false, error: "Failed to end session" };
    }
    return { success: true, newPhase: "game_finished" };
  } catch {
    return { success: false, error: "Unexpected error ending session" };
  }
}

// ============ Game Transitions ============

/**
 * Advance from reveal to voting phase
 * Game: reveal → voting
 */
export async function advanceToVoting(game: Game): Promise<TransitionResult> {
  const error = validateGameTransition(game.status as GamePhase, "voting");
  if (error) {
    return {
      success: false,
      error: formatTransitionError(error, game.status, "voting"),
    };
  }

  try {
    const { error: updateError } = await updateGameStatus(game.id, "voting");
    if (updateError) {
      return { success: false, error: "Failed to advance to voting" };
    }
    return { success: true, newPhase: "voting" };
  } catch {
    return { success: false, error: "Unexpected error advancing to voting" };
  }
}

/**
 * Check if all players have acknowledged role and advance to waiting_for_start
 * Game: reveal → waiting_for_start
 */
export async function checkAndAdvanceToWaiting(
  game: Game,
): Promise<TransitionResult> {
  const error = validateGameTransition(
    game.status as GamePhase,
    "waiting_for_start",
  );
  if (error) {
    return {
      success: false,
      error: formatTransitionError(error, game.status, "waiting_for_start"),
    };
  }

  try {
    // 1. Get all game players to check acknowledgement
    const { data: gamePlayers, error: fetchError } = await getGamePlayers(
      game.id,
    );
    if (fetchError || !gamePlayers) {
      return { success: false, error: "Failed to fetch game players" };
    }

    const allAcked = gamePlayers.every((gp) => gp.role_acknowledged);

    if (!allAcked) {
      return {
        success: false,
        error: "Not all players have acknowledged their roles",
      };
    }

    // 2. Update status
    const { error: updateError } = await updateGameStatus(
      game.id,
      "waiting_for_start",
    );
    if (updateError) {
      return {
        success: false,
        error: "Failed to advance to waiting_for_start",
      };
    }

    return { success: true, newPhase: "waiting_for_start" };
  } catch {
    return {
      success: false,
      error: "Unexpected error checking/advancing to waiting",
    };
  }
}

/**
 * Process voting results after all votes are cast
 * Game: voting → vote_result
 */
export async function processVoteResult(game: Game): Promise<TransitionResult> {
  const error = validateGameTransition(game.status as GamePhase, "vote_result");
  if (error) {
    return {
      success: false,
      error: formatTransitionError(error, game.status, "vote_result"),
    };
  }

  try {
    const { error: updateError } = await updateGameStatus(
      game.id,
      "vote_result",
    );
    if (updateError) {
      return { success: false, error: "Failed to process vote result" };
    }
    return { success: true, newPhase: "vote_result" };
  } catch {
    return { success: false, error: "Unexpected error processing vote result" };
  }
}

/**
 * Proceed to vote conclusion (individual feedback)
 * Game: vote_result → vote_conclusion
 */
export async function proceedToConclusion(
  game: Game,
  round: Round,
  eliminatedPlayerId?: string,
): Promise<TransitionResult> {
  const error = validateGameTransition(
    game.status as GamePhase,
    "vote_conclusion",
  );
  if (error) {
    return {
      success: false,
      error: formatTransitionError(error, game.status, "vote_conclusion"),
    };
  }

  try {
    if (eliminatedPlayerId) {
      const { error: elimError } = await updateRoundEliminated(
        round.id,
        eliminatedPlayerId,
      );
      if (elimError) {
        return { success: false, error: "Failed to record elimination" };
      }

      // Mark player as eliminated in game_players
      const { error: gpError } = await setPlayerEliminated(
        game.id,
        eliminatedPlayerId,
      );
      if (gpError) {
        return { success: false, error: "Failed to update player status" };
      }
    }

    const { error: updateError } = await updateGameStatus(
      game.id,
      "vote_conclusion",
    );
    if (updateError) {
      return { success: false, error: "Failed to proceed to conclusion" };
    }
    return { success: true, newPhase: "vote_conclusion" };
  } catch {
    return {
      success: false,
      error: "Unexpected error proceeding to conclusion",
    };
  }
}

/**
 * Start the next round
 * Game: vote_conclusion → voting
 */
export async function startNextRound(game: Game): Promise<TransitionResult> {
  const error = validateGameTransition(game.status as GamePhase, "voting");
  if (error) {
    return {
      success: false,
      error: formatTransitionError(error, game.status, "voting"),
    };
  }

  try {
    const newRoundNumber = game.current_round + 1;

    // Create new round
    const { error: roundError } = await createRound(game.id, newRoundNumber);
    if (roundError) {
      return { success: false, error: "Failed to create new round" };
    }

    // Update game round number
    const { error: roundUpdateError } = await updateGameRound(
      game.id,
      newRoundNumber,
    );
    if (roundUpdateError) {
      return { success: false, error: "Failed to update round number" };
    }

    // Update game status
    const { error: statusError } = await updateGameStatus(game.id, "voting");
    if (statusError) {
      return { success: false, error: "Failed to advance to voting" };
    }

    return { success: true, newPhase: "voting" };
  } catch {
    return { success: false, error: "Unexpected error starting next round" };
  }
}

/**
 * End the current game
 * Game: vote_conclusion → game_over
 */
export async function endGame(
  game: Game,
  winner: "impostor" | "players",
): Promise<TransitionResult> {
  const error = validateGameTransition(game.status as GamePhase, "game_over");
  if (error) {
    return {
      success: false,
      error: formatTransitionError(error, game.status, "game_over"),
    };
  }

  try {
    const { error: updateError } = await dbEndGame(game.id, winner);
    if (updateError) {
      return { success: false, error: "Failed to end game" };
    }
    return { success: true, newPhase: "game_over" };
  } catch {
    return { success: false, error: "Unexpected error ending game" };
  }
}

/**
 * Play again - creates a new game
 * Creates new game with status "reveal"
 */
export async function playAgain(
  room: Room,
  newWord: string,
): Promise<TransitionResult> {
  try {
    // Get current players
    const { data: players } = await getPlayersByRoomId(room.id);
    if (!players || players.length < 3) {
      return {
        success: false,
        error: "At least 3 players are required",
      };
    }

    // 1. Create new game
    const { data: game, error: gameError } = await createGame(room.id, newWord);
    if (gameError || !game) {
      return { success: false, error: "Failed to create new game" };
    }

    // 2. Create game players
    const { error: gpError } = await createGamePlayers(
      game.id,
      players.map((p) => p.id),
    );
    if (gpError) {
      return { success: false, error: "Failed to create game players" };
    }

    // 3. Randomly select new impostor
    const impostorIndex = Math.floor(Math.random() * players.length);
    const { error: impostorError } = await setImpostor(
      game.id,
      players[impostorIndex].id,
    );
    if (impostorError) {
      return { success: false, error: "Failed to set impostor" };
    }

    // 4. Create first round
    const { error: roundError } = await createRound(game.id, 1);
    if (roundError) {
      return { success: false, error: "Failed to create round" };
    }

    return { success: true, newPhase: "reveal" };
  } catch {
    return { success: false, error: "Unexpected error playing again" };
  }
}

// ============ Data Fetching ============

/**
 * Fetch all game loop data for a room
 */
export async function fetchGameLoopData(roomId: string) {
  const [gameResult, playersResult] = await Promise.all([
    getActiveGame(roomId),
    getPlayersByRoomId(roomId),
  ]);

  const game = gameResult.data;
  const players = playersResult.data ?? [];

  let currentRound: Round | null = null;
  let gamePlayers: GamePlayerWithPlayer[] = [];

  if (game) {
    const [roundResult, gpResult] = await Promise.all([
      getCurrentRound(game.id, game.current_round),
      getGamePlayers(game.id),
    ]);
    currentRound = roundResult.data;
    gamePlayers = gpResult.data ?? [];
  }

  return {
    game,
    currentRound,
    players,
    gamePlayers,
  };
}
